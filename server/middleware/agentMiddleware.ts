import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { usersTable } from "../../shared/schema/schema";
import { eq } from "drizzle-orm";

// Agent user info populated by middleware.
// IMPORTANT: req.user (session) is NEVER consulted for role authorization.
// Only req.agentUser (from this DB-backed middleware) is authoritative for role checks.
export interface AgentUser {
  id: string;
  email: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
}

declare global {
  namespace Express {
    interface Request {
      agentUser?: AgentUser;
    }
  }
}

// Role cache: userId -> { role, expires }
// 2-minute TTL, bounded to 500 entries
const roleCache = new Map<string, { role: string; firstName: string | null; lastName: string | null; email: string; expires: number }>();
const CACHE_TTL_MS = 2 * 60 * 1000;
const CACHE_MAX_SIZE = 500;

export async function getAgentUserFromDB(userId: string): Promise<AgentUser | null> {
  // Check cache
  const cached = roleCache.get(userId);
  if (cached && cached.expires > Date.now()) {
    return { id: userId, email: cached.email, role: cached.role, firstName: cached.firstName, lastName: cached.lastName };
  }

  try {
    const [user] = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        role: usersTable.role,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) return null;

    const role = user.role || "customer";

    // Evict oldest entries if cache is full
    if (roleCache.size >= CACHE_MAX_SIZE) {
      const firstKey = roleCache.keys().next().value;
      if (firstKey) roleCache.delete(firstKey);
    }

    roleCache.set(userId, {
      role,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      expires: Date.now() + CACHE_TTL_MS,
    });

    return { id: userId, email: user.email, role, firstName: user.firstName, lastName: user.lastName };
  } catch {
    return null;
  }
}

export function invalidateRoleCache(userId: string): void {
  roleCache.delete(userId);
}

/**
 * Middleware: requires authenticated user with role 'agent' or 'admin'.
 * Populates req.agentUser from DB (not session).
 */
export async function requireAgent(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
    console.log("[AGENT_AUTH] Rejected: not authenticated");
    return res.status(401).json({ error: "Authentication required" });
  }

  const sessionUser = req.user as any;
  const agentUser = await getAgentUserFromDB(sessionUser.id);

  if (!agentUser) {
    console.log("[AGENT_AUTH] Rejected: user not found in DB for id:", sessionUser.id, "email:", sessionUser.email);
    return res.status(401).json({ error: "Authentication required" });
  }

  if (agentUser.role !== "agent" && agentUser.role !== "admin") {
    console.log("[AGENT_AUTH] Rejected: role is", JSON.stringify(agentUser.role), "for", agentUser.email);
    return res.status(403).json({ error: "Agent access required" });
  }

  req.agentUser = agentUser;
  next();
}

/**
 * Middleware: requires authenticated user with role 'admin'.
 * Checks DB role column only — does NOT use ADMIN_EMAILS env var.
 * ADMIN_EMAILS is a bootstrap-only mechanism for initial admin setup via manual SQL.
 */
export async function requireAgentAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const sessionUser = req.user as any;
  const agentUser = await getAgentUserFromDB(sessionUser.id);

  if (!agentUser) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (agentUser.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  req.agentUser = agentUser;
  next();
}
