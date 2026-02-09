import { Router } from "express";
import { db } from "../db";
import { casesTable, sessionRecordingsTable, caseMessagesTable, usersTable } from "../../shared/schema/schema";
import { eq, desc, and, max } from "drizzle-orm";
import { generateCaseGuidePDF, type CasePDFData } from "../services/pdfService";
import { sendSessionGuideEmail, sendEscalationEmail } from "../services/emailService";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// GET: Fetch all cases for the logged-in user
router.get("/", async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const cases = await db
      .select()
      .from(casesTable)
      .where(eq(casesTable.userId, req.user.id))
      .orderBy(desc(casesTable.updatedAt));

    res.json(cases);
  } catch (error) {
    console.error("Error fetching cases:", error);
    res.status(500).json({ error: "Failed to fetch cases" });
  }
});

// POST: Create a new case
router.post("/", async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { title, sessionMode, deviceId } = req.body;

  try {
    // Get next case number for this user
    const [{ maxNum }] = await db
      .select({ maxNum: max(casesTable.caseNumber) })
      .from(casesTable)
      .where(eq(casesTable.userId, req.user.id));
    const nextCaseNumber = (maxNum || 0) + 1;

    const [newCase] = await db
      .insert(casesTable)
      .values({
        userId: req.user.id,
        caseNumber: nextCaseNumber,
        title: title || "New Support Session",
        status: "open",
        sessionMode: sessionMode || "chat",
        deviceId: deviceId || null,
      })
      .returning();

    res.json(newCase);
  } catch (error) {
    console.error("Error creating case:", error);
    res.status(500).json({ error: "Failed to create case" });
  }
});

// GET: Fetch single case details + recordings + messages
router.get("/:id", async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.params;

  try {
    const [caseDetails] = await db
      .select()
      .from(casesTable)
      .where(eq(casesTable.id, id))
      .limit(1);

    if (!caseDetails || caseDetails.userId !== req.user.id) {
      return res.status(404).json({ error: "Case not found" });
    }

    // Fetch associated recordings/transcripts
    const recordings = await db
      .select()
      .from(sessionRecordingsTable)
      .where(eq(sessionRecordingsTable.caseId, id))
      .orderBy(desc(sessionRecordingsTable.createdAt));

    // Fetch messages
    const [messageRecord] = await db
      .select()
      .from(caseMessagesTable)
      .where(eq(caseMessagesTable.caseId, id))
      .limit(1);

    res.json({ case: caseDetails, recordings, messages: messageRecord?.messages || [] });
  } catch (error) {
    console.error("Error fetching case details:", error);
    res.status(500).json({ error: "Failed to fetch case details" });
  }
});

// PATCH: Update case
router.patch("/:id", async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.params;

  try {
    // Verify ownership
    const [existing] = await db
      .select()
      .from(casesTable)
      .where(and(eq(casesTable.id, id), eq(casesTable.userId, req.user.id)))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Case not found" });
    }

    const {
      status,
      title,
      aiSummary,
      deviceId,
      diagnosticSteps,
      photosCount,
      escalatedAt,
      escalationReport,
    } = req.body;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (status !== undefined) updates.status = status;
    if (title !== undefined) updates.title = title;
    if (aiSummary !== undefined) updates.aiSummary = aiSummary;
    if (deviceId !== undefined) updates.deviceId = deviceId;
    if (diagnosticSteps !== undefined) updates.diagnosticSteps = diagnosticSteps;
    if (photosCount !== undefined) updates.photosCount = photosCount;
    if (escalatedAt !== undefined) updates.escalatedAt = new Date(escalatedAt);
    if (escalationReport !== undefined) updates.escalationReport = escalationReport;

    // Generate specialist token on escalation
    if (status === "escalated" && !existing.specialistToken) {
      updates.specialistToken = uuidv4();
    }

    const [updated] = await db
      .update(casesTable)
      .set(updates)
      .where(eq(casesTable.id, id))
      .returning();

    res.json(updated);

    // Fire-and-forget: email PDF when case is resolved
    if (status === "resolved" && updated) {
      (async () => {
        try {
          const [user] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.id, req.user!.id))
            .limit(1);

          if (!user?.email || user.sessionGuideEmails === false) return;

          const [messageRecord] = await db
            .select()
            .from(caseMessagesTable)
            .where(eq(caseMessagesTable.caseId, id))
            .limit(1);

          const pdfBase64 = generateCaseGuidePDF({
            caseId: id,
            title: updated.title,
            status: updated.status || "resolved",
            sessionMode: updated.sessionMode,
            aiSummary: updated.aiSummary,
            escalationReport: updated.escalationReport as CasePDFData["escalationReport"],
            messages: (messageRecord?.messages as CasePDFData["messages"]) || [],
            createdAt: updated.createdAt?.toISOString() || new Date().toISOString(),
            userName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || undefined,
          });

          await sendSessionGuideEmail(
            user.email,
            user.firstName || "there",
            updated.aiSummary || updated.title,
            pdfBase64,
            updated.createdAt || new Date()
          );

          console.log(`[CASE] Sent resolution PDF email for case ${id} to ${user.email}`);
        } catch (err) {
          console.error(`[CASE] Failed to send resolution email for case ${id}:`, err);
        }
      })();
    }

    // Fire-and-forget: send escalation email with specialist link
    if (status === "escalated" && updated?.specialistToken) {
      (async () => {
        try {
          const APP_BASE_URL = process.env.APP_URL || "https://totalassist.tech";
          const specialistUrl = `${APP_BASE_URL}/specialist/${updated.specialistToken}`;

          // For now, log the specialist URL (in production, send to configured specialist email)
          console.log(`[CASE] Escalation specialist URL: ${specialistUrl}`);

          // Generate PDF for attachment
          const [messageRecord] = await db
            .select()
            .from(caseMessagesTable)
            .where(eq(caseMessagesTable.caseId, id))
            .limit(1);

          let pdfBase64: string | undefined;
          try {
            pdfBase64 = generateCaseGuidePDF({
              caseId: id,
              title: updated.title,
              status: "escalated",
              sessionMode: updated.sessionMode,
              aiSummary: updated.aiSummary,
              escalationReport: updated.escalationReport as CasePDFData["escalationReport"],
              messages: (messageRecord?.messages as CasePDFData["messages"]) || [],
              createdAt: updated.createdAt?.toISOString() || new Date().toISOString(),
            });
          } catch {
            console.warn(`[CASE] Could not generate PDF for escalation ${id}`);
          }

          // Send to configured specialist email (fallback to support)
          const specialistEmail = process.env.SPECIALIST_EMAIL || "support@totalassist.tech";
          await sendEscalationEmail(specialistEmail, updated.title, specialistUrl, pdfBase64);

          console.log(`[CASE] Sent escalation email for case ${id}`);
        } catch (err) {
          console.error(`[CASE] Failed to send escalation email for case ${id}:`, err);
        }
      })();
    }
  } catch (error) {
    console.error("Error updating case:", error);
    res.status(500).json({ error: "Failed to update case" });
  }
});

