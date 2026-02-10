import React from 'react';
import { MessageSquare, Mic, Camera, Video, Lock } from 'lucide-react';
import { UserTier } from '../../stores/usageStore';

export type ScoutMode = 'chat' | 'voice' | 'photo' | 'video';

interface ModeConfig {
  id: ScoutMode;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  lockedTiers: UserTier[];
  gradient: string;
  glow: string;
}

const MODES: ModeConfig[] = [
  {
    id: 'chat',
    icon: MessageSquare,
    label: 'Message',
    lockedTiers: [],
    gradient: 'from-[#06B6D4] via-[#14D8A8] to-[#34D399]',
    glow: 'shadow-[0_4px_20px_rgba(6,182,212,0.4)]',
  },
  {
    id: 'photo',
    icon: Camera,
    label: 'Photo',
    lockedTiers: [],
    gradient: 'from-[#38BDF8] via-[#60A5FA] to-[#818CF8]',
    glow: 'shadow-[0_4px_20px_rgba(56,189,248,0.4)]',
  },
  {
    id: 'voice',
    icon: Mic,
    label: 'Talk',
    lockedTiers: ['guest', 'free'],
    gradient: 'from-[#3B82F6] via-[#4F46E5] to-[#6366F1]',
    glow: 'shadow-[0_4px_20px_rgba(59,130,246,0.4)]',
  },
  {
    id: 'video',
    icon: Video,
    label: 'Video',
    lockedTiers: ['guest', 'free'],
    gradient: 'from-[#8B5CF6] via-[#A855F7] to-[#C084FC]',
    glow: 'shadow-[0_4px_20px_rgba(139,92,246,0.4)]',
  },
];

interface ModeDockProps {
  activeMode: ScoutMode;
  onModeSelect: (mode: ScoutMode) => void;
  userTier: UserTier;
  onLockedModeClick: (mode: ScoutMode) => void;
}

export function ModeDock({ activeMode, onModeSelect, userTier, onLockedModeClick }: ModeDockProps) {
  const isLocked = (mode: ModeConfig) => mode.lockedTiers.includes(userTier);

  return (
    <div className="flex items-center justify-center gap-3 py-3 px-2">
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const locked = isLocked(mode);
        const isActive = activeMode === mode.id;

        return (
          <button
            key={mode.id}
            onClick={() => {
              if (locked) {
                onLockedModeClick(mode.id);
              } else {
                onModeSelect(mode.id);
              }
            }}
            className={`
              relative flex flex-col items-center justify-center gap-1
              rounded-2xl px-4 py-3 min-w-[72px]
              transition-all duration-300 ease-out overflow-hidden
              ${isActive
                ? `bg-gradient-to-br ${mode.gradient} ${mode.glow} scale-105`
                : locked
                  ? 'bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/10 opacity-40'
                  : 'bg-white/10 dark:bg-white/8 border border-white/15 dark:border-white/15 hover:bg-white/15 dark:hover:bg-white/12 hover:border-white/25 dark:hover:border-white/25 hover:scale-[1.03]'
              }
            `}
            aria-label={`${mode.label}${locked ? ' (locked)' : ''}`}
          >
            {/* Glossy shine overlay */}
            {isActive && (
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.1) 40%, transparent 60%)',
                }}
              />
            )}
            {!isActive && !locked && (
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)',
                }}
              />
            )}

            <Icon
              className={`w-5 h-5 relative z-10 ${isActive ? 'text-white' : locked ? 'text-white/40' : 'text-white/70'}`}
            />
            <span
              className={`text-[11px] font-semibold relative z-10 ${isActive ? 'text-white' : locked ? 'text-white/40' : 'text-white/60'}`}
            >
              {mode.label}
            </span>

            {locked && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-midnight-900 border border-white/20 flex items-center justify-center z-20">
                <Lock className="w-3 h-3 text-white/60" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
