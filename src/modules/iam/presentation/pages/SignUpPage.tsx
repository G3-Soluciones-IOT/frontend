import { useState, type FormEvent } from "react";
import { AuthLayout } from "../components/AuthLayout";
import { useSignUp } from "../hooks/useSignUp";
import type { UserRole } from "../../domain/models/User.ts";
import styles from "../components/AuthLayout.module.css";
import heroImg from "@/assets/SignImage.png";

// ── Icons ───────────────────────────────────────────────────
function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

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

function RoleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

// ── Types ────────────────────────────────────────────────────
interface FormFields {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

type FormErrors = Partial<Record<keyof FormFields, string>>;

// ── Component ────────────────────────────────────────────────
interface SignUpPageProps {
  onSignUp?: (session: import("../../domain/models/User.ts").AuthSession) => void;
  onNavigateToSignIn?: () => void;
}

export function SignUpPage({ onSignUp, onNavigateToSignIn }: SignUpPageProps) {
  const { execute, isLoading, error } = useSignUp();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fields, setFields] = useState<FormFields>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "patient",
  });
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const errors: FormErrors = {};
    let valid = true;

    if (!fields.fullName.trim()) {
      errors.fullName = "Full name is required.";
      valid = false;
    }

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
    } else if (fields.password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
      valid = false;
    }

    if (!fields.confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
      valid = false;
    } else if (fields.password !== fields.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
      valid = false;
    }

    setFieldErrors(errors);
    return valid;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const session = await execute(fields);
    if (session) onSignUp?.(session);
  };

  const handleChange =
    (field: keyof FormFields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFields((prev) => ({ ...prev, [field]: e.target.value }));
      if (fieldErrors[field]) {
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  return (
    <AuthLayout imageSrc={heroImg}>
      <h1 className={styles.heading}>Create account</h1>
      <p className={styles.subheading}>
        Join JameoFit and start your nutrition journey today.
      </p>

      {error && <p className={styles.errorBanner}>{error}</p>}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {/* Full name */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="signup-name">
            Full name
          </label>
          <div className={styles.fieldWrapper}>
            <span className={styles.fieldIcon}>
              <UserIcon />
            </span>
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              className={`${styles.fieldInput} ${fieldErrors.fullName ? styles.hasError : ""}`}
              value={fields.fullName}
              onChange={handleChange("fullName")}
              disabled={isLoading}
            />
          </div>
          {fieldErrors.fullName && (
            <span className={styles.fieldError}>{fieldErrors.fullName}</span>
          )}
        </div>

        {/* Email */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="signup-email">
            Email
          </label>
          <div className={styles.fieldWrapper}>
            <span className={styles.fieldIcon}>
              <MailIcon />
            </span>
            <input
              id="signup-email"
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

        {/* Role */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="signup-role">
            I am a
          </label>
          <div className={styles.fieldWrapper}>
            <span className={styles.fieldIcon}>
              <RoleIcon />
            </span>
            <select
              id="signup-role"
              className={styles.fieldSelect}
              value={fields.role}
              onChange={handleChange("role")}
              disabled={isLoading}
            >
              <option value="patient">Patient</option>
              <option value="nutritionist">Nutritionist</option>
            </select>
          </div>
        </div>

        {/* Password */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="signup-password">
            Password
          </label>
          <div className={styles.fieldWrapper}>
            <span className={styles.fieldIcon}>
              <LockIcon />
            </span>
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
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

        {/* Confirm password */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="signup-confirm">
            Confirm password
          </label>
          <div className={styles.fieldWrapper}>
            <span className={styles.fieldIcon}>
              <LockIcon />
            </span>
            <input
              id="signup-confirm"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repeat your password"
              className={`${styles.fieldInput} ${fieldErrors.confirmPassword ? styles.hasError : ""}`}
              value={fields.confirmPassword}
              onChange={handleChange("confirmPassword")}
              disabled={isLoading}
            />
            <button
              type="button"
              className={styles.togglePassword}
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              <EyeIcon closed={showConfirm} />
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <span className={styles.fieldError}>
              {fieldErrors.confirmPassword}
            </span>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isLoading}
        >
          {isLoading && <span className={styles.spinner} />}
          {isLoading ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p className={styles.formFooter}>
        Already have an account?{" "}
        <button type="button" onClick={onNavigateToSignIn}>
          Sign in
        </button>
      </p>
    </AuthLayout>
  );
}