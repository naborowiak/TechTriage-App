import { db } from "../db";
import { caseActivityTable } from "../../shared/schema/schema";
import { v4 as uuidv4 } from "uuid";

/**
 * Logs an immutable activity entry for a case.
 * Activity records are append-only — no UPDATE or DELETE.
 * Fire-and-forget: callers should await but failures are non-fatal.
 */
export async function logCaseActivity(params: {
  caseId: string;
  actorId: string;
  action: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.insert(caseActivityTable).values({
      id: uuidv4(),
      caseId: params.caseId,
      actorId: params.actorId,
      action: params.action,
      details: params.details ?? null,
    });
  } catch (err) {
    console.error("[CaseActivity] Failed to log activity:", err);
  }
}
