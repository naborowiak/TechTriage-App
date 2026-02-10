import { Router } from "express";
import { db } from "../db";
import { casesTable, caseMessagesTable, usersTable } from "../../shared/schema/schema";
import { eq } from "drizzle-orm";

const router = Router();

// GET: Fetch case details by specialist token (no auth required)
router.get("/:token", async (req, res) => {
  const { token } = req.params;

  try {
    const [caseRecord] = await db
      .select()
      .from(casesTable)
      .where(eq(casesTable.specialistToken, token))
      .limit(1);

    if (!caseRecord) {
      return res.status(404).json({ error: "Invalid or expired specialist link" });
    }

    // Check token expiration (null expiresAt = non-expiring for backward compatibility)
    if (caseRecord.specialistTokenExpiresAt && new Date() > caseRecord.specialistTokenExpiresAt) {
      return res.status(410).json({ error: "This specialist link has expired", expired: true });
    }

    // Fetch messages
    const [messageRecord] = await db
      .select()
      .from(caseMessagesTable)
      .where(eq(caseMessagesTable.caseId, caseRecord.id))
      .limit(1);

    // Fetch user info (name only, no sensitive data)
    const [user] = await db
      .select({
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
      })
      .from(usersTable)
      .where(eq(usersTable.id, caseRecord.userId))
      .limit(1);

    res.json({
      case: {
        id: caseRecord.id,
        title: caseRecord.title,
        status: caseRecord.status,
        sessionMode: caseRecord.sessionMode,
        escalatedAt: caseRecord.escalatedAt,
        escalationReport: caseRecord.escalationReport,
        specialistNotes: caseRecord.specialistNotes,
        specialistRespondedAt: caseRecord.specialistRespondedAt,
        createdAt: caseRecord.createdAt,
      },
      messages: messageRecord?.messages || [],
      userName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "User",
    });
  } catch (error) {
    console.error("Error fetching specialist case:", error);
    res.status(500).json({ error: "Failed to fetch case details" });
  }
});

// POST: Submit specialist response
router.post("/:token/respond", async (req, res) => {
  const { token } = req.params;
  const { notes } = req.body;

  if (!notes || typeof notes !== "string" || notes.trim().length === 0) {
    return res.status(400).json({ error: "Notes are required" });
  }

  try {
    const [caseRecord] = await db
      .select()
      .from(casesTable)
      .where(eq(casesTable.specialistToken, token))
      .limit(1);

    if (!caseRecord) {
      return res.status(404).json({ error: "Invalid or expired specialist link" });
    }

    // Check token expiration (null expiresAt = non-expiring for backward compatibility)
    if (caseRecord.specialistTokenExpiresAt && new Date() > caseRecord.specialistTokenExpiresAt) {
      return res.status(410).json({ error: "This specialist link has expired", expired: true });
    }

    const [updated] = await db
      .update(casesTable)
      .set({
        specialistNotes: notes.trim(),
        specialistRespondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(casesTable.id, caseRecord.id))
      .returning();

    res.json({ success: true, case: updated });

    // Fire-and-forget: notify user via email
    (async () => {
      try {
        const { sendSpecialistResponseEmail } = await import("../services/emailService");
        const [user] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, caseRecord.userId))
          .limit(1);

        if (user?.email) {
          await sendSpecialistResponseEmail(
            user.email,
            user.firstName || "there",
            caseRecord.title,
            caseRecord.id
          );
          console.log(`[SPECIALIST] Sent response notification for case ${caseRecord.id}`);
        }
      } catch (err) {
        console.error(`[SPECIALIST] Failed to send notification:`, err);
      }
    })();
  } catch (error) {
    console.error("Error submitting specialist response:", error);
    res.status(500).json({ error: "Failed to submit response" });
  }
});

export default router;
