import { MessageSquare, Camera, Mic, Video, UserPlus, Check, ChevronRight } from 'lucide-react';
import { ScoutMode } from './ModeDock';

interface EscalationBreadcrumbProps {
  activeMode: ScoutMode;
  visitedModes: Set<string>;
  isEscalated: boolean;
  messageCount: number;
  onSuggestEscalation?: () => void;
}

const STAGES = [
  { id: 'chat' as const, icon: MessageSquare, label: 'Chat' },
  { id: 'photo' as const, icon: Camera, label: 'Photo' },
  { id: 'voice' as const, icon: Mic, label: 'Voice' },
  { id: 'video' as const, icon: Video, label: 'Video' },
  { id: 'human' as const, icon: UserPlus, label: 'Human' },
];

export function EscalationBreadcrumb({
  activeMode,
  visitedModes,
  isEscalated,
  messageCount,
  onSuggestEscalation,
}: EscalationBreadcrumbProps) {
  return (
    <div className="py-2">
      <div className="flex items-center justify-center gap-1">
        {STAGES.map((stage, index) => {
          const isActive = stage.id === 'human' ? isEscalated : stage.id === activeMode;
          const isVisited = stage.id === 'human' ? isEscalated : visitedModes.has(stage.id);
          const isPast = isVisited && !isActive;
          const Icon = stage.icon;

          return (
            <div key={stage.id} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className={`w-3 h-3 shrink-0 ${
                  isVisited || isActive ? 'text-white/40' : 'text-white/15'
                }`} />
              )}
              <div className="flex items-center gap-1">
                <div
                  className={`relative w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? stage.id === 'human'
                        ? 'bg-orange-500/30 ring-1 ring-orange-400/50'
                        : 'bg-gradient-to-r from-[#6366F1] to-[#06B6D4] ring-1 ring-white/20'
                      : isPast
                        ? 'bg-[#06B6D4]/20'
                        : 'bg-white/5'
                  }`}
                >
                  <Icon className={`w-3 h-3 ${
                    isActive
                      ? 'text-white'
                      : isPast
                        ? 'text-[#06B6D4]'
                        : 'text-white/25'
                  }`} />
                  {isPast && (
                    <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#06B6D4] rounded-full flex items-center justify-center">
                      <Check className="w-1.5 h-1.5 text-white" />
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-medium hidden sm:inline ${
                  isActive
                    ? stage.id === 'human' ? 'text-orange-400' : 'text-white'
                    : isPast
                      ? 'text-[#06B6D4]/70'
                      : 'text-white/20'
                }`}>
                  {stage.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {messageCount > 8 && activeMode === 'chat' && !isEscalated && onSuggestEscalation && (
        <div className="text-center mt-1.5">
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
