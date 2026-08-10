"use client";

import { useState } from "react";

type PasswordInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
  error?: string;
  helpText?: string;
};

export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete = "current-password",
  placeholder,
  error,
  helpText,
}: PasswordInputProps) {
  const [show, setShow] = useState(false);
  const errorId = error ? `${id}-error` : undefined;
  const helpId = !error && helpText ? `${id}-help` : undefined;

  return (
    <>
      <div className="password-input-wrap">
        <input
          id={id}
          name={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId || helpId}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          aria-controls={id}
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {error && (
        <p id={errorId} className="field-error" role="alert">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
      {helpId && (
        <p id={helpId} className="auth-help">{helpText}</p>
      )}
    </>
  );
}