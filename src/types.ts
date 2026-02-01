export enum UserRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
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
  HOME = 'home',
  HOW_IT_WORKS = 'how_it_works',
  PRICING = 'pricing',
  FAQ = 'faq',
  SIGNUP = 'signup',
  LOGIN = 'login',
  HISTORY = 'history',
  SAFETY = 'safety',
  DASHBOARD = 'dashboard',
  PRIVACY = 'privacy',
  TERMS = 'terms',
  CANCELLATION = 'cancellation'
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
