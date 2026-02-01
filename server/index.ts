import express from "express";
import cors from "cors";
import path from "path";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, Modality, Type } from "@google/genai";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import nodemailer from "nodemailer";
import * as authService from "./services/authService";
import { sendWelcomeEmail } from "./services/emailService";
import { authStorage } from "./replit_integrations/auth/storage";
import * as stripeService from "./services/stripeService";
import {
  loadSubscription,
  requireFeature,
  incrementUsage,
  checkFeatureAccess,
} from "./middleware/subscriptionMiddleware";
import { STRIPE_PRICES, PLAN_LIMITS } from "./config/stripe";

const app = express();
const isProduction = process.env.NODE_ENV === "production";

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

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

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Test email endpoint (for validating SMTP configuration)
app.post("/api/test-email", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email address required" });
  }

  console.log("[EMAIL TEST] Attempting to send test email to:", email);
  console.log("[EMAIL TEST] SMTP_HOST configured:", !!process.env.SMTP_HOST);

  try {
    const result = await sendWelcomeEmail(email, "Test User");
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("[EMAIL TEST] Error:", error);
    res.status(500).json({ error: String(error) });
  }
});

// ============================================
// Authentication API Endpoints (Database)
// ============================================

// Register new user
app.post("/api/auth/register", async (req, res) => {
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

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

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

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Send welcome email in the background (don't block the response)
    sendWelcomeEmail(email, firstName).catch((err) => {
      console.error("[EMAIL] Failed to send welcome email:", err);
    });

    // Create session user object (matching OAuth format)
    const sessionUser = {
      id: result.user.id,
      username: result.user.email || "",
      email: result.user.email,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      profileImageUrl: null,
    };

    // Establish Passport session (same as OAuth/login flow)
    req.login(sessionUser, (err) => {
      if (err) {
        console.error("Session creation error after registration:", err);
        // Still return success since user was created, just without session
        return res.json({ success: true, user: result.user });
      }
      res.json({ success: true, user: result.user });
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// Login user
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await authService.loginUser(email, password);

    if (!result.success) {
      return res.status(401).json({ error: result.error });
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

// Get user by ID
app.get("/api/auth/user/:id", async (req, res) => {
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
app.put("/api/auth/user/:id", async (req, res) => {
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
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Delete user account
app.delete("/api/auth/user/:id", async (req, res) => {
  try {
    await authService.deleteUser(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

// ============================================
// Support Sessions API Endpoints
// ============================================

// Save a support session (with usage tracking)
app.post("/api/sessions", loadSubscription, async (req, res) => {
  try {
    const { userId, sessionType, title, summary, transcript } = req.body;

    // Check feature access based on session type
    const featureMap: Record<string, "chat" | "photo" | "live"> = {
      chat: "chat",
      photo: "photo",
      video: "live",
    };
    const feature = featureMap[sessionType] || "chat";

    // Check if user has access (for non-authenticated saves, skip)
    if (req.subscription && userId) {
      const canUse = {
        chat: req.subscription.canUseChat,
        photo: req.subscription.canUsePhoto,
        live: req.subscription.canUseLive,
      }[feature];

      if (!canUse) {
        return res.status(403).json({
          error: "Feature limit reached",
          code: "LIMIT_REACHED",
          feature,
          tier: req.subscription.tier,
          usage: req.subscription.usage,
          limits: req.subscription.limits,
        });
      }
    }

    const session = await authService.saveSession({
      userId,
      sessionType,
      title,
      summary,
      transcript,
    });

    // Increment usage after successful save
    if (userId) {
      const usageMap: Record<string, "chatSessions" | "photoAnalyses" | "liveSessions"> = {
        chat: "chatSessions",
        photo: "photoAnalyses",
        video: "liveSessions",
      };
      const usageField = usageMap[sessionType];
      if (usageField) {
        await incrementUsage(userId, usageField);
      }
    }

    res.json({ success: true, session });
  } catch (error) {
    console.error("Save session error:", error);
    res.status(500).json({ error: "Failed to save session" });
  }
});

// Get user's sessions
app.get("/api/sessions/:userId", async (req, res) => {
  try {
    const sessions = await authService.getUserSessions(req.params.userId);
    res.json({ sessions });
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({ error: "Failed to get sessions" });
  }
});

// Delete a session
app.delete("/api/sessions/:sessionId", async (req, res) => {
  try {
    const { userId } = req.body;
    await authService.deleteSession(req.params.sessionId, userId);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete session error:", error);
    res.status(500).json({ error: "Failed to delete session" });
  }
});

// Delete all user sessions
app.delete("/api/sessions/user/:userId", async (req, res) => {
  try {
    await authService.deleteAllUserSessions(req.params.userId);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete all sessions error:", error);
    res.status(500).json({ error: "Failed to delete sessions" });
  }
});

// ============================================
// Trial Management (Database)
// ============================================

// Check trial eligibility (database version)
app.post("/api/trial/check-db", async (req, res) => {
  try {
    const { email, fingerprint } = req.body;
    const ip = getClientIP(req);
    const result = await authService.checkTrialEligibility(email, ip, fingerprint);
    res.json(result);
  } catch (error) {
    console.error("Trial check error:", error);
    res.status(500).json({ error: "Failed to check trial eligibility" });
  }
});

// Start trial (database version)
app.post("/api/trial/start-db", async (req, res) => {
  try {
    const { email, fingerprint } = req.body;
    const ip = getClientIP(req);
    const result = await authService.startTrial(email, ip, fingerprint);
    res.json(result);
  } catch (error) {
    console.error("Start trial error:", error);
    res.status(500).json({ error: "Failed to start trial" });
  }
});

// Get trial status (database version)
app.get("/api/trial/status/:email", async (req, res) => {
  try {
    const result = await authService.getTrialStatus(req.params.email);
    res.json(result);
  } catch (error) {
    console.error("Trial status error:", error);
    res.status(500).json({ error: "Failed to get trial status" });
  }
});

// Trial tracking storage (in-memory fallback for development)
interface TrialRecord {
  email: string;
  ip: string;
  startedAt: number;
  expiresAt: number;
  fingerprint?: string;
}

const trialRecords: Map<string, TrialRecord> = new Map();

// Helper to get client IP
const getClientIP = (req: express.Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
};

// Check trial eligibility
app.post("/api/trial/check", (req, res) => {
  const { email, fingerprint } = req.body;
  const ip = getClientIP(req);

  // Check by email
  const emailRecord = trialRecords.get(`email:${email}`);
  if (emailRecord && Date.now() < emailRecord.expiresAt) {
    return res.json({
      eligible: false,
      reason: 'email_used',
      message: 'This email has already been used for a trial.',
      expiresAt: emailRecord.expiresAt
    });
  }

  // Check by IP
  const ipRecord = trialRecords.get(`ip:${ip}`);
  if (ipRecord && Date.now() < ipRecord.expiresAt) {
    return res.json({
      eligible: false,
      reason: 'ip_used',
      message: 'A trial has already been started from this location.',
      expiresAt: ipRecord.expiresAt
    });
  }

  // Check by fingerprint if provided
  if (fingerprint) {
    const fpRecord = trialRecords.get(`fp:${fingerprint}`);
    if (fpRecord && Date.now() < fpRecord.expiresAt) {
      return res.json({
        eligible: false,
        reason: 'device_used',
        message: 'A trial has already been started on this device.',
        expiresAt: fpRecord.expiresAt
      });
    }
  }

  res.json({ eligible: true });
});

// Start a new trial
app.post("/api/trial/start", (req, res) => {
  const { email, fingerprint } = req.body;
  const ip = getClientIP(req);

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Check eligibility first
  const emailRecord = trialRecords.get(`email:${email}`);
  const ipRecord = trialRecords.get(`ip:${ip}`);

  if ((emailRecord && Date.now() < emailRecord.expiresAt) ||
      (ipRecord && Date.now() < ipRecord.expiresAt)) {
    return res.status(403).json({
      error: 'Trial already used',
      message: 'You have already used your free trial.'
    });
  }

  const now = Date.now();
  const trialDuration = 24 * 60 * 60 * 1000; // 24 hours
  const expiresAt = now + trialDuration;

  const record: TrialRecord = {
    email,
    ip,
    startedAt: now,
    expiresAt,
    fingerprint
  };

  // Store by email and IP
  trialRecords.set(`email:${email}`, record);
  trialRecords.set(`ip:${ip}`, record);
  if (fingerprint) {
    trialRecords.set(`fp:${fingerprint}`, record);
  }

  console.log(`[TRIAL] Started trial for ${email} from IP ${ip}`);

  res.json({
    success: true,
    trialStarted: now,
    trialExpires: expiresAt,
    message: 'Your 24-hour free trial has started!'
  });
});

// Get trial status
app.get("/api/trial/status", (req, res) => {
  const ip = getClientIP(req);
  const email = req.query.email as string;

  let record: TrialRecord | undefined;

  if (email) {
    record = trialRecords.get(`email:${email}`);
  }

  if (!record) {
    record = trialRecords.get(`ip:${ip}`);
  }

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

  res.json({
    hasTrial: false,
    isActive: false
  });
});

// Chat audit logging endpoint
app.post("/api/audit/chat", (req, res) => {
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
app.post("/api/stripe/create-checkout-session", async (req, res) => {
  try {
    const { userId, priceId, successUrl, cancelUrl } = req.body;

    if (!userId || !priceId) {
      return res.status(400).json({ error: "userId and priceId are required" });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const result = await stripeService.createCheckoutSession(
      userId,
      priceId,
      successUrl || `${baseUrl}/dashboard?upgraded=true`,
      cancelUrl || `${baseUrl}/pricing`
    );

    res.json(result);
  } catch (error) {
    console.error("[STRIPE] Checkout session error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Create a customer portal session
app.post("/api/stripe/create-portal-session", async (req, res) => {
  try {
    const { userId, returnUrl } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const result = await stripeService.createPortalSession(
      userId,
      returnUrl || `${baseUrl}/dashboard`
    );

    res.json(result);
  } catch (error) {
    console.error("[STRIPE] Portal session error:", error);
    res.status(500).json({ error: "Failed to create portal session" });
  }
});

// Get subscription status
app.get("/api/subscription/status/:userId", async (req, res) => {
  try {
    const result = await stripeService.getSubscriptionStatus(req.params.userId);
    res.json(result);
  } catch (error) {
    console.error("[STRIPE] Get subscription status error:", error);
    res.status(500).json({ error: "Failed to get subscription status" });
  }
});

// Cancel subscription
app.post("/api/subscription/cancel", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const result = await stripeService.cancelSubscription(userId);
    res.json(result);
  } catch (error) {
    console.error("[STRIPE] Cancel subscription error:", error);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

// Reactivate subscription
app.post("/api/subscription/reactivate", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

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

// Email transporter configuration
// In production, use a real email service (SendGrid, AWS SES, etc.)
const createEmailTransporter = () => {
  // Check for email configuration
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback: Use ethereal for testing (creates a test account)
  console.log("No SMTP config found - email sending will be simulated");
  return null;
};

// Send session guide via email
app.post("/api/send-session-guide", async (req, res) => {
  const { email, userName, summary, pdfBase64, sessionDate } = req.body;

  if (!email || !pdfBase64) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  console.log(`[EMAIL] Sending session guide to ${email}`);

  const transporter = createEmailTransporter();

  if (!transporter) {
    // Simulate email sending in development
    console.log("[EMAIL] Simulated email send to:", email);
    console.log("[EMAIL] Subject: Your TechTriage Session Guide");
    console.log("[EMAIL] PDF attachment size:", pdfBase64.length, "bytes");
    return res.json({ success: true, simulated: true });
  }

  try {
    const pdfBuffer = Buffer.from(pdfBase64, "base64");
    const dateStr = new Date(sessionDate).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"TechTriage Support" <support@techtriage.com>',
      to: email,
      subject: `Your TechTriage Session Guide - ${dateStr}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #1F2937; padding: 30px; border-radius: 16px 16px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">TechTriage</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">Your Personal Tech Support Guide</p>
          </div>

          <div style="background-color: #F9FAFB; padding: 30px; border: 1px solid #E5E7EB; border-top: none;">
            <h2 style="color: #1F2937; margin: 0 0 16px 0; font-size: 22px;">Hi ${userName}!</h2>

            <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
              Thank you for using TechTriage! We've put together a personalized guide based on your recent support session.
            </p>

            <div style="background-color: white; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h3 style="color: #F97316; margin: 0 0 12px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Session Summary</h3>
              <p style="color: #1F2937; font-size: 16px; font-weight: 600; margin: 0; line-height: 1.5;">${summary || "Session completed successfully"}</p>
            </div>

            <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
              Your complete how-to guide is attached as a PDF. It includes:
            </p>

            <ul style="color: #4B5563; font-size: 15px; line-height: 1.8; padding-left: 20px;">
              <li>Step-by-step instructions we discussed</li>
              <li>Full conversation transcript</li>
              <li>Key troubleshooting tips</li>
            </ul>

            <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
              Save this guide for future reference - it's tailored specifically to your situation!
            </p>
          </div>

          <div style="background-color: #1F2937; padding: 24px; border-radius: 0 0 16px 16px; text-align: center;">
            <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin: 0;">
              Need more help? Start a new session at <a href="https://techtriage.com" style="color: #F97316;">techtriage.com</a>
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `TechTriage_Guide_${new Date(sessionDate).toISOString().split("T")[0]}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    console.log("[EMAIL] Successfully sent to:", email);
    res.json({ success: true });
  } catch (error) {
    console.error("[EMAIL] Failed to send:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// Available voices with their characteristics for variety
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

// Greeting variations to keep things fresh
const GREETINGS = [
  "Hi there! I'm your TechTriage specialist. I can see your camera feed - go ahead and show me what's giving you trouble, and I'll help you figure it out.",
  "Hey! Welcome to TechTriage. I'm here and ready to help. Point your camera at whatever's giving you grief and let's solve this together.",
  "Hello! TechTriage support here. I've got your video feed - show me the problem and we'll get it sorted out.",
  "Hi! I'm your tech support buddy today. Camera's looking good - what are we troubleshooting?",
  "Welcome! I'm ready to help with your tech issue. Just show me what you're dealing with and we'll tackle it step by step.",
];

function getRandomVoice() {
  return VOICES[Math.floor(Math.random() * VOICES.length)];
}

function getRandomGreeting() {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}

function buildSystemInstruction(voiceStyle: string) {
  return `You are a TechTriage Agent - a friendly, professional technical support specialist.

IMPORTANT PRONUNCIATION: The word "Triage" is pronounced "TREE-ahzh" (like the French word, rhymes with "massage"). Say "Tech-TREE-ahzh" NOT "Tech-TRY-age". This is critical for brand consistency.

YOUR PERSONALITY: You have a ${voiceStyle} communication style. Let this come through naturally in how you speak.

BEHAVIOR:
- Be conversational and helpful, like a knowledgeable friend
- When you see an image, describe what you're seeing and provide guidance
- Ask clarifying questions if needed
- Provide step-by-step troubleshooting when appropriate
- If you see error messages or model numbers, acknowledge them specifically
- Speak naturally and conversationally - avoid sounding robotic or scripted
- Keep responses concise and actionable

SAFETY:
- Never assist with gas leaks, electrical panels, bare wires, or structural changes
- For dangerous situations, advise calling a professional immediately

TONE: ${voiceStyle.charAt(0).toUpperCase() + voiceStyle.slice(1)}. You're a real person helping a friend with tech issues.`;
}

async function setupGeminiLive(ws: WebSocket) {
  const apiKey = process.env.GEMINI_API_KEY__TECHTRIAGE;
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
    const selectedGreeting = getRandomGreeting();
    console.log(
      `Session voice: ${selectedVoice.name} (${selectedVoice.style})`,
    );

    // Flag to track when session is ready for greeting
    let sessionReady = false;
    let sessionInstance: any = null;

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
                        text: `Hello! I just connected. Please greet me with something like: "${selectedGreeting}"`,
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
                // Send text as fallback if no outputTranscript is available
                // Filter out obvious thinking/reasoning markers
                if (part.text && !part.text.startsWith("**") && !part.text.includes("I'm ") && part.text.length > 5) {
                  console.log("AI text (fallback):", part.text.substring(0, 100));
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
            if (message.serverContent?.outputTranscript) {
              console.log("AI spoken transcript:", message.serverContent.outputTranscript);
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
              console.log("User transcript:", message.serverContent.inputTranscript);
              ws.send(
                JSON.stringify({
                  type: "userTranscript",
                  data: message.serverContent.inputTranscript,
                }),
              );
            }

            if (message.toolCall) {
              const functionCall = message.toolCall.functionCalls?.[0];
              if (functionCall?.name === "endSession") {
                ws.send(
                  JSON.stringify({
                    type: "endSession",
                    summary: functionCall.args?.summary || "Session completed",
                  }),
                );
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
          parts: [{ text: buildSystemInstruction(selectedVoice.style) }],
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
        }
      } catch (err) {
        console.error("Error handling client message:", err);
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected, closing Gemini session");
      session.close();
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
    // Trust proxy for secure cookies behind reverse proxy
    app.set("trust proxy", 1);

    // --- GOOGLE AUTH SETUP START ---
    app.use(
      session({
        secret: process.env.SESSION_SECRET || "techtriage_dev_secret_change_in_prod",
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: isProduction,
          httpOnly: true,
          sameSite: isProduction ? "none" : "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        },
      }),
    );

    app.use(passport.initialize());
    app.use(passport.session());

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

            console.log("[GOOGLE AUTH] User upserted successfully:", { id: dbUser.id, email: dbUser.email, isNewUser });

            // Send welcome email for new users
            if (isNewUser && dbUser.email) {
              sendWelcomeEmail(dbUser.email, dbUser.firstName || undefined).catch((err) => {
                console.error("[EMAIL] Failed to send welcome email for Google OAuth user:", err);
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

    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((obj: any, done) => done(null, obj));

    // 1. Start Login - store origin domain before redirecting to Google
    app.get("/auth/google", (req, res, next) => {
      // Store the origin domain so we can redirect back after auth
      const host = req.get("host") || "";
      if (isAllowedDomain(host)) {
        (req.session as any).authOrigin = host;
      }
      next();
    }, passport.authenticate("google", { scope: ["profile", "email"] }));

    // 2. Handle Callback - redirect to onboarding for new users, dashboard for returning users
    app.get(
      "/api/auth/callback/google",
      passport.authenticate("google", { failureRedirect: "/?error=auth_failed" }),
      async (req, res) => {
        const authOrigin = (req.session as any).authOrigin;
        delete (req.session as any).authOrigin;

        // Check if user has completed onboarding (has firstName set from onboarding form)
        const user = req.user as any;
        const dbUser = user?.id ? await authStorage.getUser(user.id) : null;
        const hasCompletedOnboarding = dbUser?.homeType || dbUser?.techComfort;

        // Determine redirect path - new users go to onboarding, returning users to dashboard
        const redirectPath = hasCompletedOnboarding ? '/dashboard' : '/signup?oauth=true';

        // Redirect to stored origin domain if allowed, otherwise relative
        if (authOrigin && isAllowedDomain(authOrigin)) {
          res.redirect(`https://${authOrigin}${redirectPath}`);
        } else {
          res.redirect(redirectPath);
        }
      },
    );

    // 3. Get User Info
    app.get("/api/auth/user", (req, res) => {
      if (req.isAuthenticated() && req.user) {
        res.json({ user: req.user });
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
  } catch (error) {
    console.error("Auth setup failed:", error);
  }

  // In production, serve the built frontend files
  if (isProduction) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));

    // SPA catch-all: serve index.html for any non-API routes
    app.get("/{*splat}", (req, res, next) => {
      if (req.path.startsWith("/api") || req.path.startsWith("/live")) {
        return next();
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static files from dist/");
  }

  // Use port 5000 in production (Replit), 3001 in development
  const PORT = isProduction ? 5000 : 3001;
  const server = createServer(app);

  const wss = new WebSocketServer({ server, path: "/live" });

  wss.on("connection", async (ws, req) => {
    console.log("New WebSocket connection for live session");

    // Parse userId from query string for access control
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const userId = url.searchParams.get("userId");

    if (userId) {
      // Check if user has access to live sessions
      const accessCheck = await checkFeatureAccess(userId, "live");
      if (!accessCheck.allowed) {
        console.log(`[LIVE] Access denied for user ${userId}: ${accessCheck.reason}`);
        ws.send(
          JSON.stringify({
            type: "error",
            code: accessCheck.reason,
            message:
              accessCheck.reason === "LIMIT_REACHED"
                ? "You've used all your live support sessions for this billing period."
                : "Live support is not available on your current plan.",
            tier: accessCheck.tier,
            usage: accessCheck.usage,
            limits: accessCheck.limits,
          })
        );
        ws.close();
        return;
      }

      // Increment usage when connection is established
      await incrementUsage(userId, "liveSessions");
      console.log(`[LIVE] Session started for user ${userId}`);
    }

    setupGeminiLive(ws);
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(
      `Server running on port ${PORT} (${isProduction ? "production" : "development"})`,
    );
    console.log(`WebSocket server ready at /live`);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
