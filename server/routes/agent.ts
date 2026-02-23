import { Router } from "express";
import { db } from "../db";
import {
  casesTable,
  caseMessagesTable,
  caseNotesTable,
  caseActivityTable,
  caseArchivesTable,
  sessionRecordingsTable,
  usersTable,
  devicesTable,
  subscriptionsTable,
} from "../../shared/schema/schema";
import { eq, desc, asc, and, or, ilike, isNull, sql, count } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { requireAgent, requireAgentAdmin, invalidateRoleCache } from "../middleware/agentMiddleware";
import { logCaseActivity } from "../services/caseActivityService";
import { archiveCase, restoreCase } from "../services/caseArchiveService";
import {
  validate,
  validateQuery,
  agentCaseListSchema,
  agentCaseUpdateSchema,
  agentCaseAssignSchema,
  agentCaseNoteSchema,
  agentRoleChangeSchema,
  agentArchiveListSchema,
  agentBulkDeleteSchema,
} from "../validation";
import rateLimit from "express-rate-limit";

const router = Router();

// All agent routes require agent or admin role
router.use(requireAgent);

// ============================================
// 1. GET /cases — Paginated case queue with filtering
// ============================================
router.get("/cases", validateQuery(agentCaseListSchema), async (req: any, res: any) => {
  try {
    const {
      status, priority, assignedAgentId, customerId,
      search, dateFrom, dateTo,
      page, limit, sortBy, sortOrder,
    } = (req.validatedQuery || req.query) as any;

    const conditions: any[] = [];

    if (status) conditions.push(eq(casesTable.status, status));
    if (priority) conditions.push(eq(casesTable.priority, priority));
    if (customerId) conditions.push(eq(casesTable.userId, customerId));
    if (assignedAgentId === "unassigned") {
      conditions.push(isNull(casesTable.assignedAgentId));
    } else if (assignedAgentId) {
      conditions.push(eq(casesTable.assignedAgentId, assignedAgentId));
    }
    if (dateFrom) {
      conditions.push(sql`${casesTable.createdAt} >= ${new Date(dateFrom)}`);
    }
    if (dateTo) {
      conditions.push(sql`${casesTable.createdAt} <= ${new Date(dateTo)}`);
    }

    // Multi-field search: case number, title, AI summary, customer name/email, session mode, status
    // Search requires JOIN with users table, so it's built separately and applied to both queries
    const searchCondition = search ? or(
      ilike(casesTable.title, `%${search}%`),
      ilike(casesTable.aiSummary, `%${search}%`),
      ilike(casesTable.status, `%${search}%`),
      ilike(casesTable.sessionMode, `%${search}%`),
      sql`CAST(${casesTable.caseNumber} AS TEXT) ILIKE ${"%" + search + "%"}`,
      ilike(usersTable.firstName, `%${search}%`),
      ilike(usersTable.lastName, `%${search}%`),
      ilike(usersTable.email, `%${search}%`),
      sql`CONCAT(${usersTable.firstName}, ' ', ${usersTable.lastName}) ILIKE ${"%" + search + "%"}`
    ) : undefined;

    // Combine all conditions including search
    const allConditions = [...conditions];
    if (searchCondition) allConditions.push(searchCondition);
    const whereClause = allConditions.length > 0 ? and(...allConditions) : undefined;

    // Sort mapping
    const sortColumnMap: Record<string, any> = {
      createdAt: casesTable.createdAt,
      updatedAt: casesTable.updatedAt,
      priority: casesTable.priority,
      status: casesTable.status,
    };
    const sortCol = sortColumnMap[sortBy] || casesTable.updatedAt;
    const orderFn = sortOrder === "asc" ? asc : desc;

    // Count total (joined with users for search across customer fields)
    const [{ total }] = await db
      .select({ total: count() })
      .from(casesTable)
      .leftJoin(usersTable, eq(casesTable.userId, usersTable.id))
      .where(whereClause);

    const totalNum = Number(total);
    const offset = (page - 1) * limit;

    // Aliased tables for customer and agent joins
    const customerAlias = usersTable;

    // Fetch cases with customer info
    const cases = await db
      .select({
        id: casesTable.id,
        caseNumber: casesTable.caseNumber,
        title: casesTable.title,
        status: casesTable.status,
        priority: casesTable.priority,
        sessionMode: casesTable.sessionMode,
        aiSummary: casesTable.aiSummary,
        assignedAgentId: casesTable.assignedAgentId,
        userId: casesTable.userId,
        createdAt: casesTable.createdAt,
        updatedAt: casesTable.updatedAt,
        customerFirstName: customerAlias.firstName,
        customerLastName: customerAlias.lastName,
        customerEmail: customerAlias.email,
      })
      .from(casesTable)
      .leftJoin(customerAlias, eq(casesTable.userId, customerAlias.id))
      .where(whereClause)
      .orderBy(orderFn(sortCol))
      .limit(limit)
      .offset(offset);

    // Fetch assigned agent info for cases that have one
    const agentIds = [...new Set(cases.map(c => c.assignedAgentId).filter(Boolean))] as string[];
    let agentMap: Record<string, { id: string; firstName: string | null; lastName: string | null }> = {};
    if (agentIds.length > 0) {
      const agents = await db
        .select({
          id: usersTable.id,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
        })
        .from(usersTable)
        .where(sql`${usersTable.id} IN ${agentIds}`);
      for (const a of agents) {
        agentMap[a.id] = a;
      }
    }

    const formattedCases = cases.map(c => ({
      id: c.id,
      caseNumber: c.caseNumber,
      title: c.title,
      status: c.status,
      priority: c.priority,
      sessionMode: c.sessionMode,
      aiSummary: c.aiSummary ? (c.aiSummary.length > 200 ? c.aiSummary.slice(0, 200) + "..." : c.aiSummary) : null,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      customer: {
        id: c.userId,
        firstName: c.customerFirstName,
        lastName: c.customerLastName,
        email: c.customerEmail,
      },
      assignedAgent: c.assignedAgentId && agentMap[c.assignedAgentId]
        ? agentMap[c.assignedAgentId]
        : null,
    }));

    res.json({
      cases: formattedCases,
      pagination: {
        page,
        limit,
        total: totalNum,
        totalPages: Math.ceil(totalNum / limit),
      },
    });
  } catch (err) {
    console.error("[Agent] Failed to list cases:", err);
    res.status(500).json({ error: "An unexpected error occurred. Please try again." });
  }
});