// DELETE: Delete ALL cases for the logged-in user
router.delete("/", async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Get all case IDs for this user
    const userCases = await db
      .select({ id: casesTable.id })
      .from(casesTable)
      .where(eq(casesTable.userId, req.user.id));

    // Delete in FK-safe order
    for (const c of userCases) {
      await db.delete(caseMessagesTable).where(eq(caseMessagesTable.caseId, c.id));
      await db.delete(sessionRecordingsTable).where(eq(sessionRecordingsTable.caseId, c.id));
    }
    await db.delete(casesTable).where(eq(casesTable.userId, req.user.id));

    res.json({ success: true, deletedCount: userCases.length });
  } catch (error) {
    console.error("Error deleting all cases:", error);
    res.status(500).json({ error: "Failed to delete cases" });
  }
});

// DELETE: Delete case + associated recordings/messages
router.delete("/:id", async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.params;

  try {
    // Verify ownership
    const [existing] = await db
      .select()
      .from(casesTable)
      .where(and(eq(casesTable.id, id), eq(casesTable.userId, req.user.id)))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Case not found" });
    }

    // Delete associated data first (FK constraints)
    await db.delete(caseMessagesTable).where(eq(caseMessagesTable.caseId, id));
    await db.delete(sessionRecordingsTable).where(eq(sessionRecordingsTable.caseId, id));
    await db.delete(casesTable).where(eq(casesTable.id, id));

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting case:", error);
    res.status(500).json({ error: "Failed to delete case" });
  }
});

// POST: Save/update chat messages for a case
router.post("/:id/messages", async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.params;
  const { messages } = req.body;

  try {
    // Verify case ownership
    const [caseRecord] = await db
      .select()
      .from(casesTable)
      .where(and(eq(casesTable.id, id), eq(casesTable.userId, req.user.id)))
      .limit(1);

    if (!caseRecord) {
      return res.status(404).json({ error: "Case not found" });
    }

    // Upsert messages - check if record exists
    const [existing] = await db
      .select()
      .from(caseMessagesTable)
      .where(eq(caseMessagesTable.caseId, id))
      .limit(1);

    if (existing) {
      await db
        .update(caseMessagesTable)
        .set({ messages })
        .where(eq(caseMessagesTable.caseId, id));
    } else {
      await db.insert(caseMessagesTable).values({
        caseId: id,
        messages,
      });
    }

    // Bump case updatedAt so sidebar ordering reflects latest activity
    await db
      .update(casesTable)
      .set({ updatedAt: new Date() })
      .where(eq(casesTable.id, id));

    res.json({ success: true });
  } catch (error) {
    console.error("Error saving messages:", error);
    res.status(500).json({ error: "Failed to save messages" });
  }
});

// GET: Fetch messages for a case
router.get("/:id/messages", async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.params;

  try {
    // Verify case ownership
    const [caseRecord] = await db
      .select()
      .from(casesTable)
      .where(and(eq(casesTable.id, id), eq(casesTable.userId, req.user.id)))
      .limit(1);

    if (!caseRecord) {
      return res.status(404).json({ error: "Case not found" });
    }

    const [messageRecord] = await db
      .select()
      .from(caseMessagesTable)
      .where(eq(caseMessagesTable.caseId, id))
      .limit(1);

    res.json({ messages: messageRecord?.messages || [] });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// POST: Save a session recording
router.post("/:id/recordings", async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.params;
  const { sessionType, transcript, durationSeconds } = req.body;

  try {
    // Verify case ownership
    const [caseRecord] = await db
      .select()
      .from(casesTable)
      .where(and(eq(casesTable.id, id), eq(casesTable.userId, req.user.id)))
      .limit(1);

    if (!caseRecord) {
      return res.status(404).json({ error: "Case not found" });
    }

    const [recording] = await db
      .insert(sessionRecordingsTable)
      .values({
        caseId: id,
        sessionType: sessionType || "chat",
        transcript: transcript || null,
        durationSeconds: durationSeconds || null,
      })
      .returning();

    res.json(recording);
  } catch (error) {
    console.error("Error saving recording:", error);
    res.status(500).json({ error: "Failed to save recording" });
  }
});

export default router;
