import Stripe from 'stripe';
import { db } from '../db';
import {
  usersTable,
  subscriptionsTable,
  usageTable,
  webhookEventsTable,
} from '../../shared/schema/schema';
import { eq, and, lte, gte } from 'drizzle-orm';
import {
  STRIPE_PRICES,
  getTierFromPriceId,
  getBillingIntervalFromPriceId,
  PLAN_LIMITS,
  TRIAL_DURATION_DAYS,
} from '../config/stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27.acacia',
});

// Get or create a Stripe customer for a user
export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  // Check if user already has a Stripe customer ID
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    throw new Error('User not found');
  }

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Create a new Stripe customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined,
    metadata: {
      userId: user.id,
    },
  });

  // Save customer ID to user
  await db
    .update(usersTable)
    .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
    .where(eq(usersTable.id, userId));

  return customer.id;
}

// Create a checkout session for subscription
export async function createCheckoutSession(
  userId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string }> {
  const customerId = await getOrCreateStripeCustomer(userId);

  // Check if this is the user's first subscription (for trial)
  const [existingSub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .limit(1);

  const isFirstSubscription = !existingSub || existingSub.tier === 'free';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: isFirstSubscription
      ? {
          trial_period_days: TRIAL_DURATION_DAYS,
          metadata: {
            userId,
          },
        }
      : {
          metadata: {
            userId,
          },
        },
    metadata: {
      userId,
    },
    allow_promotion_codes: true,
  });

  return {
    sessionId: session.id,
    url: session.url || '',
  };
}

// Create a customer portal session for managing subscription
export async function createPortalSession(
  userId: string,
  returnUrl: string
): Promise<{ url: string }> {
  const customerId = await getOrCreateStripeCustomer(userId);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return { url: session.url };
}

// Get subscription status for a user
export async function getSubscriptionStatus(userId: string) {
  const [subscription] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .limit(1);

  const tier = (subscription?.tier || 'free') as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[tier];

  // Get current period usage
  const now = new Date();
  const [usage] = await db
    .select()
    .from(usageTable)
    .where(
      and(
        eq(usageTable.userId, userId),
        lte(usageTable.periodStart, now),
        gte(usageTable.periodEnd, now)
      )
    )
    .limit(1);

  return {
    tier,
    status: subscription?.status || 'active',
    billingInterval: subscription?.billingInterval,
    currentPeriodStart: subscription?.currentPeriodStart,
    currentPeriodEnd: subscription?.currentPeriodEnd,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
    trialEnd: subscription?.trialEnd,
    usage: {
      chatSessions: usage?.chatSessions || 0,
      photoAnalyses: usage?.photoAnalyses || 0,
      liveSessions: usage?.liveSessions || 0,
    },
    limits: {
      chatSessions: limits.chatSessions,
      photoAnalyses: limits.photoAnalyses,
      liveSessions: limits.liveSessions,
    },
  };
}

// Cancel subscription at period end
export async function cancelSubscription(userId: string): Promise<{ success: boolean; cancelAtPeriodEnd: Date | null }> {
  const [subscription] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .limit(1);

  if (!subscription?.stripeSubscriptionId) {
    throw new Error('No active subscription found');
  }

  // Cancel at period end in Stripe
  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  // Update local record
  await db
    .update(subscriptionsTable)
    .set({
      cancelAtPeriodEnd: true,
      updatedAt: new Date(),
    })
    .where(eq(subscriptionsTable.userId, userId));

  return {
    success: true,
    cancelAtPeriodEnd: subscription.currentPeriodEnd,
  };
}

// Reactivate a subscription set to cancel
export async function reactivateSubscription(userId: string): Promise<{ success: boolean }> {
  const [subscription] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .limit(1);

  if (!subscription?.stripeSubscriptionId) {
    throw new Error('No subscription found');
  }

  // Reactivate in Stripe
  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });

  // Update local record
  await db
    .update(subscriptionsTable)
    .set({
      cancelAtPeriodEnd: false,
      canceledAt: null,
      updatedAt: new Date(),
    })
    .where(eq(subscriptionsTable.userId, userId));

  return { success: true };
}

// Handle checkout.session.completed webhook
export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('No userId in checkout session metadata');
    return;
  }

  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    console.error('No subscription ID in checkout session');
    return;
  }

  // Fetch the full subscription from Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = stripeSubscription.items.data[0]?.price.id;

  const tier = getTierFromPriceId(priceId) || 'home';
  const billingInterval = getBillingIntervalFromPriceId(priceId) || 'monthly';

  // Check if subscription record exists
  const [existingSub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .limit(1);

  const subscriptionData = {
    stripeCustomerId: session.customer as string,
    stripeSubscriptionId: subscriptionId,
    stripePriceId: priceId,
    tier,
    billingInterval,
    status: stripeSubscription.status,
    currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
    currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    trialStart: stripeSubscription.trial_start
      ? new Date(stripeSubscription.trial_start * 1000)
      : null,
    trialEnd: stripeSubscription.trial_end
      ? new Date(stripeSubscription.trial_end * 1000)
      : null,
    updatedAt: new Date(),
  };

  if (existingSub) {
    await db
      .update(subscriptionsTable)
      .set(subscriptionData)
      .where(eq(subscriptionsTable.userId, userId));
  } else {
    await db.insert(subscriptionsTable).values({
      userId,
      ...subscriptionData,
    });
  }

  // Initialize usage record for the new period
  await initializeUsageRecord(
    userId,
    new Date(stripeSubscription.current_period_start * 1000),
    new Date(stripeSubscription.current_period_end * 1000)
  );

  console.log(`[STRIPE] Subscription activated for user ${userId}: ${tier} (${billingInterval})`);
}

