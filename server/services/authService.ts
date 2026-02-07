import bcrypt from "bcrypt";
import crypto from "crypto";
import { db } from "../db";
import { usersTable, trialsTable, supportSessionsTable } from "../../shared/schema/schema";
import { eq, and, gt } from "drizzle-orm";

const SALT_ROUNDS = 10;
const TRIAL_DURATION_HOURS = 24;
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;
const VERIFICATION_OTP_EXPIRY_MINUTES = 30;
const PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1; // Password reset links expire in 1 hour

// Generate a secure random verification token (used for password reset links)
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Generate a 6-digit verification code for email OTP
export function generateVerificationCode(): string {
  const num = crypto.randomBytes(4).readUInt32BE(0) % 1000000;
  return num.toString().padStart(6, "0");
}

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

  // Generate 6-digit verification code
  const verificationToken = generateVerificationCode();
  const verificationTokenExpires = new Date(
    Date.now() + VERIFICATION_OTP_EXPIRY_MINUTES * 60 * 1000
  );

  // Create user
  console.log("[AUTH SERVICE] Inserting user with values:", {
    email: data.email.toLowerCase(),
    passwordHash: passwordHash ? `[HASH: ${passwordHash.length} chars]` : 'MISSING!',
    firstName: data.firstName,
    emailVerified: false,
  });

  let newUser;
  try {
    const result = await db
      .insert(usersTable)
      .values({
        email: data.email.toLowerCase(),
        passwordHash,
        emailVerified: false,
        verificationToken,
        verificationTokenExpires,
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
  console.log("[AUTH SERVICE] Verification token generated for user");

  return {
    success: true,
    user: {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      emailVerified: newUser.emailVerified,
    },
    verificationToken,
  };
}

// User Login
export async function loginUser(email: string, password: string) {
  console.log("[AUTH SERVICE] loginUser called for:", email);
  console.log("[AUTH SERVICE] Password provided length:", password?.length);

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
  console.log("[AUTH SERVICE] User email:", user.email);
  console.log("[AUTH SERVICE] User has passwordHash:", !!user.passwordHash);
  console.log("[AUTH SERVICE] passwordHash length:", user.passwordHash?.length);
  console.log("[AUTH SERVICE] passwordHash starts with $2:", user.passwordHash?.startsWith("$2"));
  console.log("[AUTH SERVICE] emailVerified:", user.emailVerified);

  // Check if user has a password (OAuth users don't)
  if (!user.passwordHash) {
    console.log("[AUTH SERVICE] No passwordHash - OAuth user");
    return { success: false, error: "Please log in using your social account." };
  }

  // Check if email is verified (only for email/password users)
  if (!user.emailVerified) {
    console.log("[AUTH SERVICE] Email not verified for:", email);
    return {
      success: false,
      error: "Please verify your email before logging in.",
      needsVerification: true,
      email: user.email,
    };
  }

  // Verify password
  console.log("[AUTH SERVICE] Comparing passwords...");
  console.log("[AUTH SERVICE] Input password first 3 chars:", password?.substring(0, 3));
  const isValid = await bcrypt.compare(password, user.passwordHash);
  console.log("[AUTH SERVICE] Password valid:", isValid);

  if (!isValid) {
    console.log("[AUTH SERVICE] Password comparison FAILED for user:", email);
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
      emailVerified: user.emailVerified,
    },
  };
}

// Verify email with token
export async function verifyEmail(token: string) {
  console.log("[AUTH SERVICE] verifyEmail called");

  // Find user by verification token
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.verificationToken, token))
    .limit(1);

  if (!user) {
    console.log("[AUTH SERVICE] Invalid verification code/token");
    return { success: false, error: "Invalid or expired verification code." };
  }

  // Check if token/code has expired
  if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
    console.log("[AUTH SERVICE] Verification code expired");
    return { success: false, error: "Verification code has expired. Please request a new one." };
  }

  // Check if already verified
  if (user.emailVerified) {
    console.log("[AUTH SERVICE] Email already verified");
    return { success: true, alreadyVerified: true, user: { id: user.id, email: user.email } };
  }

  // Mark email as verified and clear token
  const [updatedUser] = await db
    .update(usersTable)
    .set({
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, user.id))
    .returning();

  console.log("[AUTH SERVICE] Email verified for user:", user.email);

  return {
    success: true,
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
    },
  };
}

