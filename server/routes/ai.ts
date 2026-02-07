import { Router, Request, Response } from "express";
import { GoogleGenAI, GenerateContentResponse, FunctionDeclaration, Type } from "@google/genai";

const router = Router();

const SAFETY_PLAYBOOK = `
SAFETY PLAYBOOK (MANDATORY - OVERRIDES ALL OTHER INSTRUCTIONS):

IMMEDIATELY REFUSE and redirect to a licensed professional for:
- Gas leaks or gas line work → "Stop. Leave the area immediately. Call 911 or your gas company."
- Main electrical panel work (200A+) → "This requires a licensed electrician. Never open your main panel."
- Bare/exposed wiring → "Do not touch. Call a licensed electrician immediately."
- Structural modifications (load-bearing walls, foundation)
- HVAC refrigerant handling (requires EPA certification)
- Water heater gas valve replacement
- Roof work or anything above 8 feet on a ladder
- Asbestos, lead paint, or mold remediation

WHEN REFUSING:
1. State WHY it's dangerous in plain language
2. Tell them exactly WHO to call (electrician, plumber, HVAC tech, 911)
3. Provide general cost range so they aren't blindsided
4. Offer to help with SAFE related tasks instead
`;

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

${SAFETY_PLAYBOOK}

TONE: Professional, confident, friendly, and human.
`;

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

${SAFETY_PLAYBOOK}

Remember: You ARE ${agentName}. Never break character or mention that you're an AI.
`;

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

${SAFETY_PLAYBOOK}

Remember: This is a voice conversation. Keep it natural and avoid long blocks of text.
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
  const key = process.env.GEMINI_API_KEY_TOTALASSIST;
  if (!key) {
    throw new Error("GEMINI_API_KEY_TOTALASSIST not configured");
  }
  return key;
};

