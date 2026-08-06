"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../Context/AuthContext";
import "../auth-form.css";

type FormErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
};

export default function SignUpPage() {
  const { signUp } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validateForm() {
    const newErrors: FormErrors = {};

    if (!firstName.trim()) {
      newErrors.firstName = "Please enter your first name.";
    }

    if (!lastName.trim()) {
      newErrors.lastName = "Please enter your last name.";
    }

    if (!email.trim()) {
      newErrors.email = "Please enter your email address.";
    } else if (!isValidEmail(email.trim())) {
      newErrors.email =
        "Please enter a valid email, such as name@example.com.";
    }

    if (!password) {
      newErrors.password = "Please create a password.";
    } else if (password.length < 6) {
      newErrors.password =
        "Your password must contain at least 6 characters.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword =
        "Please confirm your password.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword =
        "The passwords do not match. Please try again.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  function clearFieldError(field: keyof FormErrors) {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      general: undefined,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      await signUp(email.trim(), password, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      router.push("/redirecting");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "We could not create your account. Please try again.";

      setErrors({
        general: message,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section
        className="auth-card"
        aria-labelledby="signup-title"
      >
        <Link href="/signin" className="auth-back">
          <span aria-hidden="true">←</span>
          Back to sign in
        </Link>

        <div className="logo-container">
          <img
            src="/images/markit-roofing-white.jpg"
            alt="Markit Roofing"
            className="auth-logo"
          />
        </div>

        <h1 id="signup-title" className="auth-title">
          Create Account
        </h1>

        <p className="auth-subtitle">
          Create an account to book inspections.
        </p>

        {errors.general && (
          <div
            className="auth-error"
            role="alert"
            aria-live="assertive"
          >
            {errors.general}
          </div>
        )}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="auth-field">
            <label htmlFor="first-name">
              First name
            </label>

            <input
              id="first-name"
              name="firstName"
              type="text"
              autoComplete="given-name"
              placeholder="Enter your first name"
              value={firstName}
              onChange={(event) => {
                setFirstName(event.target.value);
                clearFieldError("firstName");
              }}
              aria-invalid={Boolean(errors.firstName)}
              aria-describedby={
                errors.firstName
                  ? "first-name-error"
                  : undefined
              }
            />

            {errors.firstName && (
              <p
                id="first-name-error"
                className="field-error"
                role="alert"
              >
                <span aria-hidden="true">⚠</span>
                {errors.firstName}
              </p>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="last-name">
              Last name
            </label>

            <input
              id="last-name"
              name="lastName"
              type="text"
              autoComplete="family-name"
              placeholder="Enter your last name"
              value={lastName}
              onChange={(event) => {
                setLastName(event.target.value);
                clearFieldError("lastName");
              }}
              aria-invalid={Boolean(errors.lastName)}
              aria-describedby={
                errors.lastName
                  ? "last-name-error"
                  : undefined
              }
            />

            {errors.lastName && (
              <p
                id="last-name-error"
                className="field-error"
                role="alert"
              >
                <span aria-hidden="true">⚠</span>
                {errors.lastName}
              </p>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="signup-email">
              Email
            </label>

            <input
              id="signup-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                clearFieldError("email");
              }}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email
                  ? "email-error"
                  : undefined
              }
            />

            {errors.email && (
              <p
                id="email-error"
                className="field-error"
                role="alert"
              >
                <span aria-hidden="true">⚠</span>
                {errors.email}
              </p>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="signup-password">
              Password
            </label>

            <div className="password-wrapper">
              <input
                id="signup-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Create a password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  clearFieldError("password");
                }}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password
                    ? "password-error"
                    : "password-help"
                }
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                aria-pressed={showPassword}
                aria-controls="signup-password"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {errors.password ? (
              <p
                id="password-error"
                className="field-error"
                role="alert"
              >
                <span aria-hidden="true">⚠</span>
                {errors.password}
              </p>
            ) : (
              <p
                id="password-help"
                className="auth-help"
              >
                Use at least 6 characters.
              </p>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="confirm-password">
              Confirm password
            </label>

            <div className="password-wrapper">
              <input
                id="confirm-password"
                name="confirmPassword"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                autoComplete="new-password"
                placeholder="Enter your password again"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  clearFieldError("confirmPassword");
                }}
                aria-invalid={Boolean(
                  errors.confirmPassword
                )}
                aria-describedby={
                  errors.confirmPassword
                    ? "confirm-password-error"
                    : undefined
                }
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowConfirmPassword(
                    (current) => !current
                  )
                }
                aria-label={
                  showConfirmPassword
                    ? "Hide confirmed password"
                    : "Show confirmed password"
                }
                aria-pressed={showConfirmPassword}
                aria-controls="confirm-password"
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>

            {errors.confirmPassword && (
              <p
                id="confirm-password-error"
                className="field-error"
                role="alert"
              >
                <span aria-hidden="true">⚠</span>
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting
              ? "Creating account…"
              : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="signup-link"
          >
            Sign In
          </Link>
        </p>
      </section>
    </main>
  );
}