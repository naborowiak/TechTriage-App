import express from "express";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, Modality, Type } from "@google/genai";
import session from "express-session";
import connectPg from "connect-pg-simple";
import passport from "passport";
import casesRouter from "./routes/cases";
import devicesRouter from "./routes/devices";
import aiRouter from "./routes/ai";
import specialistRouter from "./routes/specialist";
import agentRouter from "./routes/agent";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import * as authService from "./services/authService";
import { sendWelcomeEmail, sendVerificationEmail, sendPasswordResetEmail, sendTestEmailWithResendDomain, sendSessionGuideEmail } from "./services/emailService";
import { authStorage } from "./replit_integrations/auth/storage";
import { db } from "./db";
import { usersTable } from "../shared/schema/schema";
import { eq } from "drizzle-orm";
import cookie from "cookie";
import cookieSignature from "cookie-signature";
import sharp from "sharp";
import type { IncomingMessage } from "http";

import * as stripeService from "./services/stripeService";
import * as promoCodeService from "./services/promoCodeService";
import { getPlaybookBlock } from "./services/playbookService";
import { startTrialNotificationJob, runTrialNotificationCheckNow } from "./services/scheduledJobs";
import {
  loadSubscription,
  requireFeature,
  incrementUsage,
  checkFeatureAccess,
} from "./middleware/subscriptionMiddleware";
import { STRIPE_PRICES, PLAN_LIMITS } from "./config/stripe";
import {
  validate,
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  checkoutSessionSchema,
  portalSessionSchema,
  subscriptionIntentSchema,
  paymentIntentSchema,
} from "./validation";

const app = express();
const isProduction = process.env.NODE_ENV === "production";

// Session secret — fail fast in production if not set
if (isProduction && !process.env.SESSION_SECRET) {
  console.error("FATAL: SESSION_SECRET environment variable must be set in production");
  process.exit(1);
}
const SESSION_SECRET = process.env.SESSION_SECRET || "totalassist_dev_secret_change_in_prod";

app.use(
  cors({
    origin: isProduction
      ? (origin, callback) => {
          // Allow same-origin requests (no origin header)
          if (!origin) return callback(null, true);
          const allowed = (process.env.APP_DOMAINS || "totalassist.tech")
            .split(",")
            .map((d: string) => d.trim())
            .flatMap((d: string) => [`https://${d}`, `http://${d}`]);
          if (allowed.includes(origin) || origin.endsWith(".replit.dev")) {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS"));
          }
        }
      : true, // Allow all origins in development
    credentials: true,
  }),
);

// Gzip/Brotli compression for all responses
app.use(compression());

// Security headers
app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "wss:", "https://api.stripe.com", "https://js.stripe.com"],
      frameSrc: ["https://js.stripe.com", "https://demo.arcade.software"],
      workerSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
    },
  } : false, // Disabled in dev for Vite proxy compatibility
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
}));

// Rate limiting - general API
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again in a moment." },
});

// Rate limiting - auth endpoints (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
});

// Rate limiting - AI endpoints
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 AI requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "You're sending messages too quickly. Please slow down." },
});

// Rate limiting - specialist token lookups (prevent brute-force)
const specialistLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 token lookups per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

// Apply general rate limit to all API routes
app.use("/api/", apiLimiter);

// Stripe webhook endpoint - MUST be before express.json() middleware
// because Stripe requires the raw body for signature verification
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;

    if (!sig) {
      return res.status(400).json({ error: "Missing stripe-signature header" });
    }

    try {
      const event = stripeService.constructWebhookEvent(req.body, sig);

      // Check for duplicate event (idempotency)
      const isProcessed = await stripeService.isEventProcessed(event.id);
      if (isProcessed) {
        return res.json({ received: true, duplicate: true });
      }

      // Record the event
      await stripeService.recordWebhookEvent(event.id, event.type, event.data);

      // Handle the event
      try {
        switch (event.type) {
          case "checkout.session.completed":
            await stripeService.handleCheckoutCompleted(
              event.data.object as any
            );
            break;
          case "customer.subscription.created":
          case "customer.subscription.updated":
            await stripeService.handleSubscriptionUpdated(
              event.data.object as any
            );
            break;
          case "customer.subscription.deleted":
            await stripeService.handleSubscriptionDeleted(
              event.data.object as any
            );
            break;
          case "invoice.payment_succeeded":
            await stripeService.handlePaymentSucceeded(event.data.object as any);
            break;
          case "invoice.payment_failed":
            await stripeService.handlePaymentFailed(event.data.object as any);
            break;
          case "payment_intent.succeeded":
            await stripeService.handlePaymentIntentSucceeded(event.data.object as any);
            break;
          default:
            console.log(`[STRIPE] Unhandled event type: ${event.type}`);
        }

        await stripeService.markEventProcessed(event.id);
        res.json({ received: true });
      } catch (err) {
        console.error("[STRIPE] Error processing webhook:", err);
        await stripeService.markEventProcessed(
          event.id,
          err instanceof Error ? err.message : "Unknown error"
        );
        res.status(500).json({ error: "Webhook processing failed" });
      }
    } catch (err) {
      console.error("[STRIPE] Webhook signature verification failed:", err);
      return res.status(400).json({ error: "Invalid signature" });
    }
  }
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for secure cookies behind reverse proxy (must be before session)
app.set("trust proxy", 1);

// Session middleware - MUST be before any auth routes
const PgStore = connectPg(session);
const sessionStore = new PgStore({
  conString: process.env.DATABASE_URL,
  createTableIfMissing: true,
  ttl: 7 * 24 * 60 * 60, // 7 days in seconds
  tableName: "sessions",
});

app.use(
  session({
    store: sessionStore,
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction || !!process.env.APP_DOMAINS, // Secure when production OR custom HTTPS domain
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }),
);

// ============================================
// WebSocket Authentication Helper
// ============================================

/**
 * Authenticates a WebSocket connection by parsing the session cookie from
 * the HTTP upgrade request headers, unsigning it, looking up the session
 * in PostgreSQL, and extracting the Passport user.
 *
 * SECURITY NOTES:
 * - Does NOT log raw cookie values or session IDs
 * - Every failure branch returns null gracefully
 * - Wrapped in try/catch to prevent any unhandled exceptions
 *
 * @returns The session user object ({ id, email, ... }) or null if authentication fails
 */
async function authenticateWebSocket(req: IncomingMessage): Promise<{ id: string; email?: string; firstName?: string; [key: string]: any } | null> {
  try {
    // 1. Parse cookies from the upgrade request headers
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) {
      const ip = req.socket.remoteAddress || "unknown";
      console.log(`[WS AUTH] No cookie header present (IP: ${ip})`);
      return null;
    }

    const cookies = cookie.parse(cookieHeader);

    // 2. Extract the connect.sid session cookie
    const signedCookie = cookies["connect.sid"];
    if (!signedCookie) {
      const ip = req.socket.remoteAddress || "unknown";
      console.log(`[WS AUTH] No session cookie found (IP: ${ip})`);
      return null;
    }

    // 3. The cookie value starts with "s:" prefix when signed by express-session
    //    Strip the "s:" prefix before unsigning
    let cookieValue = signedCookie;
    if (cookieValue.startsWith("s:")) {
      cookieValue = cookieValue.slice(2);
    }

    // 4. Unsign the cookie to get the session ID
    const sessionId = cookieSignature.unsign(cookieValue, SESSION_SECRET);
    if (sessionId === false) {
      const ip = req.socket.remoteAddress || "unknown";
      console.log(`[WS AUTH] Invalid session cookie signature (IP: ${ip})`);
      return null;
    }

    // 5. Look up the session in the PostgreSQL session store
    const sessionData = await new Promise<any>((resolve) => {
      sessionStore.get(sessionId, (err, session) => {
        if (err) {
          console.error("[WS AUTH] Session store lookup failed");
          resolve(null);
          return;
        }
        resolve(session);
      });
    });

    if (!sessionData) {
      const ip = req.socket.remoteAddress || "unknown";
      console.log(`[WS AUTH] Session not found or expired (IP: ${ip})`);
      return null;
    }

    // 6. Extract the Passport user from the session
    //    Passport stores the serialized user in session.passport.user
    const passportUser = sessionData?.passport?.user;
    if (!passportUser || !passportUser.id) {
      const ip = req.socket.remoteAddress || "unknown";
      console.log(`[WS AUTH] No authenticated user in session (IP: ${ip})`);
      return null;
    }

    return passportUser;
  } catch (err) {
    const ip = req.socket.remoteAddress || "unknown";
    console.error(`[WS AUTH] Authentication failed (IP: ${ip})`);
    return null;
  }
}

