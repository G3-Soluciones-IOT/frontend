import { useState, type FormEvent } from "react";
import { AuthLayout } from "../components/AuthLayout";
import { useSignIn } from "../hooks/useSignIn";
import styles from "../components/AuthLayout.module.css";
import heroImg from "@/assets/SignImage.png";

// ── Icons (inline SVG, zero dependencies) ──────────────────
function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon({ closed }: { closed: boolean }) {
  return closed ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// ── Component ────────────────────────────────────────────────
interface SignInPageProps {
  onSignIn?: (session: import("../../domain/models/User").AuthSession) => void;
  onNavigateToSignUp?: () => void;
}

export function SignInPage({ onSignIn, onNavigateToSignUp }: SignInPageProps) {
  const { execute, isLoading, error } = useSignIn();
  const [showPassword, setShowPassword] = useState(false);
  const [fields, setFields] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });

  const validate = (): boolean => {
    const errors = { email: "", password: "" };
    let valid = true;

    if (!fields.email) {
      errors.email = "Email is required.";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      errors.email = "Enter a valid email address.";
      valid = false;
    }

    if (!fields.password) {
      errors.password = "Password is required.";
      valid = false;
    }

    setFieldErrors(errors);
    return valid;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const session = await execute(fields);
    if (session) onSignIn?.(session);
  };

  const handleChange = (field: keyof typeof fields) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFields((prev) => ({ ...prev, [field]: e.target.value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <AuthLayout imageSrc={heroImg}>
      <h1 className={styles.heading}>Welcome back</h1>
      <p className={styles.subheading}>
        Sign in to your JameoFit account to continue.
      </p>

      {error && <p className={styles.errorBanner}>{error}</p>}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {/* Email */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="signin-email">
            Email
          </label>
          <div className={styles.fieldWrapper}>
            <span className={styles.fieldIcon}>
              <MailIcon />
            </span>
            <input
              id="signin-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={`${styles.fieldInput} ${fieldErrors.email ? styles.hasError : ""}`}
              value={fields.email}
              onChange={handleChange("email")}
              disabled={isLoading}
            />
          </div>
          {fieldErrors.email && (
            <span className={styles.fieldError}>{fieldErrors.email}</span>
          )}
        </div>

        {/* Password */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="signin-password">
            Password
          </label>
          <div className={styles.fieldWrapper}>
            <span className={styles.fieldIcon}>
              <LockIcon />
            </span>
            <input
              id="signin-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Your password"
              className={`${styles.fieldInput} ${fieldErrors.password ? styles.hasError : ""}`}
              value={fields.password}
              onChange={handleChange("password")}
              disabled={isLoading}
            />
            <button
              type="button"
              className={styles.togglePassword}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <EyeIcon closed={showPassword} />
            </button>
          </div>
          {fieldErrors.password && (
            <span className={styles.fieldError}>{fieldErrors.password}</span>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isLoading}
        >
          {isLoading && <span className={styles.spinner} />}
          {isLoading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className={styles.formFooter}>
        I don&apos;t have an account.{" "}
        <button type="button" onClick={onNavigateToSignUp}>
          Register now
        </button>
      </p>
    </AuthLayout>
  );
}