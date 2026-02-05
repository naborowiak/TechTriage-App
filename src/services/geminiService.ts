import { GoogleGenAI, GenerateContentResponse, FunctionDeclaration, Type } from "@google/genai";
import { ChatMessage, UserRole } from "../types";
import { VoiceTranscriptEntry } from "../hooks/useVoiceSession";

const SYSTEM_INSTRUCTION = `
You are a 'Scout Agent', an expert human technical support specialist. 
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

// Live Agent mode - uses a different persona that feels more human
const LIVE_AGENT_INSTRUCTION = (agentName: string) => `
You are ${agentName}, a human technical support specialist working for Scout.
You are NOT a robot or AI - you are a real person helping customers with their tech problems.

IMPORTANT BEHAVIOR:
- Respond as a real human support agent would - use natural language, occasional typos are okay
- Be warm, empathetic, and personable
- Use phrases like "Let me take a look at that for you" or "I can definitely help with this"
- If you need to look something up, say something like "Give me just a moment to check on that"
- Reference your experience: "I've seen this issue before" or "This is actually pretty common"
- Be conversational - ask follow-up questions naturally

TECHNICAL EXPERTISE:
- You have extensive knowledge of home technology: Wi-Fi, routers, smart home devices, TVs, computers, HVAC, appliances
- When looking at photos, describe what you see naturally as a human would
- Provide clear, step-by-step instructions when helping troubleshoot

SAFETY:
- Never assist with gas leaks, electrical panels, bare wires, or structural changes
- For dangerous situations, recommend calling a professional

Remember: You ARE ${agentName}. Never break character or mention that you're an AI.
`;

export const sendMessageAsLiveAgent = async (
  history: ChatMessage[],
  newMessage: string,
  agent: { first: string; last: string },
  image?: string
): Promise<{ text: string, functionCall?: { name: string; args: Record<string, unknown> } }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = "gemini-2.0-flash";
    const agentFullName = `${agent.first} ${agent.last}`;

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
        systemInstruction: LIVE_AGENT_INSTRUCTION(agentFullName),
        temperature: 0.7, // Slightly higher for more natural responses
        tools: [{ functionDeclarations: [endSessionTool] }]
      }
    });

    const functionCall = response.functionCalls?.[0];

    return {
      text: response.text || "Let me look into that for you...",
      functionCall: functionCall ? { name: functionCall.name || '', args: functionCall.args as Record<string, unknown> || {} } : undefined
    };

  } catch (error) {
    console.error("Gemini API Error (Live Agent):", error);
    return { text: "I'm having some technical difficulties on my end. Give me just a moment..." };
  }
};

// Voice Mode System Instruction
const VOICE_MODE_INSTRUCTION = `
You are Scout, a friendly and expert AI technical support assistant conducting a voice-guided diagnostic session.

VOICE CONVERSATION GUIDELINES:
- Keep responses concise and conversational (2-3 sentences max unless explaining steps)
- Speak naturally as if having a phone conversation
- Use simple, clear language that's easy to understand when spoken aloud
- Pause between steps to let the user follow along
- Be encouraging and supportive

PHOTO REQUEST PROTOCOL:
When you need to see something to diagnose the issue, include the marker [PHOTO_REQUEST] at the START of your response, followed by a clear request for what you need to see.

Examples:
- "[PHOTO_REQUEST] Could you show me the front panel of your router so I can see the status lights?"
- "[PHOTO_REQUEST] Can you take a photo of the error message on your screen?"
- "[PHOTO_REQUEST] Let me see the back of the device where the cables connect."

Only request photos when visual information is genuinely needed for diagnosis. Don't request multiple photos at once.

DIAGNOSTIC FLOW:
1. Greet the user warmly and ask about their issue
2. Listen to their description and ask clarifying questions
3. Request photos when needed using [PHOTO_REQUEST]
4. Analyze photos and explain what you see
5. Provide step-by-step troubleshooting guidance
6. Confirm each step is completed before moving to the next
7. Summarize findings and recommendations at the end

SAFETY:
Never assist with gas leaks, electrical panels, bare wires, or structural changes. Advise calling a professional for these.

