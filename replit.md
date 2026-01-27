# TechTriage - Consumer-First Home & Tech Support

## Overview

TechTriage is a consumer-first home and technology support service that helps everyday people solve problems using a tiered support workflow. The application combines Google Gemini's AI capabilities with human specialist escalation to provide instant access, less cost & stress, and safe remote troubleshooting. The target audience is everyday homeowners (including less technical Baby Boomers), which drives the accessible, trust-focused UI/UX design.

## Business Model

TechTriage offers a tiered support system:
- **TechTriage (Text)**: $9/session - Text/chat support with AI triage + human escalation
- **TechTriage AI (Photo)**: $19/session - Upload photos for AI diagnosis with guided troubleshooting
- **TechTriage Live (Video)**: $49/session - Real-time video help with AI + expert guidance, includes transcript/summary
- **Onsite Visit**: Quoted separately - When remote help can't fix the issue

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 19 with TypeScript, built using Vite as the bundler
- **Styling**: Tailwind CSS loaded via CDN in index.html with custom configuration for brand colors and animations
- **Component Structure**: Functional components using React hooks (useState, useRef, useEffect, forwardRef)
- **State Management**: Local component state with React hooks - no external state management library
- **Icons**: Lucide React for consistent iconography

### Design System
- **Color Palette**: Deep Navy (#1F2937) for primary text, Safety Orange (#F97316) for CTAs, standard grays for backgrounds
- **Typography**: Inter font family - clean, neutral, modern SaaS style
- **Logo**: Abstract triage node symbol representing diagnosis, connection, and resolution - flat design with central orange node connected to 4 navy outer nodes
- **UI Pattern**: Follows a "Jobber-style" professional aesthetic with pill-shaped buttons, soft shadows, and clear visual hierarchy

### AI Integration
- **Primary AI**: Google Gemini via `@google/genai` SDK for both text chat and computer vision
- **API Configuration**: API key injected via Vite's `define` configuration from environment variable `GEMINI_API_KEY__TECHTRIAGE`
- **Chat Service**: `geminiService.ts` handles all Gemini API communication with:
  - System instruction defining the AI as a "TechTriage Agent"
  - Function calling support (endSession tool) for structured interactions
  - Image analysis capabilities for diagnosing issues from photos

### Key Components
- **ChatWidget**: Floating chat interface with image upload, camera capture, and full-screen mode support
- **LiveSupport**: Real-time video support component using Gemini's live API with audio modality
- **HowItWorks**: Marketing/onboarding page explaining the service workflow
- **Logo**: Reusable logo component with fallback handling

### Homepage Sections (Consumer-Focused)
- **Hero**: "Show us the problem. We'll handle the rest." with CTAs for chat and how-it-works
- **SupportTiers**: 3-tier support cards (Text, AI Photo, Live Video)
- **HowItWorksSimple**: 3 steps - Tell us, Show us, Get it fixed
- **WhatWeHelpWith**: Grid of everyday problems (Wi-Fi, TV, computers, smart home, etc.)
- **TrustSection**: Privacy and safety messaging - "Real specialists. Real answers."
- **PricingTeaser**: Quick pricing preview for all tiers
- **FAQSection**: Collapsible FAQ with consumer-focused questions
- **TestimonialSection**: Customer testimonials
- **CTASection**: "Stop stressing. Start fixing."

### Build Configuration
- **Development Server**: Runs on port 5000 with host binding for external access
- **TypeScript**: Strict mode enabled with ES2020 target and bundler module resolution
- **Environment Variables**: Mapped from `GEMINI_API_KEY__TECHTRIAGE` to `VITE_GEMINI_API_KEY` at build time

## External Dependencies

### AI/ML Services
- **Google Gemini API**: Core AI functionality for chat, vision analysis, and live audio support
  - Requires API key stored in environment variable `GEMINI_API_KEY__TECHTRIAGE`
  - Uses models for content generation, function calling, and multimodal input

### Runtime Dependencies
- `@google/genai`: Official Google Generative AI SDK
- `react` / `react-dom`: UI framework (v19)
- `lucide-react`: Icon library

### Development Dependencies
- `vite`: Build tool and dev server
- `@vitejs/plugin-react`: React plugin for Vite
- `typescript`: Type checking
- Type definitions for React

### External Assets
- Google Fonts (Poppins) loaded via CDN
- Tailwind CSS loaded via CDN
- Transparent textures for background patterns