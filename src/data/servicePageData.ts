import { MessageSquare, Camera, Mic, Video, Zap, Clock, Shield, Sparkles, FileText, Headphones, Eye } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageView } from '../types';

export interface ServiceFAQ {
  question: string;
  answer: string;
}

export interface ServiceFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface ServiceStep {
  title: string;
  description: string;
}

export interface ServiceData {
  id: string;
  slug: string;
  pageView: PageView;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  color: string; // hex for glow/accent
  colorClass: string; // tailwind class prefix (e.g., "cyan", "indigo")
  heroDescription: string;
  availability: string;
  howItWorks: ServiceStep[];
  features: ServiceFeature[];
  faqs: ServiceFAQ[];
  ctaText: string;
}

export const services: ServiceData[] = [
  {
    id: 'chat',
    slug: 'chat',
    pageView: PageView.SERVICE_CHAT,
    name: 'Chat Support',
    tagline: 'Ask Anything',
    description: 'Describe your problem in plain English and get step-by-step solutions instantly.',
    icon: MessageSquare,
    color: '#06B6D4',
    colorClass: 'cyan',
    heroDescription: 'Just tell us what\'s going on — in your own words. TotalAssist understands your problem, asks smart follow-up questions, and walks you through the fix step by step. No tech jargon, no hold music, no appointments. Available 24/7 on every plan.',
    availability: 'Available on All Plans',
    howItWorks: [
      {
        title: 'Describe your issue',
        description: 'Type what\'s happening in plain English — "My Wi-Fi keeps dropping" or "There\'s a weird error on my TV." No need for model numbers or technical terms.',
      },
      {
        title: 'Get a diagnosis',
        description: 'TotalAssist analyzes your description, asks clarifying questions if needed, and identifies the most likely cause of your issue.',
      },
      {
        title: 'Follow guided steps',
        description: 'Tap through interactive step-by-step instructions to fix the problem. Confirm each step as you go — most issues resolved in minutes.',
      },
    ],
    features: [
      { icon: Zap, title: 'Instant Responses', description: 'No waiting on hold. Get answers in seconds, 24 hours a day, 7 days a week.' },
      { icon: Sparkles, title: 'Interactive Assist Pills', description: 'Tap choices instead of typing. TotalAssist guides you with interactive buttons for faster troubleshooting.' },
      { icon: Shield, title: 'Remembers Your Devices', description: 'Your setup is saved across sessions. Never explain your router model or TV brand twice.' },
      { icon: FileText, title: 'Case Reports', description: 'Every session produces a professional PDF diagnostic report you can reference later or share with a technician.' },
    ],
    faqs: [
      { question: 'How many chat sessions can I have?', answer: 'Free plan includes 5 chat sessions per month. Home and Pro plans include unlimited chat sessions.' },
      { question: 'Can I send photos during a chat?', answer: 'Yes! You can upload photos at any point during a chat session. TotalAssist will analyze the image and incorporate what it sees into the troubleshooting.' },
      { question: 'What kinds of problems can chat solve?', answer: 'Chat works great for Wi-Fi issues, smart device setup, error codes, software problems, printer connectivity, and most home tech questions. If a visual diagnosis would help, you can always switch to Photo or Video mode.' },
    ],
    ctaText: 'Start Chatting Free',
  },
  {
    id: 'photo',
    slug: 'photo',
    pageView: PageView.SERVICE_PHOTO,
    name: 'Photo Analysis',
    tagline: 'Show, Don\'t Tell',
    description: 'Snap a photo of the problem and get an instant AI-powered diagnosis.',
    icon: Camera,
    color: '#6366F1',
    colorClass: 'indigo',
    heroDescription: 'Stop trying to describe blinking lights and error codes in words. Just snap a photo of what you see — an error screen, a device panel, a tangled cable setup — and TotalAssist reads it instantly. You get a clear explanation of what\'s wrong and exactly how to fix it.',
    availability: 'Available on All Plans',
    howItWorks: [
      {
        title: 'Snap a photo',
        description: 'Take a picture of the error message, blinking light, or device screen that\'s giving you trouble. Use your phone camera or upload an existing screenshot.',
      },
      {
        title: 'AI reads the image',
        description: 'TotalAssist analyzes what\'s in the photo — error codes, indicator lights, screen messages, cable connections — and identifies the problem.',
      },
      {
        title: 'Get your fix',
        description: 'Receive a clear diagnosis with step-by-step instructions tailored to exactly what TotalAssist sees in your photo.',
      },
    ],
    features: [
      { icon: Eye, title: 'Reads Error Screens', description: 'Upload a photo of any error message or code. TotalAssist decodes it and tells you what it means in plain language.' },
      { icon: Zap, title: 'Light Pattern Recognition', description: 'Blinking router lights? Flashing device LEDs? TotalAssist identifies patterns and tells you what each one means.' },
      { icon: Clock, title: 'Instant Analysis', description: 'Photo analysis takes seconds, not minutes. Get your diagnosis before you even finish your coffee.' },
      { icon: FileText, title: 'Visual Evidence in Reports', description: 'Photos are attached to your case report, creating a visual record of the issue and resolution.' },
    ],
    faqs: [
      { question: 'What types of photos work best?', answer: 'Clear, well-lit photos of error messages, device screens, indicator lights, or cable setups work best. Try to capture the full screen or panel so TotalAssist can read all relevant information.' },
      { question: 'Can I upload multiple photos?', answer: 'Yes! You can upload several photos during a session. This is helpful when showing different angles of a device or capturing multiple error screens.' },
      { question: 'Is photo analysis available on the free plan?', answer: 'Yes — the free plan includes 1 photo analysis per month. Home and Pro plans include unlimited photo analysis.' },
    ],
    ctaText: 'Try Photo Analysis',
  },
  {
    id: 'voice',
    slug: 'voice',
    pageView: PageView.SERVICE_VOICE,
    name: 'Voice Support',
    tagline: 'Talk It Through',
    description: 'Talk hands-free while TotalAssist guides you through the fix in real time.',
    icon: Mic,
    color: '#8B5CF6',
    colorClass: 'purple',
    heroDescription: 'Sometimes you need both hands free — to hold a flashlight, press a reset button, or reach behind a TV. Voice Support lets you talk through your issue naturally while TotalAssist listens, asks follow-ups, and guides you step by step. It\'s like having a tech-savvy friend on speakerphone.',
    availability: 'Home & Pro Plans',
    howItWorks: [
      {
        title: 'Tap the mic',
        description: 'Start a voice session from any chat. Your browser\'s microphone activates and you can begin speaking naturally.',
      },
      {
        title: 'Talk through the issue',
        description: 'Describe what\'s happening in your own words. TotalAssist listens, understands context, and asks smart follow-up questions.',
      },
      {
        title: 'Get guided hands-free',
        description: 'Follow spoken instructions while keeping your hands free. You can also send photos mid-call if a visual would help.',
      },
    ],
    features: [
      { icon: Headphones, title: 'Natural Conversation', description: 'Talk like you would to a friend. No menus, no "press 1 for..." — just a natural back-and-forth troubleshooting conversation.' },
      { icon: Zap, title: 'Hands-Free Fixes', description: 'Keep your hands on the device while TotalAssist talks you through the solution. Perfect for behind-the-TV or under-the-desk fixes.' },
      { icon: Camera, title: 'Photos Mid-Call', description: 'Need to show something? Send a photo during the voice session without interrupting the conversation.' },
      { icon: Clock, title: 'Real-Time Guidance', description: 'No waiting for responses. TotalAssist listens and responds in real time, adjusting guidance based on what you report.' },
    ],
    faqs: [
      { question: 'Do I need a special microphone?', answer: 'No — any device with a built-in microphone works. Your phone, laptop, or tablet mic is fine. Just make sure to allow microphone access when prompted by your browser.' },
      { question: 'Is my voice conversation recorded?', answer: 'Voice sessions are processed in real time for troubleshooting but are not stored as audio recordings. A text transcript is saved to your case report for reference.' },
      { question: 'Can I switch between voice and text?', answer: 'Yes! You can seamlessly switch between voice and text during any session. Start with voice, then switch to typing if you prefer — or vice versa.' },
    ],
    ctaText: 'Try Voice Support',
  },
  {
    id: 'video',
    slug: 'video',
    pageView: PageView.SERVICE_VIDEO,
    name: 'Video Diagnostic',
    tagline: 'Show Us Live',
    description: 'Point your camera at the problem for real-time visual diagnosis and guidance.',
    icon: Video,
    color: '#A855F7',
    colorClass: 'purple',
    heroDescription: 'For the trickiest problems, show us exactly what you see. Point your phone or laptop camera at the device, and TotalAssist watches in real time — identifying error indicators, reading screens, and guiding you through the fix as you go. It\'s the closest thing to having a technician in your home.',
    availability: 'Home & Pro Plans (Credits)',
    howItWorks: [
      {
        title: 'Open your camera',
        description: 'Start a video session and grant camera access. Your device\'s camera feed is shared live with TotalAssist.',
      },
      {
        title: 'Point at the problem',
        description: 'Aim your camera at the device, error screen, or setup that needs help. TotalAssist sees what you see in real time.',
      },
      {
        title: 'Follow live guidance',
        description: 'Get real-time spoken and on-screen instructions as TotalAssist diagnoses the issue from the live video feed.',
      },
    ],
    features: [
      { icon: Eye, title: 'Real-Time Visual Diagnosis', description: 'TotalAssist watches your camera feed live, spotting issues you might miss — wrong cable ports, incorrect settings, or hidden error indicators.' },
      { icon: Sparkles, title: 'AI-Powered Recognition', description: 'Advanced image analysis identifies device models, reads screens, and decodes indicator light patterns from your live video.' },
      { icon: FileText, title: 'Session Recording', description: 'Key moments from your video session are captured and included in your case report for future reference.' },
      { icon: Shield, title: 'Privacy-First', description: 'Video is processed in real time and never permanently stored. Only diagnostic snapshots are saved to your case with your permission.' },
    ],
    faqs: [
      { question: 'How do video credits work?', answer: 'Each video session uses one credit. Home plan includes 3 credits per month, Pro includes 15 per month. Additional credits can be purchased individually.' },
      { question: 'What camera quality do I need?', answer: 'Any modern phone or laptop camera works well. For best results, ensure good lighting on the device you\'re showing. TotalAssist adjusts to different camera qualities automatically.' },
      { question: 'How long can a video session last?', answer: 'Video sessions can last up to 15 minutes per credit. Most issues are diagnosed and resolved within the first 5-10 minutes.' },
    ],
    ctaText: 'Try Video Diagnostic',
  },
];

export const getServiceBySlug = (slug: string): ServiceData | undefined =>
  services.find(s => s.slug === slug);

export const getServiceById = (id: string): ServiceData | undefined =>
  services.find(s => s.id === id);