// ============================================
// 2. GET /cases/:id — Full case detail (ServiceNow caller_id pattern)
// ============================================
router.get("/cases/:id", async (req: any, res: any) => {
  try {
    const caseId = req.params.id;

    // Fetch case
    const [caseRecord] = await db
      .select()
      .from(casesTable)
      .where(eq(casesTable.id, caseId))
      .limit(1);

    if (!caseRecord) {
      return res.status(404).json({ error: "Case not found" });
    }

    // Fetch customer — explicit column allowlist (Skeptic condition #5)
    const [customer] = await db
      .select({
        id: usersTable.id,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        email: usersTable.email,
        phone: usersTable.phone,
        profileImageUrl: usersTable.profileImageUrl,
        homeType: usersTable.homeType,
        techComfort: usersTable.techComfort,
        householdSize: usersTable.householdSize,
        primaryIssues: usersTable.primaryIssues,
        howHeard: usersTable.howHeard,
        createdAt: usersTable.createdAt,
        updatedAt: usersTable.updatedAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, caseRecord.userId))
      .limit(1);

    // Fetch subscription
    const [subscription] = await db
      .select({
        tier: subscriptionsTable.tier,
        status: subscriptionsTable.status,
        billingInterval: subscriptionsTable.billingInterval,
        currentPeriodEnd: subscriptionsTable.currentPeriodEnd,
        videoCredits: subscriptionsTable.videoCredits,
      })
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, caseRecord.userId))
      .limit(1);

    // Fetch devices
    const devices = await db
      .select()
      .from(devicesTable)
      .where(eq(devicesTable.userId, caseRecord.userId));

    // Fetch assigned agent
    let assignedAgent = null;
    if (caseRecord.assignedAgentId) {
      const [agent] = await db
        .select({
          id: usersTable.id,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          email: usersTable.email,
        })
        .from(usersTable)
        .where(eq(usersTable.id, caseRecord.assignedAgentId))
        .limit(1);
      assignedAgent = agent || null;
    }

    // Fetch messages
    const [messageRecord] = await db
      .select()
      .from(caseMessagesTable)
      .where(eq(caseMessagesTable.caseId, caseId))
      .limit(1);

    // Fetch recordings
    const recordings = await db
      .select()
      .from(sessionRecordingsTable)
      .where(eq(sessionRecordingsTable.caseId, caseId));

    // Fetch internal notes with author info
    const notesRaw = await db
      .select({
        id: caseNotesTable.id,
        content: caseNotesTable.content,
        createdAt: caseNotesTable.createdAt,
        updatedAt: caseNotesTable.updatedAt,
        authorId: caseNotesTable.authorId,
        authorFirstName: usersTable.firstName,
        authorLastName: usersTable.lastName,
      })
      .from(caseNotesTable)
      .leftJoin(usersTable, eq(caseNotesTable.authorId, usersTable.id))
      .where(eq(caseNotesTable.caseId, caseId))
      .orderBy(desc(caseNotesTable.createdAt));

    const notes = notesRaw.map(n => ({
      id: n.id,
      content: n.content,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
      author: { id: n.authorId, firstName: n.authorFirstName, lastName: n.authorLastName },
    }));

    // Fetch activity log with actor info
    const activityRaw = await db
      .select({
        id: caseActivityTable.id,
        action: caseActivityTable.action,
        details: caseActivityTable.details,
        createdAt: caseActivityTable.createdAt,
        actorId: caseActivityTable.actorId,
        actorFirstName: usersTable.firstName,
        actorLastName: usersTable.lastName,
      })
      .from(caseActivityTable)
      .leftJoin(usersTable, eq(caseActivityTable.actorId, usersTable.id))
      .where(eq(caseActivityTable.caseId, caseId))
      .orderBy(desc(caseActivityTable.createdAt));

    const activity = activityRaw.map(a => ({
      id: a.id,
      action: a.action,
      details: a.details,
      createdAt: a.createdAt,
      actor: { id: a.actorId, firstName: a.actorFirstName, lastName: a.actorLastName },
    }));

    // Fetch related cases (same customer, excluding this one)
    const relatedCases = await db
      .select({
        id: casesTable.id,
        caseNumber: casesTable.caseNumber,
        title: casesTable.title,
        status: casesTable.status,
        sessionMode: casesTable.sessionMode,
        createdAt: casesTable.createdAt,
      })
      .from(casesTable)
      .where(and(
        eq(casesTable.userId, caseRecord.userId),
        sql`${casesTable.id} != ${caseId}`
      ))
      .orderBy(desc(casesTable.createdAt))
      .limit(10);

    res.json({
      case: {
        id: caseRecord.id,
        caseNumber: caseRecord.caseNumber,
        title: caseRecord.title,
        status: caseRecord.status,
        priority: caseRecord.priority,
        sessionMode: caseRecord.sessionMode,
        aiSummary: caseRecord.aiSummary,
        diagnosticSteps: caseRecord.diagnosticSteps,
        escalationReport: caseRecord.escalationReport,
        specialistNotes: caseRecord.specialistNotes,
        specialistRespondedAt: caseRecord.specialistRespondedAt,
        createdAt: caseRecord.createdAt,
        updatedAt: caseRecord.updatedAt,
      },
      customer: customer || null,
      subscription: subscription || null,
      devices,
      assignedAgent,
      messages: (messageRecord?.messages as any[]) || [],
      recordings,
      notes,
      activity,
      relatedCases,
    });
  } catch (err) {
    console.error("[Agent] Failed to fetch case detail:", err);
    res.status(500).json({ error: "An unexpected error occurred. Please try again." });
  }
});

