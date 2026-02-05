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
    handleScroll(); // Initial call
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return { ref, offset };
};

// Animation types
type AnimationType = 'fadeIn' | 'fadeInUp' | 'fadeInDown' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn' | 'none';

// Animated wrapper component with various animation types
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
  duration = 0.6,
  className = '',
}) => {
  const { ref, isInView } = useInView();

  const baseStyles: React.CSSProperties = {
    transition: `opacity ${duration}s ease-out, transform ${duration}s ease-out`,
    transitionDelay: `${delay}s`,
  };

  const animations: Record<AnimationType, { hidden: React.CSSProperties; visible: React.CSSProperties }> = {
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
    fadeInUp: {
      hidden: { opacity: 0, transform: 'translateY(30px)' },
      visible: { opacity: 1, transform: 'translateY(0)' },
    },
    fadeInDown: {
      hidden: { opacity: 0, transform: 'translateY(-30px)' },
      visible: { opacity: 1, transform: 'translateY(0)' },
    },
    fadeInLeft: {
      hidden: { opacity: 0, transform: 'translateX(-30px)' },
      visible: { opacity: 1, transform: 'translateX(0)' },
    },
    fadeInRight: {
      hidden: { opacity: 0, transform: 'translateX(30px)' },
      visible: { opacity: 1, transform: 'translateX(0)' },
    },
    scaleIn: {
      hidden: { opacity: 0, transform: 'scale(0.9)' },
      visible: { opacity: 1, transform: 'scale(1)' },
    },
    none: {
      hidden: {},
      visible: {},
    },
  };

  const currentAnimation = animations[animation] || animations.fadeInUp;
  const animationStyles = isInView ? currentAnimation.visible : currentAnimation.hidden;

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...baseStyles, ...animationStyles }}
    >
      {children}
    </div>
  );
};

// Staggered children animation wrapper
export const StaggeredContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  animation?: AnimationType;
}> = ({ children, className = '', staggerDelay = 0.1, animation = 'fadeInUp' }) => {
  const { ref, isInView } = useInView();

  const getTransform = (anim: AnimationType, visible: boolean) => {
    if (visible) return 'translate(0, 0) scale(1)';
    switch (anim) {
      case 'fadeInUp': return 'translateY(20px)';
      case 'fadeInDown': return 'translateY(-20px)';
      case 'fadeInLeft': return 'translateX(-20px)';
      case 'fadeInRight': return 'translateX(20px)';
      case 'scaleIn': return 'scale(0.95)';
      default: return 'none';
    }
  };

  return (
    <div ref={ref} className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          style={{
            transition: `opacity 0.5s ease-out, transform 0.5s ease-out`,
            transitionDelay: `${index * staggerDelay}s`,
            opacity: isInView ? 1 : 0,
            transform: getTransform(animation, isInView),
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

// Floating animation wrapper (for decorative elements)
export const FloatingElement: React.FC<{
  children: React.ReactNode;
  className?: string;
  duration?: number;
  distance?: number;
}> = ({ children, className = '', duration = 3, distance = 10 }) => {
  return (
    <div
      className={className}
      style={{
        animation: `float ${duration}s ease-in-out infinite`,
      }}
    >
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-${distance}px); }
          }
        `}
      </style>
      {children}
    </div>
  );
};

// Pulse animation wrapper
export const PulseElement: React.FC<{
  children: React.ReactNode;
  className?: string;
  duration?: number;
}> = ({ children, className = '', duration = 2 }) => {
  return (
    <div
      className={className}
      style={{
        animation: `pulse ${duration}s ease-in-out infinite`,
      }}
    >
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.02); }
          }
        `}
      </style>
      {children}
    </div>
  );
};

// Counter animation hook
export const useCountUp = (end: number, duration: number = 2000, startOnView: boolean = true) => {
  const [count, setCount] = useState(0);
  const { ref, isInView } = useInView();
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (startOnView && !isInView) return;
    if (hasStarted) return;

    setHasStarted(true);
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));

      if (progress >= 1) {
        clearInterval(timer);
        setCount(end);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [end, duration, isInView, startOnView, hasStarted]);

  return { count, ref };
};

// Typewriter effect hook
export const useTypewriter = (text: string, speed: number = 50, startOnView: boolean = true) => {
  const [displayText, setDisplayText] = useState('');
  const { ref, isInView } = useInView();
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (startOnView && !isInView) return;
    if (hasStarted) return;

    setHasStarted(true);
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, isInView, startOnView, hasStarted]);

  return { displayText, ref, isComplete: displayText === text };
};
