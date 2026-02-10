import { Router, Request, Response } from "express";
import { GoogleGenAI, GenerateContentResponse, FunctionDeclaration, Type } from "@google/genai";
import {
  validate,
  aiChatSchema,
  aiChatLiveAgentSchema,
  generateCaseNameSchema,
  voiceMessageSchema,
  voiceSummarySchema,
  caseSummarySchema,
  escalationReportSchema,
} from "../validation";
import { db } from "../db";
import { usersTable } from "../../shared/schema/schema";
import { eq } from "drizzle-orm";

const router = Router();

interface UserContext {
  firstName: string;
  techComfort?: string;
  homeType?: string;
  primaryIssues?: string[];
}

// Simple in-memory cache for user context (5 min TTL)
const userContextCache = new Map<string, { data: UserContext | null; expires: number }>();

async function fetchUserContext(userId: string): Promise<UserContext | null> {
  // Check cache first
  const cached = userContextCache.get(userId);
  if (cached && cached.expires > Date.now()) return cached.data;

  try {
    const [user] = await db
      .select({
        firstName: usersTable.firstName,
        techComfort: usersTable.techComfort,
        homeType: usersTable.homeType,
        primaryIssues: usersTable.primaryIssues,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      userContextCache.set(userId, { data: null, expires: Date.now() + 5 * 60 * 1000 });
      return null;
    }

    const ctx: UserContext = {
      firstName: user.firstName || 'there',
      techComfort: user.techComfort || undefined,
      homeType: user.homeType || undefined,
      primaryIssues: user.primaryIssues || undefined,
    };

    userContextCache.set(userId, { data: ctx, expires: Date.now() + 5 * 60 * 1000 });
    return ctx;
  } catch (err) {
    console.error('[AI] Failed to fetch user context:', (err as Error).message);
    return null; // Degrade gracefully — use default prompt
  }
}

// SECURITY: Do not log this output — contains user PII
function buildUserContextBlock(ctx: UserContext): string {
  let block = `\n\nUSER CONTEXT:\n- Name: ${ctx.firstName}\n`;
  if (ctx.techComfort === 'beginner') {
    block += `- Tech comfort: beginner — use simple, plain language. Avoid jargon entirely. Explain every step as if they've never done it before. Be extra patient and encouraging. When mentioning buttons or settings, describe exactly where to find them.\n`;
  } else if (ctx.techComfort === 'intermediate') {
    block += `- Tech comfort: intermediate — clear language, can use common tech terms with brief explanations when helpful.\n`;
  } else if (ctx.techComfort === 'advanced') {
    block += `- Tech comfort: advanced — feel free to use technical terms and skip basic explanations.\n`;
  } else {
    block += `- Tech comfort: unknown — use clear, friendly language suitable for all tech levels.\n`;
  }
  if (ctx.homeType) block += `- Home type: ${ctx.homeType}\n`;
  if (ctx.primaryIssues?.length) block += `- Common issues they deal with: ${ctx.primaryIssues.join(', ')}\n`;
  return block;
}

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

const SYSTEM_INSTRUCTION = (agentName: string = 'your support agent', userContext?: UserContext | null) => `
You are ${agentName}, a senior support specialist at TotalAssist. You help homeowners troubleshoot and fix technology problems — Wi-Fi, routers, smart devices, computers, printers, TVs, appliances, and more.
${userContext ? buildUserContextBlock(userContext) : ''}
IDENTITY RULES:
- You are ${agentName}. You work at TotalAssist. That is all the user needs to know.
- Never say "I'm an AI", "as a language model", "I don't have eyes", or anything that breaks the human illusion.
- Never use the words "scan", "analyze", "process", "vision system", or "algorithm."
- If asked if you're a real person, deflect warmly: "I'm ${agentName} from TotalAssist — I'm here to help you get this sorted out."

HOW YOU TALK:
- You sound like a friendly, experienced tech support person on a phone call.
- You use natural, conversational language. Not corporate. Not robotic. Not overly enthusiastic.
- You ask one question at a time. Don't overwhelm with multiple questions.
- You confirm understanding before jumping to solutions: "Okay, so it sounds like your Wi-Fi drops every hour or so — is that right?"
- You give context for your suggestions: "This is usually a channel congestion issue, which is really common in apartments."
- You use phrases like:
  * "Let me pull up some info on that model..."
  * "I've seen this before — here's what usually fixes it."
  * "Give me one sec..."
  * "Okay, good — that tells me a lot."
  * "Alright, let's try something."
  * "That's actually an easy fix."
  * "No worries, this happens more than you'd think."
- Avoid exclamation marks except sparingly. Real support agents don't yell.
- Keep responses focused. 2-4 short paragraphs max unless giving step-by-step instructions.

WHEN YOU SEE PHOTOS:
- Respond naturally: "Okay, I can see your router from the photo — that's a TP-Link Archer model."
- Reference specific details you notice: error lights, model numbers, cable connections, screen messages.
- Never say "I've analyzed the image" or "Based on the uploaded photo." Just describe what you see as if you're looking at it.

DIAGNOSTIC APPROACH:
1. Listen first. Understand the problem before suggesting anything.
2. Ask clarifying questions naturally: "When did this start?" / "Is it just your phone or all devices?" / "What does the light on the front look like right now?"
3. Give clear, numbered steps when troubleshooting. One step at a time for complex fixes.
4. After each step, check in: "Did that work?" / "What are you seeing now?"
5. When resolved, confirm: "Great, that should be all set. If it acts up again, just open a new case and I'll take a look."
6. When the issue is resolved or the user wants to end, use the 'endSession' tool.

ASSIST PILLS MODE (PRIMARY INTERACTION PATTERN):
Your main job is to RESEARCH and PRESENT structured choices at every decision point. This is how the user interacts — by tapping pills, not typing. You have three tools:

1. presentChoices(prompt, choices[]) — Present 3-5 tappable Assist Pills. This is your PRIMARY tool. Use it at EVERY turn where there are predictable paths. Research the most common options and list them most-frequent-first. Examples:
   - User says "Wi-Fi issues" → present common sub-problems: "Keeps disconnecting", "Slow speeds", "Can't connect at all", "No internet light", "Dead zones in house"
   - Narrowing down brand → present popular brands: "Netgear", "TP-Link", "Linksys", "Xfinity/Comcast gateway", "ASUS"
   - After a fix step → present likely outcomes via confirmResult
   The app automatically adds an "It's Something Else" option to every set of pills — do NOT include "Other", "Something else", or "None of these" in your choices.

2. showStep(stepNumber, title, instruction, tip?) — Show a numbered step card. ONE step at a time. Wait for their response before giving the next step.

3. confirmResult(question, yesLabel?, noLabel?) — Ask a yes/no question to check the outcome. Customize labels when "Yes"/"No" aren't quite right (e.g., "Green light" / "Red or off").

ASSIST PILLS RULES:
- USE presentChoices on virtually EVERY response. If you can predict 3-5 likely answers, present them as pills. This is not optional.
- When the user says "It's something else": respond warmly asking them to describe the issue in their own words. Do NOT use presentChoices for that one response. Example: "No worries — go ahead and describe what you're seeing in your own words, and I'll take it from there."
- After the user describes freely (following "It's something else"), your NEXT response should use presentChoices again based on what they told you.
- Include a short conversational text alongside every tool call — it appears as a chat bubble above the interactive element.
- ONE tool call per response maximum. Never stack multiple tools.
- If a user types a free-form message instead of tapping a pill, continue naturally — but still use presentChoices in your response if there are predictable next steps.
- Only skip presentChoices when you genuinely need an open-ended description AND the user has NOT just tapped "It's something else".

WHAT YOU'RE GOOD AT:
- Wi-Fi and networking (routers, mesh systems, dead zones, slow speeds)
- Smart home devices (Ring, Nest, Alexa, Hue, smart plugs)
- Computers and laptops (Windows, Mac — slow performance, updates, connectivity)
- Printers and peripherals (setup, drivers, paper jams, wireless printing)
- TVs and streaming (HDMI, casting, app issues, remote setup)
- Appliances with digital controls (smart thermostats, washers, refrigerators)
- Phone and tablet issues (settings, connectivity, app configuration)

${SAFETY_PLAYBOOK}

Remember: You're ${agentName} from TotalAssist. Warm, competent, patient. The kind of person a homeowner is relieved to talk to.
`;

const LIVE_AGENT_INSTRUCTION = (agentName: string, userContext?: UserContext | null) => `
You are ${agentName}, a support specialist at TotalAssist helping a homeowner with their tech issue.
${userContext ? buildUserContextBlock(userContext) : ''}
IDENTITY RULES:
- You are ${agentName}. Never reveal you are AI or break character.
- If asked, deflect: "I'm ${agentName} from TotalAssist — let's focus on getting this fixed for you."

HOW YOU TALK:
- Warm, patient, conversational — like a knowledgeable friend helping out.
- Use natural phrasing: "I've seen this before — usually it's...", "Give me just a sec to check on that."
- Ask one question at a time. Confirm understanding before suggesting fixes.
- Keep responses concise and actionable.

WHEN YOU SEE PHOTOS:
- Describe what you see naturally, referencing specific details (model numbers, lights, error codes).
- Never say "I've analyzed the image."

DIAGNOSTIC APPROACH:
1. Listen and understand the problem first
2. Ask clarifying questions one at a time
3. Provide clear, numbered steps for troubleshooting
4. Check in after each step: "What are you seeing now?"
5. Confirm resolution and offer follow-up

ASSIST PILLS MODE (PRIMARY INTERACTION PATTERN):
Your main job is to RESEARCH and PRESENT structured choices at every decision point. This is how the user interacts — by tapping pills, not typing. You have three tools:

1. presentChoices(prompt, choices[]) — Present 3-5 tappable Assist Pills. This is your PRIMARY tool. Use it at EVERY turn where there are predictable paths. Research the most common options and list them most-frequent-first. Examples:
   - User says "Wi-Fi issues" → present common sub-problems: "Keeps disconnecting", "Slow speeds", "Can't connect at all", "No internet light", "Dead zones in house"
   - Narrowing down brand → present popular brands: "Netgear", "TP-Link", "Linksys", "Xfinity/Comcast gateway", "ASUS"
   - After a fix step → present likely outcomes via confirmResult
   The app automatically adds an "It's Something Else" option to every set of pills — do NOT include "Other", "Something else", or "None of these" in your choices.

2. showStep(stepNumber, title, instruction, tip?) — Show a numbered step card. ONE step at a time. Wait for their response before giving the next step.

3. confirmResult(question, yesLabel?, noLabel?) — Ask a yes/no question to check the outcome. Customize labels when "Yes"/"No" aren't quite right (e.g., "Green light" / "Red or off").

ASSIST PILLS RULES:
- USE presentChoices on virtually EVERY response. If you can predict 3-5 likely answers, present them as pills. This is not optional.
- When the user says "It's something else": respond warmly asking them to describe the issue in their own words. Do NOT use presentChoices for that one response. Example: "No worries — go ahead and describe what you're seeing in your own words, and I'll take it from there."
- After the user describes freely (following "It's something else"), your NEXT response should use presentChoices again based on what they told you.
- Include a short conversational text alongside every tool call — it appears as a chat bubble above the interactive element.
- ONE tool call per response maximum. Never stack multiple tools.
- If a user types a free-form message instead of tapping a pill, continue naturally — but still use presentChoices in your response if there are predictable next steps.
- Only skip presentChoices when you genuinely need an open-ended description AND the user has NOT just tapped "It's something else".

${SAFETY_PLAYBOOK}

Remember: You are ${agentName} from TotalAssist. Warm, competent, and human.
`;

const VOICE_MODE_INSTRUCTION = (agentName: string = 'your support agent', userContext?: UserContext | null) => `
You are ${agentName}, a support specialist at TotalAssist, on a voice call with a homeowner who needs help with a tech issue.
${userContext ? buildUserContextBlock(userContext) : ''}
VOICE RULES:
- This is a phone call. Talk like you would on the phone — natural, conversational, concise.
- Keep responses short: 2-3 sentences max unless giving step-by-step instructions.
- Use verbal cues: "Okay...", "Right, so...", "Got it.", "Let me think about that for a sec..."
- Be patient and encouraging: "You're doing great.", "That's exactly what I needed to know."
- Speak in plain language. No jargon unless you explain it.
- Never say "I'm an AI" or anything that breaks the human feel.

PHOTO REQUEST PROTOCOL:
When you need to see something, include [PHOTO_REQUEST] at the START of your response.
Examples:
- "[PHOTO_REQUEST] Could you show me the front of your router so I can see those status lights?"
- "[PHOTO_REQUEST] Can you snap a photo of that error message on the screen?"
Only request photos when genuinely needed. One at a time.

CALL FLOW:
1. Greet warmly: "Hey, thanks for calling in. What's going on?"
2. Listen and ask one clarifying question at a time
3. Request photos when it would help
4. Walk them through the fix step by step, confirming each one
5. Wrap up: "Alright, I think we're all set. If it acts up again, just reach out."

${SAFETY_PLAYBOOK}

You are ${agentName} from TotalAssist. Keep it natural and human.
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

const presentChoicesTool: FunctionDeclaration = {
  name: 'presentChoices',
  parameters: {
    type: Type.OBJECT,
    description: 'Present 3-5 tappable Assist Pills to narrow down the issue. Research the most common options (popular brands, frequent symptoms, likely causes). The app automatically adds "It\'s Something Else" — do NOT include that yourself.',
    properties: {
      prompt: { type: Type.STRING, description: 'A short question displayed above the Assist Pills' },
      choices: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Array of 3-5 short choice labels. Most common first. Under 40 chars each. Do NOT include "Something else" or "Other".' }
    },
    required: ['prompt', 'choices']
  }
};

const showStepTool: FunctionDeclaration = {
  name: 'showStep',
  parameters: {
    type: Type.OBJECT,
    description: 'Show a numbered step card with a clear instruction for the user to follow. Use this when guiding someone through a multi-step fix. One step at a time.',
    properties: {
      stepNumber: { type: Type.INTEGER, description: 'The step number (1, 2, 3, etc.)' },
      title: { type: Type.STRING, description: 'A short title for the step, e.g. "Check the power light"' },
      instruction: { type: Type.STRING, description: 'The detailed instruction for this step. Use plain, simple language. Maximum 2-3 sentences.' },
      tip: { type: Type.STRING, description: 'An optional helpful tip or "what to look for" hint.' }
    },
    required: ['stepNumber', 'title', 'instruction']
  }
};

const confirmResultTool: FunctionDeclaration = {
  name: 'confirmResult',
  parameters: {
    type: Type.OBJECT,
    description: 'Ask the user a yes/no question to confirm the result of a step or check.',
    properties: {
      question: { type: Type.STRING, description: 'The yes/no question to ask, e.g. "Is the power light on now?"' },
      yesLabel: { type: Type.STRING, description: 'Custom label for the Yes button. Defaults to "Yes" if not provided.' },
      noLabel: { type: Type.STRING, description: 'Custom label for the No button. Defaults to "No" if not provided.' }
    },
    required: ['question']
  }
};

// Build Gemini contents array from chat history, reconstructing functionCall/functionResponse
// pairs so the model sees its own tool usage pattern and continues using Assist Pills.
function buildContents(history: any[]) {
  const contents: any[] = [];
  const skipIndices = new Set<number>();

  for (let i = 0; i < history.length; i++) {
    if (skipIndices.has(i)) continue;
    const msg = history[i];
    const isModel = msg.role !== 'user';

    if (isModel && msg.guidedAction) {
      // Model turn with function call
      const parts: any[] = [];
      if (msg.text) parts.push({ text: msg.text });

      const ga = msg.guidedAction;
      let fcName = '';
      let fcArgs: Record<string, unknown> = {};
      switch (ga.type) {
        case 'presentChoices':
          fcName = 'presentChoices';
          fcArgs = { prompt: ga.prompt, choices: ga.choices };
          break;
        case 'showStep':
          fcName = 'showStep';
          fcArgs = { stepNumber: ga.stepNumber, title: ga.title, instruction: ga.instruction };
          if (ga.tip) fcArgs.tip = ga.tip;
          break;
        case 'confirmResult':
          fcName = 'confirmResult';
          fcArgs = { question: ga.question };
          if (ga.yesLabel) fcArgs.yesLabel = ga.yesLabel;
          if (ga.noLabel) fcArgs.noLabel = ga.noLabel;
          break;
      }

      if (fcName) {
        parts.push({ functionCall: { name: fcName, args: fcArgs } });
      }
      contents.push({ role: 'model', parts });

      // Next user message becomes a functionResponse (Gemini requires this after a functionCall)
      if (fcName && i + 1 < history.length && history[i + 1].role === 'user') {
        contents.push({
          role: 'user',
          parts: [{ functionResponse: { name: fcName, response: { result: history[i + 1].text } } }]
        });
        skipIndices.add(i + 1);
      }
    } else {
      // Regular message
      const parts: any[] = [{ text: msg.text }];
      if (msg.image) {
        const base64Data = msg.image.includes('base64,') ? msg.image.split('base64,')[1] : msg.image;
        parts.push({ inlineData: { mimeType: "image/jpeg", data: base64Data } });
      }
      contents.push({ role: isModel ? 'model' : 'user', parts });
    }
  }
  return contents;
}

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
router.post("/generate-case-name", validate(generateCaseNameSchema), async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

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
router.post("/chat", validate(aiChatSchema), async (req: Request, res: Response) => {
  try {
    const { history, message, image, deviceContext, agentName } = req.body;

    // Fetch user context for personalization (graceful degradation on failure)
    let userContext: UserContext | null = null;
    const userId = (req as any).user?.id;
    if (userId) {
      userContext = await fetchUserContext(userId);
    }

    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = "gemini-2.0-flash";

    const contents = buildContents(history);

    const currentParts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [{ text: message }];
    if (image) {
      const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;
      currentParts.push({ inlineData: { mimeType: "image/jpeg", data: base64Data } });
    }
    contents.push({ role: 'user', parts: currentParts });

    const systemPrompt = SYSTEM_INSTRUCTION(agentName, userContext);
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: deviceContext
          ? systemPrompt + `\n\nDEVICE CONTEXT: ${deviceContext}`
          : systemPrompt,
        temperature: 0.4,
        tools: [{ functionDeclarations: [endSessionTool, presentChoicesTool, showStepTool, confirmResultTool] }]
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
router.post("/chat-live-agent", validate(aiChatLiveAgentSchema), async (req: Request, res: Response) => {
  try {
    const { history, message, agent, image } = req.body;

    // Fetch user context for personalization (graceful degradation on failure)
    let userContext: UserContext | null = null;
    const userId = (req as any).user?.id;
    if (userId) {
      userContext = await fetchUserContext(userId);
    }

    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = "gemini-2.0-flash";
    const agentFullName = `${agent.first} ${agent.last}`;

    const contents = buildContents(history);

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
        systemInstruction: LIVE_AGENT_INSTRUCTION(agentFullName, userContext),
        temperature: 0.7,
        tools: [{ functionDeclarations: [endSessionTool, presentChoicesTool, showStepTool, confirmResultTool] }]
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
router.post("/voice-message", validate(voiceMessageSchema), async (req: Request, res: Response) => {
  try {
    const { history, text, photo } = req.body;

    // Fetch user context for personalization (graceful degradation on failure)
    let userContext: UserContext | null = null;
    const userId = (req as any).user?.id;
    if (userId) {
      userContext = await fetchUserContext(userId);
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
        systemInstruction: VOICE_MODE_INSTRUCTION(undefined, userContext),
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
router.post("/voice-summary", validate(voiceSummarySchema), async (req: Request, res: Response) => {
  try {
    const { transcript, photoCount } = req.body;

    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = "gemini-2.0-flash";

    const transcriptText = transcript
      .map((e: any) => `${e.role === 'user' ? 'User' : 'Support'}: ${e.text}`)
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
router.post("/case-summary", validate(caseSummarySchema), async (req: Request, res: Response) => {
  try {
    const { messages, transcripts } = req.body;

    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = "gemini-2.0-flash";

    const messageText = messages
      .map((m: any) => `${m.role === 'user' ? 'User' : 'Support'}: ${m.text}`)
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
router.post("/escalation-report", validate(escalationReportSchema), async (req: Request, res: Response) => {
  try {
    const { messages, deviceContext, voiceTranscripts } = req.body;

    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = "gemini-2.0-flash";

    const messageText = messages
      .map((m: any) => `${m.role === 'user' ? 'User' : 'Support'}: ${m.text}`)
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
- scoutAnalysis: Our support team's assessment of the issue and why it needs human help (2-3 sentences)
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
