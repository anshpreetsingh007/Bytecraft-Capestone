"use client";

/**
 * An accessible dialog.
 *
 * Destructive actions previously used window.confirm, which cannot be styled,
 * cannot explain what is about to happen, and reads badly on mobile. This
 * traps focus, restores it on close, closes on Escape, and labels itself
 * properly for screen readers.
 */
import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import "./ui.css";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  labelledById = "ui-modal-title",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  labelledById?: string;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Callers routinely pass an inline `onClose` (e.g. `() => setOpen(false)`),
  // which gets a new identity on every render of the parent. Reading it
  // through a ref keeps `handleKeyDown` — and the effect below — stable
  // across those renders, instead of tearing the dialog's focus/listener
  // setup down and back up on every keystroke typed into a field it
  // contains (which stole focus back to the first field each time).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onCloseRef.current();
      return;
    }

    if (event.key !== "Tab" || !dialogRef.current) return;

    const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    // Wrap at both ends so Tab cannot escape into the page behind.
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    firstFocusable?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus();
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="ui-modal-backdrop"
      onMouseDown={(event) => {
        // Only a click that both starts and ends on the backdrop closes it,
        // so dragging a text selection out of the dialog does not dismiss it.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="ui-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledById}
        ref={dialogRef}
      >
        <div className="ui-modal__header">
          <div>
            <h2 className="ui-modal__title" id={labelledById}>
              {title}
            </h2>
            {description ? <p className="ui-modal__description">{description}</p> : null}
          </div>
          <button type="button" className="ui-modal__close" onClick={onClose} aria-label="Close dialog">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {children ? <div className="ui-modal__body">{children}</div> : null}
        {footer ? <div className="ui-modal__footer">{footer}</div> : null}
      </div>
    </div>
  );
}

/** The common case: "are you sure you want to delete this". */
export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={busy ? () => undefined : onCancel}
      title={title}
      description={description}
      footer={
        <>
          <button type="button" className="ui-button ui-button--secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`ui-button ${destructive ? "ui-button--danger" : "ui-button--primary"}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Working..." : confirmLabel}
          </button>
        </>
      }
    />
  );
}
