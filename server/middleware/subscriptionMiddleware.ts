import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { subscriptionsTable, usageTable } from '../../shared/schema/schema';
import { eq, and, lte, gte } from 'drizzle-orm';
import { PLAN_LIMITS, PlanTier } from '../config/stripe';

// Extend Express Request to include subscription context
declare global {
  namespace Express {
    interface Request {
      subscription?: SubscriptionContext;
    }
  }
}

export interface SubscriptionContext {
  tier: PlanTier;
  status: string;
  limits: typeof PLAN_LIMITS['free'];
  usage: {
    chatSessions: number;
    photoAnalyses: number;
    liveSessions: number;
  };
  periodEnd: Date | null;
  canUseChat: boolean;
  canUsePhoto: boolean;
  canUseLive: boolean;
}

// Middleware to load subscription context onto the request
export async function loadSubscription(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Try to get userId from various sources
  const userId =
    (req.body?.userId as string) ||
    (req.params?.userId as string) ||
    (req.query?.userId as string) ||
    (req.user as any)?.id;

  if (!userId) {
    return next();
  }

  try {
    // Get subscription
    const [subscription] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, userId))
      .limit(1);

    const tier = (subscription?.tier || 'free') as PlanTier;
    const status = subscription?.status || 'active';
    const limits = PLAN_LIMITS[tier];

    // Get current period usage
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    if (subscription?.currentPeriodStart && subscription?.currentPeriodEnd) {
      periodStart = subscription.currentPeriodStart;
      periodEnd = subscription.currentPeriodEnd;
    } else {
      // Default to monthly period for free users
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

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

    const currentUsage = {
      chatSessions: usage?.chatSessions || 0,
      photoAnalyses: usage?.photoAnalyses || 0,
      liveSessions: usage?.liveSessions || 0,
    };

    // Calculate total video sessions available (included + purchased credits)
    const includedVideoSessions = limits.includedVideoSessions;
    const purchasedVideoCredits = subscription?.videoCredits || 0;
    const totalVideoSessions = includedVideoSessions + purchasedVideoCredits;

    // Calculate if user can use each feature
    const canUseChat = currentUsage.chatSessions < limits.chatSessions;
    const canUsePhoto =
      limits.photoAnalyses === Infinity ||
      (limits.photoAnalyses > 0 && currentUsage.photoAnalyses < limits.photoAnalyses);
    const canUseLive =
      totalVideoSessions === Infinity ||
      (totalVideoSessions > 0 && currentUsage.liveSessions < totalVideoSessions);

    req.subscription = {
      tier,
      status,
      limits,
      usage: currentUsage,
      periodEnd,
      canUseChat,
      canUsePhoto,
      canUseLive,
    };

    next();
  } catch (error) {
    console.error('Error loading subscription:', error);
    next(error);
  }
}

// Middleware to require a specific feature
export function requireFeature(feature: 'chat' | 'photo' | 'live') {
  return (req: Request, res: Response, next: NextFunction) => {
    const sub = req.subscription;

    if (!sub) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    // Check subscription status
    if (sub.status !== 'active' && sub.status !== 'trialing') {
      return res.status(403).json({
        error: 'Subscription inactive',
        code: 'SUBSCRIPTION_INACTIVE',
        status: sub.status,
        message:
          sub.status === 'past_due'
            ? 'Please update your payment method to continue.'
            : 'Your subscription is not active.',
      });
    }

    // Check feature access
    const canUse = {
      chat: sub.canUseChat,
      photo: sub.canUsePhoto,
      live: sub.canUseLive,
    }[feature];

    if (!canUse) {
      const featureNames = {
        chat: 'chat sessions',
        photo: 'photo analyses',
        live: 'live support sessions',
      };

      return res.status(403).json({
        error: 'Feature limit reached',
        code: 'LIMIT_REACHED',
        feature,
        message: `You've used all your ${featureNames[feature]} for this billing period.`,
        tier: sub.tier,
        usage: sub.usage,
        limits: sub.limits,
        upgradeRequired: sub.tier === 'free',
      });
    }

    next();
  };
}

// Middleware to require a minimum plan tier
export function requireTier(minimumTier: 'home' | 'pro') {
  const tierOrder: Record<string, number> = {
    free: 0,
    home: 1,
    pro: 2,
  };

  return (req: Request, res: Response, next: NextFunction) => {
    const sub = req.subscription;

    if (!sub) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    const currentTierLevel = tierOrder[sub.tier] || 0;
    const requiredTierLevel = tierOrder[minimumTier];

    if (currentTierLevel < requiredTierLevel) {
      return res.status(403).json({
        error: 'Upgrade required',
        code: 'TIER_REQUIRED',
        currentTier: sub.tier,
        requiredTier: minimumTier,
        message: `This feature requires the ${minimumTier.charAt(0).toUpperCase() + minimumTier.slice(1)} plan or higher.`,
      });
    }

    next();
  };
}

