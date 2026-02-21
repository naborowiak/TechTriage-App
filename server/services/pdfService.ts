import puppeteer from "puppeteer-core";
import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Pre-load logo as base64 for HTML embedding
let logoBase64: string = "";
try {
  const logoPath = resolve(__dirname, "../../public/total_assist-new-white.png");
  const logoBuffer = readFileSync(logoPath);
  logoBase64 = "data:image/png;base64," + logoBuffer.toString("base64");
} catch {
  // Fallback handled in template
}

// Chromium binary discovery
function findChromium(): string {
  // 1. Explicit env var
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;

  // 2. Nix store scan — programmatic (fast, avoids shell glob timeout)
  try {
    const nixStore = "/nix/store";
    if (existsSync(nixStore)) {
      const entries = readdirSync(nixStore);
      const chromiumBins: { path: string; version: number[] }[] = [];
      for (const entry of entries) {
        if (!entry.includes("chromium") || entry.endsWith(".drv")) continue;
        const binPath = resolve(nixStore, entry, "bin", "chromium");
        if (existsSync(binPath)) {
          // Extract version number (e.g., "chromium-138.0.7204.100" → [138,0,7204,100])
          const vMatch = entry.match(/chromium-(\d+(?:\.\d+)*)/);
          const version = vMatch ? vMatch[1].split(".").map(Number) : [0];
          chromiumBins.push({ path: binPath, version });
        }
      }
      if (chromiumBins.length > 0) {
        // Sort by version descending, pick newest
        chromiumBins.sort((a, b) => {
          for (let i = 0; i < Math.max(a.version.length, b.version.length); i++) {
            const diff = (b.version[i] || 0) - (a.version[i] || 0);
            if (diff !== 0) return diff;
          }
          return 0;
        });
        return chromiumBins[0].path;
      }
    }
  } catch {}

  // 3. Puppeteer/Playwright cached Chrome
  const cachedPaths = [
    resolve(__dirname, "../../.cache/puppeteer/chrome/linux-145.0.7632.77/chrome-linux64/chrome"),
    resolve(__dirname, "../../.cache/ms-playwright/chromium-1208/chrome-linux64/chrome"),
  ];
  for (const p of cachedPaths) {
    if (existsSync(p)) return p;
  }

  // 4. System PATH lookup
  try {
    const p = execSync("which chromium chromium-browser google-chrome-stable google-chrome 2>/dev/null | head -1", {
      encoding: "utf8",
      timeout: 3000,
    }).trim();
    if (p) return p;
  } catch {}

  throw new Error("No Chromium binary found. Set CHROMIUM_PATH env var.");
}

let _chromiumPath: string | null = null;
function getChromiumPath(): string {
  if (!_chromiumPath) {
    _chromiumPath = findChromium();
    console.log(`[PDF] Using Chromium at: ${_chromiumPath}`);
  }
  return _chromiumPath;
}

export interface CasePDFData {
  caseId: string;
  title: string;
  status: string;
  sessionMode: string | null;
  aiSummary: string | null;
  escalationReport: {
    problemDescription: string;
    stepsTried: string[];
    scoutAnalysis: string;
    recommendedSpecialist: string;
    urgencyLevel: string;
    photosIncluded: number;
    estimatedCostRange: string;
  } | null;
  messages: Array<{ role: string; text: string; timestamp: number; agentName?: string }>;
  createdAt: string;
  userName?: string;
  userEmail?: string;
  userTimezone?: string;
  agentName?: string;
}

// ============================================
// Helpers
// ============================================

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(iso: string, tz?: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(tz ? { timeZone: tz } : {}),
  };
  return new Date(iso).toLocaleDateString("en-US", opts);
}

function formatTime(ts: number, tz?: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    ...(tz ? { timeZone: tz } : {}),
  };
  return new Date(ts).toLocaleTimeString("en-US", opts);
}

function formatDateTime(ts: number, tz?: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...(tz ? { timeZone: tz } : {}),
  };
  return new Date(ts).toLocaleString("en-US", opts);
}

interface ParsedSection {
  label: string;
  content: string;
}

