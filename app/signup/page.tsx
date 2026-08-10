"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../Context/AuthContext";
import { AuthLogo } from "../../components/AuthLogo";
import { AuthHeroPanel } from "../../components/AuthHeroPanel";
import { PasswordInput } from "../../components/PasswordInput";
import { ThemeToggle } from "../../components/ThemeToggle";
import "../styles/auth.css";

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

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validateForm() {
    const newErrors: FormErrors = {};

    if (!firstName.trim()) newErrors.firstName = "Please enter your first name.";
    if (!lastName.trim()) newErrors.lastName = "Please enter your last name.";

    if (!email.trim()) {
      newErrors.email = "Please enter your email address.";
    } else if (!isValidEmail(email.trim())) {
      newErrors.email = "Please enter a valid email, such as name@example.com.";
    }

    if (!password) {
      newErrors.password = "Please create a password.";
    } else if (password.length < 6) {
      newErrors.password = "Your password must contain at least 6 characters.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "The passwords do not match. Please try again.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function clearFieldError(field: keyof FormErrors) {
    setErrors((current) => ({ ...current, [field]: undefined, general: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateForm()) return;

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
      setErrors({ general: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <AuthHeroPanel
        headline="Everything roofing, in one place."
        subtext="From booking to inspection to job tracking — all in sync, all in real time."
        imageSrc="/images/roofing.jpg"
      />

      <div className="auth-form-panel">
        <div className="auth-theme-toggle">
          <ThemeToggle />
        </div>
        <div className="auth-form-inner">
          <Link href="/signin" className="auth-back-link">
            <span aria-hidden="true">←</span> Back to sign in
          </Link>

          <div className="auth-logo-wrap">
            <AuthLogo panel="form" />
          </div>

          <h1 className="auth-form-title">Create account</h1>
          <p className="auth-form-subtitle">Create an account to get started.</p>

          {errors.general && (
            <div className="auth-error" role="alert" aria-live="assertive">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="first-name">First name</label>
              <input
                id="first-name"
                name="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="Enter your first name"
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); clearFieldError("firstName"); }}
                aria-invalid={Boolean(errors.firstName)}
                aria-describedby={errors.firstName ? "first-name-error" : undefined}
              />
              {errors.firstName && (
                <p id="first-name-error" className="field-error" role="alert">
                  <span aria-hidden="true">⚠</span> {errors.firstName}
                </p>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="last-name">Last name</label>
              <input
                id="last-name"
                name="lastName"
                type="text"
                autoComplete="family-name"
                placeholder="Enter your last name"
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); clearFieldError("lastName"); }}
                aria-invalid={Boolean(errors.lastName)}
                aria-describedby={errors.lastName ? "last-name-error" : undefined}
              />
              {errors.lastName && (
                <p id="last-name-error" className="field-error" role="alert">
                  <span aria-hidden="true">⚠</span> {errors.lastName}
                </p>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" className="field-error" role="alert">
                  <span aria-hidden="true">⚠</span> {errors.email}
                </p>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="signup-password">Password</label>
              <PasswordInput
                id="signup-password"
                value={password}
                onChange={(v) => { setPassword(v); clearFieldError("password"); }}
                autoComplete="new-password"
                placeholder="Create a password"
                error={errors.password}
                helpText="Use at least 6 characters."
              />
            </div>

            <div className="auth-field">
              <label htmlFor="confirm-password">Confirm password</label>
              <PasswordInput
                id="confirm-password"
                value={confirmPassword}
                onChange={(v) => { setConfirmPassword(v); clearFieldError("confirmPassword"); }}
                autoComplete="new-password"
                placeholder="Enter your password again"
                error={errors.confirmPassword}
              />
            </div>

            <button type="submit" className="auth-submit" disabled={submitting} aria-busy={submitting}>
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link href="/signin">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}