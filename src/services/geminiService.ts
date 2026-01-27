import { GoogleGenAI, GenerateContentResponse, FunctionDeclaration, Type } from "@google/genai";
import { ChatMessage, UserRole } from "../types";

const SYSTEM_INSTRUCTION = `
You are a 'TechTriage Agent', an expert human technical support specialist. 
You are NOT a robot, and you should not mention "Vision Systems" or "Scanning". 
Instead, act like a knowledgeable technician who is looking at the user's photos and providing help.

CORE PROTOCOL:

1. **Analyze internally**: Use your vision capabilities to read text, model numbers, and error codes.
2. **Respond naturally**: 
   - Say: "I'm looking at the photo..." or "Thanks for the picture. I see this is a [Brand] [Model]."

DECISION BRANCHING:

**BRANCH A: SUCCESS**
   - Provide solution. If user asks to end the session or if the issue is resolved, use the 'endSession' tool.

SAFETY PROTOCOLS: 
Never assist with gas leaks, main electrical panels, bare wires, or structural changes. STOP immediately and advise calling a pro.

TONE: Professional, confident, friendly, and human.
`;

const endSessionTool: FunctionDeclaration = {
  name: 'endSession',
  parameters: {
    type: Type.OBJECT,
    description: 'Call this when the user wants to end the support session, or when the technical issue has been fully resolved and the conversation is over.',
    properties: {
      summary: {
        type: Type.STRING,
        description: 'A brief 1-sentence summary of what was diagnosed or fixed during this session.'
      }
    },
    required: ['summary']
  }
};

const getApiKey = (): string => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) {
    throw new Error("API Key missing");
  }
  return key;
};

export const sendMessageToGemini = async (
  history: ChatMessage[],
  newMessage: string,
  image?: string
): Promise<{ text: string, functionCall?: { name: string; args: Record<string, unknown> } }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = "gemini-2.0-flash"; 

    const contents = history.map(msg => {
      const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [{ text: msg.text }];
      if (msg.image) {
        const base64Data = msg.image.includes('base64,') ? msg.image.split('base64,')[1] : msg.image;
        parts.push({ inlineData: { mimeType: "image/jpeg", data: base64Data } });
      }
      return { role: msg.role === UserRole.USER ? 'user' : 'model', parts: parts };
    });

    const currentParts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [{ text: newMessage }];
    if (image) {
      const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;
      currentParts.push({ inlineData: { mimeType: "image/jpeg", data: base64Data } });
    }
    contents.push({ role: 'user', parts: currentParts });

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.4,
        tools: [{ functionDeclarations: [endSessionTool] }]
      }
    });

    const functionCall = response.functionCalls?.[0];
    
    return { 
      text: response.text || "I'm processing that for you...", 
      functionCall: functionCall ? { name: functionCall.name || '', args: functionCall.args as Record<string, unknown> || {} } : undefined
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "I apologize, but I'm currently unable to process your request." };
  }
};
