# TotalAssist - AI-Powered Home Tech Support

## Overview

TotalAssist is a consumer-first home and technology support service that helps everyday people solve problems using a tiered support workflow. The application combines Google Gemini's AI capabilities with human specialist escalation to provide instant access, less cost & stress, and safe remote troubleshooting. The target audience is everyday homeowners (including less technical Baby Boomers), which drives the accessible, trust-focused UI/UX design.

## Business Model

TotalAssist offers a tiered subscription system:
- **Text Support**: Text/chat support with AI triage + human escalation
- **AI Photo Triage**: Upload photos for AI diagnosis with guided troubleshooting
- **Live Video Support**: Real-time video help with AI + expert guidance, includes transcript/summary
- **Onsite Visit**: Quoted separately - When remote help can't fix the issue

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 19 with TypeScript, built using Vite as the bundler
- **Styling**: Tailwind CSS (compiled, not CDN) with custom configuration for brand colors and animations
- **Component Structure**: Functional components using React hooks (useState, useRef, useEffect, forwardRef)
- **State Management**: Local component state with React hooks - no external state management library
- **Icons**: Lucide React for consistent iconography

### Design System
- **Color Palette**: Deep Navy (#1F2937) for primary text, Safety Orange (#F97316) for CTAs, standard grays for backgrounds
- **Typography**: Inter font family - clean, neutral, modern SaaS style
- **Logo**: Abstract triage node symbol representing diagnosis, connection, and resolution - flat design with central orange node connected to 4 navy outer nodes
- **UI Pattern**: Follows a "Jobber-style" professional aesthetic with pill-shaped buttons, soft shadows, and clear visual hierarchy

### AI Integration
- **Primary AI**: Google Gemini 2.0 Flash via `@google/genai` SDK for both text chat and computer vision
- **Chat Service**: `geminiService.ts` handles all Gemini API communication with:
  - System instruction defining the AI as "Scout AI"
  - Function calling support (endSession, presentChoices, showStep, confirmResult) for structured interactions
  - Image analysis capabilities for diagnosing issues from photos

### Key Components
- **ScoutChatScreen**: Main chat interface with guided fix engine, photo upload, voice/video modes
- **LiveSupport**: Real-time video support component using Gemini's live API with audio modality
- **Dashboard**: Central hub with triage tiles, case history, and quick actions
- **Logo**: Reusable logo component with fallback handling

### Homepage Sections (Consumer-Focused)
- **Hero**: Centered headline with typewriter animation and image carousel
- **HowItWorksSimple**: 3 steps - Tell us, Show us, Get it fixed
- **FeatureShowcases**: Side-by-side feature highlights
- **WhatWeHelpWith**: Grid of everyday problems (Wi-Fi, TV, computers, smart home, etc.)
- **TrustSection**: Privacy and safety messaging
- **PricingTeaser**: Quick pricing preview for all tiers
- **FAQSection**: Collapsible FAQ with consumer-focused questions
- **TestimonialSection**: Customer testimonials

### Authentication System
- **Provider**: Replit Auth (supports Google, GitHub, Apple, email/password via OpenID Connect)
- **Backend**: Express 5 server on port 3001 with session management
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Database Schema**: Drizzle ORM with users and sessions tables
- **Auth Flow**:
  - `/api/login` initiates OAuth flow
  - `/api/callback` handles OAuth callback and creates/updates user
  - `/api/auth/user` returns current authenticated user
  - `/api/logout` destroys session
- **Frontend Integration**: useAuth hook manages auth state, Header shows user profile when logged in

### Build Configuration
- **Development Server**: Runs on port 5000 with host binding for external access
- **Backend Server**: Runs on port 3001 for API and authentication
- **Start Command**: `npm start` uses concurrently to run both servers
- **TypeScript**: Strict mode enabled with ES2020 target and bundler module resolution

## External Dependencies

### AI/ML Services
- **Google Gemini API**: Core AI functionality for chat, vision analysis, and live audio support
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
- Google Fonts (Inter) loaded via CDN
- Tailwind CSS v3 (compiled)