// ============================================
// 3. PATCH /cases/:id — Update case status/priority
// ============================================
router.patch("/cases/:id", validate(agentCaseUpdateSchema), async (req: any, res: any) => {
  try {
    const caseId = req.params.id;
    const { status, priority } = req.body;
    const actorId = req.agentUser!.id;

    // Fetch current case
    const [existing] = await db
      .select({ status: casesTable.status, priority: casesTable.priority })
      .from(casesTable)
      .where(eq(casesTable.id, caseId))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Case not found" });
    }

    const updates: Record<string, any> = { updatedAt: new Date() };
    const activityPromises: Promise<void>[] = [];

    if (status && status !== existing.status) {
      updates.status = status;
      activityPromises.push(
        logCaseActivity({ caseId, actorId, action: "status_changed", details: { from: existing.status, to: status } })
      );
    }
    if (priority && priority !== existing.priority) {
      updates.priority = priority;
      activityPromises.push(
        logCaseActivity({ caseId, actorId, action: "priority_changed", details: { from: existing.priority, to: priority } })
      );
    }

    const [updated] = await db
      .update(casesTable)
      .set(updates)
      .where(eq(casesTable.id, caseId))
      .returning();

    await Promise.all(activityPromises);

    res.json({ case: updated });
  } catch (err) {
    console.error("[Agent] Failed to update case:", err);
    res.status(500).json({ error: "An unexpected error occurred. Please try again." });
  }
});

