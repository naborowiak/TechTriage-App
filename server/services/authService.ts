import bcrypt from "bcrypt";
import { db } from "../db";
import { usersTable, trialsTable, supportSessionsTable } from "../../shared/schema/schema";
import { eq, and, gt } from "drizzle-orm";

const SALT_ROUNDS = 10;
const TRIAL_DURATION_HOURS = 24;

// User Registration
export async function registerUser(data: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  homeType?: string;
  techComfort?: string;
  householdSize?: string;
  primaryIssues?: string[];
  howHeard?: string;
}) {
  console.log("[AUTH SERVICE] registerUser called for:", data.email);
  console.log("[AUTH SERVICE] Password received:", !!data.password, "Length:", data.password?.length);

  // Check if user already exists
  const existingUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, data.email.toLowerCase()))
    .limit(1);

  if (existingUser.length > 0) {
    console.log("[AUTH SERVICE] User already exists:", data.email);
    return { success: false, error: "An account with this email already exists." };
  }

  // Hash password
  console.log("[AUTH SERVICE] Hashing password...");
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  console.log("[AUTH SERVICE] Password hashed, hash length:", passwordHash.length);

  // Create user
  console.log("[AUTH SERVICE] Inserting user with values:", {
    email: data.email.toLowerCase(),
    passwordHash: passwordHash ? `[HASH: ${passwordHash.length} chars]` : 'MISSING!',
    firstName: data.firstName,
  });

  let newUser;
  try {
    const result = await db
      .insert(usersTable)
      .values({
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        homeType: data.homeType,
        techComfort: data.techComfort,
        householdSize: data.householdSize,
        primaryIssues: data.primaryIssues,
        howHeard: data.howHeard,
      })
      .returning();
    newUser = result[0];
  } catch (dbError) {
    console.error("[AUTH SERVICE] Database INSERT error:", dbError);
    throw dbError;
  }

  console.log("[AUTH SERVICE] User created with ID:", newUser.id);
  console.log("[AUTH SERVICE] User passwordHash stored:", !!newUser.passwordHash);
  console.log("[AUTH SERVICE] Returned user object keys:", Object.keys(newUser));

  return {
    success: true,
    user: {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
    },
  };
}

// User Login
export async function loginUser(email: string, password: string) {
  console.log("[AUTH SERVICE] loginUser called for:", email);

  // Find user by email
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (!user) {
    console.log("[AUTH SERVICE] User not found:", email);
    return { success: false, error: "Invalid email or password." };
  }

  console.log("[AUTH SERVICE] User found, ID:", user.id);
  console.log("[AUTH SERVICE] User has passwordHash:", !!user.passwordHash);
  console.log("[AUTH SERVICE] User object keys:", Object.keys(user));
  console.log("[AUTH SERVICE] Raw passwordHash value type:", typeof user.passwordHash);
  console.log("[AUTH SERVICE] passwordHash length:", user.passwordHash?.length);

  // Check if user has a password (OAuth users don't)
  if (!user.passwordHash) {
    console.log("[AUTH SERVICE] No passwordHash - OAuth user");
    return { success: false, error: "Please log in using your social account." };
  }

  // Verify password
  console.log("[AUTH SERVICE] Comparing passwords...");
  const isValid = await bcrypt.compare(password, user.passwordHash);
  console.log("[AUTH SERVICE] Password valid:", isValid);

  if (!isValid) {
    return { success: false, error: "Invalid email or password." };
  }

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
    },
  };
}

// Get user by ID
export async function getUserById(id: string) {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);

  return user || null;
}

// Get user by email
export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  return user || null;
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    emailNotifications?: boolean;
    sessionGuideEmails?: boolean;
    // Onboarding fields
    homeType?: string;
    techComfort?: string;
    householdSize?: string;
    primaryIssues?: string[];
    howHeard?: string;
  }
) {
  const [updatedUser] = await db
    .update(usersTable)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, userId))
    .returning();

  return updatedUser;
}

