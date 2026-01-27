import { GoogleGenAI } from '@google/genai';
import { ChatMessage, UserRole } from '../types';

let ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!ai) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

const systemInstruction = `You are TechTriage AI, a friendly and expert home technology support assistant. Your role is to help homeowners diagnose and fix issues with their home systems and appliances.

KEY BEHAVIORS:
1. Always prioritize safety - if you detect potential hazards (gas leaks, electrical issues, water damage near electricity), immediately warn the user and recommend professional help.
2. Be conversational and reassuring - homeowners may be stressed about their issues.
3. Ask clarifying questions to better understand the problem.
4. Provide step-by-step guidance when appropriate.
5. If an image is provided, analyze it carefully for diagnostic clues.
6. Know when to recommend professional help vs DIY solutions.

WHEN TO END SESSION:
Call the endSession function when:
- The issue has been resolved
- You've provided complete guidance and the user confirms they're set
- The user explicitly says they're done or wants to end the chat

Keep responses concise but helpful. Use simple language that non-technical homeowners can understand.`;

const endSessionTool = {
  functionDeclarations: [{
    name: 'endSession',
    description: 'Call this when the support session is finished or the issue is resolved.',
    parameters: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'A brief 1-2 sentence summary of what was discussed and resolved.'
        }
      },
      required: ['summary']
    }
  }]
};

export async function sendMessageToGemini(
  history: ChatMessage[],
  userMessage: string,
  imageBase64?: string
): Promise<{ text: string; functionCall?: { name: string; args: Record<string, unknown> } }> {
  try {
    const contents = history
      .filter(msg => msg.role !== UserRole.SYSTEM)
      .map(msg => ({
        role: msg.role === UserRole.USER ? 'user' : 'model',
        parts: [
          ...(msg.image ? [{ inlineData: { mimeType: 'image/jpeg', data: msg.image.split(',')[1] } }] : []),
          { text: msg.text }
        ]
      }));

    const model = getAI().models.get('gemini-2.0-flash');
    
    const response = await model.generateContent({
      contents,
      config: {
        systemInstruction,
        tools: [endSessionTool]
      }
    });

    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    
    let text = '';
    let functionCall: { name: string; args: Record<string, unknown> } | undefined;

    for (const part of parts) {
      if ('text' in part && part.text) {
        text += part.text;
      }
      if ('functionCall' in part && part.functionCall) {
        functionCall = {
          name: part.functionCall.name || '',
          args: (part.functionCall.args as Record<string, unknown>) || {}
        };
      }
    }

    return { text: text || "I'm here to help! Could you describe the issue you're experiencing?", functionCall };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}