// ============================================
// 4. POST /cases/:id/assign — Assign case to agent
// ============================================
router.post("/cases/:id/assign", validate(agentCaseAssignSchema), async (req: any, res: any) => {
  try {
    const caseId = req.params.id;
    const { agentId } = req.body;
    const actorId = req.agentUser!.id;

    // Verify case exists
    const [existing] = await db
      .select({ id: casesTable.id, assignedAgentId: casesTable.assignedAgentId })
      .from(casesTable)
      .where(eq(casesTable.id, caseId))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Case not found" });
    }

    // Verify target is an agent or admin
    const [targetUser] = await db
      .select({ id: usersTable.id, role: usersTable.role, firstName: usersTable.firstName, lastName: usersTable.lastName })
      .from(usersTable)
      .where(eq(usersTable.id, agentId))
      .limit(1);

    if (!targetUser || (targetUser.role !== "agent" && targetUser.role !== "admin")) {
      return res.status(400).json({ error: "Target user is not an agent" });
    }

    const [updated] = await db
      .update(casesTable)
      .set({ assignedAgentId: agentId, updatedAt: new Date() })
      .where(eq(casesTable.id, caseId))
      .returning();

    await logCaseActivity({
      caseId,
      actorId,
      action: "assigned",
      details: {
        assignedTo: agentId,
        assignedToName: `${targetUser.firstName || ""} ${targetUser.lastName || ""}`.trim(),
      },
    });

    res.json({ case: updated });
  } catch (err) {
    console.error("[Agent] Failed to assign case:", err);
    res.status(500).json({ error: "An unexpected error occurred. Please try again." });
  }
});

// ============================================
// 5. DELETE /cases/:id/assign — Unassign case
// ============================================
router.delete("/cases/:id/assign", async (req: any, res: any) => {
  try {
    const caseId = req.params.id;
    const actorId = req.agentUser!.id;

    const [existing] = await db
      .select({ id: casesTable.id, assignedAgentId: casesTable.assignedAgentId })
      .from(casesTable)
      .where(eq(casesTable.id, caseId))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Case not found" });
    }

    const [updated] = await db
      .update(casesTable)
      .set({ assignedAgentId: null, updatedAt: new Date() })
      .where(eq(casesTable.id, caseId))
      .returning();

    await logCaseActivity({
      caseId,
      actorId,
      action: "unassigned",
      details: { previousAgentId: existing.assignedAgentId },
    });

    res.json({ case: updated });
  } catch (err) {
    console.error("[Agent] Failed to unassign case:", err);
    res.status(500).json({ error: "An unexpected error occurred. Please try again." });
  }
});

// ============================================
// 5b. POST /cases/:id/reply — Agent sends a message to the customer
// ============================================
router.post("/cases/:id/reply", validate(agentCaseNoteSchema), async (req: any, res: any) => {
  try {
    const caseId = req.params.id;
    const { content } = req.body;
    const agentUser = req.agentUser;

    // Verify case exists (include userId + title for email notification)
    const [existing] = await db
      .select({ id: casesTable.id, userId: casesTable.userId, title: casesTable.title })
      .from(casesTable)
      .where(eq(casesTable.id, caseId))
      .limit(1);
    if (!existing) return res.status(404).json({ error: "Case not found" });

    // Find the case_messages record
    const [messageRecord] = await db
      .select()
      .from(caseMessagesTable)
      .where(eq(caseMessagesTable.caseId, caseId))
      .limit(1);

    const agentMessage = {
      role: "agent",
      text: content,
      timestamp: Date.now(),
      agentName: `${agentUser.firstName || ""} ${agentUser.lastName || ""}`.trim() || "Agent",
    };

    if (messageRecord) {
      // Append to existing messages array
      const currentMessages = (messageRecord.messages as any[]) || [];
      currentMessages.push(agentMessage);
      await db
        .update(caseMessagesTable)
        .set({ messages: currentMessages })
        .where(eq(caseMessagesTable.id, messageRecord.id));
    } else {
      // Create new message record
      await db.insert(caseMessagesTable).values({
        caseId,
        messages: [agentMessage],
      });
    }

    // Update case updatedAt
    await db
      .update(casesTable)
      .set({ updatedAt: new Date() })
      .where(eq(casesTable.id, caseId));

    // Fire-and-forget email notification to case owner
    try {
      const [caseOwner] = await db.select({
        email: usersTable.email,
        firstName: usersTable.firstName,
      }).from(usersTable).where(eq(usersTable.id, existing.userId)).limit(1);

      if (caseOwner?.email) {
        const { sendCaseReplyNotificationEmail } = await import("../services/emailService");
        sendCaseReplyNotificationEmail(caseOwner.email, {
          customerFirstName: caseOwner.firstName,
          agentName: agentMessage.agentName,
          messagePreview: content.substring(0, 500),
          caseId,
          caseTitle: existing.title,
        }).catch(err => console.error("[AGENT_REPLY] Email notification failed:", err));
      }
    } catch (emailErr) {
      console.error("[AGENT_REPLY] Email lookup failed:", emailErr);
    }

    res.json({ success: true, message: agentMessage });
  } catch (err) {
    console.error("[Agent] Failed to send reply:", err);
    res.status(500).json({ error: "An unexpected error occurred. Please try again." });
  }
});