// Trial Management
export async function checkTrialEligibility(email: string, ip: string, fingerprint?: string) {
  // Check for existing trial by email
  const existingByEmail = await db
    .select()
    .from(trialsTable)
    .where(eq(trialsTable.email, email.toLowerCase()))
    .limit(1);

  if (existingByEmail.length > 0) {
    const trial = existingByEmail[0];
    const now = new Date();
    if (trial.expiresAt > now) {
      // Trial still active
      const remainingMs = trial.expiresAt.getTime() - now.getTime();
      const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
      const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      return {
        eligible: false,
        hasTrial: true,
        isActive: true,
        remainingHours,
        remainingMinutes,
        reason: "Active trial exists",
      };
    } else {
      return {
        eligible: false,
        hasTrial: true,
        isActive: false,
        reason: "Trial has expired",
      };
    }
  }

  // Check for existing trial by IP (to prevent abuse)
  const existingByIP = await db
    .select()
    .from(trialsTable)
    .where(
      and(
        eq(trialsTable.ipAddress, ip),
        gt(trialsTable.expiresAt, new Date())
      )
    )
    .limit(1);

  if (existingByIP.length > 0) {
    return {
      eligible: false,
      hasTrial: false,
      reason: "A trial is already active from this network",
    };
  }

  return { eligible: true, hasTrial: false };
}

export async function startTrial(email: string, ip: string, fingerprint?: string) {
  const eligibility = await checkTrialEligibility(email, ip, fingerprint);

  if (!eligibility.eligible) {
    return { success: false, ...eligibility };
  }

  const expiresAt = new Date(Date.now() + TRIAL_DURATION_HOURS * 60 * 60 * 1000);

  const [trial] = await db
    .insert(trialsTable)
    .values({
      email: email.toLowerCase(),
      ipAddress: ip,
      fingerprint,
      expiresAt,
    })
    .returning();

  return {
    success: true,
    trial: {
      id: trial.id,
      expiresAt: trial.expiresAt,
      remainingHours: TRIAL_DURATION_HOURS,
      remainingMinutes: 0,
    },
  };
}

export async function getTrialStatus(email: string) {
  const [trial] = await db
    .select()
    .from(trialsTable)
    .where(eq(trialsTable.email, email.toLowerCase()))
    .limit(1);

  if (!trial) {
    return { hasTrial: false, isActive: false };
  }

  const now = new Date();
  if (trial.expiresAt <= now) {
    return { hasTrial: true, isActive: false };
  }

  const remainingMs = trial.expiresAt.getTime() - now.getTime();
  const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
  const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  return {
    hasTrial: true,
    isActive: true,
    remainingHours,
    remainingMinutes,
  };
}

// Support Session Management
export async function saveSession(data: {
  userId?: string;
  sessionType: "chat" | "video" | "photo";
  title: string;
  summary: string;
  transcript: Array<{ role: "user" | "model"; text: string; timestamp: number }>;
}) {
  const [session] = await db
    .insert(supportSessionsTable)
    .values({
      userId: data.userId,
      sessionType: data.sessionType,
      title: data.title,
      summary: data.summary,
      transcript: data.transcript,
      endedAt: new Date(),
    })
    .returning();

  return session;
}

export async function getUserSessions(userId: string) {
  const sessions = await db
    .select()
    .from(supportSessionsTable)
    .where(eq(supportSessionsTable.userId, userId))
    .orderBy(supportSessionsTable.startedAt);

  return sessions;
}

export async function deleteSession(sessionId: string, userId: string) {
  await db
    .delete(supportSessionsTable)
    .where(
      and(
        eq(supportSessionsTable.id, sessionId),
        eq(supportSessionsTable.userId, userId)
      )
    );
}

export async function deleteAllUserSessions(userId: string) {
  await db
    .delete(supportSessionsTable)
    .where(eq(supportSessionsTable.userId, userId));
}

export async function deleteUser(userId: string) {
  // Delete user's sessions first
  await deleteAllUserSessions(userId);

  // Delete the user
  await db.delete(usersTable).where(eq(usersTable.id, userId));
}
