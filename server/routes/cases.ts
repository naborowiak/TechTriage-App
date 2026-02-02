import { Router } from "express";
import { db } from "../db";
import { casesTable, sessionRecordingsTable } from "../../shared/schema/schema";
import { eq, desc } from "drizzle-orm";

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

// POST: Create a new case (e.g., when clicking "Start Live Support")
router.post("/", async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { title } = req.body;

  try {
    const [newCase] = await db
      .insert(casesTable)
      .values({
        userId: req.user.id,
        title: title || "New Support Session",
        status: "open",
        aiSummary: "Initial session started.",
      })
      .returning();

    res.json(newCase);
  } catch (error) {
    console.error("Error creating case:", error);
    res.status(500).json({ error: "Failed to create case" });
  }
});

// GET: Fetch single case details + recordings
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

    res.json({ case: caseDetails, recordings });
  } catch (error) {
    console.error("Error fetching case details:", error);
    res.status(500).json({ error: "Failed to fetch case details" });
  }
});

export default router;