// Increment usage after a feature is used
export async function incrementUsage(
  userId: string,
  feature: 'chatSessions' | 'photoAnalyses' | 'liveSessions'
): Promise<void> {
  const now = new Date();

  // Get subscription for period dates and video credits
  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .limit(1);

  // Find current period usage record
  let [usage] = await db
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

  if (!usage) {
    // Calculate period dates
    let periodStart: Date;
    let periodEnd: Date;

    if (sub?.currentPeriodStart && sub?.currentPeriodEnd) {
      periodStart = sub.currentPeriodStart;
      periodEnd = sub.currentPeriodEnd;
    } else {
      // Default to monthly period for free users
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    // Create new usage record
    const [newUsage] = await db
      .insert(usageTable)
      .values({
        userId,
        periodStart,
        periodEnd,
        [feature]: 1,
      })
      .returning();

    usage = newUsage;

    // For live sessions: if this is the first session and user has no included sessions,
    // consume a purchased credit
    if (feature === 'liveSessions' && sub) {
      const tier = (sub.tier || 'free') as PlanTier;
      const includedSessions = PLAN_LIMITS[tier].includedVideoSessions;
      if (includedSessions === 0 && (sub.videoCredits || 0) > 0) {
        await db
          .update(subscriptionsTable)
          .set({
            videoCredits: (sub.videoCredits || 0) - 1,
            updatedAt: new Date(),
          })
          .where(eq(subscriptionsTable.userId, userId));
      }
    }
  } else {
    // Increment existing record
    const newCount = (usage[feature] || 0) + 1;
    await db
      .update(usageTable)
      .set({
        [feature]: newCount,
        updatedAt: new Date(),
      })
      .where(eq(usageTable.id, usage.id));

    // For live sessions: consume a purchased credit if exceeding included sessions
    if (feature === 'liveSessions' && sub) {
      const tier = (sub.tier || 'free') as PlanTier;
      const includedSessions = PLAN_LIMITS[tier].includedVideoSessions;
      const currentUsed = usage.liveSessions || 0;

      // If the new session exceeds included sessions, consume a purchased credit
      if (newCount > includedSessions && (sub.videoCredits || 0) > 0) {
        await db
          .update(subscriptionsTable)
          .set({
            videoCredits: (sub.videoCredits || 0) - 1,
            updatedAt: new Date(),
          })
          .where(eq(subscriptionsTable.userId, userId));
        console.log(`[USAGE] Consumed 1 purchased video credit for user ${userId}. Remaining: ${(sub.videoCredits || 0) - 1}`);
      }
    }
  }
}

// Check if user can use a feature (for WebSocket connections)
export async function checkFeatureAccess(
  userId: string,
  feature: 'chat' | 'photo' | 'live'
): Promise<{
  allowed: boolean;
  reason?: string;
  tier?: string;
  usage?: object;
  limits?: object;
}> {
  // Get subscription
  const [subscription] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .limit(1);

  const tier = (subscription?.tier || 'free') as PlanTier;
  const status = subscription?.status || 'active';
  const limits = PLAN_LIMITS[tier];

  // Check status
  if (status !== 'active' && status !== 'trialing') {
    return {
      allowed: false,
      reason: 'SUBSCRIPTION_INACTIVE',
      tier,
    };
  }

  // Get current usage
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

  const currentUsage = {
    chatSessions: usage?.chatSessions || 0,
    photoAnalyses: usage?.photoAnalyses || 0,
    liveSessions: usage?.liveSessions || 0,
  };

  // Calculate total video sessions (included + purchased credits)
  const includedVideoSessions = limits.includedVideoSessions;
  const purchasedVideoCredits = subscription?.videoCredits || 0;
  const totalVideoSessions = includedVideoSessions + purchasedVideoCredits;

  // Check specific feature
  const featureMap = {
    chat: { current: currentUsage.chatSessions, limit: limits.chatSessions },
    photo: { current: currentUsage.photoAnalyses, limit: limits.photoAnalyses },
    live: { current: currentUsage.liveSessions, limit: totalVideoSessions },
  };

  const { current, limit } = featureMap[feature];

  if (limit === 0) {
    return {
      allowed: false,
      reason: 'FEATURE_NOT_AVAILABLE',
      tier,
      usage: currentUsage,
      limits,
    };
  }

  if (limit !== Infinity && current >= limit) {
    return {
      allowed: false,
      reason: 'LIMIT_REACHED',
      tier,
      usage: currentUsage,
      limits,
    };
  }

  return {
    allowed: true,
    tier,
    usage: currentUsage,
    limits,
  };
}
