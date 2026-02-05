import React from 'react';
import { MessageSquare, Camera, Mic, Video, Lock } from 'lucide-react';
import { UserTier } from '../../stores/usageStore';

export type ServiceMode = 'chat' | 'snap' | 'voice' | 'video';

interface ModeSelectorProps {
  activeMode: ServiceMode;
  onModeChange: (mode: ServiceMode) => void;
  tier: UserTier;
  onLockedModeClick: (mode: ServiceMode) => void;
}

interface ModeConfig {
  id: ServiceMode;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  lockedTiers: UserTier[];
}

const MODES: ModeConfig[] = [
  {
    id: 'chat',
    icon: MessageSquare,
    label: 'Chat',
    lockedTiers: [],
  },
  {
    id: 'snap',
    icon: Camera,
    label: 'Snap',
    lockedTiers: ['guest'],
  },
  {
    id: 'voice',
    icon: Mic,
    label: 'Voice',
    lockedTiers: ['guest', 'free'],
  },
  {
    id: 'video',
    icon: Video,
    label: 'Video',
    lockedTiers: ['guest', 'free'],
  },
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  activeMode,
  onModeChange,
  tier,
  onLockedModeClick,
}) => {
  const isModeLocked = (mode: ModeConfig): boolean => {
    return mode.lockedTiers.includes(tier);
  };

  const handleModeClick = (mode: ModeConfig) => {
    if (isModeLocked(mode)) {
      onLockedModeClick(mode.id);
    } else {
      onModeChange(mode.id);
    }
  };

  return (
    <div className="flex gap-1 p-1 bg-light-100 dark:bg-midnight-800 rounded-lg">
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const locked = isModeLocked(mode);
        const isActive = activeMode === mode.id && !locked;

        return (
          <button
            key={mode.id}
            onClick={() => handleModeClick(mode)}
            className={`
              relative p-2 rounded-md transition-all duration-200
              ${isActive
                ? 'bg-gradient-to-r from-electric-indigo to-electric-cyan text-white shadow-sm'
                : locked
                  ? 'text-text-muted cursor-not-allowed'
                  : 'text-text-secondary hover:text-electric-indigo hover:bg-light-200 dark:hover:bg-midnight-700'
              }
            `}
            title={locked ? `${mode.label} requires upgrade` : mode.label}
          >
            <Icon className="w-4 h-4" />
            {locked && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-midnight-900 dark:bg-midnight-700 rounded-full flex items-center justify-center">
                <Lock className="w-2 h-2 text-text-muted" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ModeSelector;
