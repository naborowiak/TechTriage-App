
export enum UserRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface ChatMessage {
  id: string;
  role: UserRole;
  text: string;
  image?: string; // base64
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
