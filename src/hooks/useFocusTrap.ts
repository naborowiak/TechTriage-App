import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

interface UseFocusTrapOptions {
  onClose: () => void;
  active?: boolean;
}

/**
 * Traps keyboard focus within a container element (modal/dialog).
 * - Tab / Shift+Tab cycles through focusable elements
 * - Escape key calls onClose
 * - Auto-focuses first focusable element on mount
 * - Restores focus to previously-focused element on unmount
 * - Locks body scroll while active
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  { onClose, active = true }: UseFocusTrapOptions
): void {
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Save the element that had focus before the modal opened
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    // Lock body scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Auto-focus first focusable element after a brief delay (let modal render)
    const focusTimer = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;
      const first = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      first?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const container = containerRef.current;
      if (!container) return;

      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: wrap from first to last
        if (document.activeElement === first || !container.contains(document.activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: wrap from last to first
        if (document.activeElement === last || !container.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = prevOverflow;
      // Restore focus to the element that was focused before the modal
      previouslyFocusedRef.current?.focus();
    };
  }, [containerRef, onClose, active]);
}