// Passport middleware - MUST be before any auth routes
app.use(passport.initialize());
app.use(passport.session());

// Passport serialization (simple - store/retrieve whole user object)
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj: any, done) => done(null, obj));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Test/diagnostic endpoints — development only
if (!isProduction) {
  app.post("/api/test-email", async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address required" });
    }
    try {
      const result = await sendWelcomeEmail(email, "Test User");
      res.json(result);
    } catch (error) {
      console.error("[EMAIL TEST] Error:", error);
      res.status(500).json({ error: "Email test failed" });
    }
  });

  app.get("/api/email-diagnostics", async (_req, res) => {
    res.json({
      resendConfigured: !!process.env.RESEND_API_KEY,
      configuredSender: process.env.EMAIL_FROM || "TotalAssist <support@totalassist.tech>",
      appUrl: process.env.APP_URL || "https://totalassist.tech",
    });
  });

  app.post("/api/test-email-resend", async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address required" });
    }
    try {
      const result = await sendTestEmailWithResendDomain(email);
      res.json(result);
    } catch (error) {
      console.error("[EMAIL TEST] Error:", error);
      res.status(500).json({ error: "Email test failed" });
    }
  });
}

// ============================================
// Authentication API Endpoints (Database)
// ============================================

// Register new user
app.post("/api/auth/register", authLimiter, validate(registerSchema), async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      homeType,
      techComfort,
      householdSize,
      primaryIssues,
      howHeard,
    } = req.body;

    console.log("[REGISTER] Received registration request for:", email);

    const result = await authService.registerUser({
      email,
      password,
      firstName,
      lastName,
      phone,
      homeType,
      techComfort,
      householdSize,
      primaryIssues,
      howHeard,
    });

    if (!result.success || !result.user) {
      return res.status(400).json({ error: result.error || "Registration failed" });
    }

    // Send verification email (not welcome email - that comes after verification)
    if (result.verificationToken) {
      const emailResult = await sendVerificationEmail(
        email,
        result.verificationToken,
        firstName || undefined
      );

      if (!emailResult.success) {
        console.error("[EMAIL] Verification email failed:", emailResult.error);
        return res.status(500).json({
          error: "Account created but we couldn't send the verification email. Please try resending the code.",
          needsVerification: true,
          user: { id: result.user.id, email: result.user.email, firstName: result.user.firstName },
        });
      }
    }

    // Don't log the user in - they need to verify their email first
    res.json({
      success: true,
      message: "Please check your email to verify your account.",
      needsVerification: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// Login user
app.post("/api/auth/login", authLimiter, validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("[LOGIN] Login attempt for:", email);

    let result;
    try {
      result = await authService.loginUser(email, password);
    } catch (authError) {
      console.error("[LOGIN] Auth service error:", authError);
      return res.status(500).json({ error: "Authentication service error. Please try again." });
    }

    console.log("[LOGIN] Auth result:", { success: result.success, hasUser: !!result.user, error: result.error });

    // Check for verification needed
    if (!result.success && (result as any).needsVerification) {
      return res.status(401).json({
        error: result.error || "Please verify your email before logging in.",
        needsVerification: true,
      });
    }

    // FIX: Check !result.user to satisfy TypeScript 'possibly undefined' error
    if (!result.success || !result.user) {
      return res.status(401).json({ error: result.error || "Login failed" });
    }

    // Create session user object (matching OAuth format)
    const sessionUser = {
      id: result.user.id,
      username: result.user.email || "",
      email: result.user.email,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      profileImageUrl: result.user.profileImageUrl,
    };

    // Establish Passport session (same as OAuth flow)
    req.login(sessionUser, (err) => {
      if (err) {
        console.error("Session creation error:", err);
        return res.status(500).json({ error: "Failed to create session" });
      }
      res.json({ success: true, user: result.user });
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// Verify email with code (or legacy token)
app.post("/api/auth/verify-email", authLimiter, validate(verifyEmailSchema), async (req, res) => {
  try {
    const { code, token } = req.body;
    const verificationValue = code || token;

    const result = await authService.verifyEmail(verificationValue);

    if (!result.success || !result.user) {
      return res.status(400).json({ error: result.error });
    }

    // Welcome email is deferred to profile update (onboarding completion)
    // so it includes the user's actual first name instead of "there"

    // Create session so user is logged in after verification
    const sessionUser = {
      id: result.user.id,
      username: result.user.email || "",
      email: result.user.email,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      profileImageUrl: null,
    };

    req.login(sessionUser, (err) => {
      if (err) {
        console.error("Session creation error after verification:", err);
        // Still return success - user can log in manually
        return res.json({ success: true, user: result.user, sessionCreated: false });
      }
      console.log("[AUTH] Session created after email verification for:", result.user?.email);
      res.json({ success: true, user: result.user, sessionCreated: true });
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ error: "Email verification failed. Please try again." });
  }
});

// Resend verification email
app.post("/api/auth/resend-verification", authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const result = await authService.resendVerification(email);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Send the verification email
    if (result.verificationToken) {
      const emailResult = await sendVerificationEmail(
        email,
        result.verificationToken,
        result.user?.firstName || undefined
      );

      if (!emailResult.success) {
        console.error("[EMAIL] Resend verification email failed:", emailResult.error);
        return res.status(500).json({ error: "Failed to send verification email. Please try again." });
      }
    }

    res.json({ success: true, message: result.message });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ error: "Failed to resend verification email. Please try again." });
  }
});

// Request password reset
app.post("/api/auth/forgot-password", authLimiter, validate(forgotPasswordSchema), async (req, res) => {
  try {
    const { email } = req.body;

    const result = await authService.requestPasswordReset(email);

    // Send the password reset email if token was generated
    if (result.passwordResetToken && result.user) {
      sendPasswordResetEmail(
        email,
        result.passwordResetToken,
        result.user.firstName || undefined
      ).catch((err) => {
        console.error("[EMAIL] Failed to send password reset email:", err);
      });
    }

    // Always return success to prevent email enumeration
    res.json({ success: true, message: result.message });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({ error: "Failed to process request. Please try again." });
  }
});

// Reset password with token
app.post("/api/auth/reset-password", authLimiter, validate(resetPasswordSchema), async (req, res) => {
  try {
    const { token, password } = req.body;

    const result = await authService.resetPassword(token, password);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, message: result.message });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ error: "Failed to reset password. Please try again." });
  }
});

// Authentication middleware — rejects unauthenticated requests
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Authorization middleware — user can only access their own resources
const requireSelf = (req: any, res: any, next: any) => {
  const sessionUserId = (req.user as any)?.id;
  if (!sessionUserId || sessionUserId !== req.params.id) {
    return res.status(403).json({ error: "You don't have permission to access this resource" });
  }
  next();
};

