# CLAUDE.md

- **TechTriage** is a full-stack React/Node.js web application that provides AI-powered technical support for homeowners, helping them diagnose and fix issues with Wi-Fi, smart devices, appliances, HVAC, and more through text chat, photo analysis, or live video support.

- The app integrates **Google Gemini 2.0 Flash** for AI-driven troubleshooting, including image/screenshot analysis via the chat widget and real-time video assistance through WebSocket-based live support sessions.

- Users authenticate via **OpenID Connect (Replit OAuth)**, with session data stored in PostgreSQL using Drizzle ORM, and can choose from tiered support options: text support ($9), AI photo triage ($19), live video support ($49), or scheduled onsite visits.
