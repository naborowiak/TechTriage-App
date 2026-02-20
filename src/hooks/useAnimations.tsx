import React, { useState, useRef, useEffect } from 'react';

// Hook to detect when an element is in viewport
export const useInView = (options?: IntersectionObserverInit) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsInView(true);
          setHasAnimated(true);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px', ...options }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [hasAnimated, options]);

  return { ref, isInView };
};

// ── Arcade-style scroll reveal ──
// Single shared IntersectionObserver that adds 'is-visible' class to .reveal elements.
// Usage: call useScrollReveal() in any component — it auto-observes all .reveal elements
// within containerRef (or document if no container).
let sharedObserver: IntersectionObserver | null = null;
const observedElements = new Set<Element>();

function getSharedObserver(): IntersectionObserver {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            sharedObserver?.unobserve(entry.target);
            observedElements.delete(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
  }
  return sharedObserver;
}

export const useScrollReveal = (containerRef?: React.RefObject<HTMLElement | null>) => {
  useEffect(() => {
    const observer = getSharedObserver();
    const root = containerRef?.current ?? document;

    // Observe all .reveal elements that aren't already visible
    const elements = root.querySelectorAll('.reveal:not(.is-visible)');
    elements.forEach((el) => {
      if (!observedElements.has(el)) {
        observedElements.add(el);
        observer.observe(el);
      }
    });

    return () => {
      elements.forEach((el) => {
        observer.unobserve(el);
        observedElements.delete(el);
      });
    };
  });
};

// ── Scroll position hook (for header blur-on-scroll) ──
export const useScrolled = (threshold = 6): boolean => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const check = () => setScrolled(window.scrollY >= threshold);
    check(); // initial
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  }, [threshold]);

  return scrolled;
};

// Animation types
type AnimationType = 'fadeIn' | 'fadeInUp' | 'fadeInDown' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn' | 'none';

// Map animation types to CSS scroll-driven animation classes
const animClassMap: Record<AnimationType, string> = {
  fadeIn: 'scroll-fade-in',
  fadeInUp: 'scroll-fade-in-up',
  fadeInDown: 'scroll-fade-in-down',
  fadeInLeft: 'scroll-fade-in-left',
  fadeInRight: 'scroll-fade-in-right',
  scaleIn: 'scroll-scale-in',
  none: '',
};

// Animated wrapper using CSS scroll-driven animations (animation-timeline: view())
export const AnimatedElement: React.FC<{
  children: React.ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
}> = ({
  children,
  animation = 'fadeInUp',
  delay = 0,
  className = '',
}) => {
  const animClass = animClassMap[animation] || animClassMap.fadeInUp;
  const style = delay > 0
    ? { '--stagger': `${Math.round(delay * 50)}%` } as React.CSSProperties
    : undefined;

  return (
    <div className={`${animClass} ${className}`} style={style}>
      {children}
    </div>
  );
};
