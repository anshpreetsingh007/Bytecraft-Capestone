"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * AutoScrollReveal — a layout-level component that automatically observes
 * common UI elements (cards, stat blocks, headings, panels, list items, etc.)
 * and animates them into view with a scroll-triggered entrance.
 *
 * Drop it once in a layout and every matching descendant gets animated —
 * no need to wrap each element individually with <ScrollReveal>.
 *
 * Elements opt-in via the `data-reveal` attribute or automatically if they
 * match one of the common selectors below.
 */

/** CSS selectors for elements that get auto-animated */
const AUTO_SELECTORS = [
  // Explicit opt-in
  "[data-reveal]",
  // Dashboard patterns (admin/inspector)
  ".dash-stat",
  ".dash-panel",
  ".dash-row",
  // Admin page patterns
  ".invoice-card",
  ".assignment-card",
  ".assignment-item",
  // Cards and content blocks
  ".card",
  ".card-hover-glow",
  // Generic sections with headings
  "section > div > h2",
  "section > div > .max-w-\\[60ch\\]",
  // Grid children (service cards, material cards, value cards, etc.)
  ".grid > div",
  // Stats & info blocks
  ".border-y > .text-center",
  // Timeline entries
  ".border-l-2 > div",
  // Contact info blocks
  ".border-t > div",
].join(",");

const STAGGER_DELAY = 80; // ms between siblings in a group

export default function AutoScrollReveal() {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const mutationRef = useRef<MutationObserver | null>(null);

  const setupElement = useCallback((el: Element) => {
    // Don't double-initialise
    if ((el as HTMLElement).dataset.revealReady) return;
    (el as HTMLElement).dataset.revealReady = "1";

    const htmlEl = el as HTMLElement;

    // Calculate stagger index among siblings that are also reveal targets
    let staggerIndex = 0;
    const parent = el.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      for (const sib of siblings) {
        if (sib === el) break;
        if (sib.matches?.(AUTO_SELECTORS)) staggerIndex++;
      }
    }

    // Read data-reveal attribute for direction override
    const direction = (htmlEl.dataset.reveal as string) || "up";

    const distance = 30; // px
    const duration = 550; // ms
    const delay = staggerIndex * STAGGER_DELAY;

    // Set initial hidden state
    htmlEl.style.opacity = "0";
    htmlEl.style.transition = "none";

    const translateMap: Record<string, string> = {
      up: `translateY(${distance}px)`,
      down: `translateY(-${distance}px)`,
      left: `translateX(${distance}px)`,
      right: `translateX(-${distance}px)`,
      none: "translate(0, 0)",
    };

    htmlEl.style.transform = translateMap[direction] || translateMap.up;

    observerRef.current?.observe(el);
  }, []);

  useEffect(() => {
    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    // Create IntersectionObserver
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const el = entry.target as HTMLElement;

          // Calculate per-element stagger
          let staggerIndex = 0;
          const parent = el.parentElement;
          if (parent) {
            const siblings = Array.from(parent.children);
            for (const sib of siblings) {
              if (sib === el) break;
              if (sib.matches?.(AUTO_SELECTORS) && (sib as HTMLElement).dataset.revealReady) {
                staggerIndex++;
              }
            }
          }

          const delay = staggerIndex * STAGGER_DELAY;
          const duration = 550;

          // Apply the reveal
          el.style.transition = `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;
          el.style.opacity = "1";
          el.style.transform = "translate(0, 0)";

          // Observe only once
          observerRef.current?.unobserve(el);

          // Cleanup will-change after animation
          setTimeout(() => {
            el.style.willChange = "auto";
          }, delay + duration + 50);
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -30px 0px",
      }
    );

    // Initial scan
    function scanAndObserve() {
      const elements = document.querySelectorAll(AUTO_SELECTORS);
      elements.forEach((el) => {
        // Skip elements that are already inside a ScrollReveal wrapper
        // (they have inline opacity/transform from the manual component)
        const htmlEl = el as HTMLElement;
        if (htmlEl.closest("[data-scroll-reveal]")) return;
        // Skip elements that already have the manual ScrollReveal inline styles
        if (htmlEl.style.opacity && htmlEl.dataset.revealReady !== "1") {
          // If the element already has opacity set by ScrollReveal, skip it
          const parent = htmlEl.parentElement;
          if (parent && parent.style.opacity !== "") return;
        }
        setupElement(el);
      });
    }

    // Delay initial scan to let the page render first
    const timer = requestAnimationFrame(() => {
      scanAndObserve();
    });

    // Watch for dynamically added elements (route changes, lazy content)
    mutationRef.current = new MutationObserver((mutations) => {
      let hasNew = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          hasNew = true;
          break;
        }
      }
      if (hasNew) {
        // Debounce slightly to batch DOM additions
        requestAnimationFrame(scanAndObserve);
      }
    });

    mutationRef.current.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      cancelAnimationFrame(timer);
      observerRef.current?.disconnect();
      mutationRef.current?.disconnect();
    };
  }, [setupElement]);

  return null; // This is a side-effect-only component
}
