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

// Hook for parallax scroll effect
export const useParallax = (speed: number = 0.5) => {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const scrolled = window.innerHeight - rect.top;
      if (scrolled > 0 && rect.bottom > 0) {
        setOffset(scrolled * speed);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return { ref, offset };
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
