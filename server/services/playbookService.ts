import { createHash } from "crypto";
import { db } from "../db";
import {
  playbookBranchesTable,
  caseMessagesTable,
  casesTable,
} from "../../shared/schema/schema";
import { eq, sql, gte } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { ROOT_CATEGORIES } from "../../shared/models/playbook";

// --- Constants ---
const PROMOTION_THRESHOLD = 3;
const MAX_PLAYBOOK_PROMPT_CHARS = 3500;
const MIN_HITS_FOR_INCLUSION = 5;
const MAX_BRANCHES_IN_PROMPT = 50;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const PROMOTION_DEBOUNCE_MS = 5 * 60 * 1000; // 5 minutes

// --- Types ---
interface BranchEvent {
  pathKey: string[];
  choice?: string;
  isSomethingElse?: boolean;
  freeformText?: string;
}

// --- Cache ---
let playbookCache: { block: string; expires: number } | null = null;
let lastPromotionCheck = 0;

/**
 * Compute SHA-256 hash of a pathKey array for fast unique lookups.
 */
function hashPath(pathKey: string[]): string {
  return createHash("sha256").update(JSON.stringify(pathKey)).digest("hex");
}

/**
 * Normalize freeform text for counting: lowercase, trim, collapse whitespace.
 */
function normalizeFreeform(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, " ").substring(0, 100);
}

/**
 * Title-case a freeform string for display as a promoted pill.
 */
