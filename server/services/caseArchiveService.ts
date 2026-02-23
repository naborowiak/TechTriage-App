import { db } from "../db";
import {
  casesTable,
  caseMessagesTable,
  sessionRecordingsTable,
  caseNotesTable,
  caseActivityTable,
  caseArchivesTable,
} from "../../shared/schema/schema";
import { eq, lt } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { logCaseActivity } from "./caseActivityService";

const ARCHIVE_RETENTION_DAYS = 7;

/**
 * Archives a case and all related records for later recovery.
 * Hard-deletes the live data in FK-safe order after snapshotting.
 */
export async function archiveCase(caseId: string, deletedById: string) {
  // 1. Fetch the case
  const [caseRecord] = await db
    .select()
    .from(casesTable)
    .where(eq(casesTable.id, caseId))
    .limit(1);

  if (!caseRecord) {
    throw new Error("Case not found");
  }

  // 2. Fetch all related records
  const messages = await db
    .select()
    .from(caseMessagesTable)
    .where(eq(caseMessagesTable.caseId, caseId));

  const recordings = await db
    .select()
    .from(sessionRecordingsTable)
    .where(eq(sessionRecordingsTable.caseId, caseId));

  const notes = await db
    .select()
    .from(caseNotesTable)
    .where(eq(caseNotesTable.caseId, caseId));

  const activity = await db
    .select()
    .from(caseActivityTable)
    .where(eq(caseActivityTable.caseId, caseId));

  // 3. Build the archive snapshot
  const purgeAfter = new Date(
    Date.now() + ARCHIVE_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );

  const archiveId = uuidv4();
  const [archiveRow] = await db
    .insert(caseArchivesTable)
    .values({
      id: archiveId,
      caseId: caseRecord.id,
      userId: caseRecord.userId,
      caseNumber: caseRecord.caseNumber,
      title: caseRecord.title,
      snapshot: {
        case: caseRecord as unknown as Record<string, unknown>,
        messages,
        recordings,
        notes,
        activity,
      },
      deletedById,
      purgeAfter,
    })
    .returning();

  // 4. Hard-delete from live tables in FK-safe order:
  //    caseActivity -> caseNotes -> caseMessages -> sessionRecordings -> casesTable
  await db
    .delete(caseActivityTable)
    .where(eq(caseActivityTable.caseId, caseId));
  await db
    .delete(caseNotesTable)
    .where(eq(caseNotesTable.caseId, caseId));
  await db
    .delete(caseMessagesTable)
    .where(eq(caseMessagesTable.caseId, caseId));
  await db
    .delete(sessionRecordingsTable)
    .where(eq(sessionRecordingsTable.caseId, caseId));
  await db
    .delete(casesTable)
    .where(eq(casesTable.id, caseId));

  return archiveRow;
}

/**
 * Restores a previously archived case back into the live tables.
 * Deletes the archive row after successful restoration.
 */
