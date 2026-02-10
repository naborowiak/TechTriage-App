import { Check, Lightbulb } from 'lucide-react';
import { GuidedAction, PresentChoicesAction, ShowStepAction, ConfirmResultAction } from '../../types';

export const SOMETHING_ELSE_LABEL = "It's Something Else";

export function ChoicePills({
  action,
  messageId,
  onSelect,
  disabled,
  variant = 'chat',
}: {
  action: PresentChoicesAction;
  messageId: string;
  onSelect: (messageId: string, action: GuidedAction, text: string) => void;
  disabled: boolean;
  variant?: 'chat' | 'compact';
}) {
  const isAnswered = !!action.selectedChoice;
  const isSomethingElseSelected = action.selectedChoice === SOMETHING_ELSE_LABEL;
  const pillClass = variant === 'compact' ? 'px-4 py-3 rounded-xl text-base' : 'px-5 py-3 rounded-xl text-base';

  return (
    <div className="mt-3 space-y-2" role="group" aria-label={action.prompt}>
      {action.prompt && (
        <p className={`font-semibold ${variant === 'compact' ? 'text-white text-base mb-1' : 'text-text-secondary dark:text-white/70 text-sm'}`}>{action.prompt}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {action.choices.map((choice, i) => {
          const isSelected = action.selectedChoice === choice;
          return (
            <button
              key={i}
              onClick={() => {
                if (isAnswered || disabled) return;
                onSelect(messageId, { ...action, selectedChoice: choice }, choice);
              }}
              disabled={isAnswered || disabled}
              aria-pressed={isSelected}
              aria-label={choice}
              className={`
                ${pillClass} font-medium transition-all
                ${isSelected
                  ? 'bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white ring-2 ring-white/30'
                  : isAnswered
                    ? 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-white/30 cursor-default'
                    : 'bg-light-200 dark:bg-white/10 border border-light-400 dark:border-white/20 text-text-primary dark:text-white hover:bg-light-300 dark:hover:bg-white/20 hover:border-[#06B6D4]/50 active:scale-95'
                }
              `}
            >
              {isSelected && <Check className="w-4 h-4 inline mr-1.5" />}
              {choice}
            </button>
          );
        })}
        {/* "It's Something Else" escape valve — always appended by frontend */}
        <button
          onClick={() => {
            if (isAnswered || disabled) return;
            onSelect(messageId, { ...action, selectedChoice: SOMETHING_ELSE_LABEL }, SOMETHING_ELSE_LABEL);
          }}
          disabled={isAnswered || disabled}
          aria-pressed={isSomethingElseSelected}
          aria-label={SOMETHING_ELSE_LABEL}
          className={`
            ${pillClass} font-medium transition-all
            ${isSomethingElseSelected
              ? 'bg-light-300 dark:bg-white/20 text-gray-800 dark:text-white ring-2 ring-gray-300 dark:ring-white/20'
              : isAnswered
                ? 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-white/20 cursor-default'
                : 'bg-transparent border border-gray-300 dark:border-white/15 text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-white/70 active:scale-95'
            }
          `}
        >
          {isSomethingElseSelected && <Check className="w-4 h-4 inline mr-1.5" />}
          {SOMETHING_ELSE_LABEL}
        </button>
      </div>
    </div>
  );
}

export function StepCard({ action, variant = 'chat' }: { action: ShowStepAction; variant?: 'chat' | 'compact' }) {
  const textClass = variant === 'compact' ? 'text-base' : 'text-base';
  return (
    <div
      className="mt-3 bg-light-200 dark:bg-white/5 border border-light-300 dark:border-white/10 rounded-2xl overflow-hidden"
      role="article"
      aria-label={`Step ${action.stepNumber}: ${action.title}`}
    >
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#6366F1]/20 to-[#06B6D4]/20 border-b border-light-300 dark:border-white/10">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#6366F1] to-[#06B6D4] flex items-center justify-center text-white font-bold text-sm shrink-0">
          {action.stepNumber}
        </div>
        <h4 className={`text-text-primary dark:text-white font-semibold ${textClass}`}>{action.title}</h4>
      </div>
      <div className="px-4 py-3">
        <p className={`text-text-primary dark:text-white/90 ${textClass} leading-relaxed`}>{action.instruction}</p>
      </div>
      {action.tip && (
        <div className="px-4 py-2.5 bg-amber-500/10 border-t border-light-200 dark:border-white/5 flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-amber-700 dark:text-amber-200/90 text-sm">{action.tip}</p>
        </div>
      )}
    </div>
  );
}

export function ConfirmButtons({
  action,
  messageId,
  onSelect,
  disabled,
  variant = 'chat',
}: {
  action: ConfirmResultAction;
  messageId: string;
  onSelect: (messageId: string, action: GuidedAction, text: string) => void;
  disabled: boolean;
  variant?: 'chat' | 'compact';
}) {
  const isAnswered = !!action.selectedAnswer;
  const yesLabel = action.yesLabel || 'Yes';
  const noLabel = action.noLabel || 'No';
  const btnClass = variant === 'compact' ? 'py-3.5 rounded-xl text-base' : 'py-3.5 rounded-xl text-base';

  return (
    <div className="mt-3 space-y-3" role="group" aria-label={action.question}>
      <p className={`font-semibold ${variant === 'compact' ? 'text-white text-base' : 'text-text-primary dark:text-white/80 text-base'}`}>{action.question}</p>
      <div className="flex gap-3">
        <button
          onClick={() => {
            if (isAnswered || disabled) return;
            onSelect(messageId, { ...action, selectedAnswer: 'yes' }, yesLabel);
          }}
          disabled={isAnswered || disabled}
          aria-pressed={action.selectedAnswer === 'yes'}
          aria-label={`${yesLabel} — confirm yes`}
          className={`
            flex-1 ${btnClass} font-semibold transition-all
            ${action.selectedAnswer === 'yes'
              ? 'bg-emerald-500 text-white ring-2 ring-emerald-400/30'
              : isAnswered
                ? 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-white/30 cursor-default'
                : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/30 active:scale-95'
            }
          `}
        >
          {action.selectedAnswer === 'yes' && <Check className="w-4 h-4 inline mr-1.5" />}
          {yesLabel}
        </button>
        <button
          onClick={() => {
            if (isAnswered || disabled) return;
            onSelect(messageId, { ...action, selectedAnswer: 'no' }, noLabel);
          }}
          disabled={isAnswered || disabled}
          aria-pressed={action.selectedAnswer === 'no'}
          aria-label={`${noLabel} — confirm no`}
          className={`
            flex-1 ${btnClass} font-semibold transition-all
            ${action.selectedAnswer === 'no'
              ? 'bg-red-500 text-white ring-2 ring-red-400/30'
              : isAnswered
                ? 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-white/30 cursor-default'
                : 'bg-red-500/20 border border-red-500/40 text-red-600 dark:text-red-300 hover:bg-red-500/30 active:scale-95'
            }
          `}
        >
          {action.selectedAnswer === 'no' && <Check className="w-4 h-4 inline mr-1.5" />}
          {noLabel}
        </button>
      </div>
    </div>
  );
}