Remember: This is a voice conversation. Keep it natural and avoid long blocks of text.
`;

// Voice mode message function with photo request detection
export const sendVoiceMessage = async (
  history: VoiceTranscriptEntry[],
  userText: string,
  photo?: string
): Promise<{ text: string; photoRequest: boolean; photoPrompt?: string }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = "gemini-2.0-flash";

    // Convert voice transcript to Gemini format
    const contents: Array<{ role: string; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }> = history.map(entry => {
      return {
        role: entry.role === 'user' ? 'user' : 'model',
        parts: [{ text: entry.text }]
      };
    });

    // Add the current message
    const currentParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [{ text: userText }];
    if (photo) {
      const base64Data = photo.includes('base64,') ? photo.split('base64,')[1] : photo;
      currentParts.push({ inlineData: { mimeType: "image/jpeg", data: base64Data } });
    }
    contents.push({ role: 'user', parts: currentParts });

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: VOICE_MODE_INSTRUCTION,
        temperature: 0.5,
      }
    });

    let text = response.text || "I'm processing that for you...";
    let photoRequest = false;
    let photoPrompt: string | undefined;

    // Check for [PHOTO_REQUEST] marker
    if (text.includes('[PHOTO_REQUEST]')) {
      photoRequest = true;
      // Remove the marker from the response text
      text = text.replace('[PHOTO_REQUEST]', '').trim();

      // The photo prompt is typically the first sentence after the marker
      const sentences = text.split(/[.?!]/);
      if (sentences.length > 0) {
        photoPrompt = sentences[0].trim();
        if (photoPrompt && !photoPrompt.endsWith('?')) {
          photoPrompt += '?';
        }
      }
    }

    return { text, photoRequest, photoPrompt };

  } catch (error) {
    console.error("Gemini API Error (Voice Mode):", error);
    return {
      text: "I'm having a bit of trouble connecting. Could you repeat that?",
      photoRequest: false
    };
  }
};

// Generate a summary for the voice diagnostic report
export const generateVoiceSummary = async (
  transcript: VoiceTranscriptEntry[],
  photoCount: number
): Promise<{
  issue: string;
  diagnosis: string;
  steps: string[];
  outcome: 'resolved' | 'partial' | 'escalate';
  recommendations: string[];
}> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = "gemini-2.0-flash";

    const transcriptText = transcript
      .map(e => `${e.role === 'user' ? 'User' : 'Scout'}: ${e.text}`)
      .join('\n');

    const prompt = `Analyze this voice diagnostic session transcript and provide a structured summary in JSON format:

TRANSCRIPT:
${transcriptText}

Photos analyzed during session: ${photoCount}

Provide a JSON response with these fields:
- issue: A brief (1-2 sentence) description of the user's original problem. If the problem is unclear or not well-defined, summarize what topics were discussed.
- diagnosis: What was determined about the issue (1-2 sentences). If inconclusive, explain what information would be needed.
- steps: Array of key troubleshooting steps taken (max 5, each under 100 chars)
- outcome: One of these values:
  * "resolved" - The issue was clearly identified AND successfully fixed/solved
  * "partial" - Some progress was made but issue not fully resolved, OR the issue couldn't be clearly identified from the conversation
  * "escalate" - ONLY use this when the issue IS clearly understood but requires physical repair, specialized equipment, licensed professional work (electrical, plumbing, HVAC), or safety concerns that cannot be addressed remotely
- recommendations: Array of follow-up suggestions (max 3, each under 100 chars)

IMPORTANT: Do NOT use "escalate" if you simply couldn't understand or identify the user's issue. Use "partial" instead with appropriate recommendations to clarify the problem.

Return ONLY valid JSON, no markdown.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.3,
      }
    });

    const responseText = response.text || '{}';

    // Try to parse JSON from response
    try {
      // Clean up potential markdown formatting
      const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanJson);
    } catch {
      // Return default if parsing fails
      return {
        issue: transcript.find(t => t.role === 'user')?.text.substring(0, 200) || 'Technical issue diagnosed',
        diagnosis: 'Voice diagnostic session completed.',
        steps: [],
        outcome: 'partial',
        recommendations: ['Continue monitoring the issue', 'Contact support if problem persists'],
      };
    }

  } catch (error) {
    console.error("Gemini API Error (Voice Summary):", error);
    return {
      issue: 'Technical issue diagnosed',
      diagnosis: 'Voice diagnostic session completed.',
      steps: [],
      outcome: 'partial',
      recommendations: ['Continue monitoring the issue', 'Contact support if problem persists'],
    };
  }
};