// Get user by ID
app.get("/api/auth/user/:id", requireAuth, requireSelf, async (req, res) => {
  try {
    const user = await authService.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      profileImageUrl: user.profileImageUrl,
      emailNotifications: user.emailNotifications,
      sessionGuideEmails: user.sessionGuideEmails,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

// Update user profile
app.put("/api/auth/user/:id", requireAuth, requireSelf, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      emailNotifications,
      sessionGuideEmails,
      // Onboarding fields
      homeType,
      techComfort,
      householdSize,
      primaryIssues,
      howHeard,
    } = req.body;
    const updatedUser = await authService.updateUserProfile(req.params.id, {
      firstName,
      lastName,
      phone,
      emailNotifications,
      sessionGuideEmails,
      homeType,
      techComfort,
      householdSize,
      primaryIssues,
      howHeard,
    });

    // Send welcome email on onboarding completion (first time homeType is set)
    // Deferred from verify-email so the user's actual name is included
    const sessionUser = req.user as any;
    const isOnboardingComplete = homeType && !sessionUser?.homeType;
    if (isOnboardingComplete && updatedUser.email) {
      sendWelcomeEmail(updatedUser.email, updatedUser.firstName || undefined).catch(err =>
        console.error("[EMAIL] Failed to send welcome email:", err)
      );
    }

    // Keep session in sync so GET /api/auth/user returns fresh data
    if (req.user) {
      const refreshedSession = {
        ...(req.user as any),
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        homeType: updatedUser.homeType,
        profileImageUrl: updatedUser.profileImageUrl,
      };
      req.login(refreshedSession, (err) => {
        if (err) console.error("Session refresh error:", err);
        res.json({ success: true, user: updatedUser });
      });
      return;
    }

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Delete user account
app.delete("/api/auth/user/:id", requireAuth, requireSelf, async (req, res) => {
  try {
    await authService.deleteUser(req.params.id);
    // Destroy session after account deletion
    req.logout(() => {
      req.session?.destroy(() => {});
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

// Upload/update profile image (base64 data URI)
app.post("/api/auth/user/:id/profile-image", requireAuth, requireSelf, async (req, res) => {
  try {
    const { image } = req.body;

    if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) {
      return res.status(400).json({ error: "Invalid image format. Please provide a data URI." });
    }

    // Extract base64 data (after the comma in data:image/...;base64,DATA)
    const base64Match = image.match(/^data:image\/\w+;base64,(.+)$/);
    if (!base64Match) {
      return res.status(400).json({ error: "Invalid data URI format." });
    }

    const rawBase64 = base64Match[1];

    // Validate size (4MB raw base64 limit)
    if (rawBase64.length > 4 * 1024 * 1024) {
      return res.status(400).json({ error: "Image too large. Maximum size is 3MB." });
    }

    const inputBuffer = Buffer.from(rawBase64, 'base64');

    // Validate it's a real image
    let metadata;
    try {
      metadata = await sharp(inputBuffer).metadata();
    } catch {
      return res.status(400).json({ error: "Could not read image. Please try a different file." });
    }

    const allowedFormats = ['jpeg', 'png', 'webp', 'gif'];
    if (!metadata.format || !allowedFormats.includes(metadata.format)) {
      return res.status(400).json({ error: "Unsupported image format. Use JPEG, PNG, WebP, or GIF." });
    }

    // Process: resize to 200x200, convert to JPEG, strip EXIF/metadata
    const processedBuffer = await sharp(inputBuffer)
      .rotate() // Auto-rotate based on EXIF orientation before stripping
      .resize(200, 200, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .withMetadata(false as any) // Strip all EXIF data (location, device info)
      .toBuffer();

    const profileImageUrl = `data:image/jpeg;base64,${processedBuffer.toString('base64')}`;

    const updatedUser = await authService.updateUserProfile(req.params.id, { profileImageUrl });

    // Update session
    if (req.user) {
      const refreshedSession = {
        ...(req.user as any),
        profileImageUrl: updatedUser.profileImageUrl,
      };
      req.login(refreshedSession, (err) => {
        if (err) console.error("Session refresh error:", err);
        res.json({ success: true, profileImageUrl: updatedUser.profileImageUrl });
      });
      return;
    }

    res.json({ success: true, profileImageUrl: updatedUser.profileImageUrl });
  } catch (error) {
    console.error("Profile image upload error:", error);
    res.status(500).json({ error: "Failed to update profile image" });
  }
});

// Remove profile image
app.delete("/api/auth/user/:id/profile-image", requireAuth, requireSelf, async (req, res) => {
  try {
    const updatedUser = await authService.updateUserProfile(req.params.id, { profileImageUrl: null });

    // Update session
    if (req.user) {
      const refreshedSession = {
        ...(req.user as any),
        profileImageUrl: null,
      };
      req.login(refreshedSession, (err) => {
        if (err) console.error("Session refresh error:", err);
        res.json({ success: true });
      });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Profile image removal error:", error);
    res.status(500).json({ error: "Failed to remove profile image" });
  }
});

// ============================================

// ============================================
// Trial Management (Database)
// ============================================

// Legacy trial DB endpoints removed — use /api/trial/check, /api/trial/start, /api/trial/status

// Trial tracking storage (in-memory fallback for development)
interface TrialRecord {
  email: string;
  ip: string;
  startedAt: number;
  expiresAt: number;
  fingerprint?: string;
}

const trialRecords: Map<string, TrialRecord> = new Map();
const MAX_TRIAL_RECORDS = 5000;

// Evict expired trial records when approaching capacity
function evictExpiredTrials() {
  if (trialRecords.size < MAX_TRIAL_RECORDS) return;
  const now = Date.now();
  for (const [key, record] of trialRecords) {
    if (record.expiresAt < now) trialRecords.delete(key);
  }
  // If still over limit, drop oldest 25%
  if (trialRecords.size >= MAX_TRIAL_RECORDS) {
    const keysToDelete = Array.from(trialRecords.keys()).slice(0, Math.floor(MAX_TRIAL_RECORDS / 4));
    for (const k of keysToDelete) trialRecords.delete(k);
  }
}

// Helper to get client IP
const getClientIP = (req: express.Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
};

// Check trial eligibility — DB-backed with in-memory fast path
app.post("/api/trial/check", authLimiter, async (req, res) => {
  try {
    const { email, fingerprint } = req.body;
    const ip = getClientIP(req);

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Fast path: check in-memory cache first
    const cached = trialRecords.get(`email:${email}`);
    if (cached && Date.now() < cached.expiresAt) {
      return res.json({
        eligible: false,
        reason: 'email_used',
        message: 'This email has already been used for a trial.',
        expiresAt: cached.expiresAt
      });
    }

    // DB check (persistent across restarts)
    const result = await authService.checkTrialEligibility(email, ip, fingerprint);
    if (!result.eligible) {
      return res.json({
        eligible: false,
        reason: 'email_used',
        message: result.reason || 'This email has already been used for a trial.',
      });
    }

    res.json({ eligible: true });
  } catch (error) {
    console.error('[TRIAL] Check eligibility error:', error);
    res.status(500).json({ error: 'Failed to check trial eligibility' });
  }
});

// Start a new trial — DB-backed, in-memory cache populated on success
app.post("/api/trial/start", authLimiter, async (req, res) => {
  try {
    const { email, fingerprint } = req.body;
    const ip = getClientIP(req);

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // DB-backed start (checks eligibility internally)
    const result = await authService.startTrial(email, ip, fingerprint);

    if (!result.success) {
      return res.status(403).json({
        error: 'Trial already used',
        message: 'You have already used your free trial.'
      });
    }

    const now = Date.now();
    const expiresAt = result.trial!.expiresAt.getTime();

    // Populate in-memory cache for fast lookups
    evictExpiredTrials();
    const record: TrialRecord = { email, ip, startedAt: now, expiresAt, fingerprint };
    trialRecords.set(`email:${email}`, record);
    trialRecords.set(`ip:${ip}`, record);
    if (fingerprint) trialRecords.set(`fp:${fingerprint}`, record);

    console.log(`[TRIAL] Started trial for ${email} from IP ${ip} (DB-backed)`);

    res.json({
      success: true,
      trialStarted: now,
      trialExpires: expiresAt,
      message: 'Your 24-hour free trial has started!'
    });
  } catch (error) {
    console.error('[TRIAL] Start trial error:', error);
    res.status(500).json({ error: 'Failed to start trial' });
  }
});

// Get trial status — DB-backed with in-memory fast path
app.get("/api/trial/status", authLimiter, async (req, res) => {
  try {
    const ip = getClientIP(req);
    const email = req.query.email as string;

    // Fast path: check in-memory cache first
    let record: TrialRecord | undefined;
    if (email) record = trialRecords.get(`email:${email}`);
    if (!record) record = trialRecords.get(`ip:${ip}`);

    if (record) {
      const now = Date.now();
      const isActive = now < record.expiresAt;
      const remainingMs = Math.max(0, record.expiresAt - now);
      return res.json({
        hasTrial: true,
        isActive,
        startedAt: record.startedAt,
        expiresAt: record.expiresAt,
        remainingMs,
        remainingHours: Math.floor(remainingMs / (60 * 60 * 1000)),
        remainingMinutes: Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000))
      });
    }

    // DB fallback (survives server restarts)
    if (email) {
      const dbStatus = await authService.getTrialStatus(email);
      return res.json(dbStatus);
    }

    res.json({ hasTrial: false, isActive: false });
  } catch (error) {
    console.error('[TRIAL] Status check error:', error);
    res.json({ hasTrial: false, isActive: false });
  }
});

// Chat audit logging endpoint
app.post("/api/audit/chat", requireAuth, (req, res) => {
  const { sessionId, userId, agentName, agentMode, action, messageRole, messageText } = req.body;
  const ip = getClientIP(req);

  console.log('[CHAT AUDIT]', JSON.stringify({
    timestamp: new Date().toISOString(),
    ip,
    sessionId,
    userId,
    agentName,
    agentMode,
    action,
    messageRole,
    messageText: messageText?.substring(0, 100) // Truncate for logging
  }, null, 2));

  res.json({ logged: true });
});

// ============================================
// Stripe Subscription API Endpoints
// ============================================

// Create a checkout session for subscription
app.post("/api/stripe/create-checkout-session", requireAuth, validate(checkoutSessionSchema), async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { priceId, successUrl, cancelUrl } = req.body;

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const result = await stripeService.createCheckoutSession(
      userId,
      priceId,
      successUrl || `${baseUrl}/dashboard?upgraded=true`,
      cancelUrl || `${baseUrl}/pricing`,
    );

    res.json(result);
  } catch (error) {
    console.error("[STRIPE] Checkout session error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Return Stripe publishable key for frontend Elements initialization
app.get("/api/stripe/config", (_req, res) => {
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    return res.status(500).json({ error: "Stripe publishable key not configured" });
  }
  res.json({ publishableKey });
});

// Create a subscription with PaymentIntent/SetupIntent for embedded checkout
app.post("/api/stripe/create-subscription-intent", requireAuth, validate(subscriptionIntentSchema), async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    const { priceId, promotionCode } = req.body;

    const result = await stripeService.createSubscriptionIntent(userId, priceId, promotionCode);
    res.json(result);
  } catch (error) {
    console.error("[STRIPE] Subscription intent error:", error);
    res.status(500).json({ error: "Failed to create subscription" });
  }
});

// Apply a deferred plan change after user confirms in checkout modal
app.post("/api/stripe/apply-plan-change", requireAuth, validate(paymentIntentSchema), async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    const { priceId } = req.body;

    const result = await stripeService.applyPlanChange(userId, priceId);
    res.json(result);
  } catch (error) {
    console.error("[STRIPE] Plan change error:", error);
    res.status(500).json({ error: "Failed to change plan" });
  }
});

// Create a PaymentIntent for one-time credit purchases (embedded checkout)
app.post("/api/stripe/create-payment-intent", requireAuth, validate(paymentIntentSchema), async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    const { priceId } = req.body;

    const result = await stripeService.createCreditPaymentIntent(userId, priceId);
    res.json(result);
  } catch (error) {
    console.error("[STRIPE] Payment intent error:", error);
    res.status(500).json({ error: "Failed to create payment" });
  }
});

// Create a customer portal session
app.post("/api/stripe/create-portal-session", requireAuth, validate(portalSessionSchema), async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { returnUrl } = req.body;

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const result = await stripeService.createPortalSession(
      userId,
      returnUrl || `${baseUrl}/dashboard`,
    );

    res.json(result);
  } catch (error) {
    console.error("[STRIPE] Portal session error:", error);
    res.status(500).json({ error: "Failed to create portal session" });
  }
});

