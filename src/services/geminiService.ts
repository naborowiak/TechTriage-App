import { ChatMessage, UserRole } from "../types";
import { VoiceTranscriptEntry } from "../hooks/useVoiceSession";

// All Gemini API calls are proxied through the server to keep the API key secure.
// Endpoints are defined in server/routes/ai.ts

export const sendMessageToGemini = async (
  history: ChatMessage[],
  newMessage: string,
  image?: string,
  deviceContext?: string,
  agentName?: string
): Promise<{ text: string, functionCall?: { name: string; args: Record<string, unknown> } }> => {
  try {
    const historyPayload = history.map(msg => ({
      role: msg.role === UserRole.USER ? 'user' : 'model',
      text: msg.text,
      image: msg.image,
      guidedAction: msg.guidedAction,
    }));

    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        history: historyPayload,
        message: newMessage,
        image,
        deviceContext,
        agentName,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { text: err.text || "I apologize, but I'm currently unable to process your request." };
    }

    return await res.json();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "I apologize, but I'm currently unable to process your request." };
  }
};

export const sendMessageAsLiveAgent = async (
  history: ChatMessage[],
  newMessage: string,
  agent: { first: string; last: string },
  image?: string
): Promise<{ text: string, functionCall?: { name: string; args: Record<string, unknown> } }> => {
  try {
    const historyPayload = history.map(msg => ({
      role: msg.role === UserRole.USER ? 'user' : 'model',
      text: msg.text,
      image: msg.image,
      guidedAction: msg.guidedAction,
    }));

    const res = await fetch('/api/ai/chat-live-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        history: historyPayload,
        message: newMessage,
        agent,
        image,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { text: err.text || "I'm having some technical difficulties on my end. Give me just a moment..." };
    }

    return await res.json();
  } catch (error) {
    console.error("Gemini API Error (Live Agent):", error);
    return { text: "I'm having some technical difficulties on my end. Give me just a moment..." };
  }
};

export const sendVoiceMessage = async (
  history: VoiceTranscriptEntry[],
  userText: string,
  photo?: string
): Promise<{ text: string; photoRequest: boolean; photoPrompt?: string }> => {
  try {
    const historyPayload = history.map(entry => ({
      role: entry.role,
      text: entry.text,
      timestamp: entry.timestamp,
    }));

    const res = await fetch('/api/ai/voice-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        history: historyPayload,
        text: userText,
        photo,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        text: err.text || "I'm having a bit of trouble connecting. Could you repeat that?",
        photoRequest: false,
      };
    }

    return await res.json();
  } catch (error) {
    console.error("Gemini API Error (Voice Mode):", error);
    return {
      text: "I'm having a bit of trouble connecting. Could you repeat that?",
      photoRequest: false,
    };
  }
};

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
    const res = await fetch('/api/ai/voice-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ transcript, photoCount }),
    });

    if (!res.ok) {
      throw new Error('Voice summary request failed');
    }

    return await res.json();
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

export const generateCaseSummary = async (
  messages: Array<{ role: string; text: string; timestamp: number }>,
  transcripts?: string[]
): Promise<{
  problem: string;
  analysis: string;
  recommendedFix: string;
  nextSteps: string[];
}> => {
  try {
    const res = await fetch('/api/ai/case-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ messages, transcripts }),
    });

    if (!res.ok) {
      throw new Error('Case summary request failed');
    }

    return await res.json();
  } catch (error) {
    console.error("Gemini API Error (Case Summary):", error);
    return {
      problem: 'Technical issue',
      analysis: 'Session completed.',
      recommendedFix: 'See conversation transcript for details.',
      nextSteps: ['Review the conversation transcript'],
    };
  }
};

export const generateEscalationReport = async (
  messages: Array<{ role: string; text: string; timestamp: number }>,
  deviceContext?: string,
  voiceTranscripts?: string[]
): Promise<{
  problemDescription: string;
  stepsTried: string[];
  scoutAnalysis: string;
  recommendedSpecialist: string;
  urgencyLevel: string;
  photosIncluded: number;
  estimatedCostRange: string;
}> => {
  try {
    const res = await fetch('/api/ai/escalation-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ messages, deviceContext, voiceTranscripts }),
    });

    if (!res.ok) {
      throw new Error('Escalation report request failed');
    }

    return await res.json();
  } catch (error) {
    console.error("Gemini API Error (Escalation Report):", error);
    return {
      problemDescription: 'Issue requires professional assessment.',
      stepsTried: ['Remote troubleshooting attempted'],
      scoutAnalysis: 'This issue requires hands-on professional diagnosis.',
      recommendedSpecialist: 'General Technician',
      urgencyLevel: 'medium',
      photosIncluded: 0,
      estimatedCostRange: '$100-300',
    };
  }
};

export const generateCaseName = async (message: string): Promise<string> => {
  try {
    const res = await fetch('/api/ai/generate-case-name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message }),
    });

    if (!res.ok) return '';
    const data = await res.json();
    return data.caseName || '';
  } catch {
    return '';
  }
};
