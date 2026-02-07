import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Mic,
  MicOff,
  PhoneOff,
  CheckCircle,
  Radio,
  MessageSquare,
  ChevronRight,
  User,
  Download,
  Copy,
  FileText,
  History,
  LifeBuoy,
  Flashlight,
  FlashlightOff,
  Mail,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { Logo } from "./Logo";
import jsPDF from "jspdf";

interface LiveSupportProps {
  onClose: () => void;
  userId?: string;
  userEmail?: string;
  userName?: string;
  caseId?: string; // <--- ADDED THIS PROP
}

interface TranscriptEntry {
  role: "user" | "model";
  text: string;
  timestamp: number;
}

const Button: React.FC<{
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "danger" | "gold" | "glass" | "outline";
  onClick?: () => void;
  disabled?: boolean;
}> = ({
  children,
  className = "",
  variant = "gold",
  onClick,
  disabled = false,
}) => {
  const themes = {
    primary:
      "bg-electric-indigo hover:bg-[#4F46E5] text-white shadow-lg shadow-electric-indigo/20",
    danger:
      "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20",
    gold: "bg-electric-indigo hover:bg-[#4F46E5] text-white shadow-lg shadow-electric-indigo/20",
    glass:
      "bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10",
    outline:
      "bg-transparent border-2 border-gray-200 text-gray-600 hover:border-electric-indigo hover:text-electric-indigo",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-8 py-4 rounded-[1.5rem] font-bold uppercase tracking-widest text-[10px] transition-all duration-300 active:scale-95 flex items-center justify-center gap-3 ${themes[variant]} ${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
};

const BotAvatar = ({ className }: { className: string }) => {
  const [error, setError] = useState(false);
  if (error) return <LifeBuoy className={className} />;
  return (
    <img
      src="/total_assist_logo-new.png"
      className={`${className} object-contain`}
      alt="AI"
      onError={() => setError(true)}
    />
  );
};

export const LiveSupport: React.FC<LiveSupportProps> = ({
  onClose,
  userId,
  userEmail,
  userName,
  caseId,
}) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const isSessionEndedRef = useRef(false);
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<"listening" | "thinking" | "speaking">(
    "listening",
  );
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [transcriptHistory, setTranscriptHistory] = useState<TranscriptEntry[]>(
    [],
  );
  const [isCopied, setIsCopied] = useState(false);
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const [hasFlashlight, setHasFlashlight] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<Promise<unknown> | null>(null);

  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const stopAllHardware = () => {
    if (animationFrameRef.current)
      cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current)
      streamRef.current.getTracks().forEach((t) => t.stop());
    if (audioContextRef.current && audioContextRef.current.state !== "closed")
      audioContextRef.current.close();
    if (
      inputAudioContextRef.current &&
      inputAudioContextRef.current.state !== "closed"
    )
      inputAudioContextRef.current.close();
    if (sessionRef.current) {
      sessionRef.current
        .then((s: unknown) => (s as { close: () => void }).close())
        .catch(() => {});
    }
  };

  const archiveSession = async (
    finalSummary: string,
    history: TranscriptEntry[],
  ) => {
    const sessionData = {
      id: `live-${Date.now()}`,
      title:
        finalSummary.length > 50
          ? `${finalSummary.substring(0, 50)}...`
          : finalSummary,
      date: Date.now(),
      type: "video" as const,
      summary: finalSummary,
      transcript: history.map((entry) => ({
        role: entry.role,
        text: entry.text,
        timestamp: entry.timestamp,
      })),
    };

    // Save to localStorage as fallback
    const existing = JSON.parse(
      localStorage.getItem("totalassist_sessions") || "[]",
    );
    localStorage.setItem(
      "totalassist_sessions",
      JSON.stringify([sessionData, ...existing]),
    );
    window.dispatchEvent(new Event("session_saved"));

    // Save recording to the case if available
    if (caseId) {
      try {
        await fetch(`/api/cases/${caseId}/recordings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            sessionType: "live_video",
            transcript: sessionData.transcript
              .map((t: { role: string; text: string }) => `${t.role}: ${t.text}`)
              .join("\n"),
          }),
        });
      } catch (error) {
        console.error("Failed to save recording to case:", error);
      }
    }
  };

  // Generate a formatted "How-To Guide" PDF from the session
  const generateSessionGuidePDF = (): string => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let yPosition = margin;

    // Helper function to add text with word wrap
    const addWrappedText = (
      text: string,
      fontSize: number,
      isBold: boolean = false,
    ) => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      const lines = doc.splitTextToSize(text, contentWidth);

      for (const line of lines) {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += fontSize * 0.5;
      }
      yPosition += 5;
    };

    // Header
    doc.setFillColor(31, 41, 55); // brand-900
    doc.rect(0, 0, pageWidth, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("Scout", margin, 25);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Your Personal Tech Support Guide", margin, 33);

    yPosition = 55;
    doc.setTextColor(31, 41, 55);

    // Title
    addWrappedText("Session Summary & How-To Guide", 18, true);
    yPosition += 5;

    // Date and user info
    doc.setTextColor(107, 114, 128);
    addWrappedText(
      `Date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`,
      10,
    );
    if (userName) {
      addWrappedText(`Prepared for: ${userName}`, 10);
    }
    // Add Case ID to PDF if available
    if (caseId) {
      addWrappedText(`Case Ref: #${caseId.slice(0, 8)}`, 10);
    }
    yPosition += 10;

    // Summary section
    doc.setTextColor(249, 115, 22); // cta-500
    addWrappedText("ISSUE SUMMARY", 12, true);
    doc.setTextColor(31, 41, 55);
    addWrappedText(summary || "No summary available", 11);
    yPosition += 10;

    // Extract key steps from the transcript
    const aiMessages = transcriptHistory.filter((e) => e.role === "model");
    const userMessages = transcriptHistory.filter((e) => e.role === "user");

    // Conversation overview
    doc.setTextColor(249, 115, 22);
    addWrappedText("WHAT WE DISCUSSED", 12, true);
    doc.setTextColor(31, 41, 55);

    if (userMessages.length > 0) {
      addWrappedText(
        `You described: "${userMessages[0]?.text?.substring(0, 200)}${userMessages[0]?.text?.length > 200 ? "..." : ""}"`,
        10,
      );
      yPosition += 5;
    }

    // Key instructions/steps section
    doc.setTextColor(249, 115, 22);
    addWrappedText("STEP-BY-STEP GUIDE", 12, true);
    doc.setTextColor(31, 41, 55);

    let stepNumber = 1;
    for (const msg of aiMessages) {
      // Skip very short messages
      if (msg.text.length < 20) continue;

      addWrappedText(`Step ${stepNumber}: ${msg.text}`, 10);
      yPosition += 3;
      stepNumber++;

      // Limit to 10 steps for readability
      if (stepNumber > 10) break;
    }

    yPosition += 10;

    // Full transcript section
    doc.setTextColor(249, 115, 22);
    addWrappedText("FULL CONVERSATION TRANSCRIPT", 12, true);
    doc.setTextColor(31, 41, 55);

    for (const entry of transcriptHistory) {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      const speaker = entry.role === "user" ? "You" : "Scout AI";
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`[${time}] ${speaker}:`, margin, yPosition);
      yPosition += 5;
      doc.setFont("helvetica", "normal");
      addWrappedText(entry.text, 9);
      yPosition += 3;
    }

    // Footer
    yPosition += 10;
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.text(
      "This guide was automatically generated by Scout AI.",
      margin,
      yPosition,
    );
    yPosition += 4;
    doc.text(
      "For additional support, visit totalassist.ai or start a new session.",
      margin,
      yPosition,
    );
    yPosition += 4;
    doc.text(`Generated: ${new Date().toISOString()}`, margin, yPosition);

    // Return as base64
    return doc.output("datauristring").split(",")[1];
  };

  // Download the PDF guide
  const handleDownloadGuide = () => {
    const pdfBase64 = generateSessionGuidePDF();

    // Create blob from base64
    const byteCharacters = atob(pdfBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Scout_Guide_${new Date().toISOString().split("T")[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Send the guide via email
  const handleSendGuideEmail = async () => {
    if (!userEmail) {
      setEmailError("No email address available");
      return;
    }

    setIsSendingEmail(true);
    setEmailError(null);

    try {
      const pdfBase64 = generateSessionGuidePDF();

      const response = await fetch("/api/send-session-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: userEmail,
          userName: userName || "Valued Customer",
          summary: summary,
          pdfBase64: pdfBase64,
          sessionDate: new Date().toISOString(),
          caseId, // Include caseId in email log
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      setEmailSent(true);
    } catch (error) {
      console.error("Error sending guide email:", error);
      setEmailError("Failed to send email. Please try downloading instead.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDownloadReport = () => {
    const header = `SCOUT VIDEO DIAGNOSTIC REPORT\nDate: ${new Date().toLocaleString()}\nCase ID: ${caseId || "N/A"}\nSummary: ${summary}\n\nCONVERSATION TRANSCRIPT:\n`;
    const body = transcriptHistory
      .map(
        (e) =>
          `[${new Date(e.timestamp).toLocaleTimeString()}] ${e.role.toUpperCase()}: ${e.text}`,
      )
      .join("\n\n");
    const footer = `\n\n--- END OF REPORT ---\nSecurity Verified By Scout AI`;

    const blob = new Blob([header + body + footer], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Scout_Report_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(summary);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    isMutedRef.current = newMuteState;
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !newMuteState;
      });
    }
  };

  const toggleFlashlight = async () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      const newState = !isFlashlightOn;
      await videoTrack.applyConstraints({
        advanced: [{ torch: newState } as MediaTrackConstraintSet],
      });
      setIsFlashlightOn(newState);
    } catch (e) {
      console.error("Flashlight toggle failed:", e);
    }
  };

  const drawWaveform = () => {
    if (!mountedRef.current || !waveformCanvasRef.current) return;
    const canvas = waveformCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const audioCtx = audioContextRef.current;
    const currentlySpeaking =
      audioCtx && audioCtx.currentTime < nextStartTimeRef.current + 0.15;

    if (currentlySpeaking !== isAiSpeaking) {
      setIsAiSpeaking(!!currentlySpeaking);
      setStatus(currentlySpeaking ? "speaking" : "listening");
    }

    const analyser = currentlySpeaking
      ? outputAnalyserRef.current
      : inputAnalyserRef.current;

    if (!analyser || (isMutedRef.current && !currentlySpeaking)) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      animationFrameRef.current = requestAnimationFrame(drawWaveform);
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height;
      const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
      if (currentlySpeaking) {
        gradient.addColorStop(0, "#A855F7");
        gradient.addColorStop(1, "#6366F1");
      } else {
        gradient.addColorStop(0, "#06B6D4");
        gradient.addColorStop(1, "#6366F1");
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
      x += barWidth + 1;
    }
    animationFrameRef.current = requestAnimationFrame(drawWaveform);
  };

  useEffect(() => {
    if (isTranscriptOpen) {
      transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcriptHistory, isTranscriptOpen]);

  useEffect(() => {
    let mounted = true;
    let ws: WebSocket | null = null;
    let scriptProcessor: ScriptProcessorNode | null = null;
    let videoIntervalId: ReturnType<typeof setInterval> | null = null;

    // Target sample rate for Gemini API
    const TARGET_SAMPLE_RATE = 16000;

    // Downsample audio from native rate to 16kHz using linear interpolation
    const downsampleBuffer = (
      buffer: Float32Array,
      inputSampleRate: number,
      outputSampleRate: number,
    ): Float32Array => {
      if (inputSampleRate === outputSampleRate) {
        return buffer;
      }
      const ratio = inputSampleRate / outputSampleRate;
      const newLength = Math.round(buffer.length / ratio);
      const result = new Float32Array(newLength);

      for (let i = 0; i < newLength; i++) {
        const srcIndex = i * ratio;
        const srcIndexFloor = Math.floor(srcIndex);
        const srcIndexCeil = Math.min(srcIndexFloor + 1, buffer.length - 1);
        const lerp = srcIndex - srcIndexFloor;
        result[i] =
          buffer[srcIndexFloor] * (1 - lerp) + buffer[srcIndexCeil] * lerp;
      }
      return result;
    };

    // Convert Float32Array to little-endian 16-bit PCM
    const floatTo16BitPCM = (float32Array: Float32Array): ArrayBuffer => {
      const buffer = new ArrayBuffer(float32Array.length * 2);
      const view = new DataView(buffer);
      for (let i = 0; i < float32Array.length; i++) {
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        // Convert to 16-bit signed integer, little-endian
        view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      }
      return buffer;
    };

    // Convert ArrayBuffer to base64 string
    const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    };

    // Play incoming audio from Gemini (16kHz PCM)
    const playAudio = (base64Audio: string) => {
      if (!audioContextRef.current || audioContextRef.current.state === "closed") return;

      try {
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Convert 16-bit PCM to Float32
        const pcmData = new Int16Array(bytes.buffer);
        const float32Data = new Float32Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
          float32Data[i] = pcmData[i] / 32768;
        }

        // Create audio buffer at 24kHz (Gemini native audio model output rate)
        const audioBuffer = audioContextRef.current.createBuffer(
          1,
          float32Data.length,
          24000,
        );
        audioBuffer.getChannelData(0).set(float32Data);

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;

        // Connect to analyser for visualization
        if (outputAnalyserRef.current) {
          source.connect(outputAnalyserRef.current);
          outputAnalyserRef.current.connect(
            audioContextRef.current.destination,
          );
        } else {
          source.connect(audioContextRef.current.destination);
        }

        // Schedule playback
        const startTime = Math.max(
          audioContextRef.current.currentTime,
          nextStartTimeRef.current,
        );
        source.start(startTime);
        nextStartTimeRef.current = startTime + audioBuffer.duration;
      } catch (err) {
        console.error("Error playing audio:", err);
      }
    };

    // Capture video frame and send to backend
    const captureAndSendFrame = () => {
      if (
        !canvasRef.current ||
        !videoRef.current ||
        !ws ||
        ws.readyState !== WebSocket.OPEN
      )
        return;

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size to match video (scaled down for efficiency)
      canvas.width = 640;
      canvas.height = 480;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to JPEG and send
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      const base64 = dataUrl.split(",")[1];

      ws.send(
        JSON.stringify({
          type: "image",
          data: base64,
        }),
      );
    };

    const start = async () => {
      try {
        // Get media stream - don't hardcode sampleRate for AudioContext
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (!mounted) return;

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Check for flashlight capability
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities =
            videoTrack.getCapabilities() as MediaTrackCapabilities & {
              torch?: boolean;
            };
          if (capabilities.torch) {
            setHasFlashlight(true);
          }
        }

        // Create AudioContext for input processing (let browser choose native rate)
        const inputAudioContext = new AudioContext();
        inputAudioContextRef.current = inputAudioContext;
        const nativeSampleRate = inputAudioContext.sampleRate;
        console.log(`Native audio sample rate: ${nativeSampleRate}Hz`);

        // Create AudioContext for output playback
        const outputAudioContext = new AudioContext();
        audioContextRef.current = outputAudioContext;

        // Setup input analyser for visualization
        const inputAnalyser = inputAudioContext.createAnalyser();
        inputAnalyser.fftSize = 256;
        inputAnalyserRef.current = inputAnalyser;

        // Setup output analyser for visualization
        const outputAnalyser = outputAudioContext.createAnalyser();
        outputAnalyser.fftSize = 256;
        outputAnalyserRef.current = outputAnalyser;

        // Connect microphone to processor
        const source = inputAudioContext.createMediaStreamSource(stream);
        source.connect(inputAnalyser);

        // Use ScriptProcessorNode for audio capture (buffer size 4096 works well)
        scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
        inputAnalyser.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioContext.destination);

        // Connect to WebSocket backend with userId and caseId
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const baseWsUrl = `${protocol}//${window.location.host}/live`;

        // >>> UPDATED: Pass caseId in query params
        const params = new URLSearchParams();
        if (userId) params.append("userId", userId);
        if (caseId) params.append("caseId", caseId);

        const wsUrl = `${baseWsUrl}?${params.toString()}`;
        console.log(`Connecting to WebSocket: ${wsUrl}`);

        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("WebSocket connected");
          setStatus("listening");
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            if (message.type === "ready") {
              console.log("Gemini session ready");
              setIsConnecting(false);

              // Start sending video frames every 2 seconds
              videoIntervalId = setInterval(captureAndSendFrame, 2000);
            } else if (message.type === "audio") {
              setStatus("speaking");
              playAudio(message.data);
            } else if (message.type === "aiTranscript") {
              console.log("AI said:", message.data);
              // Add AI's spoken words to transcript
              setTranscriptHistory((prev) => [
                ...prev,
                {
                  role: "model",
                  text: message.data,
                  timestamp: Date.now(),
                },
              ]);
            } else if (message.type === "userTranscript") {
              console.log("User said:", message.data);
              // Add user's spoken words to transcript
              setTranscriptHistory((prev) => [
                ...prev,
                {
                  role: "user",
                  text: message.data,
                  timestamp: Date.now(),
                },
              ]);
            } else if (message.type === "turnComplete") {
              setStatus("listening");
            } else if (message.type === "error") {
              console.error("Server error:", message.message);
              setConnectionError(message.message || "An error occurred with the AI service.");
              setIsConnecting(false);
            } else if (message.type === "endSession") {
              console.log("Session ended:", message.summary);
              const finalSummary = message.summary || "Session completed";
              setSummary(finalSummary);
              setIsSessionEnded(true);
              isSessionEndedRef.current = true;
              setStatus("listening");
              // Stop hardware when session ends
              stopAllHardware();
              // Archive the session to history - use a callback to get latest transcript
              setTranscriptHistory((currentHistory) => {
                archiveSession(finalSummary, currentHistory);
                return currentHistory;
              });
            }
          } catch (err) {
            console.error("Error parsing WebSocket message:", err);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          if (mounted) {
            setConnectionError("Failed to connect to AI service. Please check your connection and try again.");
            setIsConnecting(false);
          }
        };

        ws.onclose = (event) => {
          console.log("WebSocket closed", event.code, event.reason);
          if (mounted && !isSessionEndedRef.current) {
            // Only show error if closed unexpectedly (not a clean close)
            if (event.code !== 1000) {
              setConnectionError("Connection to AI service was lost. Please try again.");
            }
          }
        };

        // Process audio and send to backend
        scriptProcessor.onaudioprocess = (e) => {
          if (!ws || ws.readyState !== WebSocket.OPEN) return;
          if (isMutedRef.current) return;

          const inputData = e.inputBuffer.getChannelData(0);

          // Downsample from native rate to 16kHz
          const downsampled = downsampleBuffer(
            inputData,
            nativeSampleRate,
            TARGET_SAMPLE_RATE,
          );

          // Convert to 16-bit little-endian PCM
          const pcmBuffer = floatTo16BitPCM(downsampled);

          // Convert to base64 and send
          const base64 = arrayBufferToBase64(pcmBuffer);

          ws.send(
            JSON.stringify({
              type: "audio",
              data: base64,
            }),
          );
        };

        // Start waveform visualization
        animationFrameRef.current = requestAnimationFrame(drawWaveform);
      } catch (e: unknown) {
        console.error("Error starting live support:", e);
        const errMsg = e instanceof DOMException && e.name === "NotAllowedError"
          ? "Camera and microphone access is required for video support. Please allow access in your browser settings and try again."
          : e instanceof DOMException && e.name === "NotFoundError"
            ? "No camera or microphone found. Please connect a camera and try again."
            : "Failed to start video session. Please check your camera/microphone permissions.";
        if (mounted) {
          setConnectionError(errMsg);
          setIsConnecting(false);
        }
      }
    };

    start();

    return () => {
      mounted = false;
      mountedRef.current = false;
      if (videoIntervalId) clearInterval(videoIntervalId);
      if (scriptProcessor) {
        scriptProcessor.disconnect();
        scriptProcessor.onaudioprocess = null;
      }
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      stopAllHardware();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-midnight-900 flex flex-col overflow-hidden">
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${isSessionEnded ? "opacity-20 blur-3xl scale-110" : "opacity-100"}`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Connecting overlay */}
        {isConnecting && !connectionError && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-midnight-900/90 backdrop-blur-sm">
            <Loader2 className="w-12 h-12 text-electric-indigo animate-spin mb-4" />
            <p className="text-white font-bold text-lg tracking-wide">Connecting to Scout AI...</p>
            <p className="text-white/50 text-sm mt-2">Setting up camera and microphone</p>
          </div>
        )}

        {/* Error overlay */}
        {connectionError && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-midnight-900/95 backdrop-blur-sm px-8">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
              <X className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-white font-bold text-lg tracking-wide text-center mb-2">Connection Failed</p>
            <p className="text-white/60 text-sm text-center max-w-md mb-8">{connectionError}</p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setConnectionError(null);
                  setIsConnecting(true);
                  window.location.reload();
                }}
                className="px-6 py-3 bg-electric-indigo hover:bg-[#4F46E5] text-white rounded-full font-bold text-xs uppercase tracking-widest transition-all"
              >
                Try Again
              </button>
              <button
                onClick={() => { stopAllHardware(); onClose(); }}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold text-xs uppercase tracking-widest transition-all"
              >
                Go Back
              </button>
            </div>
          </div>
        )}

        <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start bg-gradient-to-b from-midnight-900/80 to-transparent z-20">
          <div className="flex items-center gap-3">
            <Logo variant="light" />
            {caseId && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 backdrop-blur-sm">
                <FolderOpen className="w-3 h-3 text-electric-indigo" />
                <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
                  Case #{caseId.slice(0, 8)}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
              className={`p-4 rounded-full text-white backdrop-blur-md transition-all ${isTranscriptOpen ? "bg-electric-indigo" : "bg-white/10 hover:bg-white/20"}`}
            >
              <MessageSquare className="w-6 h-6" />
            </button>
            <button
              onClick={() => {
                stopAllHardware();
                onClose();
              }}
              className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div
          className={`absolute top-0 bottom-0 right-0 w-full md:w-[450px] bg-midnight-900/95 backdrop-blur-2xl shadow-2xl z-30 transition-transform duration-500 ease-in-out border-l border-white/5 flex flex-col ${isTranscriptOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
            <div>
              <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-1">
                Session Transcript
              </h3>
              <div className="flex items-center gap-1.5">
                {isSessionEnded ? (
                  <CheckCircle className="w-1.5 h-1.5 text-green-500" />
                ) : (
                  <div className="w-1.5 h-1.5 bg-electric-indigo rounded-full animate-pulse"></div>
                )}
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                  {isSessionEnded ? "Session Archived" : "Recording Active"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsTranscriptOpen(false)}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {transcriptHistory.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                <Radio className="w-12 h-12 text-white mb-4 animate-pulse" />
                <p className="text-white text-xs font-bold uppercase tracking-widest">
                  Awaiting Audio Feed...
                </p>
              </div>
            )}
            {transcriptHistory.map((entry, i) => (
              <div
                key={i}
                className={`flex flex-col ${entry.role === "user" ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-2 mb-2 opacity-40">
                  {entry.role === "model" ? (
                    <BotAvatar className="w-3 h-3" />
                  ) : (
                    <User className="w-3 h-3 text-white" />
                  )}
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white">
                    {entry.role === "model" ? "Scout" : (userName || "You")}
                  </span>
                </div>
                <div
                  className={`max-w-[90%] p-4 rounded-[1.5rem] text-sm font-medium leading-relaxed ${entry.role === "user" ? "bg-electric-indigo text-white border border-[#4F46E5] rounded-tr-none" : "bg-white/5 text-white/90 border border-white/10 rounded-tl-none"}`}
                >
                  {entry.text}
                </div>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
          {isSessionEnded && (
            <div className="p-4 bg-electric-indigo/10 border-t border-electric-indigo/20">
              <button
                onClick={handleDownloadReport}
                className="w-full py-3 flex items-center justify-center gap-2 text-electric-indigo font-bold text-[10px] uppercase tracking-widest hover:text-white transition-colors"
              >
                <Download className="w-4 h-4" /> Download This Transcript
              </button>
            </div>
          )}
          <div className="p-8 bg-black/20 border-t border-white/5">
            <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] text-center">
              End-to-End Encrypted Session
            </div>
          </div>
        </div>

        {!isSessionEnded && (
          <div className="absolute bottom-40 left-0 right-0 flex flex-col items-center pointer-events-none px-8 z-10">
            <div
              className={`bg-midnight-900/40 backdrop-blur-3xl px-10 py-6 rounded-[3rem] border border-white/10 shadow-2xl flex items-center gap-8 w-full max-w-lg transition-all duration-500 pointer-events-auto ${isTranscriptOpen ? "md:mr-[450px]" : ""}`}
            >
              <div className="flex-1 h-12 overflow-hidden">
                <canvas
                  ref={waveformCanvasRef}
                  width={300}
                  height={48}
                  className="w-full h-full"
                />
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-electric-indigo uppercase tracking-[0.2em] mb-1">
                  Status
                </div>
                <div className="text-white font-black tracking-tight text-lg uppercase">
                  {status}
                </div>
              </div>
            </div>
          </div>
        )}

        {isSessionEnded && (
          <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-10 animate-fade-in-up z-40 overflow-y-auto">
            <div className="bg-white rounded-[3rem] sm:rounded-[4rem] p-10 sm:p-16 max-w-2xl w-full shadow-2xl border border-gray-100 my-auto">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-100">
                <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
              </div>
              <h3 className="text-3xl sm:text-4xl font-black text-midnight-900 mb-4 tracking-tighter uppercase text-center">
                Triage Complete
              </h3>

              <div className="bg-gray-50 rounded-[2rem] p-8 mb-10 border border-gray-100 relative group">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <FileText className="w-3 h-3" /> Diagnostic Summary
                </div>
                <p className="text-gray-700 text-base sm:text-lg font-bold leading-relaxed pr-10">
                  {summary ||
                    "Analysis successfully completed. Session archived."}
                </p>
                <button
                  onClick={handleCopySummary}
                  className="absolute top-8 right-8 p-2 text-gray-400 hover:text-electric-indigo transition-colors"
                >
                  {isCopied ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Button
                  variant="primary"
                  onClick={handleDownloadGuide}
                  className="w-full"
                >
                  <Download className="w-4 h-4" /> Download PDF Guide
                </Button>
                {userEmail && !emailSent && (
                  <Button
                    variant="outline"
                    onClick={handleSendGuideEmail}
                    className="w-full"
                    disabled={isSendingEmail}
                  >
                    {isSendingEmail ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" /> Email Guide
                      </>
                    )}
                  </Button>
                )}
                {emailSent && (
                  <div className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-green-50 rounded-[1.5rem] border-2 border-green-200 text-green-700 font-bold text-[10px] uppercase tracking-widest">
                    <CheckCircle className="w-4 h-4" /> Guide Sent!
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={() => setIsTranscriptOpen(true)}
                  className="w-full"
                >
                  <MessageSquare className="w-4 h-4" /> Review Chat
                </Button>
                <Button
                  variant="gold"
                  onClick={onClose}
                  className="w-full sm:col-span-2 mt-2"
                >
                  <History className="w-4 h-4" /> Finish & Exit
                </Button>
              </div>

              {emailError && (
                <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200 text-red-700 text-sm text-center">
                  {emailError}
                </div>
              )}

              <div className="mt-8 text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {emailSent ? (
                    <>
                      Your guide has been sent to{" "}
                      <span className="text-electric-indigo">{userEmail}</span>
                    </>
                  ) : (
                    <>
                      A full recap has been saved to your{" "}
                      <span className="text-electric-indigo underline">Archive</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {!isSessionEnded && (
        <div className="h-32 bg-midnight-900 flex items-center justify-center gap-6 px-8 border-t border-white/5 z-40">
          <button
            onClick={toggleMute}
            className={`p-6 rounded-full transition-all duration-300 ${isMuted ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
          >
            {isMuted ? (
              <MicOff className="w-7 h-7" />
            ) : (
              <Mic className="w-7 h-7" />
            )}
          </button>
          {hasFlashlight && (
            <button
              onClick={toggleFlashlight}
              className={`p-6 rounded-full transition-all duration-300 ${isFlashlightOn ? "bg-yellow-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
            >
              {isFlashlightOn ? (
                <Flashlight className="w-7 h-7" />
              ) : (
                <FlashlightOff className="w-7 h-7" />
              )}
            </button>
          )}
          <button
            onClick={() => {
              stopAllHardware();
              onClose();
            }}
            className="px-10 py-5 bg-red-600 rounded-full text-white font-bold uppercase tracking-widest text-xs flex items-center gap-3 shadow-2xl shadow-red-900/40 hover:scale-105 transition-all"
          >
            <PhoneOff className="w-5 h-5" /> End Session
          </button>
        </div>
      )}
    </div>
  );
};
