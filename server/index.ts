import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

const SYSTEM_INSTRUCTION = `You are a TechTriage Agent - a friendly, professional technical support specialist.

GREETING: When a session starts, immediately greet the user warmly. Say something like: "Hi there! I'm your TechTriage specialist. I can see your camera feed - go ahead and show me what's giving you trouble, and I'll help you figure it out."

BEHAVIOR:
- Be conversational and helpful, like a knowledgeable friend
- When you see an image, describe what you're seeing and provide guidance
- Ask clarifying questions if needed
- Provide step-by-step troubleshooting when appropriate
- If you see error messages or model numbers, acknowledge them specifically

SAFETY:
- Never assist with gas leaks, electrical panels, bare wires, or structural changes
- For dangerous situations, advise calling a professional immediately

TONE: Warm, confident, professional. You're a real person helping a friend with tech issues.`;

async function setupGeminiLive(ws: WebSocket) {
  const apiKey = process.env.GEMINI_API_KEY__TECHTRIAGE;
  if (!apiKey) {
    ws.send(JSON.stringify({ type: 'error', message: 'API key not configured' }));
    ws.close();
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const session = await ai.live.connect({
      model: "gemini-2.0-flash-live-preview-04-09",
      callbacks: {
        onopen: () => {
          console.log("Gemini Live session opened");
          ws.send(JSON.stringify({ type: 'ready' }));
          
          console.log("Sending initial greeting prompt...");
          session.sendClientContent({
            turns: [{
              role: "user",
              parts: [{ text: "Hello! I just connected. Please greet me warmly and let me know you're ready to help with my tech issue." }]
            }],
            turnComplete: true
          });
        },
        onmessage: (message: any) => {
          try {
            console.log("Received Gemini message:", JSON.stringify(message).substring(0, 500));
            
            if (message.serverContent?.modelTurn?.parts) {
              console.log("Processing modelTurn parts:", message.serverContent.modelTurn.parts.length);
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData?.mimeType?.startsWith('audio/')) {
                  console.log("Sending audio data to client");
                  ws.send(JSON.stringify({
                    type: 'audio',
                    data: part.inlineData.data
                  }));
                }
                if (part.text) {
                  console.log("Sending text to client:", part.text.substring(0, 100));
                  ws.send(JSON.stringify({
                    type: 'text',
                    data: part.text
                  }));
                }
              }
            }
            
            if (message.serverContent?.turnComplete) {
              ws.send(JSON.stringify({ type: 'turnComplete' }));
            }
            
            if (message.serverContent?.interrupted) {
              ws.send(JSON.stringify({ type: 'interrupted' }));
            }
            
            if (message.toolCall) {
              const functionCall = message.toolCall.functionCalls?.[0];
              if (functionCall?.name === 'endSession') {
                ws.send(JSON.stringify({
                  type: 'endSession',
                  summary: functionCall.args?.summary || 'Session completed'
                }));
              }
            }
          } catch (err) {
            console.error("Error processing Gemini message:", err);
          }
        },
        onerror: (error: any) => {
          console.error("Gemini Live error:", error);
          ws.send(JSON.stringify({ type: 'error', message: 'Gemini connection error' }));
        },
        onclose: () => {
          console.log("Gemini Live session closed");
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        }
      },
      config: {
        responseModalities: [Modality.AUDIO, Modality.TEXT],
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Kore"
            }
          }
        },
        tools: [{
          functionDeclarations: [{
            name: 'endSession',
            description: 'Call this when the user wants to end the support session or when the issue is resolved.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                summary: {
                  type: Type.STRING,
                  description: 'A brief summary of what was diagnosed or fixed.'
                }
              },
              required: ['summary']
            }
          }]
        }]
      }
    });

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'audio') {
          session.sendRealtimeInput({
            audio: {
              data: message.data,
              mimeType: "audio/pcm;rate=16000"
            }
          });
        } else if (message.type === 'image') {
          session.sendRealtimeInput({
            media: {
              data: message.data,
              mimeType: "image/jpeg"
            }
          });
        }
      } catch (err) {
        console.error("Error handling client message:", err);
      }
    });

    ws.on('close', () => {
      console.log("Client disconnected, closing Gemini session");
      session.close();
    });

  } catch (error) {
    console.error("Failed to connect to Gemini Live:", error);
    ws.send(JSON.stringify({ type: 'error', message: 'Failed to connect to AI service' }));
    ws.close();
  }
}

async function main() {
  try {
    await setupAuth(app);
    registerAuthRoutes(app);
    console.log("Auth setup complete");
  } catch (error) {
    console.error("Auth setup failed:", error);
  }

  const PORT = 3001;
  const server = createServer(app);
  
  const wss = new WebSocketServer({ server, path: '/live' });
  
  wss.on('connection', (ws) => {
    console.log("New WebSocket connection for live session");
    setupGeminiLive(ws);
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server ready at /live`);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
