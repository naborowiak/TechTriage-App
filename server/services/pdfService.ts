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
// HTML Template Builder
// ============================================

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

  // Timestamps
  let startTime = "";
  let endTime = "";
  if (data.messages.length > 0) {
    startTime = formatDateTime(data.messages[0].timestamp, tz);
    endTime = formatDateTime(data.messages[data.messages.length - 1].timestamp, tz);
  }

  // Parse AI summary
  const parsedSections = data.aiSummary ? parseAISummary(data.aiSummary) : null;

  // SVG icon helpers (inline SVGs render reliably in headless Chromium — emoji do not)
  const svgIcon = (path: string, color = "#6366F1") =>
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><${path}/></svg>`;

  // Section icon SVGs (Lucide-style)
  const sectionIconSvgs: Record<string, string> = {
    problem: svgIcon('circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"', "#EF4444"),
    analysis: svgIcon('path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"', "#8B5CF6"),
    fix: svgIcon('path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"', "#10B981"),
    resolution: svgIcon('polyline points="20 6 9 17 4 12"', "#10B981"),
    "next steps": svgIcon('line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"', "#F59E0B"),
    "next step": svgIcon('line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"', "#F59E0B"),
    recommendation: svgIcon('line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"', "#F59E0B"),
    cause: svgIcon('circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"', "#EF4444"),
    "root cause": svgIcon('circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"', "#EF4444"),
    summary: svgIcon('path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"', "#6366F1"),
  };

  // Section header SVG icons (for the section titles)
  const reportSvg = svgIcon('rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"', "#4F46E5");
  const detailsSvg = svgIcon('circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"', "#16A34A");
  const transcriptSvg = svgIcon('path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"', "#D97706");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1F2937;
    background: #FFFFFF;
    font-size: 13px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 0;
    margin: 0 auto;
  }

  /* ===== HEADER ===== */
  .header {
    background: linear-gradient(135deg, #6366F1 0%, #4F46E5 40%, #4338CA 100%);
    padding: 32px 40px 28px;
    position: relative;
    overflow: hidden;
  }

  .header::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
    border-radius: 50%;
  }

  .header::after {
    content: '';
    position: absolute;
    bottom: -30%;
    left: 10%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
    border-radius: 50%;
  }

  .header-content {
    position: relative;
    z-index: 1;
  }

  .logo {
    height: 28px;
    margin-bottom: 16px;
    opacity: 0.95;
  }

  .logo-text {
    color: #FFFFFF;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.3px;
    margin-bottom: 16px;
  }

  .header-title {
    font-size: 26px;
    font-weight: 700;
    color: #FFFFFF;
    letter-spacing: -0.5px;
    margin-bottom: 4px;
  }

  .header-subtitle {
    font-size: 13px;
    color: rgba(255,255,255,0.7);
    font-weight: 400;
  }

  .header-meta {
    display: flex;
    gap: 24px;
    margin-top: 16px;
  }

  .header-meta-item {
    font-size: 11px;
    color: rgba(255,255,255,0.65);
    font-weight: 400;
  }

  .header-meta-item strong {
    color: rgba(255,255,255,0.9);
    font-weight: 600;
  }

  /* ===== CONTENT ===== */
  .content {
    padding: 28px 40px 40px;
  }

  /* ===== STATUS BADGE ===== */
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 14px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.3px;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* ===== SECTION ===== */
  .section {
    margin-bottom: 28px;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    padding-bottom: 10px;
    border-bottom: 2px solid #F3F4F6;
  }

  .section-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
  }

  .section-title {
    font-size: 15px;
    font-weight: 700;
    color: #111827;
    letter-spacing: -0.2px;
  }

  /* ===== INFO GRID ===== */
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
    background: #F3F4F6;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #E5E7EB;
  }

  .info-cell {
    background: #FFFFFF;
    padding: 12px 16px;
  }

  .info-cell.full-width {
    grid-column: 1 / -1;
  }

  .info-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #9CA3AF;
    margin-bottom: 3px;
  }

  .info-value {
    font-size: 13px;
    font-weight: 500;
    color: #1F2937;
  }

  /* ===== SUMMARY CARDS ===== */
  .summary-cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .summary-card {
    background: #F9FAFB;
    border: 1px solid #E5E7EB;
    border-radius: 10px;
    padding: 16px 18px;
    page-break-inside: avoid;
  }

  .summary-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .summary-card-icon {
    font-size: 16px;
    flex-shrink: 0;
  }

  .summary-card-label {
    font-size: 12px;
    font-weight: 700;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .summary-card-content {
    font-size: 13px;
    color: #4B5563;
    line-height: 1.65;
  }

  /* Unstructured bullets */
  .bullet-list {
    list-style: none;
    padding: 0;
  }

  .bullet-item {
    position: relative;
    padding-left: 16px;
    margin-bottom: 8px;
    font-size: 13px;
    color: #4B5563;
    line-height: 1.6;
  }

  .bullet-item::before {
    content: '';
    position: absolute;
    left: 0;
    top: 8px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #6366F1;
  }

  /* ===== ESCALATION ===== */
  .escalation-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 12px;
  }

  .escalation-item {
    background: #FEF2F2;
    border: 1px solid #FECACA;
    border-radius: 8px;
    padding: 12px 14px;
  }

  .escalation-item .info-label {
    color: #DC2626;
  }

  .escalation-item .info-value {
    color: #991B1B;
    font-weight: 600;
  }

  /* ===== TRANSCRIPT ===== */
  .transcript {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .msg {
    padding: 10px 14px;
    border-radius: 10px;
    max-width: 88%;
    page-break-inside: avoid;
  }

  .msg-user {
    background: #EEF2FF;
    border: 1px solid #C7D2FE;
    align-self: flex-end;
    margin-left: auto;
  }

  .msg-agent {
    background: #F3F4F6;
    border: 1px solid #E5E7EB;
    align-self: flex-start;
  }

  .msg-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .msg-name {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.2px;
  }

  .msg-name-user { color: #4338CA; }
  .msg-name-agent { color: #374151; }

  .msg-time {
    font-size: 10px;
    color: #9CA3AF;
    font-weight: 400;
  }

  .msg-text {
    font-size: 12.5px;
    color: #374151;
    line-height: 1.6;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  /* ===== FOOTER ===== */
  .footer {
    margin-top: 32px;
    padding: 20px 40px;
    background: #F9FAFB;
    border-top: 1px solid #E5E7EB;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .footer-left {
    font-size: 11px;
    color: #6B7280;
  }

  .footer-left strong {
    color: #4F46E5;
    font-weight: 600;
  }

  .footer-right {
    font-size: 10px;
    color: #9CA3AF;
  }

  .footer-divider {
    width: 100%;
    height: 3px;
    background: linear-gradient(90deg, #6366F1, #A78BFA, #6366F1);
    border-radius: 2px;
  }

  /* ===== PRINT / PAGE BREAKS ===== */
  .page-break-before {
    page-break-before: always;
  }
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="header-content">
      ${logoBase64 ? `<img src="${logoBase64}" class="logo" alt="TotalAssist" />` : `<div class="logo-text">TotalAssist</div>`}
      <div class="header-title">Diagnostic Report</div>
      <div class="header-subtitle">Comprehensive support session summary</div>
      <div class="header-meta">
        <div class="header-meta-item"><strong>${esc(sessionId)}</strong> Session ID</div>
        <div class="header-meta-item"><strong>${esc(dateStr)}</strong> Date</div>
        ${sessionMode ? `<div class="header-meta-item"><strong>${esc(sessionMode)}</strong> Mode</div>` : ""}
        <div class="header-meta-item"><strong>${esc(assistedBy)}</strong> Agent</div>
      </div>
    </div>
  </div>

  <div class="content">

    <!-- REPORT SUMMARY -->
    <div class="section">
      <div class="section-header">
        <div class="section-icon" style="background: #EEF2FF;">${reportSvg}</div>
        <div class="section-title">Report Summary</div>
      </div>
      <div class="info-grid">
        ${data.userName ? `<div class="info-cell"><div class="info-label">Client Name</div><div class="info-value">${esc(data.userName)}</div></div>` : ""}
        ${data.userEmail ? `<div class="info-cell"><div class="info-label">Email</div><div class="info-value">${esc(data.userEmail)}</div></div>` : ""}
        <div class="info-cell">
          <div class="info-label">Date</div>
          <div class="info-value">${esc(dateStr)}</div>
        </div>
        <div class="info-cell">
          <div class="info-label">Session ID</div>
          <div class="info-value">${esc(sessionId)}</div>
        </div>
        ${sessionMode ? `<div class="info-cell"><div class="info-label">Session Mode</div><div class="info-value">${esc(sessionMode)}</div></div>` : ""}
        <div class="info-cell">
          <div class="info-label">Assisted By</div>
          <div class="info-value">${esc(assistedBy)}</div>
        </div>
        ${startTime ? `<div class="info-cell"><div class="info-label">Started</div><div class="info-value">${esc(startTime)}</div></div>` : ""}
        ${endTime ? `<div class="info-cell"><div class="info-label">Completed</div><div class="info-value">${esc(endTime)}</div></div>` : ""}
        <div class="info-cell full-width">
          <div class="info-label">Status</div>
          <div class="info-value">
            <span class="status-badge" style="background: ${statusInfo.bg}; color: ${statusInfo.color};">
              <span class="status-dot" style="background: ${statusInfo.color};"></span>
              ${esc(statusInfo.label)}
            </span>
          </div>
        </div>
        <div class="info-cell full-width">
          <div class="info-label">Issue</div>
          <div class="info-value">${esc(data.title || data.aiSummary?.split(".")[0] || "Technical issue diagnosed")}</div>
        </div>
      </div>
    </div>

    <!-- DETAILS & RECOMMENDATIONS -->
    ${(data.aiSummary || data.escalationReport) ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon" style="background: #F0FDF4;">${detailsSvg}</div>
        <div class="section-title">Details &amp; Recommendations</div>
      </div>

      ${data.aiSummary ? (() => {
        if (parsedSections && parsedSections.length > 0) {
          return `<div class="summary-cards">${parsedSections.map((s) => {
            const icon = sectionIconSvgs[s.label.toLowerCase()] || svgIcon('circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"', "#6366F1");
            return `<div class="summary-card">
              <div class="summary-card-header">
                <span class="summary-card-icon">${icon}</span>
                <span class="summary-card-label">${esc(s.label)}</span>
              </div>
              <div class="summary-card-content">${esc(s.content)}</div>
            </div>`;
          }).join("")}</div>`;
        } else {
          const sentences = data.aiSummary.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 5);
          return `<ul class="bullet-list">${sentences.map((s) => `<li class="bullet-item">${esc(s.trim())}</li>`).join("")}</ul>`;
        }
      })() : ""}

      ${data.escalationReport ? (() => {
        const r = data.escalationReport;
        const analysisLabel = data.agentName ? `${data.agentName}'s Analysis` : "Support Analysis";
        return `
          <div class="escalation-grid" style="margin-top: 16px;">
            <div class="escalation-item">
              <div class="info-label">Recommended Specialist</div>
              <div class="info-value">${esc(r.recommendedSpecialist)}</div>
            </div>
            <div class="escalation-item">
              <div class="info-label">Urgency Level</div>
              <div class="info-value">${esc(r.urgencyLevel)}</div>
            </div>
            ${r.estimatedCostRange ? `<div class="escalation-item"><div class="info-label">Estimated Cost</div><div class="info-value">${esc(r.estimatedCostRange)}</div></div>` : ""}
            ${r.photosIncluded > 0 ? `<div class="escalation-item"><div class="info-label">Photos Included</div><div class="info-value">${r.photosIncluded}</div></div>` : ""}
          </div>
          ${r.stepsTried.length > 0 ? `
            <div class="summary-card" style="margin-top: 12px;">
              <div class="summary-card-header">
                <span class="summary-card-icon">${sectionIconSvgs.fix}</span>
                <span class="summary-card-label">Steps Already Tried</span>
              </div>
              <ul class="bullet-list">${r.stepsTried.map((s) => `<li class="bullet-item">${esc(s)}</li>`).join("")}</ul>
            </div>
          ` : ""}
          ${r.scoutAnalysis ? `
            <div class="summary-card" style="margin-top: 12px;">
              <div class="summary-card-header">
                <span class="summary-card-icon">${sectionIconSvgs.analysis}</span>
                <span class="summary-card-label">${esc(analysisLabel)}</span>
              </div>
              <div class="summary-card-content">${esc(r.scoutAnalysis)}</div>
            </div>
          ` : ""}
        `;
      })() : ""}
    </div>
    ` : ""}

    <!-- CONVERSATION TRANSCRIPT -->
    ${data.messages.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon" style="background: #FEF3C7;">${transcriptSvg}</div>
        <div class="section-title">Conversation Transcript</div>
      </div>
      <div class="transcript">
        ${data.messages.map((msg) => {
          const agentLabel = msg.agentName || data.agentName || "TotalAssist Support";
          const speaker = msg.role === "user" ? (data.userName?.split(" ")[0] || "You") : agentLabel;
          const time = formatTime(msg.timestamp, tz);
          const isUser = msg.role === "user";
          return `<div class="msg ${isUser ? "msg-user" : "msg-agent"}">
            <div class="msg-header">
              <span class="msg-name ${isUser ? "msg-name-user" : "msg-name-agent"}">${esc(speaker)}</span>
              <span class="msg-time">${esc(time)}</span>
            </div>
            <div class="msg-text">${esc(msg.text)}</div>
          </div>`;
        }).join("")}
      </div>
    </div>
    ` : ""}

  </div>

  <!-- FOOTER -->
  <div class="footer-divider"></div>
  <div class="footer">
    <div class="footer-left">
      <strong>TotalAssist</strong> &nbsp;·&nbsp; Fast, friendly tech support
    </div>
    <div class="footer-right">
      Generated ${esc(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }))} &nbsp;·&nbsp; totalassist.tech
    </div>
  </div>

</div>
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
