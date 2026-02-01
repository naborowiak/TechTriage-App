import { pgTable, varchar, text, timestamp, boolean, jsonb, integer } from "drizzle-orm/pg-core";
import { v4 as uuidv4 } from "uuid";

// Subscription tier and billing interval types
export const subscriptionTierEnum = ['free', 'home', 'pro'] as const;
export type SubscriptionTier = typeof subscriptionTierEnum[number];

export const billingIntervalEnum = ['monthly', 'annual'] as const;
export type BillingInterval = typeof billingIntervalEnum[number];

// Users table - stores user account information
export const usersTable = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }), // null for OAuth users
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  profileImageUrl: text("profile_image_url"),
  homeType: varchar("home_type", { length: 100 }),
  techComfort: varchar("tech_comfort", { length: 50 }),
  householdSize: varchar("household_size", { length: 50 }),
  primaryIssues: jsonb("primary_issues").$type<string[]>(),
  howHeard: varchar("how_heard", { length: 100 }),
  emailNotifications: boolean("email_notifications").default(true),
  sessionGuideEmails: boolean("session_guide_emails").default(true),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trials table - tracks free trial usage
export const trialsTable = pgTable("trials", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
  email: varchar("email", { length: 255 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  fingerprint: varchar("fingerprint", { length: 255 }),
  startedAt: timestamp("started_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true),
});

// Support sessions table - stores chat/video session history
export const supportSessionsTable = pgTable("support_sessions", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
  userId: varchar("user_id", { length: 255 }).references(() => usersTable.id),
  sessionType: varchar("session_type", { length: 20 }).notNull(), // 'chat', 'video', 'photo'
  title: varchar("title", { length: 255 }),
  summary: text("summary"),
  transcript: jsonb("transcript").$type<Array<{
    role: 'user' | 'model';
    text: string;
    timestamp: number;
  }>>(),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

// Express sessions table - for session storage
export const sessionsTable = pgTable("sessions", {
  sid: varchar("sid", { length: 255 }).primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// Subscriptions table - tracks user subscription state
export const subscriptionsTable = pgTable("subscriptions", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => usersTable.id).unique(),

  // Stripe identifiers
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).unique(),
  stripePriceId: varchar("stripe_price_id", { length: 255 }),

  // Subscription state
  tier: varchar("tier", { length: 20 }).notNull().default('free'), // 'free' | 'home' | 'pro'
  billingInterval: varchar("billing_interval", { length: 20 }), // 'monthly' | 'annual'
  status: varchar("status", { length: 50 }).notNull().default('active'), // 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing'

  // Billing period tracking
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),

  // Cancellation tracking
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  canceledAt: timestamp("canceled_at"),

  // Trial tracking
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Usage tracking table - tracks feature usage per billing period
export const usageTable = pgTable("usage", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => uuidv4()),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => usersTable.id),

  // Period this usage belongs to
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),

  // Usage counts
  chatSessions: integer("chat_sessions").notNull().default(0),
  photoAnalyses: integer("photo_analyses").notNull().default(0),
  liveSessions: integer("live_sessions").notNull().default(0),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Webhook events table - for idempotency and debugging
export const webhookEventsTable = pgTable("webhook_events", {
  id: varchar("id", { length: 255 }).primaryKey(), // Use Stripe event ID
  eventType: varchar("event_type", { length: 100 }).notNull(),
  processed: boolean("processed").notNull().default(false),
  payload: jsonb("payload").$type<object>(),
  error: text("error"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Type exports
export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
export type Trial = typeof trialsTable.$inferSelect;
export type InsertTrial = typeof trialsTable.$inferInsert;
export type SupportSession = typeof supportSessionsTable.$inferSelect;
export type InsertSupportSession = typeof supportSessionsTable.$inferInsert;
export type Subscription = typeof subscriptionsTable.$inferSelect;
export type InsertSubscription = typeof subscriptionsTable.$inferInsert;
export type Usage = typeof usageTable.$inferSelect;
export type InsertUsage = typeof usageTable.$inferInsert;
export type WebhookEvent = typeof webhookEventsTable.$inferSelect;
export type InsertWebhookEvent = typeof webhookEventsTable.$inferInsert;
