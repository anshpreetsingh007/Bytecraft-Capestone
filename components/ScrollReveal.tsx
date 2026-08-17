"use client";

import React, { useEffect, useRef, useState, type ReactNode } from "react";

type RevealDirection = "up" | "down" | "left" | "right" | "none";

interface ScrollRevealProps {
  children: ReactNode;
  /** Animation direction the element enters from */
  direction?: RevealDirection;
  /** Delay in ms before animation starts */
  delay?: number;
  /** Distance in px the element travels */
  distance?: number;
  /** Duration of the animation in ms */
  duration?: number;
  /** How much of the element must be visible (0–1) */
  threshold?: number;
  /** Whether to animate only once or every time it enters */
  once?: boolean;
  /** Extra className on the wrapper */
  className?: string;
  /** Render as a different element */
  as?: keyof React.JSX.IntrinsicElements;
}

export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  distance = 40,
  duration = 600,
  threshold = 0.15,
  once = true,
  className = "",
  as: Tag = "div",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  const translate = {
    up: `translateY(${distance}px)`,
    down: `translateY(-${distance}px)`,
    left: `translateX(${distance}px)`,
    right: `translateX(-${distance}px)`,
    none: "translate(0, 0)",
  };

  const Component = Tag as any;

  return (
    <Component
      ref={ref}
      className={className}
      data-scroll-reveal="manual"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translate(0, 0)" : translate[direction],
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: isVisible ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </Component>
  );
}

/* ─── Staggered children wrapper ─── */

interface StaggerProps {
  children: ReactNode[];
  /** Base delay for the first child */
  baseDelay?: number;
  /** Delay increment between each child */
  stagger?: number;
  /** Animation direction */
  direction?: RevealDirection;
  /** Distance in px */
  distance?: number;
  /** Duration of each animation */
  duration?: number;
  /** Extra className on each wrapper */
  childClassName?: string;
  /** Extra className on the container */
  className?: string;
}

export function StaggerReveal({
  children,
  baseDelay = 0,
  stagger = 100,
  direction = "up",
  distance = 30,
  duration = 600,
  childClassName = "",
  className = "",
}: StaggerProps) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <ScrollReveal
          key={i}
          direction={direction}
          delay={baseDelay + i * stagger}
          distance={distance}
          duration={duration}
          className={childClassName}
        >
          {child}
        </ScrollReveal>
      ))}
    </div>
  );
}

/* ─── Parallax wrapper (subtle vertical shift on scroll) ─── */

interface ParallaxProps {
  children: ReactNode;
  /** How much slower than scroll (0.1 = very subtle, 0.5 = strong) */
  speed?: number;
  className?: string;
}

export function Parallax({
  children,
  speed = 0.15,
  className = "",
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    let ticking = false;

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            const center = rect.top + rect.height / 2;
            const viewCenter = window.innerHeight / 2;
            setOffset((center - viewCenter) * speed);
          }
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, [speed]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: `translateY(${offset}px)`,
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}

/* ─── Animated counter ─── */

interface CountUpProps {
  end: number;
  /** Duration in ms */
  duration?: number;
  /** Prefix text (e.g. "$") */
  prefix?: string;
  /** Suffix text (e.g. "+") */
  suffix?: string;
  className?: string;
}

export function CountUp({
  end,
  duration = 2000,
  prefix = "",
  suffix = "",
  className = "",
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      setCount(end);
      return;
    }

    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }, [started, end, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {count}
      {suffix}
    </span>
  );
}