function parseAISummary(summary: string): ParsedSection[] | null {
  // Match labels at start of line, after newline, or after sentence boundary (". ")
  const labels = "Problem|Analysis|Fix|Resolution|Next Steps?|Recommendation|Action Taken|Cause|Root Cause|Steps Taken|What Happened|What We Found|What We Did|Summary";
  const pattern = new RegExp(
    `(?:^|\\n|(?<=\\.\\s)|(?<=\\.\\s\\n))\\s*(${labels})\\s*:\\s*`,
    "gi"
  );
  const matches = [...summary.matchAll(pattern)];
  if (matches.length < 2) return null;

  const sections: ParsedSection[] = [];
  for (let i = 0; i < matches.length; i++) {
    const label = matches[i][1];
    const start = matches[i].index! + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : summary.length;
    let content = summary.substring(start, end).trim();
    // Clean trailing period-space that precedes next label
    content = content.replace(/\.\s*$/, ".").trim();
    if (content) sections.push({ label, content });
  }
  return sections;
}

function getStatusInfo(status: string): { label: string; color: string; bg: string; icon: string } {
  const s = (status || "resolved").toLowerCase();
  if (s === "escalated" || s === "escalate") {
    return { label: "Escalated", color: "#EF4444", bg: "#FEE2E2", icon: "!" };
  }
  if (s === "in_progress" || s === "partial" || s === "active") {
    return { label: "In Progress", color: "#F59E0B", bg: "#FEF3C7", icon: "~" };
  }
  return { label: "Resolved", color: "#10B981", bg: "#D1FAE5", icon: "✓" };
}

// ============================================
// HTML Template Builder (Glassmorphic Design)
// ============================================

function splitIntoSteps(text: string): string[] {
  const numbered = text.split(/\d+[.)]\s+/).filter(s => s.trim().length > 5);
  if (numbered.length > 1) return numbered.map(s => s.trim().replace(/\.\s*$/, ""));
  const sentences = text.split(/(?<=[.!])\s+/).filter(s => s.trim().length > 10);
  if (sentences.length > 1) return sentences;
  return [text];
}