// ============================================
// CASE DELETION (admin-only) — archives case for 7-day recovery
// ============================================
router.delete("/cases/:id", requireAgentAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const archive = await archiveCase(id, req.agentUser.id);
    res.json({
      success: true,
      archive: {
        id: archive.id,
        caseId: archive.caseId,
        title: archive.title,
        deletedAt: archive.deletedAt,
        purgeAfter: archive.purgeAfter,
      },
    });
  } catch (error: any) {
    if (error.message === "Case not found") {
      return res.status(404).json({ error: "Case not found" });
    }
    console.error("Error archiving case:", error);
    res.status(500).json({ error: "Failed to archive case" });
  }
});

// ============================================
// BULK DELETE (admin-only) — archive multiple cases
// ============================================
const bulkDeleteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: "Too many bulk delete requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/cases/bulk-delete", requireAgentAdmin, bulkDeleteLimiter, validate(agentBulkDeleteSchema), async (req: any, res: any) => {
  try {
    const { caseIds } = req.body;
    const actorId = req.agentUser!.id;

    // Deduplicate case IDs
    const uniqueIds = [...new Set(caseIds as string[])];

    const results: Array<{ caseId: string; success: boolean; error?: string }> = [];

    // Sequential archival — each archiveCase does ~11 DB operations
    for (const caseId of uniqueIds) {
      try {
        await archiveCase(caseId, actorId);
        results.push({ caseId, success: true });
      } catch (err: any) {
        results.push({ caseId, success: false, error: err.message || "Failed to archive" });
      }
    }

    const deleted = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    // Audit log: single bulk_delete entry (Skeptic condition #1)
    if (deleted > 0) {
      console.log(`[Agent] Bulk delete by ${actorId}: ${deleted} archived, ${failed} failed out of ${uniqueIds.length} requested`);
    }

    res.json({ results, deleted, failed });
  } catch (err) {
    console.error("[Agent] Failed to bulk delete cases:", err);
    res.status(500).json({ error: "An unexpected error occurred. Please try again." });
  }
});