// Handle subscription updated webhook
export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    // Try to find user by customer ID
    const customerId = subscription.customer as string;
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.stripeCustomerId, customerId))
      .limit(1);

    if (!user) {
      console.error('Could not find user for subscription update');
      return;
    }

    await updateSubscriptionRecord(user.id, subscription);
  } else {
    await updateSubscriptionRecord(userId, subscription);
  }
}

async function updateSubscriptionRecord(userId: string, subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price.id;
  const tier = getTierFromPriceId(priceId) || 'home';
  const billingInterval = getBillingIntervalFromPriceId(priceId) || 'monthly';

  await db
    .update(subscriptionsTable)
    .set({
      stripePriceId: priceId,
      tier,
      billingInterval,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
      updatedAt: new Date(),
    })
    .where(eq(subscriptionsTable.userId, userId));

  console.log(`[STRIPE] Subscription updated for user ${userId}: ${tier} (${subscription.status})`);
}

// Handle subscription deleted webhook
export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find user by customer ID
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.stripeCustomerId, customerId))
    .limit(1);

  if (!user) {
    console.error('Could not find user for subscription deletion');
    return;
  }

  // Downgrade to free tier
  await db
    .update(subscriptionsTable)
    .set({
      tier: 'free',
      status: 'canceled',
      stripeSubscriptionId: null,
      stripePriceId: null,
      billingInterval: null,
      cancelAtPeriodEnd: false,
      canceledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(subscriptionsTable.userId, user.id));

  console.log(`[STRIPE] Subscription canceled for user ${user.id}, downgraded to free tier`);
}

// Handle successful payment - reset usage for new period
export async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId = invoice.customer as string;

  // Find user by customer ID
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.stripeCustomerId, customerId))
    .limit(1);

  if (!user) {
    console.error('Could not find user for payment success');
    return;
  }

  // Update subscription period
  await db
    .update(subscriptionsTable)
    .set({
      status: 'active',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      updatedAt: new Date(),
    })
    .where(eq(subscriptionsTable.userId, user.id));

  // Create new usage record for the period
  await initializeUsageRecord(
    user.id,
    new Date(subscription.current_period_start * 1000),
    new Date(subscription.current_period_end * 1000)
  );

  console.log(`[STRIPE] Payment succeeded for user ${user.id}, usage reset`);
}

// Handle failed payment
export async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Find user by customer ID
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.stripeCustomerId, customerId))
    .limit(1);

  if (!user) {
    console.error('Could not find user for payment failure');
    return;
  }

  // Update subscription status
  await db
    .update(subscriptionsTable)
    .set({
      status: 'past_due',
      updatedAt: new Date(),
    })
    .where(eq(subscriptionsTable.userId, user.id));

  console.log(`[STRIPE] Payment failed for user ${user.id}, status set to past_due`);
}

// Initialize or reset usage record for a billing period
async function initializeUsageRecord(
  userId: string,
  periodStart: Date,
  periodEnd: Date
) {
  // Check if record already exists for this period
  const [existing] = await db
    .select()
    .from(usageTable)
    .where(
      and(
        eq(usageTable.userId, userId),
        eq(usageTable.periodStart, periodStart),
        eq(usageTable.periodEnd, periodEnd)
      )
    )
    .limit(1);

  if (!existing) {
    await db.insert(usageTable).values({
      userId,
      periodStart,
      periodEnd,
      chatSessions: 0,
      photoAnalyses: 0,
      liveSessions: 0,
    });
  }
}

// Check if a webhook event has been processed (idempotency)
export async function isEventProcessed(eventId: string): Promise<boolean> {
  const [existing] = await db
    .select()
    .from(webhookEventsTable)
    .where(eq(webhookEventsTable.id, eventId))
    .limit(1);

  return existing?.processed || false;
}

// Record a webhook event
export async function recordWebhookEvent(
  eventId: string,
  eventType: string,
  payload: object
) {
  await db
    .insert(webhookEventsTable)
    .values({
      id: eventId,
      eventType,
      payload,
      processed: false,
    })
    .onConflictDoNothing();
}

// Mark webhook event as processed
export async function markEventProcessed(eventId: string, error?: string) {
  await db
    .update(webhookEventsTable)
    .set({
      processed: !error,
      error,
      processedAt: new Date(),
    })
    .where(eq(webhookEventsTable.id, eventId));
}

// Construct and verify webhook event
export function constructWebhookEvent(
  payload: Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET || ''
  );
}

// Export stripe instance for direct use if needed
export { stripe };