function buildHTMLReport(data: CasePDFData): string {
  const tz = data.userTimezone;
  const statusInfo = getStatusInfo(data.status);
  const assistedBy =
    data.agentName ||
    data.messages.find((m) => m.role !== "user" && m.agentName)?.agentName ||
    "TotalAssist Support";
  const sessionId = data.caseId.substring(0, 8).toUpperCase();
  const dateStr = formatDate(data.createdAt, tz);
  const sessionMode = data.sessionMode
    ? data.sessionMode.charAt(0).toUpperCase() + data.sessionMode.slice(1)
    : null;
  const modeLabel = sessionMode
    ? sessionMode + (sessionMode.toLowerCase() === "chat" || sessionMode.toLowerCase() === "voice" || sessionMode.toLowerCase() === "video" ? " Mode" : "")
    : null;

  // Duration
  let durationStr = "";
  if (data.messages.length >= 2) {
    const ms = data.messages[data.messages.length - 1].timestamp - data.messages[0].timestamp;
    const mins = Math.max(1, Math.round(ms / 60000));
    durationStr = mins === 1 ? "1 minute" : `${mins} minutes`;
  }

  // Parse AI summary into categorized sections
  const parsedSections = data.aiSummary ? parseAISummary(data.aiSummary) : null;

  const issueTexts: string[] = [];
  const rootCauseTexts: string[] = [];
  const resolutionTexts: string[] = [];
  const nextStepsTexts: string[] = [];

  if (parsedSections) {
    for (const s of parsedSections) {
      const label = s.label.toLowerCase();
      if (["problem", "what happened"].includes(label)) {
        issueTexts.push(s.content);
      } else if (["analysis", "cause", "root cause", "what we found"].includes(label)) {
        rootCauseTexts.push(s.content);
      } else if (["fix", "resolution", "steps taken", "action taken", "what we did"].includes(label)) {
        resolutionTexts.push(s.content);
      } else if (["next steps", "next step", "recommendation", "summary"].includes(label)) {
        nextStepsTexts.push(s.content);
      }
    }
  }

  const issueText = issueTexts.length > 0
    ? issueTexts.join(" ")
    : data.title || (data.aiSummary ? data.aiSummary.split(".")[0] + "." : "Technical issue diagnosed");

  // Status badge colors
  const statusStyleMap: Record<string, { bg: string; border: string; text: string; dot: string; dotShadow: string }> = {
    resolved:    { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.18)", text: "rgba(5,120,80,0.95)", dot: "rgba(16,185,129,0.85)", dotShadow: "rgba(16,185,129,0.14)" },
    escalated:   { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.18)", text: "rgba(153,27,27,0.95)", dot: "rgba(239,68,68,0.85)", dotShadow: "rgba(239,68,68,0.14)" },
    in_progress: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.18)", text: "rgba(146,64,14,0.95)", dot: "rgba(245,158,11,0.85)", dotShadow: "rgba(245,158,11,0.14)" },
  };
  const sc = statusStyleMap[statusInfo.label.toLowerCase().replace(" ", "_")] || statusStyleMap.resolved;

  // Resolution steps
  const resolutionSteps = resolutionTexts.length > 0 ? splitIntoSteps(resolutionTexts.join(" ")) : [];

  // SVG icons (inline — headless Chromium has no emoji fonts)
  const iconOverview = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M14 3v4h4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 11h8M8 15h8M8 19h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
  const iconIssue = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 10v7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M12 7.2h.01" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;
  const iconRootCause = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 18a7.5 7.5 0 1 1 5.3-12.8A7.5 7.5 0 0 1 10.5 18Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 16.2 21 21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M7.9 10.6 9.8 12.5 13.4 8.9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const iconResolution = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 7.8a6 6 0 0 1-8.3 5.5L7.1 19a2 2 0 0 1-2.8 0l-.3-.3a2 2 0 0 1 0-2.8l5.7-5.6A6 6 0 0 1 16.2 3l-2.7 2.7 2.1 2.1L18.3 5A6 6 0 0 1 21 7.8Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
  const iconNextSteps = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const iconEscalation = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="none" stroke="currentColor" stroke-width="1.8"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;
  const iconTranscript = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`;
  const iconCheck = `<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  // Build conditional sections
  const hasRootCause = rootCauseTexts.length > 0;
  const hasResolution = resolutionSteps.length > 0;
  const hasNextSteps = nextStepsTexts.length > 0;
  const hasEscalation = !!data.escalationReport;
  const hasTranscript = data.messages.length > 0;

  // Escalation HTML
  let escalationHTML = "";
  if (hasEscalation) {
    const r = data.escalationReport!;
    const analysisLabel = data.agentName ? `${data.agentName}'s Analysis` : "Support Analysis";
    escalationHTML = `
    <hr class="divider" />
    <section class="section">
      <div class="section__head">
        <div class="icon icon--red">${iconEscalation}</div>
        <div>
          <h2>Escalation Details</h2>
          <p class="muted">This case has been escalated for specialist attention.</p>
        </div>
      </div>
      <div class="escalation-tiles">
        <div class="escalation-tile"><div class="k">Recommended Specialist</div><div class="v">${esc(r.recommendedSpecialist)}</div></div>
        <div class="escalation-tile"><div class="k">Urgency Level</div><div class="v">${esc(r.urgencyLevel)}</div></div>
        ${r.estimatedCostRange ? `<div class="escalation-tile"><div class="k">Estimated Cost</div><div class="v">${esc(r.estimatedCostRange)}</div></div>` : ""}
        ${r.photosIncluded > 0 ? `<div class="escalation-tile"><div class="k">Photos Included</div><div class="v">${r.photosIncluded}</div></div>` : ""}
      </div>
      ${r.stepsTried.length > 0 ? `
        <ul class="checks" style="margin-top: 14px;">
          ${r.stepsTried.map(s => `<li><span class="checkIcon" aria-hidden="true">${iconCheck}</span>${esc(s)}</li>`).join("")}
        </ul>
      ` : ""}
      ${r.scoutAnalysis ? `
        <div class="note" style="margin-top: 12px;">
          <strong>${esc(analysisLabel)}:</strong> ${esc(r.scoutAnalysis)}
        </div>
      ` : ""}
    </section>`;
  }

  // Transcript HTML
  let transcriptHTML = "";
  if (hasTranscript) {
    transcriptHTML = `
    <hr class="divider" />
    <section class="section">
      <div class="section__head">
        <div class="icon icon--amber">${iconTranscript}</div>
        <div>
          <h2>Conversation Transcript</h2>
          <p class="muted">Full session dialogue between client and support agent.</p>
        </div>
      </div>
      <div class="transcript">
        ${data.messages.map((msg) => {
          const agentLabel = msg.agentName || data.agentName || "TotalAssist Support";
          const speaker = msg.role === "user" ? (data.userName?.split(" ")[0] || "You") : agentLabel;
          const time = formatTime(msg.timestamp, tz);
          const isUser = msg.role === "user";
          return `<div class="msg ${isUser ? "msg--user" : "msg--agent"}">
            <div class="msg__head">
              <span class="msg__name">${esc(speaker)}</span>
              <span class="msg__time">${esc(time)}</span>
            </div>
            <div class="msg__text">${esc(msg.text)}</div>
          </div>`;
        }).join("")}
      </div>
    </section>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
:root{
  --bg1:#5B4BFF;
  --bg2:#2AA7FF;
  --ink:#0B1020;
  --muted:#6B7280;
  --card:rgba(255,255,255,0.90);
  --stroke:rgba(255,255,255,0.36);
  --shadow:0 24px 80px rgba(11,16,32,0.25);
  --radius:24px;
  --radius2:18px;
}

*{ box-sizing:border-box; margin:0; padding:0; }
body{
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color:rgba(255,255,255,0.92);
  background: linear-gradient(135deg, var(--bg1), var(--bg2));
  -webkit-font-smoothing: antialiased;
}

.page{
  width: 210mm;
  padding: 30px 18px 50px;
  position:relative;
}

/* Background decor */
.bg{
  position:absolute;
  top:0; left:0; right:0;
  height: 420px;
  overflow:hidden;
  z-index:0;
}
.glow{
  position:absolute;
  width:520px;
  height:520px;
  filter: blur(40px);
  opacity:0.55;
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.55), rgba(255,255,255,0));
}
.glow--tl{ top:-160px; left:-160px; transform:rotate(12deg); }
.glow--tr{ top:-180px; right:-180px; opacity:0.45; }
.glow--br{ bottom:-200px; right:-220px; opacity:0.35; }

.shell{
  width: 100%;
  position:relative;
  z-index:1;
}

/* Hero header */
.hero{
  padding: 10px 6px 18px;
}

.brand{
  display:flex;
  align-items:center;
  gap:14px;
}
.mark{
  width:52px;
  height:52px;
  border-radius:16px;
  background: rgba(255,255,255,0.14);
  border: 1px solid rgba(255,255,255,0.18);
  box-shadow: 0 10px 30px rgba(11,16,32,0.18);
  display:grid;
  place-items:center;
}
.mark svg{ width:30px; height:30px; }

.brand__text{ line-height:1.05; }
.brand__name{
  font-weight:800;
  letter-spacing:-0.02em;
  font-size:22px;
}
.brand__name span{
  font-weight:700;
  opacity:0.95;
}
.brand__tagline{
  margin-top:6px;
  font-size:11px;
  letter-spacing:0.16em;
  opacity:0.78;
}

.titleBlock{
  margin-top: 22px;
}
.titleBlock h1{
  margin:0;
  font-size: 42px;
  letter-spacing:-0.03em;
  line-height:1.06;
}
.titleBlock p{
  margin:10px 0 0;
  opacity:0.86;
  font-size: 15px;
}

/* Meta pills */
.metaRow{
  margin-top: 18px;
  display:flex;
  flex-wrap:wrap;
  gap:10px;
}
.metaPill{
  display:flex;
  gap:10px;
  align-items:baseline;
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(255,255,255,0.14);
  border: 1px solid rgba(255,255,255,0.20);
}
.metaPill span{
  font-size:12px;
  opacity:0.78;
}
.metaPill strong{
  font-size:13px;
  font-weight:700;
  letter-spacing:-0.01em;
}

/* Main glass card */
.card{
  margin-top: 18px;
  background: var(--card);
  color: var(--ink);
  border: 1px solid rgba(255,255,255,0.55);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow:hidden;
}

.section{
  padding: 22px 22px 18px;
}

.section__head{
  display:flex;
  align-items:flex-start;
  gap:12px;
  position:relative;
}
.icon{
  width:42px;
  height:42px;
  border-radius: 14px;
  background: rgba(91,75,255,0.12);
  border: 1px solid rgba(91,75,255,0.14);
  display:grid;
  place-items:center;
  color: rgba(64, 84, 255, 0.95);
  flex-shrink:0;
}
.icon svg{ width:22px; height:22px; }
.icon--green{ background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.14); color: rgba(5,120,80,0.95); }
.icon--amber{ background: rgba(245,158,11,0.12); border-color: rgba(245,158,11,0.14); color: rgba(180,100,10,0.95); }
.icon--red{ background: rgba(239,68,68,0.12); border-color: rgba(239,68,68,0.14); color: rgba(220,38,38,0.95); }

.section__head h2{
  margin:0;
  font-size: 20px;
  letter-spacing:-0.02em;
}
.muted{
  margin:6px 0 0;
  color: var(--muted);
  font-size: 13px;
}

/* Status badge */
.status{
  margin-left:auto;
  display:flex;
  align-items:center;
  gap:8px;
  padding: 10px 12px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 13px;
  white-space:nowrap;
  flex-shrink:0;
}
.statusDot{
  width:10px;
  height:10px;
  border-radius: 999px;
}

/* Tiles grid */
.tiles{
  margin-top: 16px;
  display:grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.tile{
  background: rgba(255,255,255,0.78);
  border: 1px solid rgba(11,16,32,0.06);
  border-radius: var(--radius2);
  padding: 14px 14px;
  box-shadow: 0 10px 28px rgba(11,16,32,0.07);
  page-break-inside: avoid;
}
.k{
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(107,114,128,0.95);
}
.v{
  margin-top:8px;
  font-size: 16px;
  font-weight: 750;
  letter-spacing:-0.01em;
  color: rgba(11,16,32,0.92);
}

/* Divider */
.divider{
  margin:0;
  border:0;
  height:1px;
  background: linear-gradient(90deg, rgba(11,16,32,0.05), rgba(11,16,32,0.10), rgba(11,16,32,0.05));
}

/* Callout */
.callout{
  margin-top: 14px;
  padding: 16px 16px;
  border-radius: 18px;
  border: 1px solid rgba(91,75,255,0.20);
  background:
    linear-gradient(135deg, rgba(91,75,255,0.16), rgba(42,167,255,0.14)),
    radial-gradient(circle at 20% 30%, rgba(255,255,255,0.55), rgba(255,255,255,0));
  position:relative;
  overflow:hidden;
  page-break-inside: avoid;
}
.callout__label{
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: rgba(56, 66, 160, 0.95);
  font-weight: 800;
}
.callout__text{
  margin-top: 10px;
  font-size: 15px;
  font-weight: 650;
  color: rgba(11,16,32,0.86);
  line-height: 1.45;
}

/* Check items */
.checks{
  margin: 14px 0 0;
  padding:0;
  list-style:none;
  display:grid;
  gap:10px;
}
.checks li{
  display:flex;
  gap:10px;
  align-items:flex-start;
  padding: 12px 12px;
  border-radius: 16px;
  background: rgba(255,255,255,0.78);
  border: 1px solid rgba(11,16,32,0.06);
  box-shadow: 0 10px 26px rgba(11,16,32,0.06);
  line-height:1.5;
  color: rgba(11,16,32,0.82);
  font-size: 14px;
  page-break-inside: avoid;
}
.checkIcon{
  width:22px;
  height:22px;
  border-radius: 10px;
  background: rgba(16,185,129,0.14);
  border: 1px solid rgba(16,185,129,0.20);
  color: rgba(16,185,129,0.95);
  display:grid;
  place-items:center;
  flex:0 0 auto;
  margin-top:2px;
}
.checkIcon svg{ width:14px; height:14px; }

/* Numbered steps */
.steps{
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
  display:grid;
  gap:10px;
}
.steps li{
  display:flex;
  gap:10px;
  align-items:flex-start;
  padding: 12px 12px;
  border-radius: 16px;
  background: rgba(255,255,255,0.78);
  border: 1px solid rgba(11,16,32,0.06);
  box-shadow: 0 10px 26px rgba(11,16,32,0.06);
  line-height:1.5;
  color: rgba(11,16,32,0.82);
  font-size: 14px;
  page-break-inside: avoid;
}
.stepNum{
  width:26px;
  height:26px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(91,75,255,0.75), rgba(42,167,255,0.75));
  color: white;
  font-weight: 800;
  font-size: 13px;
  display:grid;
  place-items:center;
  flex:0 0 auto;
  margin-top:1px;
  box-shadow: 0 10px 18px rgba(91,75,255,0.18);
}

/* Note */
.note{
  margin-top: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(59,130,246,0.08);
  border: 1px solid rgba(59,130,246,0.14);
  color: rgba(11,16,32,0.78);
  font-size: 13px;
  line-height: 1.55;
  page-break-inside: avoid;
}

/* Recommendation */
.recommendation{
  margin-top: 14px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(245,158,11,0.08);
  border: 1px solid rgba(245,158,11,0.16);
  page-break-inside: avoid;
}
.recommendation__label{
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: rgba(146,64,14,0.85);
  font-weight: 800;
}
.recommendation__text{
  margin-top: 10px;
  font-size: 14px;
  color: rgba(11,16,32,0.78);
  line-height: 1.5;
}

/* Escalation tiles */
.escalation-tiles{
  margin-top: 14px;
  display:grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.escalation-tile{
  background: rgba(239,68,68,0.06);
  border: 1px solid rgba(239,68,68,0.14);
  border-radius: var(--radius2);
  padding: 14px;
  page-break-inside: avoid;
}
.escalation-tile .k{ color: rgba(220,38,38,0.75); }
.escalation-tile .v{ color: rgba(153,27,27,0.9); }

/* Transcript */
.transcript{
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
}
.msg{
  padding: 12px 14px;
  border-radius: 16px;
  max-width: 85%;
  page-break-inside: avoid;
}
.msg--user{
  background: rgba(91,75,255,0.06);
  border: 1px solid rgba(91,75,255,0.12);
  align-self: flex-end;
  margin-left: auto;
}
.msg--agent{
  background: rgba(255,255,255,0.78);
  border: 1px solid rgba(11,16,32,0.06);
  align-self: flex-start;
  box-shadow: 0 4px 12px rgba(11,16,32,0.04);
}
.msg__head{
  display: flex;
  gap: 8px;
  align-items: baseline;
  margin-bottom: 4px;
}
.msg__name{
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.msg--user .msg__name{ color: rgba(91,75,255,0.8); }
.msg--agent .msg__name{ color: rgba(11,16,32,0.55); }
.msg__time{
  font-size: 10px;
  color: rgba(107,114,128,0.65);
}
.msg__text{
  font-size: 12.5px;
  line-height: 1.55;
  color: rgba(11,16,32,0.78);
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* Footer */
.footer{
  display:flex;
  gap:12px;
  justify-content:space-between;
  padding: 16px 22px 18px;
  background: rgba(255,255,255,0.62);
  border-top: 1px solid rgba(11,16,32,0.05);
  color: rgba(11,16,32,0.62);
  font-size: 12px;
}
.footer strong{ color: rgba(11,16,32,0.78); }
</style>
</head>

<body>
  <div class="bg" aria-hidden="true">
    <div class="glow glow--tl"></div>
    <div class="glow glow--tr"></div>
    <div class="glow glow--br"></div>
  </div>

  <main class="page">
    <section class="shell">

      <!-- Hero Header -->
      <header class="hero">
        <div class="brand">
          <div class="mark" aria-hidden="true">
            <svg viewBox="0 0 64 64" role="img" aria-label="TotalAssist mark">
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stop-color="var(--bg2)"/>
                  <stop offset="1" stop-color="var(--bg1)"/>
                </linearGradient>
              </defs>
              <path d="M32 6 8 58h10l6-14h16l6 14h10L32 6Zm-4 28 4-10 4 10h-8Z" fill="url(#g1)"/>
            </svg>
          </div>
          <div class="brand__text">
            <div class="brand__name">Total<span>Assist</span></div>
            <div class="brand__tagline">AI-POWERED HOME TECH SUPPORT</div>
          </div>
        </div>

        <div class="titleBlock">
          <h1>Diagnostic Report</h1>
          <p>Comprehensive support session summary</p>
        </div>

        <div class="metaRow" role="list" aria-label="Session metadata">
          <div class="metaPill" role="listitem"><span>Session ID</span><strong>${esc(sessionId)}</strong></div>
          <div class="metaPill" role="listitem"><span>Date</span><strong>${esc(dateStr)}</strong></div>
          ${modeLabel ? `<div class="metaPill" role="listitem"><span>Mode</span><strong>${esc(modeLabel)}</strong></div>` : ""}
          <div class="metaPill" role="listitem"><span>Agent</span><strong>${esc(assistedBy)}</strong></div>
        </div>
      </header>

      <!-- Main Glass Card -->
      <section class="card">

        <!-- Session Overview -->
        <section class="section">
          <div class="section__head">
            <div class="icon">${iconOverview}</div>
            <div>
              <h2>Session Overview</h2>
              <p class="muted">Key information captured for this support session.</p>
            </div>
            <div class="status" style="background:${sc.bg}; border:1px solid ${sc.border}; color:${sc.text};">
              <span class="statusDot" style="background:${sc.dot}; box-shadow:0 0 0 4px ${sc.dotShadow};" aria-hidden="true"></span>
              <span>${esc(statusInfo.label)}</span>
            </div>
          </div>

          <div class="tiles">
            ${data.userName ? `<div class="tile"><div class="k">Client Name</div><div class="v">${esc(data.userName)}</div></div>` : ""}
            <div class="tile"><div class="k">Date</div><div class="v">${esc(dateStr)}</div></div>
            <div class="tile"><div class="k">Session ID</div><div class="v">${esc(sessionId)}</div></div>
            ${sessionMode ? `<div class="tile"><div class="k">Session Mode</div><div class="v">${esc(modeLabel || sessionMode)}</div></div>` : ""}
            <div class="tile"><div class="k">Support Agent</div><div class="v">${esc(assistedBy)}</div></div>
            ${durationStr ? `<div class="tile"><div class="k">Duration</div><div class="v">${esc(durationStr)}</div></div>` : ""}
          </div>
        </section>

        <hr class="divider" />

        <!-- Issue Summary -->
        <section class="section">
          <div class="section__head">
            <div class="icon">${iconIssue}</div>
            <div>
              <h2>Issue Summary</h2>
              <p class="muted">What the client reported and what was observed.</p>
            </div>
          </div>

          <div class="callout">
            <div class="callout__label">Issue</div>
            <div class="callout__text">${esc(issueText)}</div>
          </div>
        </section>

        ${hasRootCause ? `
        <hr class="divider" />

        <!-- Root Cause Analysis -->
        <section class="section">
          <div class="section__head">
            <div class="icon">${iconRootCause}</div>
            <div>
              <h2>Root Cause Analysis</h2>
              <p class="muted">Why the problem occurred (high-confidence summary).</p>
            </div>
          </div>

          <ul class="checks">
            ${rootCauseTexts.map(t => `<li><span class="checkIcon" aria-hidden="true">${iconCheck}</span>${esc(t)}</li>`).join("")}
          </ul>
        </section>
        ` : ""}

        ${hasResolution ? `
        <hr class="divider" />

        <!-- Resolution Steps -->
        <section class="section">
          <div class="section__head">
            <div class="icon icon--green">${iconResolution}</div>
            <div>
              <h2>Resolution Steps</h2>
              <p class="muted">Actions taken to restore service.</p>
            </div>
          </div>

          <ol class="steps">
            ${resolutionSteps.map((s, i) => `<li><span class="stepNum">${i + 1}</span> ${esc(s)}</li>`).join("")}
          </ol>

          ${resolutionSteps.length === 1 ? "" : `<div class="note">The issue was addressed through the steps above.</div>`}
        </section>
        ` : ""}

        ${hasNextSteps ? `
        <hr class="divider" />

        <!-- Recommendations -->
        <section class="section">
          <div class="section__head">
            <div class="icon icon--amber">${iconNextSteps}</div>
            <div>
              <h2>Recommendations</h2>
              <p class="muted">Suggested next steps to prevent recurrence.</p>
            </div>
          </div>

          <div class="recommendation">
            <div class="recommendation__label">Next Steps</div>
            <div class="recommendation__text">${esc(nextStepsTexts.join(" "))}</div>
          </div>
        </section>
        ` : ""}

        ${!hasRootCause && !hasResolution && !hasNextSteps && data.aiSummary && !parsedSections ? `
        <hr class="divider" />

        <!-- Unstructured Summary -->
        <section class="section">
          <div class="section__head">
            <div class="icon">${iconRootCause}</div>
            <div>
              <h2>Analysis</h2>
              <p class="muted">Support agent findings and recommendations.</p>
            </div>
          </div>

          <ul class="checks">
            ${data.aiSummary.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 10).map(s => `<li><span class="checkIcon" aria-hidden="true">${iconCheck}</span>${esc(s.trim())}</li>`).join("")}
          </ul>
        </section>
        ` : ""}

        ${escalationHTML}

        ${transcriptHTML}

        <!-- Footer -->
        <footer class="footer">
          <div><strong>TotalAssist</strong> &middot; Diagnostic Session Report</div>
          <div>Confidential &middot; For client use</div>
        </footer>
      </section>

    </section>
  </main>
</body>
</html>`;
}

