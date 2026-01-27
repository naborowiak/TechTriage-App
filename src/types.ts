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
  SIGNUP = 'signup',
  HISTORY = 'history',
  SAFETY = 'safety'
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
