import { Router } from "express";
import { db } from "../db";
import { screenShareTokensTable, casesTable } from "../../shared/schema/schema";
import { eq, and, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { requireAgent } from "../middleware/agentMiddleware";
import { logCaseActivity } from "../services/caseActivityService";
import { validateQuery, screenShareTokenListSchema } from "../validation";

const router = Router();

// Rate limiters
const tokenCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: "Too many screen share requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const tokenValidateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: "Too many attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================
// Agent endpoints (require agent auth)
// ============================================

// POST /api/agent/cases/:caseId/screen-share-token — Generate a screen share token
router.post(
  "/agent/cases/:caseId/screen-share-token",
  requireAgent,
  tokenCreateLimiter,
  async (req, res) => {
    const { caseId } = req.params;
    const agentUser = req.agentUser!;

    try {
      // Verify case exists and is in a state that allows screen sharing
      const [caseRecord] = await db
        .select({ id: casesTable.id, status: casesTable.status })
        .from(casesTable)
        .where(eq(casesTable.id, caseId))
        .limit(1);

      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      if (caseRecord.status !== "open" && caseRecord.status !== "escalated") {
        return res.status(400).json({
          error: "Screen share can only be requested for open or escalated cases",
        });
      }

      // Generate cryptographically secure token (256-bit)
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      const tokenRecord = {
        id: uuidv4(),
        token,
        caseId,
        createdById: agentUser.id,
        expiresAt,
      };

      await db.insert(screenShareTokensTable).values(tokenRecord);

      // Log activity
      await logCaseActivity({
        caseId,
        actorId: agentUser.id,
        action: "screen_share_requested",
        details: { tokenId: tokenRecord.id, expiresAt: expiresAt.toISOString() },
      });

      res.json({
        id: tokenRecord.id,
        token,
        url: `/screen-share/${token}`,
        expiresAt: expiresAt.toISOString(),
      });
    } catch (error) {
      console.error("[ScreenShare] Error creating token:", error);
      res.status(500).json({ error: "Failed to create screen share token" });
    }
  }
);

// GET /api/agent/cases/:caseId/screen-share-tokens — List tokens for a case
router.get(
  "/agent/cases/:caseId/screen-share-tokens",
  requireAgent,
  validateQuery(screenShareTokenListSchema),
  async (req, res) => {
    const { caseId } = req.params;
    const { page, limit } = (req as any).validatedQuery;

    try {
      const tokens = await db
        .select({
          id: screenShareTokensTable.id,
          usedAt: screenShareTokensTable.usedAt,
          expiresAt: screenShareTokensTable.expiresAt,
          revokedAt: screenShareTokensTable.revokedAt,
          createdAt: screenShareTokensTable.createdAt,
        })
        .from(screenShareTokensTable)
        .where(eq(screenShareTokensTable.caseId, caseId))
        .orderBy(desc(screenShareTokensTable.createdAt))
        .limit(limit)
        .offset((page - 1) * limit);

      // Add computed status to each token
      const now = new Date();
      const tokensWithStatus = tokens.map((t) => {
        let status: string;
        if (t.revokedAt) status = "revoked";
        else if (t.usedAt) status = "used";
        else if (now > t.expiresAt) status = "expired";
        else status = "active";
        return { ...t, status };
      });

      res.json({ tokens: tokensWithStatus });
    } catch (error) {
      console.error("[ScreenShare] Error listing tokens:", error);
      res.status(500).json({ error: "Failed to list screen share tokens" });
    }
  }
);

// DELETE /api/agent/cases/:caseId/screen-share-token/:tokenId — Revoke a token
router.delete(
  "/agent/cases/:caseId/screen-share-token/:tokenId",
  requireAgent,
  async (req, res) => {
    const { caseId, tokenId } = req.params;
    const agentUser = req.agentUser!;

    try {
      const [tokenRecord] = await db
        .select()
        .from(screenShareTokensTable)
        .where(
          and(
            eq(screenShareTokensTable.id, tokenId),
            eq(screenShareTokensTable.caseId, caseId)
          )
        )
        .limit(1);

      if (!tokenRecord) {
        return res.status(404).json({ error: "Token not found" });
      }

      if (tokenRecord.revokedAt) {
        return res.status(400).json({ error: "Token already revoked" });
      }

      if (tokenRecord.usedAt) {
        return res.status(400).json({ error: "Token already used" });
      }

      await db
        .update(screenShareTokensTable)
        .set({ revokedAt: new Date() })
        .where(eq(screenShareTokensTable.id, tokenId));

      await logCaseActivity({
        caseId,
        actorId: agentUser.id,
        action: "screen_share_token_revoked",
        details: { tokenId },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("[ScreenShare] Error revoking token:", error);
      res.status(500).json({ error: "Failed to revoke token" });
    }
  }
);

// ============================================
// Public endpoint (no auth — for link recipients)
// ============================================

// GET /api/screen-share/:token/validate — Validate a screen share token
router.get(
  "/screen-share/:token/validate",
  tokenValidateLimiter,
  async (req, res) => {
    const { token } = req.params;

    try {
      const [tokenRecord] = await db
        .select({
          id: screenShareTokensTable.id,
          caseId: screenShareTokensTable.caseId,
          usedAt: screenShareTokensTable.usedAt,
          expiresAt: screenShareTokensTable.expiresAt,
          revokedAt: screenShareTokensTable.revokedAt,
        })
        .from(screenShareTokensTable)
        .where(eq(screenShareTokensTable.token, token))
        .limit(1);

      if (!tokenRecord) {
        return res.status(404).json({ error: "Invalid screen share link" });
      }

      if (tokenRecord.revokedAt) {
        return res.status(410).json({ error: "This screen share link has been revoked" });
      }

      if (tokenRecord.usedAt) {
        return res.status(410).json({ error: "This screen share link has already been used" });
      }

      if (new Date() > tokenRecord.expiresAt) {
        return res.status(410).json({ error: "This screen share link has expired" });
      }

      // Fetch case title for display (no sensitive data)
      const [caseRecord] = await db
        .select({ title: casesTable.title })
        .from(casesTable)
        .where(eq(casesTable.id, tokenRecord.caseId))
        .limit(1);

      res.json({
        valid: true,
        caseTitle: caseRecord?.title || "Support Case",
      });
    } catch (error) {
      console.error("[ScreenShare] Error validating token:", error);
      res.status(500).json({ error: "Failed to validate screen share link" });
    }
  }
);

export default router;
