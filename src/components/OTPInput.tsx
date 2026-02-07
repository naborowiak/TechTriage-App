import React, { useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";

interface OTPInputProps {
  length?: number;
  onComplete: (code: string) => void;
  onInput?: () => void; // called on any digit entry — use to clear errors
  disabled?: boolean;
  error?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  onComplete,
  onInput,
  disabled = false,
  error = false,
}) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Auto-focus the first input on mount
    inputsRef.current[0]?.focus();
  }, []);

  const getValues = () => inputsRef.current.map((inp) => inp?.value || "");

  const triggerComplete = (values: string[]) => {
    const code = values.join("");
    if (code.length === length) {
      onComplete(code);
    }
  };

  const handleChange = (index: number, value: string) => {
    // Only accept digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const input = inputsRef.current[index];
    if (input) input.value = digit;

    // Notify parent of any input (for clearing errors)
    if (digit && onInput) onInput();

    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    triggerComplete(getValues());
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      const input = inputsRef.current[index];
      if (input && !input.value && index > 0) {
        const prev = inputsRef.current[index - 1];
        if (prev) {
          prev.value = "";
          prev.focus();
        }
      }
      // Clear error on backspace too
      if (onInput) onInput();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;

    pasted.split("").forEach((char, i) => {
      const input = inputsRef.current[i];
      if (input) input.value = char;
    });

    // Focus the next empty input or the last one
    const nextEmpty = inputsRef.current.findIndex((inp) => !inp?.value);
    const focusIndex = nextEmpty === -1 ? length - 1 : nextEmpty;
    inputsRef.current[focusIndex]?.focus();

    if (onInput) onInput();
    triggerComplete(getValues());
  };

  // Clear all inputs (useful for resetting after error)
  const clearAll = () => {
    inputsRef.current.forEach((inp) => {
      if (inp) inp.value = "";
    });
    inputsRef.current[0]?.focus();
  };

  // Re-focus first input when error state changes (so user can retype)
  useEffect(() => {
    if (error) {
      clearAll();
    }
  }, [error]);

  const borderColor = error
    ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
    : "border-light-300 dark:border-midnight-600 focus:border-electric-indigo focus:ring-electric-indigo/30";

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputsRef.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          onFocus={(e) => e.target.select()}
          className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-white dark:bg-midnight-800 text-text-primary dark:text-white outline-none transition-all focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed ${borderColor}`}
        />
      ))}
    </div>
  );
};
