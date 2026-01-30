import { pgTable, varchar, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { v4 as uuidv4 } from "uuid";

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

// Type exports
export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
export type Trial = typeof trialsTable.$inferSelect;
export type InsertTrial = typeof trialsTable.$inferInsert;
export type SupportSession = typeof supportSessionsTable.$inferSelect;
export type InsertSupportSession = typeof supportSessionsTable.$inferInsert;
