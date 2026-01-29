import express from "express";
import cors from "cors";
import path from "path";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, Modality, Type } from "@google/genai";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const app = express();
const isProduction = process.env.NODE_ENV === "production";

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Available voices with their characteristics for variety
const VOICES = [
  { name: "Kore", style: "firm and professional" },
  { name: "Puck", style: "upbeat and energetic" },
  { name: "Charon", style: "informative and clear" },
  { name: "Aoede", style: "breezy and approachable" },
  { name: "Fenrir", style: "excitable and enthusiastic" },
  { name: "Achird", style: "friendly and warm" },
  { name: "Sulafat", style: "warm and reassuring" },
  { name: "Sadachbia", style: "lively and engaging" },
  { name: "Zubenelgenubi", style: "casual and relaxed" },
  { name: "Vindemiatrix", style: "gentle and patient" },
];

// Greeting variations to keep things fresh
const GREETINGS = [
  "Hi there! I'm your TechTriage specialist. I can see your camera feed - go ahead and show me what's giving you trouble, and I'll help you figure it out.",
  "Hey! Welcome to TechTriage. I'm here and ready to help. Point your camera at whatever's giving you grief and let's solve this together.",
  "Hello! TechTriage support here. I've got your video feed - show me the problem and we'll get it sorted out.",
  "Hi! I'm your tech support buddy today. Camera's looking good - what are we troubleshooting?",
  "Welcome! I'm ready to help with your tech issue. Just show me what you're dealing with and we'll tackle it step by step.",
];

function getRandomVoice() {
  return VOICES[Math.floor(Math.random() * VOICES.length)];
}

function getRandomGreeting() {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}

function buildSystemInstruction(voiceStyle: string) {
  return `You are a TechTriage Agent - a friendly, professional technical support specialist.

YOUR PERSONALITY: You have a ${voiceStyle} communication style. Let this come through naturally in how you speak.

BEHAVIOR:
- Be conversational and helpful, like a knowledgeable friend
- When you see an image, describe what you're seeing and provide guidance
- Ask clarifying questions if needed
- Provide step-by-step troubleshooting when appropriate
- If you see error messages or model numbers, acknowledge them specifically

SAFETY:
- Never assist with gas leaks, electrical panels, bare wires, or structural changes
- For dangerous situations, advise calling a professional immediately

TONE: ${voiceStyle.charAt(0).toUpperCase() + voiceStyle.slice(1)}. You're a real person helping a friend with tech issues.`;
}

async function setupGeminiLive(ws: WebSocket) {
  const apiKey = process.env.GEMINI_API_KEY__TECHTRIAGE;
  if (!apiKey) {
    ws.send(
      JSON.stringify({ type: "error", message: "API key not configured" }),
    );
    ws.close();
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Select random voice and greeting for this session
    const selectedVoice = getRandomVoice();
    const selectedGreeting = getRandomGreeting();
    console.log(
      `Session voice: ${selectedVoice.name} (${selectedVoice.style})`,
    );

    // Flag to track when session is ready for greeting
    let sessionReady = false;
    let sessionInstance: any = null;

    const session = await ai.live.connect({
      model: "gemini-2.5-flash-native-audio-preview-12-2025",
      callbacks: {
        onopen: () => {
          console.log(
            "Gemini Live session opened at",
            new Date().toISOString(),
          );
          ws.send(JSON.stringify({ type: "ready", voice: selectedVoice.name }));
          sessionReady = true;
          console.log(
            "Session ready flag set, sessionInstance:",
            !!sessionInstance,
          );

          // Send greeting after a short delay to ensure session is fully assigned
          setTimeout(() => {
            if (sessionInstance) {
              console.log("Sending initial greeting prompt...");
              sessionInstance.sendClientContent({
                turns: [
                  {
                    role: "user",
                    parts: [
                      {
                        text: `Hello! I just connected. Please greet me with something like: "${selectedGreeting}"`,
                      },
                    ],
                  },
                ],
                turnComplete: true,
              });
            }
          }, 100);
        },
        onmessage: (message: any) => {
          try {
            console.log(
              "Received Gemini message:",
              JSON.stringify(message).substring(0, 500),
            );

            if (message.serverContent?.modelTurn?.parts) {
              console.log(
                "Processing modelTurn parts:",
                message.serverContent.modelTurn.parts.length,
              );
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData?.mimeType?.startsWith("audio/")) {
                  console.log("Sending audio data to client");
                  ws.send(
                    JSON.stringify({
                      type: "audio",
                      data: part.inlineData.data,
                    }),
                  );
                }
                if (part.text) {
                  console.log(
                    "Sending text to client:",
                    part.text.substring(0, 100),
                  );
                  ws.send(
                    JSON.stringify({
                      type: "text",
                      data: part.text,
                    }),
                  );
                }
              }
            }

            if (message.serverContent?.turnComplete) {
              ws.send(JSON.stringify({ type: "turnComplete" }));
            }

            if (message.serverContent?.interrupted) {
              ws.send(JSON.stringify({ type: "interrupted" }));
            }

            if (message.toolCall) {
              const functionCall = message.toolCall.functionCalls?.[0];
              if (functionCall?.name === "endSession") {
                ws.send(
                  JSON.stringify({
                    type: "endSession",
                    summary: functionCall.args?.summary || "Session completed",
                  }),
                );
              }
            }
          } catch (err) {
            console.error("Error processing Gemini message:", err);
          }
        },
        onerror: (error: any) => {
          console.error("Gemini Live error:", error);
          console.error(
            "Gemini error details:",
            JSON.stringify(error, Object.getOwnPropertyNames(error)),
          );
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Gemini connection error",
            }),
          );
        },
        onclose: (event: any) => {
          console.log(
            "Gemini Live session closed at",
            new Date().toISOString(),
          );
          console.log("Close event:", event);
          console.log("Close event code:", event?.code);
          console.log("Close event reason:", event?.reason);
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        },
      },
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: {
          parts: [{ text: buildSystemInstruction(selectedVoice.style) }],
        },
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: selectedVoice.name,
            },
          },
        },
        tools: [
          {
            functionDeclarations: [
              {
                name: "endSession",
                description:
                  "Call this when the user wants to end the support session or when the issue is resolved.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    summary: {
                      type: Type.STRING,
                      description:
                        "A brief summary of what was diagnosed or fixed.",
                    },
                  },
                  required: ["summary"],
                },
              },
            ],
          },
        ],
      },
    });

    // Assign session instance for use in onopen callback
    sessionInstance = session;

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === "audio") {
          session.sendRealtimeInput({
            audio: {
              data: message.data,
              mimeType: "audio/pcm;rate=16000",
            },
          });
        } else if (message.type === "image") {
          session.sendRealtimeInput({
            media: {
              data: message.data,
              mimeType: "image/jpeg",
            },
          });
        }
      } catch (err) {
        console.error("Error handling client message:", err);
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected, closing Gemini session");
      session.close();
    });
  } catch (error) {
    console.error("Failed to connect to Gemini Live:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Failed to connect to AI service",
      }),
    );
    ws.close();
  }
}