// Resend verification email
export async function resendVerification(email: string) {
  console.log("[AUTH SERVICE] resendVerification called for:", email);

  // Find user by email
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (!user) {
    console.log("[AUTH SERVICE] User not found for resend verification");
    // Don't reveal if user exists or not for security
    return { success: true, message: "If an account exists, a verification email has been sent." };
  }

  // Check if already verified
  if (user.emailVerified) {
    console.log("[AUTH SERVICE] Email already verified, no resend needed");
    return { success: false, error: "Email is already verified." };
  }

  // Generate new 6-digit verification code
  const verificationToken = generateVerificationCode();
  const verificationTokenExpires = new Date(
    Date.now() + VERIFICATION_OTP_EXPIRY_MINUTES * 60 * 1000
  );

  // Update user with new code
  await db
    .update(usersTable)
    .set({
      verificationToken,
      verificationTokenExpires,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, user.id));

  console.log("[AUTH SERVICE] New verification token generated for:", email);

  return {
    success: true,
    verificationToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
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

// Request password reset - generates token and returns it for email sending
export async function requestPasswordReset(email: string) {
  console.log("[AUTH SERVICE] requestPasswordReset called for:", email);

  // Find user by email
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  // Always return success to prevent email enumeration attacks
  if (!user) {
    console.log("[AUTH SERVICE] User not found for password reset (not revealing)");
    return { success: true, message: "If an account exists, a password reset email has been sent." };
  }

  // Check if user has a password (OAuth users can't reset password)
  if (!user.passwordHash) {
    console.log("[AUTH SERVICE] OAuth user attempted password reset");
    return { success: true, message: "If an account exists, a password reset email has been sent." };
  }

  // Generate password reset token
  const passwordResetToken = generateVerificationToken();
  const passwordResetTokenExpires = new Date(
    Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
  );

  // Update user with reset token
  await db
    .update(usersTable)
    .set({
      passwordResetToken,
      passwordResetTokenExpires,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, user.id));

  console.log("[AUTH SERVICE] Password reset token generated for:", email);

  return {
    success: true,
    passwordResetToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
    },
    message: "If an account exists, a password reset email has been sent.",
  };
}

// Reset password with token
export async function resetPassword(token: string, newPassword: string) {
  console.log("[AUTH SERVICE] resetPassword called");
  console.log("[AUTH SERVICE] New password length:", newPassword?.length);

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }

  // Find user by reset token
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.passwordResetToken, token))
    .limit(1);

  if (!user) {
    console.log("[AUTH SERVICE] Invalid password reset token");
    return { success: false, error: "Invalid or expired password reset link." };
  }

  console.log("[AUTH SERVICE] Found user for password reset:", user.email);
  console.log("[AUTH SERVICE] User ID:", user.id);

  // Check if token has expired
  if (user.passwordResetTokenExpires && user.passwordResetTokenExpires < new Date()) {
    console.log("[AUTH SERVICE] Password reset token expired");
    return { success: false, error: "Password reset link has expired. Please request a new one." };
  }

  // Hash new password
  console.log("[AUTH SERVICE] Hashing new password...");
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  console.log("[AUTH SERVICE] New password hash generated, length:", passwordHash.length);

  // Update user password and clear reset token
  const [updatedUser] = await db
    .update(usersTable)
    .set({
      passwordHash,
      passwordResetToken: null,
      passwordResetTokenExpires: null,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, user.id))
    .returning();

  if (!updatedUser) {
    console.error("[AUTH SERVICE] Failed to update password - no user returned");
    return { success: false, error: "Failed to update password. Please try again." };
  }

  console.log("[AUTH SERVICE] Password reset successful for user:", user.email);
  console.log("[AUTH SERVICE] Updated user passwordHash exists:", !!updatedUser.passwordHash);
  console.log("[AUTH SERVICE] Updated user passwordHash length:", updatedUser.passwordHash?.length);

  // Verify the password was saved correctly by comparing immediately
  const verifyHash = await bcrypt.compare(newPassword, updatedUser.passwordHash!);
  console.log("[AUTH SERVICE] Immediate password verification:", verifyHash);

  if (!verifyHash) {
    console.error("[AUTH SERVICE] CRITICAL: Password hash verification failed immediately after save!");
  }

  return {
    success: true,
    message: "Your password has been reset successfully.",
  };
}

// Find email by username/email (for "forgot username" - we use email as username)
export async function findAccountByEmail(email: string) {
  console.log("[AUTH SERVICE] findAccountByEmail called for:", email);

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  // Always return success message to prevent enumeration
  return {
    success: true,
    exists: !!user,
    message: "If an account exists with this email, you can use it to log in.",
  };
}