// ============================================
// ARCHIVE LIST (admin-only) — list deleted cases
// ============================================
router.get("/archives", requireAgentAdmin, validateQuery(agentArchiveListSchema), async (req: any, res: any) => {
  try {
    const { search, page, limit } = (req.validatedQuery || req.query) as any;

    const conditions: any[] = [];

    if (search) {
      conditions.push(
        or(
          ilike(caseArchivesTable.title, `%${search}%`),
          sql`CAST(${caseArchivesTable.caseNumber} AS TEXT) ILIKE ${"%" + search + "%"}`
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count total
    const [{ total }] = await db
      .select({ total: count() })
      .from(caseArchivesTable)
      .where(whereClause);

    const totalNum = Number(total);
    const offset = (page - 1) * limit;

    // Fetch archives with admin name
    const archives = await db
      .select({
        id: caseArchivesTable.id,
        caseId: caseArchivesTable.caseId,
        userId: caseArchivesTable.userId,
        caseNumber: caseArchivesTable.caseNumber,
        title: caseArchivesTable.title,
        deletedById: caseArchivesTable.deletedById,
        deletedAt: caseArchivesTable.deletedAt,
        purgeAfter: caseArchivesTable.purgeAfter,
        deletedByFirstName: usersTable.firstName,
        deletedByLastName: usersTable.lastName,
      })
      .from(caseArchivesTable)
      .leftJoin(usersTable, eq(caseArchivesTable.deletedById, usersTable.id))
      .where(whereClause)
      .orderBy(desc(caseArchivesTable.deletedAt))
      .limit(limit)
      .offset(offset);

    const formattedArchives = archives.map(a => ({
      id: a.id,
      caseId: a.caseId,
      userId: a.userId,
      caseNumber: a.caseNumber,
      title: a.title,
      deletedAt: a.deletedAt,
      purgeAfter: a.purgeAfter,
      deletedBy: {
        id: a.deletedById,
        firstName: a.deletedByFirstName,
        lastName: a.deletedByLastName,
      },
    }));

    res.json({
      archives: formattedArchives,
      pagination: {
        page,
        limit,
        total: totalNum,
        totalPages: Math.ceil(totalNum / limit),
      },
    });
  } catch (err) {
    console.error("[Agent] Failed to list archives:", err);
    res.status(500).json({ error: "An unexpected error occurred. Please try again." });
  }
});

// ============================================
// ARCHIVE RESTORE (admin-only) — restore deleted case
// ============================================
router.post("/archives/:id/restore", requireAgentAdmin, async (req: any, res: any) => {
  try {
    const result = await restoreCase(req.params.id, req.agentUser.id);
    res.json({ success: true, caseId: result.caseId });
  } catch (error: any) {
    if (error.message === "Archive not found") return res.status(404).json({ error: error.message });
    if (error.message === "Archive has expired") return res.status(410).json({ error: error.message });
    if (error.message === "Case ID already exists") return res.status(409).json({ error: error.message });
    console.error("Error restoring case:", error);
    res.status(500).json({ error: "Failed to restore case" });
  }
});

// ============================================
// 6. GET /cases/:id/notes — List internal notes
// ============================================
router.get("/cases/:id/notes", async (req: any, res: any) => {
  try {
    const caseId = req.params.id;

    // Verify case exists
    const [existing] = await db
      .select({ id: casesTable.id })
      .from(casesTable)
      .where(eq(casesTable.id, caseId))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Case not found" });
    }

    const notesRaw = await db
      .select({
        id: caseNotesTable.id,
        content: caseNotesTable.content,
        createdAt: caseNotesTable.createdAt,
        updatedAt: caseNotesTable.updatedAt,
        authorId: caseNotesTable.authorId,
        authorFirstName: usersTable.firstName,
        authorLastName: usersTable.lastName,
      })
      .from(caseNotesTable)
      .leftJoin(usersTable, eq(caseNotesTable.authorId, usersTable.id))
      .where(eq(caseNotesTable.caseId, caseId))
      .orderBy(desc(caseNotesTable.createdAt));

    const notes = notesRaw.map(n => ({
      id: n.id,
      content: n.content,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
      author: { id: n.authorId, firstName: n.authorFirstName, lastName: n.authorLastName },
    }));

    res.json({ notes });
  } catch (err) {
    console.error("[Agent] Failed to list notes:", err);
    res.status(500).json({ error: "An unexpected error occurred. Please try again." });
  }
});

// ============================================
// 7. POST /cases/:id/notes — Add internal note
// ============================================
router.post("/cases/:id/notes", validate(agentCaseNoteSchema), async (req: any, res: any) => {
  try {
    const caseId = req.params.id;
    const { content } = req.body;
    const actorId = req.agentUser!.id;

    // Verify case exists
    const [existing] = await db
      .select({ id: casesTable.id })
      .from(casesTable)
      .where(eq(casesTable.id, caseId))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Case not found" });
    }

    const noteId = uuidv4();
    const [note] = await db
      .insert(caseNotesTable)
      .values({
        id: noteId,
        caseId,
        authorId: actorId,
        content,
      })
      .returning();

    // Log activity (Skeptic condition #7: note_id only, not full content)
    await logCaseActivity({
      caseId,
      actorId,
      action: "note_added",
      details: { noteId },
    });

    res.status(201).json({
      note: {
        ...note,
        author: {
          id: req.agentUser!.id,
          firstName: req.agentUser!.firstName,
          lastName: req.agentUser!.lastName,
        },
      },
    });
  } catch (err) {
    console.error("[Agent] Failed to add note:", err);
    res.status(500).json({ error: "An unexpected error occurred. Please try again." });
  }
});

// ============================================
// 8. PATCH /cases/:id/notes/:noteId — Edit note (author only)
// ============================================
router.patch("/cases/:id/notes/:noteId", validate(agentCaseNoteSchema), async (req: any, res: any) => {
  try {
    const { id: caseId, noteId } = req.params;
    const { content } = req.body;
    const actorId = req.agentUser!.id;

    const [existing] = await db
      .select()
      .from(caseNotesTable)
      .where(and(eq(caseNotesTable.id, noteId), eq(caseNotesTable.caseId, caseId)))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Note not found" });
    }

    // Only the original author can edit
    if (existing.authorId !== actorId) {
      return res.status(403).json({ error: "You don't have permission to edit this note" });
    }

    const [updated] = await db
      .update(caseNotesTable)
      .set({ content, updatedAt: new Date() })
      .where(eq(caseNotesTable.id, noteId))
      .returning();

    res.json({ note: updated });
  } catch (err) {
    console.error("[Agent] Failed to edit note:", err);
    res.status(500).json({ error: "An unexpected error occurred. Please try again." });
  }
});