async function main() {
  try {
    // Trust proxy for secure cookies behind reverse proxy
    app.set("trust proxy", 1);

    // --- GOOGLE AUTH SETUP START ---
    app.use(
      session({
        secret: process.env.SESSION_SECRET || "techtriage_dev_secret_change_in_prod",
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: isProduction,
          httpOnly: true,
          sameSite: isProduction ? "none" : "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        },
      }),
    );

    app.use(passport.initialize());
    app.use(passport.session());

    // Build callback URL dynamically based on environment
    const getCallbackURL = () => {
      if (process.env.REPLIT_DOMAINS) {
        const domain = process.env.REPLIT_DOMAINS.split(",")[0];
        return `https://${domain}/api/auth/callback/google`;
      }
      if (process.env.CALLBACK_URL) {
        return process.env.CALLBACK_URL;
      }
      return "/api/auth/callback/google";
    };

    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID || "",
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
          callbackURL: getCallbackURL(),
          proxy: true,
        },
        (accessToken, refreshToken, profile, done) => {
          // Transform Google profile to match expected User format
          const user = {
            id: profile.id,
            username: profile.displayName || profile.emails?.[0]?.value || "",
            email: profile.emails?.[0]?.value || null,
            firstName: profile.name?.givenName || null,
            lastName: profile.name?.familyName || null,
            profileImageUrl: profile.photos?.[0]?.value || null,
          };
          return done(null, user);
        },
      ),
    );

    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((obj: any, done) => done(null, obj));

    // 1. Start Login
    app.get(
      "/auth/google",
      passport.authenticate("google", { scope: ["profile", "email"] }),
    );

    // 2. Handle Callback
    app.get(
      "/api/auth/callback/google",
      passport.authenticate("google", { failureRedirect: "/?error=auth_failed" }),
      (req, res) => {
        res.redirect("/");
      },
    );

    // 3. Get User Info
    app.get("/api/auth/user", (req, res) => {
      if (req.isAuthenticated() && req.user) {
        res.json({ user: req.user });
      } else {
        res.status(401).json({ user: null });
      }
    });

    // 4. Logout
    app.get("/api/auth/logout", (req, res) => {
      req.logout((err) => {
        if (err) {
          console.error("Logout error:", err);
        }
        req.session.destroy((err) => {
          if (err) {
            console.error("Session destroy error:", err);
          }
          res.clearCookie("connect.sid");
          res.redirect("/");
        });
      });
    });
    // --- GOOGLE AUTH SETUP END ---
    console.log("Auth setup complete");
  } catch (error) {
    console.error("Auth setup failed:", error);
  }

  // In production, serve the built frontend files
  if (isProduction) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));

    // SPA catch-all: serve index.html for any non-API routes
    app.get("/{*splat}", (req, res, next) => {
      if (req.path.startsWith("/api") || req.path.startsWith("/live")) {
        return next();
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static files from dist/");
  }

  // Use port 5000 in production (Replit), 3001 in development
  const PORT = isProduction ? 5000 : 3001;
  const server = createServer(app);

  const wss = new WebSocketServer({ server, path: "/live" });

  wss.on("connection", (ws) => {
    console.log("New WebSocket connection for live session");
    setupGeminiLive(ws);
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(
      `Server running on port ${PORT} (${isProduction ? "production" : "development"})`,
    );
    console.log(`WebSocket server ready at /live`);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
