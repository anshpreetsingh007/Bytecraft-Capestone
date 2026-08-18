"use client";

/**
 * Toasts.
 *
 * Saves, deletes and approvals previously succeeded silently, so the only way
 * to know whether an action had worked was to watch the table redraw. Errors
 * were worse: most of them went to console.error and the user saw nothing.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import "./ui.css";

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: number;
  variant: ToastVariant;
  title: string;
  message?: string;
}

interface ToastContextValue {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS: Record<ToastVariant, number> = {
  success: 4000,
  info: 5000,
  // Errors stay longer: they usually carry something the user needs to read.
  error: 9000,
};

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info } as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (variant: ToastVariant, title: string, message?: string) => {
      const id = nextId.current++;
      // Cap the stack so a loop of failing requests cannot bury the page.
      setToasts((current) => [...current.slice(-3), { id, variant, title, message }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), AUTO_DISMISS_MS[variant]),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (title, message) => push("success", title, message),
      error: (title, message) => push("error", title, message),
      info: (title, message) => push("info", title, message),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Assertive so an error interrupts a screen reader rather than queueing
          behind whatever else is being announced. */}
      <div className="ui-toast-viewport" role="region" aria-label="Notifications">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.variant];
          return (
            <div
              key={toast.id}
              className={`ui-toast ui-toast--${toast.variant}`}
              role={toast.variant === "error" ? "alert" : "status"}
              aria-live={toast.variant === "error" ? "assertive" : "polite"}
            >
              <Icon size={18} className="ui-toast__icon" aria-hidden="true" />
              <div className="ui-toast__body">
                <div className="ui-toast__title">{toast.title}</div>
                {toast.message ? <div className="ui-toast__message">{toast.message}</div> : null}
              </div>
              <button
                type="button"
                className="ui-toast__close"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Falls back to no-ops rather than throwing when a component renders outside
 * the provider, so a missing provider degrades to "no toast" instead of a
 * blank page.
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (context) return context;

  return {
    success: () => undefined,
    error: () => undefined,
    info: () => undefined,
    dismiss: () => undefined,
  };
}