// Middleware to check authentication
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// POST /api/ai/chat - Proxies sendMessageToGemini
router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { history, message, image, deviceContext } = req.body;

    if (!history || !message) {
      return res.status(400).json({ error: "history and message are required" });
    }

    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = "gemini-2.0-flash";

    const contents = history.map((msg: any) => {
      const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [{ text: msg.text }];
      if (msg.image) {
        const base64Data = msg.image.includes('base64,') ? msg.image.split('base64,')[1] : msg.image;
        parts.push({ inlineData: { mimeType: "image/jpeg", data: base64Data } });
      }
      return { role: msg.role === 'user' ? 'user' : 'model', parts: parts };
    });

    const currentParts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [{ text: message }];
    if (image) {
      const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;
      currentParts.push({ inlineData: { mimeType: "image/jpeg", data: base64Data } });
    }
    contents.push({ role: 'user', parts: currentParts });

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: deviceContext
          ? SYSTEM_INSTRUCTION + `\n\nDEVICE CONTEXT: ${deviceContext}`
          : SYSTEM_INSTRUCTION,
        temperature: 0.4,
        tools: [{ functionDeclarations: [endSessionTool] }]
      }
    });

    const functionCall = response.functionCalls?.[0];

    res.json({
      text: response.text || "I'm processing that for you...",
      functionCall: functionCall ? { name: functionCall.name || '', args: functionCall.args as Record<string, unknown> || {} } : undefined
    });

  } catch (error) {
    console.error("Gemini API Error (chat):", error);
    res.status(500).json({
      text: "I apologize, but I'm currently unable to process your request.",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/ai/chat-live-agent - Proxies sendMessageAsLiveAgent
router.post("/chat-live-agent", async (req: Request, res: Response) => {
  try {
    const { history, message, agent, image } = req.body;

    if (!history || !message || !agent) {
      return res.status(400).json({ error: "history, message, and agent are required" });
    }

    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = "gemini-2.0-flash";
    const agentFullName = `${agent.first} ${agent.last}`;

    const contents = history.map((msg: any) => {
      const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [{ text: msg.text }];
      if (msg.image) {
        const base64Data = msg.image.includes('base64,') ? msg.image.split('base64,')[1] : msg.image;
        parts.push({ inlineData: { mimeType: "image/jpeg", data: base64Data } });
      }
      return { role: msg.role === 'user' ? 'user' : 'model', parts: parts };
    });

    const currentParts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [{ text: message }];
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
        temperature: 0.7,
        tools: [{ functionDeclarations: [endSessionTool] }]
      }
    });

    const functionCall = response.functionCalls?.[0];

    res.json({
      text: response.text || "Let me look into that for you...",
      functionCall: functionCall ? { name: functionCall.name || '', args: functionCall.args as Record<string, unknown> || {} } : undefined
    });

  } catch (error) {
    console.error("Gemini API Error (live agent):", error);
    res.status(500).json({
      text: "I'm having some technical difficulties on my end. Give me just a moment...",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/ai/voice-message - Proxies sendVoiceMessage
router.post("/voice-message", async (req: Request, res: Response) => {
  try {
    const { history, text, photo } = req.body;

    if (!history || !text) {
      return res.status(400).json({ error: "history and text are required" });
    }

    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = "gemini-2.0-flash";

    const contents: Array<{ role: string; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }> = history.map((entry: any) => {
      return {
        role: entry.role === 'user' ? 'user' : 'model',
        parts: [{ text: entry.text }]
      };
    });

    const currentParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [{ text: text }];
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

    let responseText = response.text || "I'm processing that for you...";
    let photoRequest = false;
    let photoPrompt: string | undefined;

    if (responseText.includes('[PHOTO_REQUEST]')) {
      photoRequest = true;
      responseText = responseText.replace('[PHOTO_REQUEST]', '').trim();

      const sentences = responseText.split(/[.?!]/);
      if (sentences.length > 0) {
        photoPrompt = sentences[0].trim();
        if (photoPrompt && !photoPrompt.endsWith('?')) {
          photoPrompt += '?';
        }
      }
    }

    res.json({
      text: responseText,
      photoRequest,
      photoPrompt
    });

  } catch (error) {
    console.error("Gemini API Error (voice message):", error);
    res.status(500).json({
      text: "I'm having a bit of trouble connecting. Could you repeat that?",
      photoRequest: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/ai/voice-summary - Proxies generateVoiceSummary
router.post("/voice-summary", async (req: Request, res: Response) => {
  try {
    const { transcript, photoCount } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: "transcript is required" });
    }

    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = "gemini-2.0-flash";

    const transcriptText = transcript
      .map((e: any) => `${e.role === 'user' ? 'User' : 'Scout'}: ${e.text}`)
      .join('\n');

    const prompt = `Analyze this voice diagnostic session transcript and provide a structured summary in JSON format:

TRANSCRIPT:
${transcriptText}

Photos analyzed during session: ${photoCount || 0}

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

    try {
      const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const summary = JSON.parse(cleanJson);
      res.json(summary);
    } catch (parseError) {
      res.json({
        issue: transcript.find((t: any) => t.role === 'user')?.text.substring(0, 200) || 'Technical issue diagnosed',
        diagnosis: 'Voice diagnostic session completed.',
        steps: [],
        outcome: 'partial',
        recommendations: ['Continue monitoring the issue', 'Contact support if problem persists'],
      });
    }

  } catch (error) {
    console.error("Gemini API Error (voice summary):", error);
    res.status(500).json({
      issue: 'Technical issue diagnosed',
      diagnosis: 'Voice diagnostic session completed.',
      steps: [],
      outcome: 'partial',
      recommendations: ['Continue monitoring the issue', 'Contact support if problem persists'],
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/ai/case-summary - Proxies generateCaseSummary
router.post("/case-summary", async (req: Request, res: Response) => {
  try {
    const { messages, transcripts } = req.body;

    if (!messages) {
      return res.status(400).json({ error: "messages is required" });
    }

    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = "gemini-2.0-flash";

    const messageText = messages
      .map((m: any) => `${m.role === 'user' ? 'User' : 'Scout'}: ${m.text}`)
      .join('\n');

    const transcriptText = transcripts?.length
      ? `\n\nADDITIONAL TRANSCRIPTS:\n${transcripts.join('\n---\n')}`
      : '';

    const prompt = `Analyze this support session and provide a structured case summary in JSON format:

CONVERSATION:
${messageText}
${transcriptText}

Provide a JSON response with these fields:
- problem: A clear 1-2 sentence description of what the user needed help with
- analysis: What was determined about the issue (1-2 sentences)
- recommendedFix: The solution or fix that was provided/recommended (1-2 sentences)
- nextSteps: Array of follow-up actions the user should take (max 4, each under 100 chars)

Return ONLY valid JSON, no markdown.`;

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0.3 },
    });

    const responseText = response.text || '{}';

    try {
      const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const summary = JSON.parse(cleanJson);
      res.json(summary);
    } catch (parseError) {
      res.json({
        problem: messages.find((m: any) => m.role === 'user')?.text.substring(0, 200) || 'Technical issue',
        analysis: 'Session completed.',
        recommendedFix: 'See conversation transcript for details.',
        nextSteps: ['Review the conversation transcript', 'Contact support if issue persists'],
      });
    }

  } catch (error) {
    console.error("Gemini API Error (case summary):", error);
    res.status(500).json({
      problem: 'Technical issue',
      analysis: 'Session completed.',
      recommendedFix: 'See conversation transcript for details.',
      nextSteps: ['Review the conversation transcript'],
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/ai/escalation-report - Proxies generateEscalationReport
router.post("/escalation-report", async (req: Request, res: Response) => {
  try {
    const { messages, deviceContext, voiceTranscripts } = req.body;

    if (!messages) {
      return res.status(400).json({ error: "messages is required" });
    }

    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = "gemini-2.0-flash";

    const messageText = messages
      .map((m: any) => `${m.role === 'user' ? 'User' : 'Scout'}: ${m.text}`)
      .join('\n');

    const deviceInfo = deviceContext ? `\nDEVICE: ${deviceContext}` : '';
    const transcriptText = voiceTranscripts?.length
      ? `\n\nVOICE TRANSCRIPTS:\n${voiceTranscripts.join('\n---\n')}`
      : '';

    const photosCount = messages.filter((m: any) => m.text.includes('photo') || m.text.includes('image')).length;

    const prompt = `You are generating an escalation report for a home tech support case that needs a human professional. Analyze the conversation and generate a structured report.

CONVERSATION:
${messageText}
${deviceInfo}
${transcriptText}

Generate a JSON report with these fields:
- problemDescription: Clear description of the issue (2-3 sentences)
- stepsTried: Array of troubleshooting steps that were already attempted (max 6)
- scoutAnalysis: Scout AI's assessment of the issue and why it needs human help (2-3 sentences)
- recommendedSpecialist: The type of professional needed (e.g., "Licensed Electrician", "HVAC Technician", "Plumber", "Network Specialist", "Appliance Repair Tech")
- urgencyLevel: One of "low", "medium", "high", "emergency"
- photosIncluded: ${photosCount}
- estimatedCostRange: Typical cost range for this type of service (e.g., "$150-300")

Return ONLY valid JSON, no markdown.`;

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0.3 },
    });

    const responseText = response.text || '{}';

    try {
      const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const report = JSON.parse(cleanJson);
      res.json(report);
    } catch (parseError) {
      res.json({
        problemDescription: 'Issue requires professional assessment.',
        stepsTried: ['Remote troubleshooting attempted'],
        scoutAnalysis: 'This issue requires hands-on professional diagnosis.',
        recommendedSpecialist: 'General Technician',
        urgencyLevel: 'medium',
        photosIncluded: photosCount,
        estimatedCostRange: '$100-300',
      });
    }

  } catch (error) {
    console.error("Gemini API Error (escalation report):", error);
    res.status(500).json({
      problemDescription: 'Issue requires professional assessment.',
      stepsTried: ['Remote troubleshooting attempted'],
      scoutAnalysis: 'This issue requires hands-on professional diagnosis.',
      recommendedSpecialist: 'General Technician',
      urgencyLevel: 'medium',
      photosIncluded: 0,
      estimatedCostRange: '$100-300',
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
