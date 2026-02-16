import { MessageSquare, Camera, Mic, Video, UserPlus, Check } from 'lucide-react';
import { ScoutMode } from './ModeDock';

interface EscalationBreadcrumbProps {
  activeMode: ScoutMode;
  visitedModes: Set<string>;
  isEscalated: boolean;
  messageCount: number;
  onSuggestEscalation?: () => void;
}

const MODE_CONFIG = [
  { id: 'chat' as const, icon: MessageSquare, label: 'Chat' },
  { id: 'photo' as const, icon: Camera, label: 'Photo' },
  { id: 'voice' as const, icon: Mic, label: 'Voice' },
  { id: 'video' as const, icon: Video, label: 'Video' },
  { id: 'human' as const, icon: UserPlus, label: 'Escalated' },
];

export function EscalationBreadcrumb({
  activeMode,
  visitedModes,
  isEscalated,
  messageCount,
  onSuggestEscalation,
}: EscalationBreadcrumbProps) {
  // Only show modes that have been visited or are currently active
  const visibleModes = MODE_CONFIG.filter(mode => {
    if (mode.id === 'human') return isEscalated;
    return visitedModes.has(mode.id);
  });

  return (
    <div className="py-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        {visibleModes.map((mode) => {
          const isActive = mode.id === 'human' ? isEscalated : mode.id === activeMode;
          const isPast = !isActive;
          const Icon = mode.icon;

          return (
            <div
              key={mode.id}
              className={`
                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200
                ${isActive
                  ? mode.id === 'human'
                    ? 'bg-orange-500/20 text-orange-400 ring-1 ring-orange-400/40'
                    : 'bg-[#6366F1]/20 text-[#818CF8] ring-1 ring-[#6366F1]/40'
                  : 'bg-white/5 text-white/50'
                }
              `}
            >
              <Icon className="w-3 h-3" />
              <span>{mode.label}</span>
              {isPast && (
                <Check className="w-2.5 h-2.5 text-[#06B6D4]" />
              )}
            </div>
          );
        })}
      </div>

      {messageCount > 8 && activeMode === 'chat' && !isEscalated && onSuggestEscalation && (
        <div className="mt-1.5">
          <button
            onClick={onSuggestEscalation}
            className="text-[10px] text-white/35 hover:text-[#06B6D4] transition-colors"
          >
            Not resolved? Try photo or voice for faster help
          </button>
        </div>
      )}
    </div>
  );
}
