/**
 * One-time bootstrap script: processes all resolved cases that haven't
 * been fed into the playbook learning system yet.
 *
 * Usage:
 *   npx tsx scripts/bootstrap-playbook.ts           # Live run
 *   npx tsx scripts/bootstrap-playbook.ts --dry-run  # Preview only
 */
import { db } from "../server/db";
import { casesTable } from "../shared/schema/schema";
import { eq, and, isNull } from "drizzle-orm";
import { processResolvedCase } from "../server/services/playbookService";

const isDryRun = process.argv.includes("--dry-run");

async function main() {
  console.log(`[BOOTSTRAP] Starting playbook bootstrap${isDryRun ? " (DRY RUN)" : ""}...`);

  // Find all resolved cases that haven't been processed
  const unprocessedCases = await db
    .select({ id: casesTable.id, title: casesTable.title })
    .from(casesTable)
    .where(
      and(
        eq(casesTable.status, "resolved"),
        isNull(casesTable.playbookProcessed)
      )
    );

  console.log(`[BOOTSTRAP] Found ${unprocessedCases.length} unprocessed resolved cases`);

  if (isDryRun) {
    for (const c of unprocessedCases) {
      console.log(`  [DRY RUN] Would process: ${c.id} — "${c.title}"`);
    }
    console.log(`[BOOTSTRAP] Dry run complete. ${unprocessedCases.length} cases would be processed.`);
    process.exit(0);
  }

  let processed = 0;
  let errors = 0;

  // Process in batches of 50 with 100ms delays
  const BATCH_SIZE = 50;
  for (let i = 0; i < unprocessedCases.length; i += BATCH_SIZE) {
    const batch = unprocessedCases.slice(i, i + BATCH_SIZE);

    for (const c of batch) {
      try {
        await processResolvedCase(c.id);
        processed++;
        if (processed % 10 === 0) {
          console.log(`[BOOTSTRAP] Progress: ${processed}/${unprocessedCases.length}`);
        }
      } catch (err) {
        errors++;
        console.error(`[BOOTSTRAP] Error processing case ${c.id}:`, err);
      }
    }

    // Small delay between batches to avoid overwhelming the database
    if (i + BATCH_SIZE < unprocessedCases.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.log(`[BOOTSTRAP] Complete. Processed: ${processed}, Errors: ${errors}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[BOOTSTRAP] Fatal error:", err);
  process.exit(1);
});
