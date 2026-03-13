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
  guidedAction?: GuidedAction; // Phase 4: Guided Fix Engine
}

// Guided Fix Engine types
export interface PresentChoicesAction {
  type: 'presentChoices';
  prompt: string;
  choices: string[];
  selectedChoice?: string;
}

export interface ShowStepAction {
  type: 'showStep';
  stepNumber: number;
  title: string;
  instruction: string;
  tip?: string;
}

export interface ConfirmResultAction {
  type: 'confirmResult';
  question: string;
  yesLabel?: string;
  noLabel?: string;
  selectedAnswer?: 'yes' | 'no';
}

export type GuidedAction = PresentChoicesAction | ShowStepAction | ConfirmResultAction;

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
  DASHBOARD = "dashboard",
  PRIVACY = "privacy",
  TERMS = "terms",
  VERIFY_EMAIL = "verify-email",
  CANCELLATION = "cancellation",
  FORGOT_PASSWORD = "forgot-password",
  RESET_PASSWORD = "reset-password",
  SCOUT = "scout",
  SPECIALIST = "specialist",
  NOT_FOUND = "not_found",
  SERVICE_CHAT = "service_chat",
  SERVICE_PHOTO = "service_photo",
  SERVICE_VOICE = "service_voice",
  SERVICE_VIDEO = "service_video",
  AGENT_PORTAL = "agent_portal",
  SCREEN_SHARE = "screen_share",
}

// ============================================
// Agent Portal types
// ============================================

export interface AgentCaseListItem {
  id: string;
  caseNumber: number | null;
  title: string;
  status: string;
  priority: string | null;
  sessionMode: string | null;
  aiSummary: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  assignedAgent: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

export interface AgentCaseListResponse {
  cases: AgentCaseListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface AgentNote {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: { id: string; firstName: string | null; lastName: string | null };
}

export interface AgentActivityEntry {
  id: string;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
  actor: { id: string; firstName: string | null; lastName: string | null };
}

export interface AgentRosterItem {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
}

export interface AgentCustomerProfile {
  customer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    profileImageUrl: string | null;
    homeType: string | null;
    techComfort: string | null;
    householdSize: string | null;
    primaryIssues: string[] | null;
    howHeard: string | null;
    createdAt: string;
    updatedAt: string;
  };
  subscription: {
    tier: string;
    status: string;
    billingInterval: string | null;
    currentPeriodEnd: string | null;
    videoCredits: number;
  } | null;
  devices: Array<{
    id: string;
    name: string;
    type: string;
    brand: string | null;
    model: string | null;
    location: string | null;
  }>;
  caseStats: { total: number; open: number; resolved: number; escalated: number; pending: number };
  recentCases: Array<{
    id: string;
    caseNumber: number | null;
    title: string;
    status: string;
    sessionMode: string | null;
    createdAt: string;
  }>;
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
  caseNumber?: number | null;
  modeSequence?: number | null;
  title: string;
  status: string; // "open" | "resolved" | "escalated" | "pending"
  aiSummary?: string | null;
  deviceId?: string | null;
  diagnosticSteps?: Array<{ step: string; result: string; timestamp: number }> | null;
  photosCount?: number | null;
  sessionMode?: string | null; // "chat" | "voice" | "photo" | "video"
  escalatedAt?: string | null;
  escalationReport?: EscalationReportData | null;
  specialistNotes?: string | null;
  specialistRespondedAt?: string | null;
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
  caseCount?: number;
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

// Dashboard overhaul types
export interface CaseProgressStep {
  label: string;
  status: 'completed' | 'suggested' | 'in-progress';
  stepNumber?: number;
}

export type DashboardTab = 'chat' | 'history' | 'devices' | 'settings';

// Case archive types (admin case deletion with recovery)
export interface CaseArchiveListItem {
  id: string;
  caseId: string;
  userId: string;
  caseNumber: number | null;
  title: string;
  deletedAt: string;
  purgeAfter: string;
  deletedBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export interface CaseArchiveListResponse {
  archives: CaseArchiveListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface BulkDeleteResult {
  results: Array<{ caseId: string; success: boolean; error?: string }>;
  deleted: number;
  failed: number;
}

// Format case display ID from sessionMode + modeSequence
export function formatCaseDisplayId(sessionMode: string | null | undefined, modeSequence: number | null | undefined): string {
  const prefixMap: Record<string, string> = {
    chat: 'ME',          // Message
    video: 'VI',         // Video
    voice: 'TA',         // Talk
    photo: 'PH',         // Photo
    screenshare: 'SS',   // Screen Share
  };
  const prefix = prefixMap[sessionMode || 'chat'] || 'ME';
  const seq = modeSequence || 0;
  return `${prefix}${String(seq).padStart(7, '0')}`;
}
