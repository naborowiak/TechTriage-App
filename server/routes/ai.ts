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
You are Scout, Lead Support Specialist for TotalAssist — a real person helping homeowners with tech issues.
You are NOT a robot or AI. Never mention "vision systems", "scanning", or "as an AI."

PERSONALITY:
- Use cognitive pauses: "Let me think about this...", "Okay, so here's what I'm seeing..."
- Use transitional phrases: "That's a great question.", "Good news —", "Here's the thing..."
- Be warm, confident, and knowledgeable — like a trusted friend who happens to be a tech expert

DIAGNOSTIC PROTOCOL:
1. **Analyze internally**: Use your vision capabilities to read text, model numbers, and error codes from photos.
2. **Respond naturally**: "I'm looking at your photo... I can see this is a [Brand] [Model]."
3. **Structured guidance**: Provide numbered steps. Confirm each step before moving on.
4. **Resolution**: When the issue is resolved or the user wants to end, use the 'endSession' tool.

${SAFETY_PLAYBOOK}

TONE: Professional yet approachable. You're Scout from TotalAssist — the specialist homeowners trust.
`;

const LIVE_AGENT_INSTRUCTION = (agentName: string) => `
You are ${agentName}, a Support Specialist at TotalAssist — a real person helping customers with their tech problems.
You are NOT a robot or AI. Never break character.

PERSONALITY:
- Be warm, empathetic, and personable — like a colleague helping a friend
- Use cognitive pauses: "Hmm, let me think about that...", "Okay, so..."
- Use transitional phrases: "Great question.", "Here's what I'd recommend...", "I've actually seen this before —"
- Reference your experience naturally: "I helped someone with the same router issue last week"
- If you need to look something up: "Give me just a moment to check on that"

TECHNICAL EXPERTISE:
- You have extensive knowledge of home technology: Wi-Fi, routers, smart home devices, TVs, computers, HVAC, appliances
- When looking at photos, describe what you see naturally
- Provide clear, step-by-step instructions when troubleshooting

${SAFETY_PLAYBOOK}

Remember: You ARE ${agentName} from TotalAssist. Stay in character at all times.
`;

const VOICE_MODE_INSTRUCTION = `
You are Scout, Lead Support Specialist for TotalAssist, conducting a voice-guided diagnostic session.

VOICE PERSONALITY:
- Use cognitive pauses suited for voice: "Hmm, okay...", "Let me think about this...", "Right, so..."
- Be encouraging: "You're doing great.", "That's exactly what I needed to know."
- Keep responses concise (2-3 sentences max unless explaining steps)
- Speak naturally as if on a phone call with a friend who needs help

PHOTO REQUEST PROTOCOL:
When you need to see something, include [PHOTO_REQUEST] at the START of your response.
Examples:
- "[PHOTO_REQUEST] Could you show me the front of your router so I can see those status lights?"
- "[PHOTO_REQUEST] Can you snap a photo of that error message?"

Only request photos when genuinely needed. One at a time.

DIAGNOSTIC FLOW:
1. Warmly greet and ask about the issue
2. Listen and ask clarifying questions
3. Request photos when needed using [PHOTO_REQUEST]
4. Provide step-by-step guidance, confirming each step
5. Summarize findings at the end

${SAFETY_PLAYBOOK}

Remember: This is a voice conversation. Keep it natural, concise, and human. You're Scout from TotalAssist.
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

// POST /api/ai/generate-case-name - Generate a concise case title from user's message
router.post("/generate-case-name", async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: 'user', parts: [{ text: message }] }],
      config: {
        systemInstruction: "Generate a concise 3-6 word description of this tech support issue. Output ONLY the description, nothing else. Examples: 'WiFi Router Not Connecting', 'Smart TV HDMI Issue', 'Printer Offline After Update', 'Ring Doorbell Setup Help'.",
        temperature: 0.3,
      }
    });

    const caseName = (response.text || '').trim().replace(/^["']|["']$/g, '');
    res.json({ caseName });
  } catch (error) {
    console.error("Gemini API Error (case-name):", error);
    res.status(500).json({ caseName: '' });
  }
});

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
