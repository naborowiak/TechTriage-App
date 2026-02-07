export enum UserRole {
  USER = "user",
  MODEL = "model",
  SYSTEM = "system",
}

export interface ChatMessage {
  id: string;
  role: UserRole;
  text: string;
  image?: string;
  isError?: boolean;
  timestamp: number;
  agentName?: string;
  cannedFollowUp?: string[]; // For non-authenticated user canned responses
}

export interface SavedSession {
  id: string;
  title: string;
  date: number;
  messages: ChatMessage[];
  summary?: string;
}

export enum PageView {
  HOME = "home",
  HOW_IT_WORKS = "how_it_works",
  PRICING = "pricing",
  FAQ = "faq",
  SIGNUP = "signup",
  LOGIN = "login",
  HISTORY = "history",
  SAFETY = "safety",
  DASHBOARD = "dashboard",
  PRIVACY = "privacy",
  TERMS = "terms",
  VERIFY_EMAIL = "verify-email",
  CANCELLATION = "cancellation",
  FORGOT_PASSWORD = "forgot-password",
  RESET_PASSWORD = "reset-password",
  SCOUT = "scout",
}

export interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}

// Case types for diagnostic workflow
export interface CaseRecord {
  id: string;
  userId: string;
  title: string;
  status: string; // "open" | "resolved" | "escalated" | "pending"
  aiSummary?: string | null;
  deviceId?: string | null;
  diagnosticSteps?: Array<{ step: string; result: string; timestamp: number }> | null;
  photosCount?: number | null;
  sessionMode?: string | null; // "chat" | "voice" | "photo" | "video"
  escalatedAt?: string | null;
  escalationReport?: EscalationReportData | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceRecord {
  id: string;
  userId: string;
  name: string;
  type: string;
  brand?: string | null;
  model?: string | null;
  location?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EscalationReportData {
  problemDescription: string;
  stepsTried: string[];
  scoutAnalysis: string;
  recommendedSpecialist: string;
  urgencyLevel: string;
  photosIncluded: number;
  estimatedCostRange: string;
}

export interface CaseSummary {
  problem: string;
  analysis: string;
  recommendedFix: string;
  nextSteps: string[];
}