// ============================================
// 9. DELETE /cases/:id/notes/:noteId — Delete note (author or admin)
// ============================================
router.delete("/cases/:id/notes/:noteId", async (req: any, res: any) => {
  try {
    const { id: caseId, noteId } = req.params;
    const actorId = req.agentUser!.id;
    const actorRole = req.agentUser!.role;

    const [existing] = await db
      .select()
      .from(caseNotesTable)
      .where(and(eq(caseNotesTable.id, noteId), eq(caseNotesTable.caseId, caseId)))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Note not found" });
    }

    // Author or admin can delete
    if (existing.authorId !== actorId && actorRole !== "admin") {
      return res.status(403).json({ error: "You don't have permission to delete this note" });
    }

    // Skeptic condition #7: log deletion BEFORE the delete executes
    await logCaseActivity({
      caseId,
      actorId,
      action: "note_deleted",
      details: { noteId },
    });

    await db
      .delete(caseNotesTable)
      .where(eq(caseNotesTable.id, noteId));

    res.json({ success: true });
  } catch (err) {
    console.error("[Agent] Failed to delete note:", err);
    res.status(500).json({ error: "An unexpected error occurred. Please try again." });
  }
});

// ============================================
// 10. GET /cases/:id/activity — Audit log
// ============================================
router.get("/cases/:id/activity", async (req: any, res: any) => {
  try {
    const caseId = req.params.id;

    // Verify case exists
    const [existing] = await db
      .select({ id: casesTable.id })
      .from(casesTable)
      .where(eq(casesTable.id, caseId))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Case not found" });
    }

    const activityRaw = await db
      .select({
        id: caseActivityTable.id,
        action: caseActivityTable.action,
        details: caseActivityTable.details,
        createdAt: caseActivityTable.createdAt,
        actorId: caseActivityTable.actorId,
        actorFirstName: usersTable.firstName,
        actorLastName: usersTable.lastName,
      })
      .from(caseActivityTable)
      .leftJoin(usersTable, eq(caseActivityTable.actorId, usersTable.id))
      .where(eq(caseActivityTable.caseId, caseId))
      .orderBy(desc(caseActivityTable.createdAt));

    const activity = activityRaw.map(a => ({
      id: a.id,
      action: a.action,
      details: a.details,
      createdAt: a.createdAt,
      actor: { id: a.actorId, firstName: a.actorFirstName, lastName: a.actorLastName },
    }));

    res.json({ activity });
  } catch (err) {
    console.error("[Agent] Failed to fetch activity:", err);
    res.status(500).json({ error: "An unexpected error occurred. Please try again." });
  }
});

// ============================================
// 11. GET /customers/:userId — Customer profile (ServiceNow caller_id pattern)
// ============================================
router.get("/customers/:userId", async (req: any, res: any) => {
  try {
    const { userId } = req.params;

    // Explicit column allowlist — no passwordHash, tokens, or stripe IDs (Skeptic condition #5)
    const [customer] = await db
      .select({
        id: usersTable.id,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        email: usersTable.email,
        phone: usersTable.phone,
        profileImageUrl: usersTable.profileImageUrl,
        homeType: usersTable.homeType,
        techComfort: usersTable.techComfort,
        householdSize: usersTable.householdSize,
        primaryIssues: usersTable.primaryIssues,
        howHeard: usersTable.howHeard,
        createdAt: usersTable.createdAt,
        updatedAt: usersTable.updatedAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!customer) {
      return res.status(404).json({ error: "User not found" });
    }

    // Fetch subscription
    const [subscription] = await db
      .select({
        tier: subscriptionsTable.tier,
        status: subscriptionsTable.status,
        billingInterval: subscriptionsTable.billingInterval,
        currentPeriodEnd: subscriptionsTable.currentPeriodEnd,
        videoCredits: subscriptionsTable.videoCredits,
      })
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, userId))
      .limit(1);

    // Fetch devices
    const devices = await db
      .select()
      .from(devicesTable)
      .where(eq(devicesTable.userId, userId));

    // Case stats
    const allCases = await db
      .select({ status: casesTable.status })
      .from(casesTable)
      .where(eq(casesTable.userId, userId));

    const caseStats = {
      total: allCases.length,
      open: allCases.filter(c => c.status === "open").length,
      resolved: allCases.filter(c => c.status === "resolved").length,
      escalated: allCases.filter(c => c.status === "escalated").length,
      pending: allCases.filter(c => c.status === "pending").length,
    };

    // Recent cases (last 5)
    const recentCases = await db
      .select({
        id: casesTable.id,
        caseNumber: casesTable.caseNumber,
        title: casesTable.title,
        status: casesTable.status,
        sessionMode: casesTable.sessionMode,
        createdAt: casesTable.createdAt,
      })
      .from(casesTable)
      .where(eq(casesTable.userId, userId))
      .orderBy(desc(casesTable.createdAt))
      .limit(5);

    res.json({
      customer,
      subscription: subscription || null,
      devices,
      caseStats,
      recentCases,
    });
  } catch (err) {
    console.error("[Agent] Failed to fetch customer profile:", err);
    res.status(500).json({ error: "An unexpected error occurred. Please try again." });
  }
});

