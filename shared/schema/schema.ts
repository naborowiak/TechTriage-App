import {
  pgTable,
  varchar,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";
import { v4 as uuidv4 } from "uuid";

// Subscription tier and billing interval types
export const subscriptionTierEnum = ["free", "home", "pro"] as const;
export type SubscriptionTier = (typeof subscriptionTierEnum)[number];

export const billingIntervalEnum = ["monthly", "annual"] as const;
export type BillingInterval = (typeof billingIntervalEnum)[number];

// Users table - stores user account information
export const usersTable = pgTable("users", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }), // null for OAuth users
  emailVerified: boolean("email_verified").default(false),
  verificationToken: varchar("verification_token", { length: 255 }),
  verificationTokenExpires: timestamp("verification_token_expires"),
  passwordResetToken: varchar("password_reset_token", { length: 255 }),
  passwordResetTokenExpires: timestamp("password_reset_token_expires"),
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
  sessionGuideEmails: boolean("session_guide_emails").default(true), // Fixed typo: 'sessieon' -> 'session'
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trials table - tracks free trial usage
export const trialsTable = pgTable("trials", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  email: varchar("email", { length: 255 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  fingerprint: varchar("fingerprint", { length: 255 }),
  startedAt: timestamp("started_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true),
});

// Devices Table (Home Inventory)
export const devicesTable = pgTable("devices", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => usersTable.id),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(), // 'router', 'smart_speaker', 'thermostat', etc.
  brand: varchar("brand", { length: 255 }),
  model: varchar("model", { length: 255 }),
  location: varchar("location", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// NEW: Cases Table (The "Folder" for a problem)
export const casesTable = pgTable("cases", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => usersTable.id),
  caseNumber: integer("case_number"), // Sequential per user (e.g., 1, 2, 3)
  title: varchar("title", { length: 255 }).notNull(), // e.g., "Blinking Red Router Light"
  status: varchar("status", { length: 50 }).default("open"), // "open", "resolved", "escalated", "pending"
  aiSummary: text("ai_summary"), // The compressed context for the AI
  deviceId: varchar("device_id", { length: 255 }).references(() => devicesTable.id),
  diagnosticSteps: jsonb("diagnostic_steps").$type<Array<{ step: string; result: string; timestamp: number }>>(),
  photosCount: integer("photos_count").default(0),
  sessionMode: varchar("session_mode", { length: 20 }), // 'chat' | 'voice' | 'photo' | 'video'
  escalatedAt: timestamp("escalated_at"),
  escalationReport: jsonb("escalation_report").$type<{
    problemDescription: string;
    stepsTried: string[];
    scoutAnalysis: string;
    recommendedSpecialist: string;
    urgencyLevel: string;
    photosIncluded: number;
    estimatedCostRange: string;
  }>(),
  // Specialist response fields
  specialistToken: varchar("specialist_token", { length: 255 }),
  specialistNotes: text("specialist_notes"),
  specialistRespondedAt: timestamp("specialist_responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// NEW: Case Messages Table (Chat messages per case)
export const caseMessagesTable = pgTable("case_messages", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  caseId: varchar("case_id", { length: 255 })
    .notNull()
    .references(() => casesTable.id),
  messages: jsonb("messages").$type<Array<{ role: string; text: string; image?: string; timestamp: number }>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// NEW: Session Recordings Table (The "File" inside the folder for Live sessions)
export const sessionRecordingsTable = pgTable("session_recordings", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  caseId: varchar("case_id", { length: 255 })
    .notNull()
    .references(() => casesTable.id),
  sessionType: varchar("session_type", { length: 50 }).notNull(), // "chat", "live_audio", "live_video", "photo_analysis", "escalation_report"
  transcript: text("transcript"), // Full text conversation
  audioUrl: text("audio_url"), // URL to stored audio file
  durationSeconds: integer("duration_seconds"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Express sessions table - for session storage
export const sessionsTable = pgTable("sessions", {
  sid: varchar("sid", { length: 255 }).primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// Subscriptions table - tracks user subscription state
export const subscriptionsTable = pgTable("subscriptions", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => usersTable.id)
    .unique(),

  // Stripe identifiers
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", {
    length: 255,
  }).unique(),
  stripePriceId: varchar("stripe_price_id", { length: 255 }),

  // Subscription state
  tier: varchar("tier", { length: 20 }).notNull().default("free"), // 'free' | 'home' | 'pro'
  billingInterval: varchar("billing_interval", { length: 20 }), // 'monthly' | 'annual'
  status: varchar("status", { length: 50 }).notNull().default("active"), // 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing'

  // Billing period tracking
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),

  // Cancellation tracking
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  canceledAt: timestamp("canceled_at"),

  // Trial tracking
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),

  // Purchased credits (one-time purchases, never expire)
  videoCredits: integer("video_credits").notNull().default(0),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Usage tracking table - tracks feature usage per billing period
export const usageTable = pgTable("usage", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => usersTable.id),

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

// Promo codes table - tracks promotional codes and their configuration
export const promoCodesTable = pgTable("promo_codes", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  code: varchar("code", { length: 50 }).notNull().unique(),
  stripePromoCodeId: varchar("stripe_promo_code_id", { length: 255 }),
  stripeCouponId: varchar("stripe_coupon_id", { length: 255 }),
  description: varchar("description", { length: 255 }),
  discountType: varchar("discount_type", { length: 20 }).notNull(), // 'percent' | 'fixed'
  discountValue: integer("discount_value").notNull(),
  maxRedemptions: integer("max_redemptions"),
  redemptionCount: integer("redemption_count").notNull().default(0),
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Promo code redemptions table - tracks who used which promo code
export const promoCodeRedemptionsTable = pgTable("promo_code_redemptions", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  promoCodeId: varchar("promo_code_id", { length: 255 })
    .notNull()
    .references(() => promoCodesTable.id),
  userId: varchar("user_id", { length: 255 }).references(() => usersTable.id),
  checkoutSessionId: varchar("checkout_session_id", { length: 255 }),
  redeemedAt: timestamp("redeemed_at").defaultNow(),
});

// Type exports
export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
export type Trial = typeof trialsTable.$inferSelect;
export type InsertTrial = typeof trialsTable.$inferInsert;
export type Subscription = typeof subscriptionsTable.$inferSelect;
export type InsertSubscription = typeof subscriptionsTable.$inferInsert;
export type Usage = typeof usageTable.$inferSelect;
export type InsertUsage = typeof usageTable.$inferInsert;
export type WebhookEvent = typeof webhookEventsTable.$inferSelect;
export type InsertWebhookEvent = typeof webhookEventsTable.$inferInsert;

// New Type exports
export type Case = typeof casesTable.$inferSelect;
export type InsertCase = typeof casesTable.$inferInsert;
export type CaseMessage = typeof caseMessagesTable.$inferSelect;
export type InsertCaseMessage = typeof caseMessagesTable.$inferInsert;
export type SessionRecording = typeof sessionRecordingsTable.$inferSelect;
export type InsertSessionRecording = typeof sessionRecordingsTable.$inferInsert;
export type Device = typeof devicesTable.$inferSelect;
export type InsertDevice = typeof devicesTable.$inferInsert;
export type PromoCode = typeof promoCodesTable.$inferSelect;
export type InsertPromoCode = typeof promoCodesTable.$inferInsert;
export type PromoCodeRedemption = typeof promoCodeRedemptionsTable.$inferSelect;
export type InsertPromoCodeRedemption = typeof promoCodeRedemptionsTable.$inferInsert;
