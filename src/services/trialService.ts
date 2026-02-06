// Trial service for checking and starting free trials

interface TrialCheckResponse {
  eligible: boolean;
  reason?: 'email_used' | 'ip_used' | 'device_used';
  message?: string;
  expiresAt?: number;
}

interface TrialStartResponse {
  success: boolean;
  trialStarted?: number;
  trialExpires?: number;
  message?: string;
  error?: string;
}

interface TrialStatusResponse {
  hasTrial: boolean;
  isActive: boolean;
  startedAt?: number;
  expiresAt?: number;
  remainingMs?: number;
  remainingHours?: number;
  remainingMinutes?: number;
}

// Generate a simple browser fingerprint
const generateFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('TotalAssist', 2, 2);
  }

  const data = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|');

  // Simple hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return `fp_${Math.abs(hash).toString(36)}`;
};

// Get or create fingerprint
const getFingerprint = (): string => {
  let fp = localStorage.getItem('totalassist_device_fp');
  if (!fp) {
    fp = generateFingerprint();
    localStorage.setItem('totalassist_device_fp', fp);
  }
  return fp;
};

export const checkTrialEligibility = async (email: string): Promise<TrialCheckResponse> => {
  try {
    const fingerprint = getFingerprint();

    const response = await fetch('/api/trial/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, fingerprint })
    });

    return response.json();
  } catch (error) {
    console.error('Failed to check trial eligibility:', error);
    // Allow trial if we can't check
    return { eligible: true };
  }
};

export const startTrial = async (email: string): Promise<TrialStartResponse> => {
  try {
    const fingerprint = getFingerprint();

    const response = await fetch('/api/trial/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, fingerprint })
    });

    const data = await response.json();

    if (data.success) {
      // Store trial info locally
      localStorage.setItem('totalassist_trial', JSON.stringify({
        email,
        startedAt: data.trialStarted,
        expiresAt: data.trialExpires
      }));
    }

    return data;
  } catch (error) {
    console.error('Failed to start trial:', error);
    return { success: false, error: 'Failed to start trial' };
  }
};

export const getTrialStatus = async (email?: string): Promise<TrialStatusResponse> => {
  try {
    // First check localStorage for cached trial info
    const cached = localStorage.getItem('totalassist_trial');
    if (cached) {
      const trial = JSON.parse(cached);
      const now = Date.now();
      if (now < trial.expiresAt) {
        const remainingMs = trial.expiresAt - now;
        return {
          hasTrial: true,
          isActive: true,
          startedAt: trial.startedAt,
          expiresAt: trial.expiresAt,
          remainingMs,
          remainingHours: Math.floor(remainingMs / (60 * 60 * 1000)),
          remainingMinutes: Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000))
        };
      }
    }

    // Check with server
    const params = email ? `?email=${encodeURIComponent(email)}` : '';
    const response = await fetch(`/api/trial/status${params}`);
    return response.json();
  } catch (error) {
    console.error('Failed to get trial status:', error);
    return { hasTrial: false, isActive: false };
  }
};

export const hasActiveTrial = async (email?: string): Promise<boolean> => {
  const status = await getTrialStatus(email);
  return status.isActive;
};