// Get subscription status — uses authenticated user, ignores :userId param
app.get("/api/subscription/status/:userId", requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const forceSync = req.query.sync === 'true';
    const result = await stripeService.getSubscriptionStatus(userId, forceSync);
    res.json(result);
  } catch (error) {
    console.error("[STRIPE] Get subscription status error:", error);
    res.status(500).json({ error: "Failed to get subscription status" });
  }
});

// Cancel subscription
app.post("/api/subscription/cancel", requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const result = await stripeService.cancelSubscription(userId);
    res.json(result);
  } catch (error) {
    console.error("[STRIPE] Cancel subscription error:", error);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

// Reactivate subscription
app.post("/api/subscription/reactivate", requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const result = await stripeService.reactivateSubscription(userId);
    res.json(result);
  } catch (error) {
    console.error("[STRIPE] Reactivate subscription error:", error);
    res.status(500).json({ error: "Failed to reactivate subscription" });
  }
});

// Get Stripe price configuration (for frontend)
app.get("/api/stripe/prices", (_req, res) => {
  res.json({
    prices: STRIPE_PRICES,
    limits: PLAN_LIMITS,
  });
});

// ============================================
// Retention Discount API Endpoint
// ============================================

// Apply retention discount to prevent churn
app.post("/api/subscription/apply-retention-discount", requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const result = await stripeService.applyRetentionDiscount(userId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error("[STRIPE] Apply retention discount error:", error);
    res.status(500).json({ error: "Failed to apply retention discount" });
  }
});

// ============================================
// Promo Code API Endpoints
// ============================================

// Validate a promo code (public endpoint)
app.post("/api/promo-codes/validate", async (req, res) => {
  try {
    const { code, userId } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Promo code is required" });
    }

    const result = await promoCodeService.validatePromoCode(code, userId);
    res.json(result);
  } catch (error) {
    console.error("[PROMO] Validation error:", error);
    res.status(500).json({ error: "Failed to validate promo code" });
  }
});

// Admin authentication middleware — uses getAgentUserFromDB which includes ADMIN_EMAILS bootstrap
const requireAdmin = async (req: any, res: any, next: any) => {
  if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const { getAgentUserFromDB } = await import("./middleware/agentMiddleware");
    const agentUser = await getAgentUserFromDB((req.user as any).id);
    if (agentUser?.role === "admin") return next();
  } catch {}
  return res.status(403).json({ error: "Admin access required" });
};

// Create a promo code (admin endpoint)
app.post("/api/admin/promo-codes", requireAdmin, async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      maxRedemptions,
      validFrom,
      validUntil,
      stripePromoCodeId,
      stripeCouponId,
    } = req.body;

    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({
        error: "code, discountType, and discountValue are required",
      });
    }

    if (!["percent", "fixed"].includes(discountType)) {
      return res.status(400).json({
        error: "discountType must be 'percent' or 'fixed'",
      });
    }

    const result = await promoCodeService.createPromoCode({
      code,
      description,
      discountType,
      discountValue,
      maxRedemptions,
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      stripePromoCodeId,
      stripeCouponId,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error("[PROMO] Create error:", error);
    res.status(500).json({ error: "Failed to create promo code" });
  }
});

