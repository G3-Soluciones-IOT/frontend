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
  username: string;
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
    username: "",
    password: "",
    confirmPassword: "",
    role: "ROLE_ADMIN",
  });
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const errors: FormErrors = {};
    let valid = true;

    if (!fields.username.trim()) {
      errors.username = "Username is required.";
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
        {/* Username */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="signup-username">
            Username
          </label>

          <div className={styles.fieldWrapper}>
    <span className={styles.fieldIcon}>
      <UserIcon />
    </span>

            <input
                id="signup-username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                className={`${styles.fieldInput} ${
                    fieldErrors.username ? styles.hasError : ""
                }`}
                value={fields.username}
                onChange={handleChange("username")}
                disabled={isLoading}
            />
          </div>

          {fieldErrors.username && (
              <span className={styles.fieldError}>
      {fieldErrors.username}
    </span>
          )}
        </div>



        {/* Role */}
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>
            I am a
          </span>
          <div className={styles.roleOptions}>
            <label className={`${styles.roleOption} ${fields.role === "ROLE_ADMIN" ? styles.roleOptionSelected : ""}`}>
              <input
                type="radio"
                name="signup-role"
                value="ROLE_ADMIN"
                checked={fields.role === "ROLE_ADMIN"}
                onChange={handleChange("role")}
                disabled={isLoading}
              />
              <span className={styles.roleOptionIcon}>
                <RoleIcon />
              </span>
              <span className={styles.roleOptionText}>
                Admin
              </span>
            </label>

            <label className={`${styles.roleOption} ${fields.role === "ROLE_NUTRITIONIST" ? styles.roleOptionSelected : ""}`}>
              <input
                type="radio"
                name="signup-role"
                value="ROLE_NUTRITIONIST"
                checked={fields.role === "ROLE_NUTRITIONIST"}
                onChange={handleChange("role")}
                disabled={isLoading}
              />
              <span className={styles.roleOptionIcon}>
                <RoleIcon />
              </span>
              <span className={styles.roleOptionText}>
                Nutritionist
              </span>
            </label>
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
