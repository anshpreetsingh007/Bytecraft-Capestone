"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";

export default function Chatbot() {
  const { messages, status, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");

  const isLoading = status === "submitted" || status === "streaming";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-[var(--color-surface,#fff)] border border-[var(--color-border,#e5e7eb)] shadow-xl rounded-2xl w-80 sm:w-96 h-[500px] mb-4 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[#0c2d4a] text-white p-4 flex justify-between items-center">
            <h3 className="font-semibold text-lg">Markit Assistant</h3>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-white/70">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--color-bg,#f9fafb)] flex flex-col">
            {messages.length === 0 ? (
              <p className="text-[var(--color-muted,#6b7280)] text-center text-sm mt-4">
                Hi! I'm the Markit Roofing assistant. How can I help you today?
              </p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-2 ${
                      m.role === "user"
                        ? "bg-orange-700 dark:bg-orange-400 text-white dark:text-slate-900"
                        : "bg-[var(--color-surface,#fff)] border border-[var(--color-border,#e5e7eb)] text-[var(--color-ink,#1f2937)]"
                    }`}
                  >
                    {m.parts
                      .filter((part) => part.type === "text")
                      .map((part, i) => (
                        <span key={i}>{part.text}</span>
                      ))}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[var(--color-surface,#fff)] border border-[var(--color-border,#e5e7eb)] text-[var(--color-ink,#1f2937)] max-w-[80%] rounded-xl px-4 py-2">
                  <span className="animate-pulse">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-[var(--color-border,#e5e7eb)] bg-[var(--color-surface,#fff)] flex gap-2">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask me anything..."
              className="flex-1 border border-[var(--color-border,#d1d5db)] rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-700 dark:focus:ring-orange-400 bg-[var(--color-bg,#fff)] text-[var(--color-ink,#000)]"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-orange-700 dark:bg-orange-400 text-white dark:text-slate-900 p-2 rounded-full hover:bg-orange-800 dark:hover:bg-orange-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-orange-700 dark:bg-orange-400 text-white dark:text-slate-900 p-4 rounded-full shadow-lg hover:bg-orange-800 dark:hover:bg-orange-300 transition-transform hover:scale-105"
          aria-label="Open chat assistant"
        >
          <MessageCircle size={28} />
        </button>
      )}
    </div>
  );
}