// ============================================
// PDF Generation via Puppeteer (with jsPDF fallback)
// ============================================

async function generatePDFWithPuppeteer(html: string): Promise<string> {
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: getChromiumPath(),
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--font-render-hinting=none",
      ],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 15000 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
      preferCSSPageSize: false,
    });

    return Buffer.from(pdfBuffer).toString("base64");
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

/**
 * jsPDF fallback for when Chromium is not available (e.g., deployment without nix packages).
 * Generates a functional but simpler PDF using jsPDF directly.
 */
async function generateFallbackPDF(data: CasePDFData): Promise<string> {
  const jspdfModule = await import("jspdf");
  const { jsPDF } = jspdfModule;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // Header bar
  for (let i = 0; i < 30; i++) {
    const ratio = i / 30;
    const r = Math.round(99 + (67 - 99) * ratio);
    const g = Math.round(102 + (56 - 102) * ratio);
    const b = Math.round(241 + (202 - 241) * ratio);
    doc.setFillColor(r, g, b);
    doc.rect(0, i * (50 / 30), pageWidth, (50 / 30) + 0.5, "F");
  }

  // Logo
  if (logoBase64) {
    try { doc.addImage(logoBase64, "PNG", margin, 10, 36, 12); } catch {}
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("TotalAssist", margin, 20);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Diagnostic Report", margin, 38);

  y = 60;

  // Report Summary
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(margin, y, contentWidth, 10, 1, 1, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(55, 65, 81);
  doc.text("Report Summary", margin + 5, y + 7);
  y += 16;

  const addRow = (label: string, value: string) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text(label, margin + 5, y);
    doc.setTextColor(17, 24, 39);
    const lines = doc.splitTextToSize(value, contentWidth - 55);
    doc.text(lines, margin + 50, y);
    y += lines.length * 4.5 + 2;
  };

  if (data.userName) addRow("Client:", data.userName);
  addRow("Date:", formatDate(data.createdAt, data.userTimezone));
  addRow("Session ID:", data.caseId.substring(0, 8).toUpperCase());
  const assistedBy = data.agentName || data.messages.find(m => m.role !== "user" && m.agentName)?.agentName || "TotalAssist Support";
  addRow("Assisted By:", assistedBy);
  addRow("Status:", (data.status || "resolved").charAt(0).toUpperCase() + (data.status || "resolved").slice(1));
  addRow("Issue:", data.title || "Technical issue");
  y += 8;

  // Details
  if (data.aiSummary) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(margin, y, contentWidth, 10, 1, 1, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(55, 65, 81);
    doc.text("Details & Recommendations", margin + 5, y + 7);
    y += 16;

    const parsed = parseAISummary(data.aiSummary);
    if (parsed && parsed.length > 0) {
      for (const section of parsed) {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.setTextColor(55, 65, 81);
        doc.text(`${section.label}:`, margin + 5, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(75, 85, 99);
        const lines = doc.splitTextToSize(section.content, contentWidth - 12);
        for (const line of lines) {
          if (y > 275) { doc.addPage(); y = 20; }
          doc.text(line, margin + 8, y);
          y += 4.5;
        }
        y += 4;
      }
    } else {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(75, 85, 99);
      const lines = doc.splitTextToSize(data.aiSummary, contentWidth - 10);
      for (const line of lines) {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(line, margin + 5, y);
        y += 4.5;
      }
    }
    y += 8;
  }

  // Transcript
  if (data.messages.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(margin, y, contentWidth, 10, 1, 1, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(55, 65, 81);
    doc.text("Conversation Transcript", margin + 5, y + 7);
    y += 16;

    for (const msg of data.messages) {
      if (y > 265) { doc.addPage(); y = 20; }
      const speaker = msg.role === "user" ? (data.userName?.split(" ")[0] || "You") : (msg.agentName || assistedBy);
      const time = formatTime(msg.timestamp, data.userTimezone);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(msg.role === "user" ? 67 : 99, msg.role === "user" ? 56 : 102, msg.role === "user" ? 202 : 241);
      doc.text(speaker, margin + 5, y);
      doc.setTextColor(156, 163, 175);
      doc.setFont("helvetica", "normal");
      doc.text(`  ${time}`, margin + 5 + doc.getTextWidth(speaker), y);
      y += 5;
      doc.setTextColor(55, 65, 81);
      doc.setFontSize(8);
      const msgLines = doc.splitTextToSize(msg.text, contentWidth - 12);
      for (const line of msgLines) {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(line, margin + 8, y);
        y += 4;
      }
      y += 4;
    }
  }

  // Footer on every page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const ph = doc.internal.pageSize.getHeight();
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(0, ph - 16, pageWidth, ph - 16);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(156, 163, 175);
    doc.text("TotalAssist", margin, ph - 7);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, ph - 7, { align: "right" });
  }

  return doc.output("datauristring").split(",")[1];
}

export async function generateCaseGuidePDF(data: CasePDFData): Promise<string> {
  const html = buildHTMLReport(data);

  try {
    return await generatePDFWithPuppeteer(html);
  } catch (puppeteerError) {
    console.warn("[PDF] Puppeteer/Chromium unavailable, falling back to jsPDF:", (puppeteerError as Error).message);
    try {
      return await generateFallbackPDF(data);
    } catch (fallbackError) {
      console.error("[PDF] jsPDF fallback also failed:", (fallbackError as Error).message);
      throw fallbackError;
    }
  }
}