export async function restoreCase(archiveId: string, restoredById: string) {
  // 1. Fetch the archive row
  const [archive] = await db
    .select()
    .from(caseArchivesTable)
    .where(eq(caseArchivesTable.id, archiveId))
    .limit(1);

  if (!archive) {
    throw new Error("Archive not found");
  }

  // 2. Check retention window
  if (!archive.purgeAfter || archive.purgeAfter <= new Date()) {
    throw new Error("Archive has expired");
  }

  // 3. Check for ID collision in live casesTable
  const [existing] = await db
    .select({ id: casesTable.id })
    .from(casesTable)
    .where(eq(casesTable.id, archive.caseId))
    .limit(1);

  if (existing) {
    throw new Error("Case ID already exists");
  }

  const snapshot = archive.snapshot;
  if (!snapshot) {
    throw new Error("Archive snapshot is empty");
  }

  // 4. Re-insert the case record from snapshot
  const snapshotCase = snapshot.case as Record<string, unknown>;
  await db.insert(casesTable).values({
    id: snapshotCase.id as string,
    userId: snapshotCase.userId as string,
    caseNumber: snapshotCase.caseNumber as number | null,
    title: snapshotCase.title as string,
    status: snapshotCase.status as string | null,
    aiSummary: (snapshotCase.aiSummary as string) ?? null,
    deviceId: (snapshotCase.deviceId as string) ?? null,
    diagnosticSteps: (snapshotCase.diagnosticSteps as Array<{ step: string; result: string; timestamp: number }>) ?? null,
    photosCount: (snapshotCase.photosCount as number) ?? 0,
    sessionMode: (snapshotCase.sessionMode as string) ?? null,
    modeSequence: (snapshotCase.modeSequence as number) ?? null,
    escalatedAt: snapshotCase.escalatedAt ? new Date(snapshotCase.escalatedAt as string) : null,
    escalationReport: (snapshotCase.escalationReport as any) ?? null,
    specialistToken: (snapshotCase.specialistToken as string) ?? null,
    specialistTokenExpiresAt: snapshotCase.specialistTokenExpiresAt
      ? new Date(snapshotCase.specialistTokenExpiresAt as string)
      : null,
    specialistNotes: (snapshotCase.specialistNotes as string) ?? null,
    specialistRespondedAt: snapshotCase.specialistRespondedAt
      ? new Date(snapshotCase.specialistRespondedAt as string)
      : null,
    playbookProcessed: (snapshotCase.playbookProcessed as boolean) ?? null,
    priority: (snapshotCase.priority as string) ?? "medium",
    assignedAgentId: (snapshotCase.assignedAgentId as string) ?? null,
    createdAt: snapshotCase.createdAt ? new Date(snapshotCase.createdAt as string) : new Date(),
    updatedAt: snapshotCase.updatedAt ? new Date(snapshotCase.updatedAt as string) : new Date(),
  });

  // 5. Re-insert messages
  const messages = snapshot.messages as Array<Record<string, unknown>>;
  for (const msg of messages) {
    await db.insert(caseMessagesTable).values({
      id: msg.id as string,
      caseId: msg.caseId as string,
      messages: msg.messages as Array<{ role: string; text: string; image?: string; timestamp: number }> | null,
      createdAt: msg.createdAt ? new Date(msg.createdAt as string) : new Date(),
    });
  }

  // 6. Re-insert recordings
  const recordings = snapshot.recordings as Array<Record<string, unknown>>;
  for (const rec of recordings) {
    await db.insert(sessionRecordingsTable).values({
      id: rec.id as string,
      caseId: rec.caseId as string,
      sessionType: rec.sessionType as string,
      transcript: (rec.transcript as string) ?? null,
      audioUrl: (rec.audioUrl as string) ?? null,
      durationSeconds: (rec.durationSeconds as number) ?? null,
      createdAt: rec.createdAt ? new Date(rec.createdAt as string) : new Date(),
    });
  }

  // 7. Re-insert notes
  const notes = snapshot.notes as Array<Record<string, unknown>>;
  for (const note of notes) {
    await db.insert(caseNotesTable).values({
      id: note.id as string,
      caseId: note.caseId as string,
      authorId: note.authorId as string,
      content: note.content as string,
      createdAt: note.createdAt ? new Date(note.createdAt as string) : new Date(),
      updatedAt: note.updatedAt ? new Date(note.updatedAt as string) : new Date(),
    });
  }

  // 8. Re-insert activity records
  const activityRecords = snapshot.activity as Array<Record<string, unknown>>;
  for (const act of activityRecords) {
    await db.insert(caseActivityTable).values({
      id: act.id as string,
      caseId: act.caseId as string,
      actorId: act.actorId as string,
      action: act.action as string,
      details: (act.details as Record<string, unknown>) ?? null,
      createdAt: act.createdAt ? new Date(act.createdAt as string) : new Date(),
    });
  }

  // 9. Delete the archive row
  await db
    .delete(caseArchivesTable)
    .where(eq(caseArchivesTable.id, archiveId));

  // 10. Log a "restored" activity entry
  await logCaseActivity({
    caseId: archive.caseId,
    actorId: restoredById,
    action: "restored",
    details: { archiveId, restoredFrom: "case_archives" },
  });

  return { caseId: archive.caseId };
}

/**
 * Purges archive rows that have exceeded the retention window.
 * Intended to be called by a scheduled cron job.
 */
export async function purgeExpiredArchives() {
  const now = new Date();

  const deleted = await db
    .delete(caseArchivesTable)
    .where(lt(caseArchivesTable.purgeAfter, now))
    .returning();

  const purgedCount = deleted.length;

  if (purgedCount > 0) {
    console.log(`[CaseArchive] Purged ${purgedCount} expired archive(s)`);
  }

  return { purgedCount };
}
