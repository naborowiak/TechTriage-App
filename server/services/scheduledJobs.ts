import cron from 'node-cron';
import { db } from '../db';
import { subscriptionsTable, usersTable } from '../../shared/schema/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { sendTrialEndingEmail } from './emailService';

/**
 * Check for subscriptions with trials ending soon (3 days or 1 day)
 * and send reminder emails
 */
async function checkTrialEndingNotifications(): Promise<void> {
  console.log('[SCHEDULED] Running trial notification check...');

  const now = new Date();

  // Calculate date ranges for 3 days from now and 1 day from now
  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  threeDaysFromNow.setHours(0, 0, 0, 0);

  const threeDaysFromNowEnd = new Date(threeDaysFromNow);
  threeDaysFromNowEnd.setHours(23, 59, 59, 999);

  const oneDayFromNow = new Date(now);
  oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
  oneDayFromNow.setHours(0, 0, 0, 0);

  const oneDayFromNowEnd = new Date(oneDayFromNow);
  oneDayFromNowEnd.setHours(23, 59, 59, 999);

  try {
    // Find subscriptions with trial ending in 3 days
    const trialEndingIn3Days = await db
      .select({
        subscription: subscriptionsTable,
        user: usersTable,
      })
      .from(subscriptionsTable)
      .innerJoin(usersTable, eq(subscriptionsTable.userId, usersTable.id))
      .where(
        and(
          eq(subscriptionsTable.status, 'trialing'),
          gte(subscriptionsTable.trialEnd, threeDaysFromNow),
          lte(subscriptionsTable.trialEnd, threeDaysFromNowEnd)
        )
      );

    console.log(`[SCHEDULED] Found ${trialEndingIn3Days.length} trials ending in 3 days`);

    for (const { subscription, user } of trialEndingIn3Days) {
      if (user.email && subscription.trialEnd) {
        await sendTrialEndingEmail(
          user.email,
          user.firstName || undefined,
          3,
          subscription.trialEnd
        );
      }
    }

    // Find subscriptions with trial ending in 1 day (tomorrow)
    const trialEndingIn1Day = await db
      .select({
        subscription: subscriptionsTable,
        user: usersTable,
      })
      .from(subscriptionsTable)
      .innerJoin(usersTable, eq(subscriptionsTable.userId, usersTable.id))
      .where(
        and(
          eq(subscriptionsTable.status, 'trialing'),
          gte(subscriptionsTable.trialEnd, oneDayFromNow),
          lte(subscriptionsTable.trialEnd, oneDayFromNowEnd)
        )
      );

    console.log(`[SCHEDULED] Found ${trialEndingIn1Day.length} trials ending in 1 day`);

    for (const { subscription, user } of trialEndingIn1Day) {
      if (user.email && subscription.trialEnd) {
        await sendTrialEndingEmail(
          user.email,
          user.firstName || undefined,
          1,
          subscription.trialEnd
        );
      }
    }

    console.log('[SCHEDULED] Trial notification check completed');
  } catch (error) {
    console.error('[SCHEDULED] Error checking trial notifications:', error);
  }
}

/**
 * Start the cron job for trial notifications
 * Runs daily at 9 AM
 */
export function startTrialNotificationJob(): void {
  console.log('[SCHEDULED] Starting trial notification cron job (daily at 9 AM)');

  // Schedule to run at 9:00 AM every day
  cron.schedule('0 9 * * *', async () => {
    console.log('[SCHEDULED] Cron job triggered at', new Date().toISOString());
    await checkTrialEndingNotifications();
  });
}

/**
 * Manually trigger the trial notification check (for testing)
 */
export async function runTrialNotificationCheckNow(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    await checkTrialEndingNotifications();
    return { success: true, message: 'Trial notification check completed' };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}
