"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState, useCallback } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import "./chatbot.css";

/* ─── Suggested starter questions ─── */

const SUGGESTIONS = [
  "What roofing services do you offer?",
  "How do I get a free estimate?",
  "Do you handle insurance claims?",
  "What areas do you serve?",
];

/* ─── Simple markdown-ish parser ─── */

function formatMessage(text: string) {
  const paragraphs = text.split(/\n{2,}/);

  return paragraphs.map((para, pi) => {
    const listItems = para.split("\n").filter((l) => /^[-•*]\s/.test(l.trim()));
    if (listItems.length > 0 && listItems.length === para.split("\n").filter(Boolean).length) {
      return (
        <ul key={pi}>
          {listItems.map((item, li) => (
            <li key={li}>{formatInline(item.replace(/^[-•*]\s+/, ""))}</li>
          ))}
        </ul>
      );
    }

    const orderedItems = para.split("\n").filter((l) => /^\d+[.)]\s/.test(l.trim()));
    if (orderedItems.length > 0 && orderedItems.length === para.split("\n").filter(Boolean).length) {
      return (
        <ol key={pi}>
          {orderedItems.map((item, li) => (
            <li key={li}>{formatInline(item.replace(/^\d+[.)]\s+/, ""))}</li>
          ))}
        </ol>
      );
    }

    return <p key={pi}>{formatInline(para)}</p>;
  });
}

function formatInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

/* ─── Time formatter ─── */

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/* ─── Lottie Hammer Animation ─── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let lottieLib: any = null;
let lottieLoading = false;
const lottieCallbacks: (() => void)[] = [];

function loadLottie(): Promise<void> {
  if (lottieLib) return Promise.resolve();
  return new Promise((resolve) => {
    lottieCallbacks.push(resolve);
    if (lottieLoading) return;
    lottieLoading = true;

    // Check if already loaded globally
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).lottie) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lottieLib = (window as any).lottie;
      lottieCallbacks.forEach((cb) => cb());
      lottieCallbacks.length = 0;
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js";
    script.async = true;
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lottieLib = (window as any).lottie;
      lottieCallbacks.forEach((cb) => cb());
      lottieCallbacks.length = 0;
    };
    document.head.appendChild(script);
  });
}

function LottieHammer({ size = 80 }: { size?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const animRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    loadLottie().then(() => {
      if (cancelled || !containerRef.current || !lottieLib) return;
      animRef.current = lottieLib.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/hammer-animation.json",
      });
    });

    return () => {
      cancelled = true;
      animRef.current?.destroy();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

/* ─── Full loading screen ─── */

function HammerLoader() {
  return (
    <div className="chat-loading">
      <LottieHammer size={100} />
      <p className="chat-loading-text">Getting things ready...</p>
      <p className="chat-loading-subtext">Markit AI is warming up</p>
    </div>
  );
}

/* ─── Inline hammer for AI response typing ─── */

function HammerTyping() {
  return (
    <div className="chat-msg-row assistant">
      <div className="chat-hammer-typing">
        <LottieHammer size={32} />
        <span className="chat-hammer-typing-text">Nailing your answer...</span>
      </div>
    </div>
  );
}

/* ─── Component ─── */

export default function Chatbot() {
  const { messages, status, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [input, setInput] = useState("");
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLoading = status === "submitted" || status === "streaming";

  /* Show hammer animation on first open, then mark ready */
  useEffect(() => {
    if (isOpen && !isReady) {
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isReady]);

  /* Auto-scroll to bottom on new messages */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  /* Focus input when chat opens and is ready */
  useEffect(() => {
    if (isOpen && !isClosing && isReady) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [isOpen, isClosing, isReady]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 250);
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setHasInteracted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  const handleSuggestion = (question: string) => {
    sendMessage({ text: question });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* ─── Chat window ─── */}
      {isOpen && (
        <div className={`chat-window mb-3 ${isClosing ? "closing" : ""}`}>
          <div className="chat-window-frame">
            {/* Header */}
            <div className="chat-header">
              <div className="chat-header-avatar">
                <Sparkles size={18} />
              </div>

              <div className="chat-header-info">
                <h3 className="chat-header-title">Markit Assistant</h3>
                <div className="chat-header-status">
                  <span className="chat-status-dot" />
                  {isReady ? "Online" : "Connecting..."}
                </div>
              </div>

              <button
                onClick={handleClose}
                className="chat-close-btn"
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages / Loading */}
            <div className="chat-messages">
              {!isReady ? (
                <HammerLoader />
              ) : messages.length === 0 ? (
                <>
                  {/* Empty state */}
                  <div className="chat-empty">
                    <div className="chat-empty-avatar">
                      <Sparkles size={24} />
                    </div>
                    <h4 className="chat-empty-title">Hi there!</h4>
                    <p className="chat-empty-subtitle">
                      I&apos;m the Markit Roofing assistant. Ask me anything
                      about our services, estimates, or scheduling.
                    </p>
                  </div>

                  {/* Suggested questions */}
                  <div className="chat-suggestions">
                    {SUGGESTIONS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        className="chat-suggestion-btn"
                        onClick={() => handleSuggestion(q)}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {messages.map((m) => (
                    <div key={m.id}>
                      <div className={`chat-msg-row ${m.role}`}>
                        <div className={`chat-msg-bubble ${m.role}`}>
                          {m.role === "assistant" ? (
                            formatMessage(
                              m.parts
                                .filter((part) => part.type === "text")
                                .map((part) => part.text)
                                .join("")
                            )
                          ) : (
                            m.parts
                              .filter((part) => part.type === "text")
                              .map((part, i) => (
                                <span key={i}>{part.text}</span>
                              ))
                          )}
                        </div>
                      </div>
                      <div
                        className={`chat-msg-time ${
                          m.role === "user" ? "text-right" : ""
                        }`}
                      >
                        {formatTime(m.createdAt ?? new Date())}
                      </div>
                    </div>
                  ))}

                  {/* Hammer typing indicator while AI responds */}
                  {isLoading && <HammerTyping />}
                </>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="chat-input-area">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isReady ? "Type a message…" : "Loading..."}
                className="chat-input"
                disabled={isLoading || !isReady}
                aria-label="Chat message"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim() || !isReady}
                className="chat-send-btn"
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </form>

            {/* Powered by */}
            <div className="chat-powered">
              Powered by Markit AI
            </div>
          </div>
        </div>
      )}

      {/* ─── Floating action button ─── */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="chat-fab"
          aria-label="Open chat assistant"
        >
          <MessageCircle size={26} />
          {!hasInteracted && <span className="chat-fab-ping" />}
        </button>
      )}
    </div>
  );
}