function titleCase(str: string): string {
  return str
    .split(" ")
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/**
 * Walk a message array from a resolved case and extract the user's
 * diagnostic path: pill selections, "Something Else" taps, and free-form
 * text at each branch point.
 *
 * IMPORTANT: The welcome message (with the root-level presentChoices) is
 * filtered out before saving to DB. We synthesize the root branch point
 * by checking if the first user message matches one of the known root
 * categories (from shared/models/playbook.ts), is "Something Else", or
 * is free-form text.
 */
export function extractConversationPath(
  messages: Array<{ role: string; text: string; guidedAction?: any }>
): BranchEvent[] {
  const events: BranchEvent[] = [];
  const currentPath: string[] = [];

  // Find the first user message to handle the implicit root branch point.
  // The welcome message with presentChoices is NOT in the DB (filtered out
  // before save), so we must detect root-level choices here.
  let handledRoot = false;
  const firstUserIdx = messages.findIndex((m) => m.role === "user");

  if (firstUserIdx >= 0) {
    const firstUserMsg = messages[firstUserIdx];
    // Check: is there a preceding model message with presentChoices?
    const precedingModel =
      firstUserIdx > 0 ? messages[firstUserIdx - 1] : null;
    const hasPrecedingChoices =
      precedingModel &&
      precedingModel.role !== "user" &&
      precedingModel.guidedAction?.type === "presentChoices";

    // If no preceding presentChoices, the user responded to the (unsaved) welcome message
    if (!hasPrecedingChoices) {
      const userText = (firstUserMsg.text || "").trim();

      if (
        userText.toLowerCase().includes("something else") ||
        userText.toLowerCase() === "it's something else"
      ) {
        events.push({ pathKey: [], isSomethingElse: true });
      } else if (
        ROOT_CATEGORIES.some(
          (c) => c.toLowerCase() === userText.toLowerCase()
        )
      ) {
        const matched = ROOT_CATEGORIES.find(
          (c) => c.toLowerCase() === userText.toLowerCase()
        )!;
        events.push({ pathKey: [], choice: matched });
        currentPath.push(matched);
      } else if (userText.length > 0) {
        events.push({ pathKey: [], freeformText: userText });
        currentPath.push(normalizeFreeform(userText));
      }

      handledRoot = true;
    }
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    // Skip the first user message if we already handled it as a root response
    if (handledRoot && i === firstUserIdx) continue;

    // Look for model messages with presentChoices
    if (msg.role !== "user" && msg.guidedAction?.type === "presentChoices") {
      const choices: string[] = msg.guidedAction.choices || [];
      const nextMsg = i + 1 < messages.length ? messages[i + 1] : null;

      if (nextMsg && nextMsg.role === "user") {
        const userText = (nextMsg.text || "").trim();

        // Check if user tapped "It's Something Else"
        if (
          userText.toLowerCase().includes("something else") ||
          userText.toLowerCase() === "it's something else"
        ) {
          events.push({
            pathKey: [...currentPath],
            isSomethingElse: true,
          });
        }
        // Check if user tapped one of the offered choices
        else if (
          choices.some((c) => c.toLowerCase() === userText.toLowerCase())
        ) {
          const matchedChoice = choices.find(
            (c) => c.toLowerCase() === userText.toLowerCase()
          )!;
          events.push({
            pathKey: [...currentPath],
            choice: matchedChoice,
          });
          currentPath.push(matchedChoice);
        }
        // Free-form text typed at this branch point
        else if (userText.length > 0) {
          events.push({
            pathKey: [...currentPath],
            freeformText: userText,
          });
          currentPath.push(normalizeFreeform(userText));
        }
      }
    }
  }

  return events;
}

/**
 * Upsert branch statistics from extracted path events.
 *
 * Uses atomic SQL with parameterized values via jsonb_build_object()
 * — no sql.raw(), no string interpolation of user text into SQL.
 * The || operator atomically merges the new key into the existing JSONB,
 * so concurrent resolves don't clobber each other.
 */
export async function updateBranchStatistics(
  events: BranchEvent[]
): Promise<void> {
  const hitPaths = new Set<string>();

  for (const event of events) {
    const pathHash = hashPath(event.pathKey);
    const category = event.pathKey[0] || "uncategorized";
    const depth = event.pathKey.length;
    const isNewHit = !hitPaths.has(pathHash);

    // Build atomic JSONB merge expressions using parameterized jsonb_build_object.
    // jsonb_build_object(key, value) is safe — key is a parameterized $N, not interpolated.
    const choiceCountsUpdate = event.choice
      ? sql`COALESCE(${playbookBranchesTable.choiceCounts}, '{}') || jsonb_build_object(${event.choice}, (COALESCE((${playbookBranchesTable.choiceCounts}->>${event.choice})::int, 0) + 1))`
      : playbookBranchesTable.choiceCounts;

    const freeformKey = event.freeformText
      ? normalizeFreeform(event.freeformText)
      : null;
    const freeformCountsUpdate = freeformKey
      ? sql`COALESCE(${playbookBranchesTable.freeformCounts}, '{}') || jsonb_build_object(${freeformKey}, (COALESCE((${playbookBranchesTable.freeformCounts}->>${freeformKey})::int, 0) + 1))`
      : playbookBranchesTable.freeformCounts;

    const somethingElseUpdate = event.isSomethingElse
      ? sql`COALESCE(${playbookBranchesTable.somethingElseCount}, 0) + 1`
      : playbookBranchesTable.somethingElseCount;

    const totalHitsUpdate = isNewHit
      ? sql`COALESCE(${playbookBranchesTable.totalHits}, 0) + 1`
      : playbookBranchesTable.totalHits;

    await db
      .insert(playbookBranchesTable)
      .values({
        id: uuidv4(),
        pathKey: event.pathKey,
        pathHash,
        category,
        depth,
        choiceCounts: event.choice ? { [event.choice]: 1 } : {},
        somethingElseCount: event.isSomethingElse ? 1 : 0,
        freeformCounts: freeformKey ? { [freeformKey]: 1 } : {},
        totalHits: isNewHit ? 1 : 0,
        resolvedCount: 0,
      })
      .onConflictDoUpdate({
        target: playbookBranchesTable.pathHash,
        set: {
          choiceCounts: choiceCountsUpdate,
          freeformCounts: freeformCountsUpdate,
          somethingElseCount: somethingElseUpdate,
          totalHits: totalHitsUpdate,
          updatedAt: new Date(),
        },
      });

    hitPaths.add(pathHash);
  }
}

/**
 * Mark all branches visited by this case as resolved.
 */
async function markBranchesResolved(events: BranchEvent[]): Promise<void> {
  const seenHashes = new Set<string>();
  for (const event of events) {
    const pathHash = hashPath(event.pathKey);
    if (seenHashes.has(pathHash)) continue;
    seenHashes.add(pathHash);

    await db
      .update(playbookBranchesTable)
      .set({
        resolvedCount: sql`COALESCE(${playbookBranchesTable.resolvedCount}, 0) + 1`,
        updatedAt: new Date(),
      })
      .where(eq(playbookBranchesTable.pathHash, pathHash));
  }
}

/**
 * Check for freeform entries that should be promoted to pills.
 * Promotion threshold: freeform count >= PROMOTION_THRESHOLD.
 * Also logs a warning when >30% of users at a branch tap "Something Else".
 *
 * Debounced: runs at most once per PROMOTION_DEBOUNCE_MS (5 minutes).
 * Multiple case resolves in quick succession share a single scan.
 */
export async function checkPromotions(): Promise<void> {
  const now = Date.now();
  if (now - lastPromotionCheck < PROMOTION_DEBOUNCE_MS) return;
  lastPromotionCheck = now;

  const branches = await db
    .select()
    .from(playbookBranchesTable)
    .where(gte(playbookBranchesTable.totalHits, MIN_HITS_FOR_INCLUSION));

  for (const branch of branches) {
    const freeformCounts = (branch.freeformCounts || {}) as Record<
      string,
      number
    >;
    const promotedChoices = (branch.promotedChoices || []) as string[];
    let updated = false;

    for (const [text, count] of Object.entries(freeformCounts)) {
      if (
        count >= PROMOTION_THRESHOLD &&
        !promotedChoices.includes(titleCase(text))
      ) {
        promotedChoices.push(titleCase(text));
        updated = true;
        console.log(
          `[PLAYBOOK] Promoted "${titleCase(text)}" at branch [${(branch.pathKey as string[]).join(" > ")}] (count: ${count})`
        );
      }
    }

    if (updated) {
      await db
        .update(playbookBranchesTable)
        .set({ promotedChoices, updatedAt: new Date() })
        .where(eq(playbookBranchesTable.id, branch.id));
    }

    // Log warning when >30% tap "Something Else"
    const totalHits = branch.totalHits || 0;
    const seCount = branch.somethingElseCount || 0;
    if (totalHits >= MIN_HITS_FOR_INCLUSION && seCount / totalHits > 0.3) {
      console.warn(
        `[PLAYBOOK] Gap warning: ${Math.round((seCount / totalHits) * 100)}% tapped "Something Else" at [${(branch.pathKey as string[]).join(" > ")}] (${seCount}/${totalHits})`
      );
    }
  }
}

/**
 * Orchestrator: process a resolved case end-to-end.
 * 1. Fetch messages
 * 2. Extract path
 * 3. Update branch stats (atomic)
 * 4. Mark resolved
 * 5. Check promotions (debounced)
 * 6. Invalidate cache
 */
export async function processResolvedCase(caseId: string): Promise<void> {
  try {
    // Check if already processed
    const [caseRecord] = await db
      .select({ playbookProcessed: casesTable.playbookProcessed })
      .from(casesTable)
      .where(eq(casesTable.id, caseId))
      .limit(1);

    if (caseRecord?.playbookProcessed) {
      return; // Already processed
    }

    // Fetch messages
    const [messageRecord] = await db
      .select()
      .from(caseMessagesTable)
      .where(eq(caseMessagesTable.caseId, caseId))
      .limit(1);

    const messages = (messageRecord?.messages || []) as Array<{
      role: string;
      text: string;
      guidedAction?: any;
    }>;

    if (messages.length === 0) {
      // No messages to process — still mark as processed
      await db
        .update(casesTable)
        .set({ playbookProcessed: true })
        .where(eq(casesTable.id, caseId));
      return;
    }

    // Extract conversation path
    const events = extractConversationPath(messages);

    if (events.length > 0) {
      // Update branch statistics (atomic upserts)
      await updateBranchStatistics(events);

      // Mark branches as resolved
      await markBranchesResolved(events);

      // Check for promotions (debounced — at most once per 5 min)
      await checkPromotions();
    }

    // Mark case as processed
    await db
      .update(casesTable)
      .set({ playbookProcessed: true })
      .where(eq(casesTable.id, caseId));

    // Invalidate cache so next prompt uses updated playbook
    invalidatePlaybookCache();

    console.log(
      `[PLAYBOOK] Processed case ${caseId}: ${events.length} branch events`
    );
  } catch (err) {
    console.error(`[PLAYBOOK] Error processing case ${caseId}:`, err);
  }
}

/**
 * Build the playbook prompt block from learned branch data.
 * Queries top branches and formats them as supplemental decision tree text.
 */
export async function buildPlaybookBlock(): Promise<string> {
  try {
    const branches = await db
      .select()
      .from(playbookBranchesTable)
      .where(gte(playbookBranchesTable.totalHits, MIN_HITS_FOR_INCLUSION))
      .orderBy(sql`${playbookBranchesTable.totalHits} DESC`)
      .limit(MAX_BRANCHES_IN_PROMPT);

    if (branches.length === 0) return "";

    let block =
      "\n\nLEARNED PLAYBOOK (supplemental branches learned from resolved cases — use these to expand your decision tree):\n";

    for (const branch of branches) {
      const pathKey = branch.pathKey as string[];
      const promoted = (branch.promotedChoices || []) as string[];
      const choiceCounts = (branch.choiceCounts || {}) as Record<
        string,
        number
      >;

      // Only include branches that have promoted choices or meaningful choice data
      if (promoted.length === 0 && Object.keys(choiceCounts).length === 0)
        continue;

      const pathStr = pathKey.length > 0 ? pathKey.join(" > ") : "Root";

      // Build choices sorted by frequency
      const allChoices: string[] = [];

      // Add promoted freeform entries first (these are new pills)
      for (const p of promoted) {
        if (!allChoices.includes(p)) allChoices.push(p);
      }

      // Add existing high-frequency choices
      const sortedChoices = Object.entries(choiceCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([choice]) => choice);
      for (const c of sortedChoices) {
        if (!allChoices.includes(c)) allChoices.push(c);
      }

      if (allChoices.length === 0) continue;

      // Cap at 6 choices per branch
      const displayChoices = allChoices.slice(0, 6);
      const line = `  At [${pathStr}] → presentChoices: ${displayChoices.map((c) => `"${c}"`).join(", ")}\n`;

      // Check character budget
      if (block.length + line.length > MAX_PLAYBOOK_PROMPT_CHARS) break;

      block += line;
    }

    return block.length > 80 ? block : ""; // Only return if meaningful content
  } catch (err) {
    console.error("[PLAYBOOK] Error building playbook block:", err);
    return "";
  }
}

/**
 * Cached wrapper for buildPlaybookBlock. 10-minute TTL.
 */
export async function getPlaybookBlock(): Promise<string> {
  if (playbookCache && playbookCache.expires > Date.now()) {
    return playbookCache.block;
  }

  const block = await buildPlaybookBlock();
  playbookCache = { block, expires: Date.now() + CACHE_TTL_MS };
  return block;
}

/**
 * Invalidate the playbook cache. Called after processing a resolved case.
 */
export function invalidatePlaybookCache(): void {
  playbookCache = null;
}