// ============================================
// 12. GET /customers/:userId/cases — All cases for customer
// ============================================
router.get("/customers/:userId/cases", validateQuery(agentCaseListSchema), async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const { page, limit, sortBy, sortOrder } = (req.validatedQuery || req.query) as any;

    // Verify user exists
    const [user] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const sortColumnMap: Record<string, any> = {
      createdAt: casesTable.createdAt,
      updatedAt: casesTable.updatedAt,
      priority: casesTable.priority,
      status: casesTable.status,
    };
    const sortCol = sortColumnMap[sortBy] || casesTable.updatedAt;
    const orderFn = sortOrder === "asc" ? asc : desc;

    const [{ total }] = await db
      .select({ total: count() })
      .from(casesTable)
      .where(eq(casesTable.userId, userId));

    const totalNum = Number(total);
    const offset = (page - 1) * limit;

    const cases = await db
      .select({
        id: casesTable.id,
        caseNumber: casesTable.caseNumber,
        title: casesTable.title,
        status: casesTable.status,
        priority: casesTable.priority,
        sessionMode: casesTable.sessionMode,
        aiSummary: casesTable.aiSummary,
        assignedAgentId: casesTable.assignedAgentId,
        createdAt: casesTable.createdAt,
        updatedAt: casesTable.updatedAt,
      })
      .from(casesTable)
      .where(eq(casesTable.userId, userId))
      .orderBy(orderFn(sortCol))
      .limit(limit)
      .offset(offset);

    res.json({
      cases,
      pagination: {
        page,
        limit,
        total: totalNum,
        totalPages: Math.ceil(totalNum / limit),
      },
    });
  } catch (err) {
    console.error("[Agent] Failed to list customer cases:", err);
    res.status(500).json({ error: "An unexpected error occurred. Please try again." });
  }
});

// ============================================
// 13. GET /agents — Agent roster (for assignment picker)
// ============================================
router.get("/agents", async (_req: any, res: any) => {
  try {
    const agents = await db
      .select({
        id: usersTable.id,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        email: usersTable.email,
        role: usersTable.role,
      })
      .from(usersTable)
      .where(
        or(
          eq(usersTable.role, "agent"),
          eq(usersTable.role, "admin")
        )
      )
      .orderBy(asc(usersTable.firstName));

    res.json({ agents });
  } catch (err) {
    console.error("[Agent] Failed to list agents:", err);
    res.status(500).json({ error: "An unexpected error occurred. Please try again." });
  }
});

// ============================================
// 14. PUT /users/:userId/role — Change user role (admin only)
// ============================================
router.put("/users/:userId/role", requireAgentAdmin, validate(agentRoleChangeSchema), async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const actorId = req.agentUser!.id;

    // Self-demotion prevention
    if (userId === actorId && role !== "admin") {
      return res.status(400).json({ error: "Cannot demote yourself. Another admin must change your role." });
    }

    // Verify target user exists
    const [targetUser] = await db
      .select({ id: usersTable.id, email: usersTable.email, role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (targetUser.role === role) {
      return res.json({ success: true, user: { id: targetUser.id, email: targetUser.email, role } });
    }

    await db
      .update(usersTable)
      .set({ role, updatedAt: new Date() })
      .where(eq(usersTable.id, userId));

    // Invalidate role cache for this user
    invalidateRoleCache(userId);

    res.json({ success: true, user: { id: targetUser.id, email: targetUser.email, role } });
  } catch (err) {
    console.error("[Agent] Failed to change role:", err);
    res.status(500).json({ error: "An unexpected error occurred. Please try again." });
  }
});

export default router;