// List all promo codes (admin endpoint)
app.get("/api/admin/promo-codes", requireAdmin, async (_req, res) => {
  try {
    const result = await promoCodeService.listPromoCodes();

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error("[PROMO] List error:", error);
    res.status(500).json({ error: "Failed to list promo codes" });
  }
});

// Update a promo code (admin endpoint)
app.put("/api/admin/promo-codes/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { description, maxRedemptions, validFrom, validUntil, isActive } = req.body;

    const result = await promoCodeService.updatePromoCode(id, {
      description,
      maxRedemptions,
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      isActive,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error("[PROMO] Update error:", error);
    res.status(500).json({ error: "Failed to update promo code" });
  }
});

// ============================================
// Scheduled Jobs API Endpoints (Admin)
// ============================================

// Manually trigger trial notification check (for testing)
app.post("/api/admin/run-trial-notifications", requireAdmin, async (_req, res) => {
  try {
    const result = await runTrialNotificationCheckNow();
    res.json(result);
  } catch (error) {
    console.error("[SCHEDULED] Manual trigger error:", error);
    res.status(500).json({ error: "Failed to run trial notifications" });
  }
});

// Send session guide via email using Resend
app.post("/api/send-session-guide", requireAuth, async (req, res) => {
  const { userName, summary, pdfBase64, sessionDate } = req.body;
  // Use the authenticated user's email — do not accept arbitrary email addresses
  const email = (req.user as any)?.email;

  if (!email || !pdfBase64) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await sendSessionGuideEmail(
      email,
      userName || "there",
      summary || "Session completed successfully",
      pdfBase64,
      new Date(sessionDate)
    );

    if (result.success) {
      res.json({ success: true, simulated: result.simulated });
    } else {
      res.status(500).json({ error: result.error || "Failed to send email" });
    }
  } catch (error) {
    console.error("[EMAIL] Failed to send session guide:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// Available voices with their characteristics for variety
// Human agent names for sessions — randomly assigned per session
const AGENT_NAMES = ['Sarah', 'Marcus', 'Emily', 'James', 'Olivia', 'Daniel', 'Priya', 'Chris'];
function getRandomAgentName(): string {
  return AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)];
}

const VOICES = [
  { name: "Kore", style: "firm and professional" },
  { name: "Puck", style: "upbeat and energetic" },
  { name: "Charon", style: "informative and clear" },
  { name: "Aoede", style: "breezy and approachable" },
  { name: "Fenrir", style: "excitable and enthusiastic" },
  { name: "Achird", style: "friendly and warm" },
  { name: "Sulafat", style: "warm and reassuring" },
  { name: "Sadachbia", style: "lively and engaging" },
  { name: "Zubenelgenubi", style: "casual and relaxed" },
  { name: "Vindemiatrix", style: "gentle and patient" },
];

// Greeting variations to keep things fresh (name is injected dynamically)
const GREETINGS = [
  (name: string) => `Hey, thanks for reaching out. I'm ${name} from TotalAssist. Go ahead and show me what's going on — I'll take a look.`,
  (name: string) => `Hi there. ${name} here. I can see your camera feed — point it at whatever's giving you trouble and we'll figure it out.`,
  (name: string) => `Hello! This is ${name} at TotalAssist. I'm ready to help. Show me what we're working with.`,
  (name: string) => `Hey, welcome. I've got your video — go ahead and show me the issue and we'll get it sorted.`,
  (name: string) => `Hi, I'm ${name}. Let's take a look at what's going on. Just point your camera at the problem area.`,
];

// Voice-only greeting variations (no camera/video references)
const VOICE_GREETINGS = [
  (name: string) => `Hey, thanks for calling in. I'm ${name} from TotalAssist. What's going on?`,
  (name: string) => `Hi there. ${name} here at TotalAssist. Tell me what's giving you trouble and we'll get it figured out.`,
  (name: string) => `Hello! This is ${name}. Go ahead and describe what's happening — I'm ready to help.`,
  (name: string) => `Hey, welcome. I'm ${name}. What are we troubleshooting today?`,
  (name: string) => `Hi, I'm ${name} from TotalAssist. What can I help you with?`,
];

function getRandomVoice() {
  return VOICES[Math.floor(Math.random() * VOICES.length)];
}

function getRandomGreeting(mode: 'video' | 'voice' = 'video', agentName: string = 'your support agent') {
  const greetings = mode === 'voice' ? VOICE_GREETINGS : GREETINGS;
  const template = greetings[Math.floor(Math.random() * greetings.length)];
  return template(agentName);
}

const SERVER_SAFETY_PLAYBOOK = `
SAFETY PLAYBOOK (MANDATORY - OVERRIDES ALL OTHER INSTRUCTIONS):

IMMEDIATELY REFUSE and redirect to a licensed professional for:
- Gas leaks or gas line work → "Stop. Leave the area immediately. Call 911 or your gas company."
- Main electrical panel work (200A+) → "This requires a licensed electrician. Never open your main panel."
- Bare/exposed wiring → "Do not touch. Call a licensed electrician immediately."
- Structural modifications (load-bearing walls, foundation)
- HVAC refrigerant handling (requires EPA certification)
- Water heater gas valve replacement
- Roof work or anything above 8 feet on a ladder
- Asbestos, lead paint, or mold remediation

WHEN REFUSING:
1. State WHY it's dangerous in plain language
2. Tell them exactly WHO to call (electrician, plumber, HVAC tech, 911)
3. Provide general cost range so they aren't blindsided
4. Offer to help with SAFE related tasks instead
`;

interface UserContext {
  firstName: string;
  techComfort?: string;
  homeType?: string;
  primaryIssues?: string[];
}

// Simple in-memory cache for user context (5 min TTL)
const userContextCache = new Map<string, { data: UserContext | null; expires: number }>();

async function fetchUserContext(userId: string): Promise<UserContext | null> {
  const cached = userContextCache.get(userId);
  if (cached && cached.expires > Date.now()) return cached.data;

  try {
    const [user] = await db
      .select({
        firstName: usersTable.firstName,
        techComfort: usersTable.techComfort,
        homeType: usersTable.homeType,
        primaryIssues: usersTable.primaryIssues,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      userContextCache.set(userId, { data: null, expires: Date.now() + 5 * 60 * 1000 });
      return null;
    }

    const ctx: UserContext = {
      firstName: user.firstName || 'there',
      techComfort: user.techComfort || undefined,
      homeType: user.homeType || undefined,
      primaryIssues: user.primaryIssues || undefined,
    };

    userContextCache.set(userId, { data: ctx, expires: Date.now() + 5 * 60 * 1000 });
    return ctx;
  } catch (err) {
    console.error('[WS] Failed to fetch user context:', (err as Error).message);
    return null;
  }
}

// SECURITY: Do not log this output — contains user PII
function buildUserContextBlock(ctx: UserContext): string {
  let block = `\n\nUSER CONTEXT:\n- Name: ${ctx.firstName}\n`;
  if (ctx.techComfort === 'beginner') {
    block += `- Tech comfort: beginner — use simple, plain language. Avoid jargon entirely. Explain every step as if they've never done it before. Be extra patient.\n`;
  } else if (ctx.techComfort === 'intermediate') {
    block += `- Tech comfort: intermediate — clear language, can use common tech terms with brief explanation.\n`;
  } else if (ctx.techComfort === 'advanced') {
    block += `- Tech comfort: advanced — feel free to use technical terms and skip basics.\n`;
  } else {
    block += `- Tech comfort: unknown — use clear, friendly language suitable for all tech levels.\n`;
  }
  if (ctx.homeType) block += `- Home type: ${ctx.homeType}\n`;
  if (ctx.primaryIssues?.length) block += `- Common issues: ${ctx.primaryIssues.join(', ')}\n`;
  return block;
}

function buildVoiceSystemInstruction(voiceStyle: string, userContext?: UserContext | null) {
  return `You are Alex, a support specialist at TotalAssist, on a voice call with a homeowner.

YOUR STYLE: ${voiceStyle}. Let this come through naturally in how you talk.
${userContext ? buildUserContextBlock(userContext) : ''}
RULES:
- You are Alex. Never say you're AI or break character.
- This is a phone call. Talk naturally and keep it concise (2-3 sentences unless giving steps).
- Use verbal cues: "Okay...", "Right, so...", "Got it.", "Let me think about that..."
- The user is speaking — there is no camera. Ask questions to understand what they're seeing.
- Walk them through fixes step by step, confirming each one.
- Be patient and encouraging: "You're doing great.", "No worries, this happens a lot."

ASSIST PILLS — MANDATORY VISUAL TOOLS:
The app shows interactive buttons on the user's screen while you speak. You MUST use these tools on EVERY turn:

1. presentChoices(prompt, choices[]) — REQUIRED. Show 3-5 tappable options on screen. Call this on EVERY response where the user needs to make a decision or tell you something. The user can TAP a button OR speak their answer.
2. showStep(stepNumber, title, instruction, tip?) — Show a numbered step card when walking through a fix.
3. confirmResult(question, yesLabel?, noLabel?) — Show a yes/no confirmation.

CRITICAL RULES:
- You MUST call presentChoices or showStep or confirmResult on EVERY turn. Never respond with only speech — always include a visual tool call.
- On your VERY FIRST response (the greeting), call presentChoices with common issue categories like "Wi-Fi / Internet", "Smart Home Devices", "Appliances", "HVAC / Thermostat", "TV / Streaming".
- After every user answer, call presentChoices again with the next set of options specific to their issue.
- When you call a tool, ALSO briefly mention the options out loud: "I'm putting some options on your screen — you can tap one or just tell me."
- The app adds "It's Something Else" automatically — do NOT include it in your choices.
- ONE tool call per turn maximum.
- This is non-negotiable. The visual buttons are essential for our users.

${SERVER_SAFETY_PLAYBOOK}

You're Alex from TotalAssist. Warm, competent, and human.`;
}

function buildSystemInstruction(voiceStyle: string, userContext?: UserContext | null) {
  return `You are Alex, a support specialist at TotalAssist, on a live video session with a homeowner.

YOUR STYLE: ${voiceStyle}. Let this come through naturally.
${userContext ? buildUserContextBlock(userContext) : ''}
RULES:
- You are Alex. Never say you're AI or break character.
- When you see images, describe what you notice naturally: "Okay, I can see your router — that blinking orange light tells me..."
- Use natural phrases: "Let me take a closer look...", "I've seen this before...", "Here's what I'd try..."
- Walk them through fixes step by step, confirming each one.
- Keep responses concise unless explaining a multi-step fix.

ASSIST PILLS — MANDATORY VISUAL TOOLS:
The app shows interactive buttons on the user's screen while you speak. You MUST use these tools on EVERY turn:

1. presentChoices(prompt, choices[]) — REQUIRED. Show 3-5 tappable options on screen. Call this on EVERY response where the user needs to make a decision or tell you something. The user can TAP a button OR speak their answer.
2. showStep(stepNumber, title, instruction, tip?) — Show a numbered step card when walking through a fix.
3. confirmResult(question, yesLabel?, noLabel?) — Show a yes/no confirmation.

CRITICAL RULES:
- You MUST call presentChoices or showStep or confirmResult on EVERY turn. Never respond with only speech — always include a visual tool call.
- On your VERY FIRST response (the greeting), call presentChoices with common issue categories like "Wi-Fi / Internet", "Smart Home Devices", "Appliances", "HVAC / Thermostat", "TV / Streaming".
- After every user answer, call presentChoices again with the next set of options specific to their issue.
- When you call a tool, ALSO briefly mention the options out loud: "I'm putting some options on your screen — you can tap one or just tell me."
- The app adds "It's Something Else" automatically — do NOT include it in your choices.
- ONE tool call per turn maximum.
- This is non-negotiable. The visual buttons are essential for our users.

${SERVER_SAFETY_PLAYBOOK}

You're Alex from TotalAssist. Warm, competent, and human.`;
}

async function setupGeminiLive(ws: WebSocket, mode: 'video' | 'voice' = 'video', userContext?: UserContext | null) {
  const apiKey = process.env.GEMINI_API_KEY_TOTALASSIST;
  if (!apiKey) {
    ws.send(
      JSON.stringify({ type: "error", message: "API key not configured" }),
    );
    ws.close();
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Select random voice and greeting for this session
    const selectedVoice = getRandomVoice();
    const sessionAgentName = getRandomAgentName();
    const selectedGreeting = getRandomGreeting(mode, sessionAgentName);
    console.log(
      `Session voice: ${selectedVoice.name} (${selectedVoice.style}), mode: ${mode}`,
    );

    // Flag to track when session is ready for greeting
    let sessionReady = false;
    let sessionInstance: any = null;

    // Fetch learned playbook branches (cached, 10-min TTL)
    let systemInstructionText = mode === 'voice'
      ? buildVoiceSystemInstruction(selectedVoice.style, userContext)
      : buildSystemInstruction(selectedVoice.style, userContext);
    const playbookBlock = await getPlaybookBlock();
    if (playbookBlock) systemInstructionText += playbookBlock;

    const session = await ai.live.connect({
      model: "gemini-2.5-flash-native-audio-preview-12-2025",
      callbacks: {
        onopen: () => {
          console.log(
            "Gemini Live session opened at",
            new Date().toISOString(),
          );
          ws.send(JSON.stringify({ type: "ready", voice: selectedVoice.name }));
          sessionReady = true;
          console.log(
            "Session ready flag set, sessionInstance:",
            !!sessionInstance,
          );

          // Send greeting after a short delay to ensure session is fully assigned
          setTimeout(() => {
            if (sessionInstance) {
              console.log("Sending initial greeting prompt...");
              sessionInstance.sendClientContent({
                turns: [
                  {
                    role: "user",
                    parts: [
                      {
                        text: `Hello! I just connected. Please greet me warmly like: "${selectedGreeting}" — and then IMMEDIATELY call the presentChoices tool to show the main issue categories on my screen (Wi-Fi / Internet, Smart Home Devices, Appliances, HVAC / Thermostat, TV / Streaming). Remember: you must ALWAYS use a visual tool on every response.`,
                      },
                    ],
                  },
                ],
                turnComplete: true,
              });
            }
          }, 100);
        },
        onmessage: (message: any) => {
          try {
            console.log(
              "Received Gemini message:",
              JSON.stringify(message).substring(0, 500),
            );

            // Prefer outputTranscript (actual spoken words) over part.text (may be thinking/reasoning)
            const hasOutputTranscript = !!message.serverContent?.outputTranscript;

            if (message.serverContent?.modelTurn?.parts) {
              console.log(
                "Processing modelTurn parts:",
                message.serverContent.modelTurn.parts.length,
              );
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData?.mimeType?.startsWith("audio/")) {
                  console.log("Sending audio data to client");
                  ws.send(
                    JSON.stringify({
                      type: "audio",
                      data: part.inlineData.data,
                    }),
                  );
                }
                // Only send part.text as transcript fallback when outputTranscript is NOT available
                if (
                  !hasOutputTranscript &&
                  part.text &&
                  !part.text.startsWith("**") &&
                  !part.text.includes("I'm ") &&
                  part.text.length > 5
                ) {
                  console.log(
                    "AI text (fallback):",
                    part.text.substring(0, 100),
                  );
                  ws.send(
                    JSON.stringify({
                      type: "aiTranscript",
                      data: part.text,
                    }),
                  );
                }
              }
            }

            // Handle AI's spoken transcript (what the AI actually says) - preferred method
            if (hasOutputTranscript) {
              console.log(
                "AI spoken transcript:",
                message.serverContent.outputTranscript,
              );
              ws.send(
                JSON.stringify({
                  type: "aiTranscript",
                  data: message.serverContent.outputTranscript,
                }),
              );
            }

            if (message.serverContent?.turnComplete) {
              ws.send(JSON.stringify({ type: "turnComplete" }));
            }

            if (message.serverContent?.interrupted) {
              ws.send(JSON.stringify({ type: "interrupted" }));
            }

            // Handle user speech transcription
            if (message.serverContent?.inputTranscript) {
              console.log(
                "User transcript:",
                message.serverContent.inputTranscript,
              );
              ws.send(
                JSON.stringify({
                  type: "userTranscript",
                  data: message.serverContent.inputTranscript,
                }),
              );
            }

            if (message.toolCall) {
              const functionCalls = message.toolCall.functionCalls || [];
              const functionResponses: any[] = [];

              for (const fc of functionCalls) {
                if (fc.name === "endSession") {
                  ws.send(JSON.stringify({ type: "endSession", summary: fc.args?.summary || "Session completed" }));
                  functionResponses.push({ id: fc.id, name: fc.name, response: { result: "session_ended" } });
                } else if (fc.name === "presentChoices" || fc.name === "showStep" || fc.name === "confirmResult") {
                  ws.send(JSON.stringify({
                    type: "guidedAction",
                    action: { type: fc.name, ...fc.args }
                  }));
                  functionResponses.push({ id: fc.id, name: fc.name, response: { result: "displayed_to_user" } });
                }
              }

              // Send tool responses to unblock the model
              if (functionResponses.length > 0) {
                try {
                  session.sendToolResponse({ functionResponses });
                } catch (err) {
                  console.error("Error sending tool response:", err);
                }
              }
            }
          } catch (err) {
            console.error("Error processing Gemini message:", err);
          }
        },
        onerror: (error: any) => {
          console.error("Gemini Live error:", error);
          console.error(
            "Gemini error details:",
            JSON.stringify(error, Object.getOwnPropertyNames(error)),
          );
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Gemini connection error",
            }),
          );
        },
        onclose: (event: any) => {
          console.log(
            "Gemini Live session closed at",
            new Date().toISOString(),
          );
          console.log("Close event:", event);
          console.log("Close event code:", event?.code);
          console.log("Close event reason:", event?.reason);
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        },
      },
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: {
          parts: [{ text: systemInstructionText }],
        },
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: selectedVoice.name,
            },
          },
        },
        // Enable real-time transcription of user's speech and AI's speech
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        tools: [
          {
            functionDeclarations: [
              {
                name: "endSession",
                description:
                  "Call this when the user wants to end the support session or when the issue is resolved.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    summary: {
                      type: Type.STRING,
                      description:
                        "A brief summary of what was diagnosed or fixed.",
                    },
                  },
                  required: ["summary"],
                },
              },
              {
                name: "presentChoices",
                description: "Show 3-5 tappable option buttons on the user's screen. Use whenever there are predictable answer paths.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    prompt: {
                      type: Type.STRING,
                      description: "A short label or question displayed above the choices.",
                    },
                    choices: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "The list of choice labels to display as tappable buttons.",
                    },
                  },
                  required: ["prompt", "choices"],
                },
              },
              {
                name: "showStep",
                description: "Display a numbered step card on the user's screen with a title, instruction, and optional tip.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    stepNumber: {
                      type: Type.INTEGER,
                      description: "The step number to display.",
                    },
                    title: {
                      type: Type.STRING,
                      description: "Short title for the step.",
                    },
                    instruction: {
                      type: Type.STRING,
                      description: "Detailed instruction text for the step.",
                    },
                    tip: {
                      type: Type.STRING,
                      description: "Optional helpful tip for the step.",
                    },
                  },
                  required: ["stepNumber", "title", "instruction"],
                },
              },
              {
                name: "confirmResult",
                description: "Show a yes/no confirmation question on the user's screen.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    question: {
                      type: Type.STRING,
                      description: "The yes/no question to display.",
                    },
                    yesLabel: {
                      type: Type.STRING,
                      description: "Custom label for the yes button.",
                    },
                    noLabel: {
                      type: Type.STRING,
                      description: "Custom label for the no button.",
                    },
                  },
                  required: ["question"],
                },
              },
            ],
          },
        ],
      },
    });

    // Assign session instance for use in onopen callback
    sessionInstance = session;

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === "audio") {
          session.sendRealtimeInput({
            audio: {
              data: message.data,
              mimeType: "audio/pcm;rate=16000",
            },
          });
        } else if (message.type === "image") {
          session.sendRealtimeInput({
            media: {
              data: message.data,
              mimeType: "image/jpeg",
            },
          });
        } else if (message.type === "text") {
          session.sendClientContent({
            turns: [{ role: "user", parts: [{ text: message.data }] }],
            turnComplete: true,
          });
        }
      } catch (err) {
        console.error("Error handling client message:", err);
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected, closing Gemini session");
      try {
        session.close();
      } catch (err) {
        console.error("Error closing Gemini session:", err);
      }
    });
  } catch (error) {
    console.error("Failed to connect to Gemini Live:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Failed to connect to AI service",
      }),
    );
    ws.close();
  }
}

