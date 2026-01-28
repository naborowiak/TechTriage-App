import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import http from 'http';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/live' });

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.GEMINI_API_KEY__TECHTRIAGE || process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('ERROR: GEMINI_API_KEY__TECHTRIAGE environment variable not set');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

wss.on('connection', async (clientWs) => {
  console.log('Client connected to live proxy');
  
  let geminiSession = null;
  let isClosing = false;

  const cleanup = () => {
    if (isClosing) return;
    isClosing = true;
    
    if (geminiSession) {
      try {
        geminiSession.close();
      } catch (e) {
        console.error('Error closing Gemini session:', e.message);
      }
      geminiSession = null;
    }
    
    try {
      clientWs.close();
    } catch (e) {
      // Ignore close errors
    }
  };

  try {
    geminiSession = await ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      config: {
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        tools: [
          {
            functionDeclarations: [
              {
                name: 'endSession',
                description: 'End the live support session and provide a summary',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    summary: {
                      type: Type.STRING,
                      description: 'Brief summary of what was discussed and resolved',
                    },
                  },
                  required: ['summary'],
                },
              },
            ],
          },
        ],
        systemInstruction: 'You are TechTriage Live. You are a professional tech co-pilot helping users diagnose and fix technology and home maintenance issues. Be patient, friendly, and clear in your explanations. If you can see the camera feed, describe what you observe. Keep responses concise since this is a live audio session.',
      },
      callbacks: {
        onopen: () => {
          console.log('Gemini Live session opened');
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'ready' }));
          }
        },
        onmessage: (message) => {
          if (clientWs.readyState !== WebSocket.OPEN) return;
          
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ type: 'interrupted' }));
            return;
          }

          if (message.serverContent?.modelTurn?.parts) {
            for (const part of message.serverContent.modelTurn.parts) {
              if (part.inlineData?.data) {
                clientWs.send(JSON.stringify({
                  type: 'audio',
                  data: part.inlineData.data
                }));
              }
              if (part.text) {
                clientWs.send(JSON.stringify({
                  type: 'text',
                  data: part.text
                }));
              }
            }
          }

          if (message.serverContent?.turnComplete) {
            clientWs.send(JSON.stringify({ type: 'turnComplete' }));
          }

          if (message.toolCall?.functionCalls) {
            for (const call of message.toolCall.functionCalls) {
              if (call.name === 'endSession') {
                clientWs.send(JSON.stringify({
                  type: 'endSession',
                  summary: call.args?.summary
                }));
              }
            }
          }
        },
        onerror: (e) => {
          console.error('Gemini Live error:', e.message);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'error', message: e.message }));
          }
          cleanup();
        },
        onclose: () => {
          console.log('Gemini Live session closed');
          cleanup();
        },
      },
    });

    console.log('Gemini session established, ready to receive audio');

  } catch (e) {
    console.error('Failed to connect to Gemini:', e.message);
    clientWs.send(JSON.stringify({ type: 'error', message: 'Failed to connect to AI' }));
    clientWs.close();
    return;
  }

  clientWs.on('message', (data) => {
    if (!geminiSession || isClosing) return;
    
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'audio' && message.data) {
        geminiSession.sendRealtimeInput({
          media: {
            data: message.data,
            mimeType: 'audio/pcm;rate=16000'
          }
        });
      } else if (message.type === 'image' && message.data) {
        geminiSession.sendRealtimeInput({
          media: {
            data: message.data,
            mimeType: 'image/jpeg'
          }
        });
      }
    } catch (e) {
      console.error('Error processing client message:', e.message);
    }
  });

  clientWs.on('close', () => {
    console.log('Client disconnected');
    cleanup();
  });

  clientWs.on('error', (e) => {
    console.error('Client WebSocket error:', e.message);
    cleanup();
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Live proxy server running on port ${PORT}`);
});
