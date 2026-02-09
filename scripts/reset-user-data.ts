/**
 * One-time script to reset all case/session data for a specific user.
 * Usage: npx tsx scripts/reset-user-data.ts naborowiak@gmail.com
 */
import { db } from "../server/db";
import {
  usersTable,
  casesTable,
  caseMessagesTable,
  sessionRecordingsTable,
  devicesTable,
  usageTable,
  promoCodeRedemptionsTable,
} from "../shared/schema/schema";
import { eq } from "drizzle-orm";

async function resetUserData(email: string) {
  console.log(`Looking up user: ${email}`);

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()))
    .limit(1);

  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  console.log(`Found user: ${user.id} (${user.firstName} ${user.lastName})`);

  // Get all case IDs for this user
  const userCases = await db
    .select({ id: casesTable.id })
    .from(casesTable)
    .where(eq(casesTable.userId, user.id));

  console.log(`Found ${userCases.length} cases to delete`);

  // Delete in FK-safe order (deepest children first)
  for (const c of userCases) {
    await db.delete(caseMessagesTable).where(eq(caseMessagesTable.caseId, c.id));
    await db.delete(sessionRecordingsTable).where(eq(sessionRecordingsTable.caseId, c.id));
  }
  console.log("Deleted case messages and session recordings");

  await db.delete(casesTable).where(eq(casesTable.userId, user.id));
  console.log("Deleted cases");

  await db.delete(devicesTable).where(eq(devicesTable.userId, user.id));
  console.log("Deleted devices");

  await db.delete(usageTable).where(eq(usageTable.userId, user.id));
  console.log("Deleted usage records");

  await db.delete(promoCodeRedemptionsTable).where(eq(promoCodeRedemptionsTable.userId, user.id));
  console.log("Deleted promo code redemptions");

  console.log(`\nReset complete for ${email}:`);
  console.log(`  - ${userCases.length} cases deleted (with messages and recordings)`);
  console.log(`  - Devices, usage, and promo redemptions cleared`);
  console.log(`  - User account and subscription preserved`);
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: npx tsx scripts/reset-user-data.ts <email>");
  process.exit(1);
}

resetUserData(email)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
