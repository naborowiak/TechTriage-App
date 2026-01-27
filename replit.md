# TechTriage - AI-Powered Home Support

## Overview

TechTriage is an AI-powered home maintenance and tech support application that combines Google Gemini's computer vision capabilities with real-time video support concepts. The application allows homeowners to diagnose and fix household issues by uploading photos, chatting with an AI assistant, or connecting to live video support. The target audience includes both tech-savvy users and less technical homeowners (particularly Baby Boomers), which influences the UI/UX design choices emphasizing accessibility and trust.

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
- **Typography**: Poppins font family with emphasis on larger font sizes for accessibility
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