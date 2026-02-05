import React from 'react';
import { MessageSquare, Mic, Camera, Video, Lock } from 'lucide-react';
import { UserTier } from '../../stores/usageStore';

export type ScoutMode = 'chat' | 'voice' | 'photo' | 'video';

interface ModeConfig {
  id: ScoutMode;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  lockedTiers: UserTier[];
}

const MODES: ModeConfig[] = [
  { id: 'chat', icon: MessageSquare, label: 'Chat', lockedTiers: [] },
  { id: 'voice', icon: Mic, label: 'Voice', lockedTiers: ['guest', 'free'] },
  { id: 'photo', icon: Camera, label: 'Photo', lockedTiers: ['guest'] },
  { id: 'video', icon: Video, label: 'Video', lockedTiers: ['guest', 'free'] },
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
    <div className="flex items-center justify-center gap-4 py-3">
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
              relative w-14 h-14 rounded-full flex items-center justify-center
              transition-all duration-300 ease-out
              ${isActive
                ? 'bg-gradient-to-r from-[#6366F1] to-[#06B6D4] shadow-[0_0_20px_rgba(99,102,241,0.5)]'
                : locked
                  ? 'bg-white/5 backdrop-blur-md border border-white/10 opacity-50'
                  : 'bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20'
              }
            `}
            aria-label={`${mode.label}${locked ? ' (locked)' : ''}`}
          >
            <Icon
              className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white/70'}`}
            />
            {locked && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-midnight-900 border border-white/20 flex items-center justify-center">
                <Lock className="w-3 h-3 text-white/60" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