async function main() {
  try {
    // --- GOOGLE AUTH STRATEGY SETUP ---
    // Note: Session and passport middleware are initialized at the top of the file
    // before auth routes. Only the Google OAuth strategy is configured here.

    // Support multiple custom domains (comma-separated)
    const allowedDomains = process.env.APP_DOMAINS
      ? process.env.APP_DOMAINS.split(",").map((d) => d.trim())
      : [];

    // Helper to check if a host is an allowed custom domain
    const isAllowedDomain = (host: string) => {
      return allowedDomains.some((d) => host === d || host.endsWith(`.${d}`));
    };

    // Build callback URL - uses first custom domain or falls back to Replit/relative
    const getCallbackURL = () => {
      if (allowedDomains.length > 0) {
        return `https://${allowedDomains[0]}/api/auth/callback/google`;
      }
      if (process.env.CALLBACK_URL) {
        return process.env.CALLBACK_URL;
      }
      if (process.env.REPLIT_DOMAINS) {
        const domain = process.env.REPLIT_DOMAINS.split(",")[0];
        return `https://${domain}/api/auth/callback/google`;
      }
      return "/api/auth/callback/google";
    };

    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID || "",
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
          callbackURL: getCallbackURL(),
          proxy: true,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            console.log("[GOOGLE AUTH] Processing login for:", email);

            if (!email) {
              console.error("[GOOGLE AUTH] No email returned from Google");
              return done(new Error("No email address returned from Google"));
            }

            // Upsert user to database and check if new
            const { user: dbUser, isNewUser } = await authStorage.upsertUser({
              id: profile.id,
              email,
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
              profileImageUrl: profile.photos?.[0]?.value,
            });

            console.log("[GOOGLE AUTH] User upserted successfully:", {
              id: dbUser.id,
              email: dbUser.email,
              isNewUser,
            });

            // Send welcome email for new users
            if (isNewUser && dbUser.email) {
              sendWelcomeEmail(
                dbUser.email,
                dbUser.firstName || undefined,
              ).catch((err) => {
                console.error(
                  "[EMAIL] Failed to send welcome email for Google OAuth user:",
                  err,
                );
              });
            }

            // Transform to session user format
            const user = {
              id: dbUser.id,
              username: profile.displayName || dbUser.email || "",
              email: dbUser.email,
              firstName: dbUser.firstName,
              lastName: dbUser.lastName,
              profileImageUrl: dbUser.profileImageUrl,
            };
            return done(null, user);
          } catch (error) {
            console.error("[GOOGLE AUTH] Error during user upsert:", error);
            // Log full error details for debugging
            if (error instanceof Error) {
              console.error("[GOOGLE AUTH] Error message:", error.message);
              console.error("[GOOGLE AUTH] Error stack:", error.stack);
            }
            return done(error as Error);
          }
        },
      ),
    );

    // 1. Start Login - store origin domain before redirecting to Google
    app.get(
      "/auth/google",
      (req, res, next) => {
        // Store the origin domain so we can redirect back after auth
        const host = req.get("host") || "";
        if (isAllowedDomain(host)) {
          (req.session as any).authOrigin = host;
        }
        next();
      },
      passport.authenticate("google", { scope: ["profile", "email"] }),
    );

    // 2. Handle Callback - redirect to onboarding for new users, dashboard for returning users
    app.get(
      "/api/auth/callback/google",
      passport.authenticate("google", {
        failureRedirect: "/?error=auth_failed",
        keepSessionInfo: true, // Passport 0.7+ regenerates sessions; preserve authOrigin
      }),
      async (req, res) => {
        try {
          const authOrigin = (req.session as any).authOrigin;
          delete (req.session as any).authOrigin;

          const user = req.user as any;
          console.log("[GOOGLE CALLBACK] Auth success, user:", { id: user?.id, email: user?.email });

          const dbUser = user?.id ? await authStorage.getUser(user.id) : null;
          const hasCompletedOnboarding = dbUser?.homeType || dbUser?.techComfort;

          // Determine redirect path - new users go to onboarding, returning users to dashboard
          const redirectPath = hasCompletedOnboarding
            ? "/dashboard"
            : "/signup?oauth=true";

          // Use authOrigin if preserved, otherwise fall back to first allowed domain
          const redirectDomain = (authOrigin && isAllowedDomain(authOrigin))
            ? authOrigin
            : allowedDomains[0] || null;

          // Explicitly save session before redirect to guarantee persistence
          req.session.save((saveErr) => {
            if (saveErr) {
              console.error("[GOOGLE CALLBACK] Session save error:", saveErr);
            }
            if (redirectDomain) {
              console.log("[GOOGLE CALLBACK] Redirecting to:", `https://${redirectDomain}${redirectPath}`);
              res.redirect(`https://${redirectDomain}${redirectPath}`);
            } else {
              res.redirect(redirectPath);
            }
          });
        } catch (callbackErr) {
          console.error("[GOOGLE CALLBACK] Error in success handler:", callbackErr);
          res.redirect("/?error=auth_failed");
        }
      },
    );

    // 3. Get User Info (includes role from DB via cached lookup)
    app.get("/api/auth/user", async (req, res) => {
      if (req.isAuthenticated() && req.user) {
        try {
          const { getAgentUserFromDB } = await import("./middleware/agentMiddleware");
          const agentUser = await getAgentUserFromDB((req.user as any).id);
          const role = agentUser?.role || "customer";
          res.json({ user: { ...req.user, role } });
        } catch {
          res.json({ user: { ...req.user, role: "customer" } });
        }
      } else {
        res.status(401).json({ user: null });
      }
    });

    // 4. Logout - redirect back to the domain user is on
    app.get("/api/auth/logout", (req, res) => {
      const host = req.get("host") || "";
      const redirectDomain = isAllowedDomain(host) ? host : null;

      req.logout((err) => {
        if (err) {
          console.error("Logout error:", err);
        }
        req.session.destroy((err) => {
          if (err) {
            console.error("Session destroy error:", err);
          }
          res.clearCookie("connect.sid");
          // Redirect to current domain if allowed, otherwise relative
          if (redirectDomain) {
            res.redirect(`https://${redirectDomain}/`);
          } else {
            res.redirect("/");
          }
        });
      });
    });
    // --- GOOGLE AUTH SETUP END ---
    console.log("Auth setup complete");

    // Start scheduled jobs
    startTrialNotificationJob();
    console.log("Scheduled jobs initialized");

    // Mount the cases, devices, and AI routers
    app.use("/api/cases", casesRouter);
    app.use("/api/devices", devicesRouter);
    app.use("/api/ai", aiLimiter, aiRouter);
    app.use("/api/specialist", specialistLimiter, specialistRouter);
    app.use("/api/agent", agentRouter);
  } catch (error) {
    console.error("Auth setup failed:", error);
  }

  // In production, serve the built frontend files
  if (isProduction) {
    const distPath = path.join(process.cwd(), "dist");

    // Hashed assets (JS/CSS) get long cache; HTML/manifest get short cache
    app.use("/assets", express.static(path.join(distPath, "assets"), {
      maxAge: "1y",
      immutable: true,
    }));
    app.use(express.static(distPath, {
      maxAge: "1h",
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    }));

    // SPA catch-all: serve index.html for any non-API routes
    app.get("/{*splat}", (req, res, next) => {
      if (req.path.startsWith("/api") || req.path.startsWith("/live")) {
        return next();
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static files from dist/");
  }

  // Global error handler — catch unhandled route errors
  app.use((err: any, _req: any, res: any, next: any) => {
    console.error("[UNHANDLED ERROR]", err.message || err);
    if (res.headersSent) return next(err);
    res.status(500).json({ error: "An unexpected error occurred. Please try again." });
  });

  // Use port 5000 in production (Replit), 3001 in development
  const PORT = isProduction ? 5000 : 3001;
  const server = createServer(app);

  const wss = new WebSocketServer({ server, path: "/live" });

  wss.on("connection", async (ws, req) => {
    // Parse query params for mode only (userId is NO LONGER trusted from query params)
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const mode = (url.searchParams.get("mode") === "voice" ? "voice" : "video") as "voice" | "video";
    const clientIp = req.socket.remoteAddress || "unknown";
    console.log(`[WS] New WebSocket connection for ${mode} session (IP: ${clientIp})`);

    // SECURITY: Authenticate via session cookie — userId query param is completely ignored
    const sessionUser = await authenticateWebSocket(req);
    if (!sessionUser) {
      console.log(`[WS] Unauthenticated connection rejected (IP: ${clientIp})`);
      ws.close(4401, "Authentication required");
      return;
    }

    // Use authenticated session user's ID as sole source of truth
    const userId = sessionUser.id;
    console.log(`[WS] Authenticated ${mode} session for user ${userId}`);

    let userContext: UserContext | null = null;

    // Check if user has access to live sessions (voice and video share the same quota)
    const accessCheck = await checkFeatureAccess(userId, "live");
    if (!accessCheck.allowed) {
      console.log(
        `[${mode.toUpperCase()}] Access denied for user ${userId}: ${accessCheck.reason}`,
      );
      ws.send(
        JSON.stringify({
          type: "error",
          code: accessCheck.reason,
          message:
            accessCheck.reason === "LIMIT_REACHED"
              ? `You've used all your ${mode} support sessions for this billing period.`
              : `${mode === 'voice' ? 'Voice' : 'Live'} support is not available on your current plan.`,
          tier: accessCheck.tier,
          usage: accessCheck.usage,
          limits: accessCheck.limits,
        }),
      );
      ws.close();
      return;
    }

    // Increment usage when connection is established
    await incrementUsage(userId, "liveSessions");
    console.log(`[${mode.toUpperCase()}] Session started for user ${userId}`);

    // Fetch user context for personalization
    userContext = await fetchUserContext(userId);

    setupGeminiLive(ws, mode, userContext);
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(
      `Server running on port ${PORT} (${isProduction ? "production" : "development"})`,
    );
    console.log(`WebSocket server ready at /live`);
  });
}

// Process-level error handlers for defense-in-depth
process.on("unhandledRejection", (reason) => {
  console.error("[PROCESS] Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[PROCESS] Uncaught exception:", err.message);
  // Allow in-flight responses to complete before exiting
  setTimeout(() => process.exit(1), 1000);
});

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
