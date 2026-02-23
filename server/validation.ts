import { z } from "zod";
import { Request, Response, NextFunction } from "express";

// ============================================
// Reusable schemas
// ============================================

const email = z.string().email("Invalid email format").max(255).trim().toLowerCase();
const password = z.string().min(8, "Password must be at least 8 characters").max(128);
const shortText = z.string().max(500).trim();
const longText = z.string().max(10000).trim();
const optionalShortText = z.string().max(500).trim().optional().or(z.literal(""));
const uuid = z.string().uuid("Invalid ID format");

// ============================================
// Auth schemas
// ============================================

export const registerSchema = z.object({
  email,
  password,
  firstName: optionalShortText,
  lastName: optionalShortText,
  phone: z.string().max(20).trim().optional().or(z.literal("")),
  homeType: optionalShortText,
  techComfort: optionalShortText,
  householdSize: optionalShortText,
  primaryIssues: z.array(z.string().max(100)).max(20).optional(),
  howHeard: optionalShortText,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required").max(128),
});

export const verifyEmailSchema = z.object({
  code: z.string().max(100).trim().optional(),
  token: z.string().max(500).trim().optional(),
}).refine(data => data.code || data.token, {
  message: "Verification code is required",
});

export const forgotPasswordSchema = z.object({
  email,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required").max(500).trim(),
  password,
});

// ============================================
// AI chat schemas
// ============================================

// History format used by chat routes: { role, text, image? }
const chatHistoryItem = z.object({
  role: z.enum(["user", "model"]),
  text: z.string().max(50000).optional(),
  image: z.string().max(10_000_000).optional().nullable(),
}).passthrough();

export const aiChatSchema = z.object({
  history: z.array(chatHistoryItem).max(200),
  message: z.string().min(1, "Message is required").max(10000),
  image: z.string().max(10_000_000).optional().nullable(),
  deviceContext: z.string().max(2000).optional().nullable(),
  agentName: z.string().max(50).optional(),
});

export const guestChatSchema = z.object({
  history: z.array(chatHistoryItem).max(10), // Guests get shorter history
  message: z.string().min(1, "Message is required").max(5000),
  agentName: z.string().max(50).optional(),
});

export const aiChatLiveAgentSchema = z.object({
  history: z.array(chatHistoryItem).max(200),
  message: z.string().min(1, "Message is required").max(10000),
  agent: z.object({
    first: z.string().max(100),
    last: z.string().max(100),
    role: z.string().max(200).optional(),
    personality: z.string().max(1000).optional(),
  }).passthrough(),
  image: z.string().max(10_000_000).optional().nullable(),
});

export const generateCaseNameSchema = z.object({
  message: z.string().min(1, "Message is required").max(5000),
});

export const voiceMessageSchema = z.object({
  history: z.array(chatHistoryItem).max(200),
  text: z.string().min(1).max(10000),
  photo: z.string().max(10_000_000).optional().nullable(),
});

export const voiceSummarySchema = z.object({
  transcript: z.array(z.object({
    role: z.enum(["user", "model"]),
    text: z.string().max(50000),
  }).passthrough()).min(1).max(500),
  photoCount: z.number().int().min(0).max(1000).optional(),
});

export const caseSummarySchema = z.object({
  messages: z.array(z.any()).min(1).max(500),
  transcripts: z.array(z.any()).max(100).optional(),
});

export const escalationReportSchema = z.object({
  messages: z.array(z.any()).min(1).max(500),
  deviceContext: z.any().optional(),
  voiceTranscripts: z.array(z.any()).max(100).optional(),
});

// ============================================
// Stripe schemas
// ============================================

export const checkoutSessionSchema = z.object({
  userId: z.string().max(255).optional(), // Ignored — server uses authenticated session user
  priceId: z.string().min(1, "priceId is required").max(255).regex(/^price_/, "Invalid price ID format"),
  successUrl: z.string().url().max(2000).optional(),
  cancelUrl: z.string().url().max(2000).optional(),
});

export const portalSessionSchema = z.object({
  userId: z.string().max(255).optional(), // Ignored — server uses authenticated session user
  returnUrl: z.string().url().max(2000).optional(),
});

export const subscriptionIntentSchema = z.object({
  priceId: z.string().min(1, "priceId is required").max(255).regex(/^price_/, "Invalid price ID format"),
  promotionCode: z.string().max(255).trim().optional(),
});

export const paymentIntentSchema = z.object({
  priceId: z.string().min(1, "priceId is required").max(255).regex(/^price_/, "Invalid price ID format"),
});

// ============================================
// Agent CRM schemas
// ============================================

export const agentCaseListSchema = z.object({
  status: z.enum(["open", "resolved", "escalated", "pending"]).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  assignedAgentId: z.string().max(255).optional(),
  customerId: z.string().max(255).optional(),
  search: z.string().max(200).trim().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.enum(["createdAt", "updatedAt", "priority", "status"]).default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const agentCaseUpdateSchema = z.object({
  status: z.enum(["open", "resolved", "escalated", "pending"]).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
});

export const agentCaseAssignSchema = z.object({
  agentId: z.string().min(1, "Agent ID is required").max(255),
});

export const agentCaseNoteSchema = z.object({
  content: z.string().min(1, "Note content is required").max(10000).trim(),
});

export const agentRoleChangeSchema = z.object({
  role: z.enum(["customer", "agent", "admin"]),
});

export const agentArchiveListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().max(200).trim().optional(),
});

// ============================================
// Validation middleware factories
// ============================================

export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const firstError = result.error.errors[0];
      return res.status(400).json({
        error: firstError?.message || "Invalid input",
      });
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const firstError = result.error.errors[0];
      return res.status(400).json({
        error: firstError?.message || "Invalid query parameters",
      });
    }
    // Express 5 makes req.query read-only; store validated data on req.validatedQuery
    (req as any).validatedQuery = result.data;
    next();
  };
}
