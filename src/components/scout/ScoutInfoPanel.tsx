import { MessageSquare, Mic, Camera, ScanLine, Zap, ArrowUpRight } from 'lucide-react';
import { useUsage } from '../../stores/usageStore';

interface ScoutInfoPanelProps {
  activeMode?: string;
}

export function ScoutInfoPanel({ activeMode = 'chat' }: ScoutInfoPanelProps) {
  const { tier, usage, videoCredits, getVideoResetInfo } = useUsage();

  const getModeInfo = () => {
    switch (activeMode) {
      case 'voice':
        return { icon: <Mic className="w-5 h-5" />, label: 'Voice Mode', color: 'text-scout-purple' };
      case 'photo':
        return { icon: <Camera className="w-5 h-5" />, label: 'Photo Mode', color: 'text-electric-cyan' };
      case 'video':
        return { icon: <ScanLine className="w-5 h-5" />, label: 'Video Mode', color: 'text-emerald-400' };
      default:
        return { icon: <MessageSquare className="w-5 h-5" />, label: 'Chat Mode', color: 'text-electric-indigo' };
    }
  };

  const modeInfo = getModeInfo();
  const isPaidTier = tier === 'home' || tier === 'pro';
  const chatRemaining = Math.max(0, usage.chat.limit - usage.chat.used);
  const chatTotal = usage.chat.limit;
  const isUnlimited = chatTotal >= 999999;
  const photoRemaining = Math.max(0, usage.photo.limit - usage.photo.used);
  const totalVideoCredits = videoCredits.subscriptionCredits + videoCredits.purchasedCredits;
  const videoResetInfo = getVideoResetInfo();

  const getTierBadge = () => {
    if (tier === 'pro') return { label: 'PRO', bg: 'bg-scout-purple/20', text: 'text-scout-purple' };
    if (tier === 'home') return { label: 'HOME', bg: 'bg-electric-cyan/20', text: 'text-electric-cyan' };
    return { label: 'FREE', bg: 'bg-midnight-700', text: 'text-text-secondary' };
  };

  const badge = getTierBadge();

  return (
    <div className="h-full bg-white dark:bg-midnight-900 border-l border-light-300 dark:border-midnight-700 p-6 overflow-y-auto">
      {/* Current Mode */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">Current Mode</h3>
        <div className="flex items-center gap-3 p-4 bg-light-100 dark:bg-midnight-800 rounded-xl border border-light-300 dark:border-midnight-700">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-scout-purple to-electric-indigo flex items-center justify-center text-white`}>
            {modeInfo.icon}
          </div>
          <div>
            <div className={`font-semibold text-text-primary dark:text-white`}>{modeInfo.label}</div>
            <div className="text-xs text-text-secondary">Active session</div>
          </div>
        </div>
      </div>

      {/* Scout Credits */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">Scout Credits</h3>
        <div className="p-4 bg-light-100 dark:bg-midnight-800 rounded-xl border border-light-300 dark:border-midnight-700 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Plan</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
              {badge.label}
            </span>
          </div>

          {/* Chat credits */}
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-text-secondary">Chat Messages</span>
              <span className="text-text-primary dark:text-white font-medium">
                {isUnlimited ? 'Unlimited' : `${chatRemaining}/${chatTotal}`}
              </span>
            </div>
            {!isUnlimited && (
              <div className="h-1.5 bg-light-300 dark:bg-midnight-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    chatRemaining === 0
                      ? 'bg-red-500'
                      : chatRemaining <= 2
                        ? 'bg-yellow-500'
                        : 'bg-gradient-to-r from-electric-indigo to-electric-cyan'
                  }`}
                  style={{ width: `${(chatRemaining / chatTotal) * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Photo credits - only for free tier */}
          {!isPaidTier && (
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Snapshots</span>
                <span className={`font-medium ${photoRemaining === 0 ? 'text-red-400' : 'text-text-primary dark:text-white'}`}>
                  {photoRemaining === 0 ? 'Used' : `${photoRemaining}/1`}
                </span>
              </div>
            </div>
          )}

          {/* Video credits - only for paid tiers */}
          {isPaidTier && (
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-text-secondary">Video Diagnostic</span>
                <span className={`font-medium ${totalVideoCredits === 0 ? 'text-red-400' : 'text-text-primary dark:text-white'}`}>
                  {tier === 'home'
                    ? (totalVideoCredits > 0 ? '1 Credit' : 'Used')
                    : `${totalVideoCredits}/${videoCredits.subscriptionLimit}`
                  }
                </span>
              </div>
              {tier === 'pro' && (
                <div className="h-1.5 bg-light-300 dark:bg-midnight-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-scout-purple to-scout-glow transition-all"
                    style={{ width: `${Math.min(100, (totalVideoCredits / videoCredits.subscriptionLimit) * 100)}%` }}
                  />
                </div>
              )}
              {totalVideoCredits === 0 && (
                <div className="text-xs text-text-muted mt-1">
                  Resets in {videoResetInfo.daysUntilReset} day{videoResetInfo.daysUntilReset !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Help */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">Quick Help</h3>
        <div className="space-y-2">
          <div className="p-3 bg-light-100 dark:bg-midnight-800 rounded-lg border border-light-300 dark:border-midnight-700">
            <div className="text-sm font-medium text-text-primary dark:text-white mb-1">Chat Mode</div>
            <div className="text-xs text-text-secondary">Type your question and get instant AI guidance.</div>
          </div>
          <div className="p-3 bg-light-100 dark:bg-midnight-800 rounded-lg border border-light-300 dark:border-midnight-700">
            <div className="text-sm font-medium text-text-primary dark:text-white mb-1">Voice Mode</div>
            <div className="text-xs text-text-secondary">Speak naturally — Scout listens and responds with real voice.</div>
          </div>
          <div className="p-3 bg-light-100 dark:bg-midnight-800 rounded-lg border border-light-300 dark:border-midnight-700">
            <div className="text-sm font-medium text-text-primary dark:text-white mb-1">Photo Mode</div>
            <div className="text-xs text-text-secondary">Upload a photo of the issue for visual analysis.</div>
          </div>
          <div className="p-3 bg-light-100 dark:bg-midnight-800 rounded-lg border border-light-300 dark:border-midnight-700">
            <div className="text-sm font-medium text-text-primary dark:text-white mb-1">Video Mode</div>
            <div className="text-xs text-text-secondary">Start a live video session for real-time diagnosis.</div>
          </div>
        </div>
      </div>

      {/* Upgrade CTA for free users */}
      {!isPaidTier && (
        <div className="p-4 bg-gradient-to-br from-electric-indigo/10 to-scout-purple/10 rounded-xl border border-electric-indigo/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-electric-indigo" />
            <span className="text-sm font-semibold text-text-primary dark:text-white">Unlock More</span>
          </div>
          <p className="text-xs text-text-secondary mb-3">
            Upgrade to Home or Pro for unlimited chat, voice mode, video diagnostics, and more.
          </p>
          <a
            href="/pricing"
            className="inline-flex items-center gap-1 text-xs font-semibold text-electric-indigo hover:text-electric-cyan transition-colors"
          >
            View Plans <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
