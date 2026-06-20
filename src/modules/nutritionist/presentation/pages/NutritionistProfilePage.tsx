import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { AuthLayout } from "@/modules/iam/presentation/components/AuthLayout";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import heroImg from "@/assets/SignImage.png";
import styles from "./NutritionistProfile.module.css";
import { useUpdateProfile } from "../hooks/useUpdateProfile";
import type { CreateProfessionalProfileInput } from "../../application/dto/CreateProfessionalProfileInput";
import type { UpdateProfessionalProfileInput } from "../../application/dto/UpdateProfessionalProfileInput";
import {
  getStoredNutritionistProfile,
  isStoredNutritionistProfileCompleted,
  storeNutritionistProfile,
} from "../../infrastructure/storage/nutritionistProfileStorage";

interface NutritionistProfilePageProps {
  currentPath?: string;
  onNavigate: (href: string) => void;
  onSignOut?: () => void;
}

interface ProfileForm {
  fullName: string;
  licenseNumber: string;
  specialty: string;
  bio: string;
  profilePictureUrl: string;
  acceptingNewPatients: boolean;
  yearsExperience: number;
}

const emptyForm: ProfileForm = {
  fullName: "",
  licenseNumber: "",
  specialty: "CLINICAL",
  bio: "",
  profilePictureUrl: "",
  acceptingNewPatients: true,
  yearsExperience: 0,
};

function getStoredProfile(): ProfileForm | null {
  const stored = getStoredNutritionistProfile();

  if (!stored) {
    return null;
  }

  return {
    fullName: stored.fullName ?? "",
    licenseNumber: stored.licenseNumber ?? "",
    specialty: stored.specialty ?? "CLINICAL",
    bio: stored.bio ?? "",
    profilePictureUrl: stored.profilePictureUrl ?? "",
    acceptingNewPatients: stored.acceptingNewPatients ?? true,
    yearsExperience: Number(stored.yearsExperience ?? 0),
  };
}

function BadgeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15l-3.5 2 1-4-3-2.6 4-.3L12 6.5l1.5 3.6 4 .3-3 2.6 1 4Z" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function getSessionUserId() {
  const session = JSON.parse(localStorage.getItem("session") || "null");
  return session?.user?.id ?? "";
}

function getInitials(fullName: string) {
  const names = fullName.trim().split(/\s+/).filter(Boolean);
  const initials = `${names[0]?.charAt(0) ?? ""}${names[1]?.charAt(0) ?? ""}`;
  return initials ? initials.toUpperCase() : "NF";
}

export function NutritionistProfilePage({ currentPath = "/professional-profile", onNavigate, onSignOut }: NutritionistProfilePageProps) {
  const { execute, isSaving, error: saveError, savedAt } = useUpdateProfile();
  const navigationItems = useNavigation();
  const storedProfile = getStoredNutritionistProfile();
  const isProfileCompleted = Boolean(storedProfile) && isStoredNutritionistProfileCompleted();
  const isCreateMode = !isProfileCompleted;
  const [form, setForm] = useState<ProfileForm>(() => getStoredProfile() ?? emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProfileForm, string>>>({});

  const userInitials = useMemo(() => getInitials(form.fullName), [form.fullName]);
  const bioCount = form.bio.length;
  const hasRequiredFields = form.fullName.trim().length > 0 && form.bio.trim().length > 0;

  const handleFieldChange =
    (field: keyof ProfileForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        field === "acceptingNewPatients"
          ? (event.target as HTMLInputElement).checked
          : field === "yearsExperience"
            ? Number(event.target.value)
            : event.target.value;

      setForm((current) => ({ ...current, [field]: value }));
      if (fieldErrors[field]) {
        setFieldErrors((current) => ({ ...current, [field]: undefined }));
      }
    };

  const validate = () => {
    const errors: Partial<Record<keyof ProfileForm, string>> = {};

    if (!form.fullName.trim()) {
      errors.fullName = "Full name is required.";
    }

    if (!form.licenseNumber?.trim()) {
      errors.licenseNumber = "License number is required.";
    }

    if (!form.specialty?.trim()) {
      errors.specialty = "Specialty is required.";
    }

    if (!form.bio.trim()) {
      errors.bio = "Bio is required.";
    }

    if (form.bio.length > 500) {
      errors.bio = "Bio must be 500 characters or fewer.";
    }

    if (form.yearsExperience < 0) {
      errors.yearsExperience = "Years of experience cannot be negative.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const id = getSessionUserId();
    const updated = isCreateMode
      ? await execute({ userId: id, ...form } satisfies CreateProfessionalProfileInput, "create")
      : await execute({ id, ...form } satisfies UpdateProfessionalProfileInput, "update");

    if (updated) {
      storeNutritionistProfile(updated);
      if (isCreateMode) {
        onNavigate("/nutritionist");
      }
    }
  };

  const profileContent = (
    <>
      <div className={styles.pageHeading}>
        <h1 className={styles.pageTitle}>
          {isProfileCompleted ? "My nutritionist profile" : "Complete your nutritionist profile"}
        </h1>
        <p className={styles.pageSubtitle}>
          {isProfileCompleted
            ? "Update the professional information patients see."
            : "Add the professional information patients will see before continuing."}
        </p>
      </div>

      {saveError && <p className={styles.errorBanner}>{saveError}</p>}

      <form className={styles.onboardingForm} onSubmit={handleSubmit}>
        <div className={styles.onboardingGrid}>
          <aside className={`${styles.card} ${styles.profileCard} ${styles.onboardingPreview}`}>
            {form.profilePictureUrl ? (
              <img src={form.profilePictureUrl} alt="" className={styles.profileAvatar} />
            ) : (
              <span className={styles.profileAvatarPlaceholder}>{userInitials}</span>
            )}

            <h2 className={styles.profileName}>{form.fullName || "Nutritionist"}</h2>
            <p className={styles.profileTitle}>
              {form.acceptingNewPatients ? "Accepting new patients" : "Not accepting new patients"}
            </p>

            <div className={styles.verificationBox}>
              <div className={styles.verificationTitle}>
                Profile status
                {savedAt && (
                  <span className={styles.verifiedDot}>
                    <CheckIcon />
                  </span>
                )}
              </div>
              <div className={styles.verificationItem}>
                <CheckIcon />
                {hasRequiredFields ? "Ready to save" : "Missing required fields"}
              </div>
            </div>
          </aside>

          <div className={styles.rightStack}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>
                <BadgeIcon />
                Professional information
              </h2>

              <div className={styles.formGrid}>
                <div className={`${styles.fieldGroup} ${styles.fieldGroupFull}`}>
                  <label className={styles.fieldLabel} htmlFor="nutritionist-full-name">
                    Full name
                  </label>
                  <input
                    id="nutritionist-full-name"
                    className={styles.fieldInput}
                    placeholder="Maria Perez"
                    value={form.fullName}
                    onChange={handleFieldChange("fullName")}
                    disabled={isSaving}
                  />
                  {fieldErrors.fullName && <span className={styles.fieldError}>{fieldErrors.fullName}</span>}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="nutritionist-years">
                    Years of experience
                  </label>
                  <input
                    id="nutritionist-years"
                    className={styles.fieldInput}
                    type="number"
                    min="0"
                    value={form.yearsExperience}
                    onChange={handleFieldChange("yearsExperience")}
                    disabled={isSaving}
                  />
                  {fieldErrors.yearsExperience && <span className={styles.fieldError}>{fieldErrors.yearsExperience}</span>}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="nutritionist-license">
                    License number
                  </label>
                  <input
                    id="nutritionist-license"
                    className={styles.fieldInput}
                    placeholder="CNP-12345"
                    value={form.licenseNumber ?? ""}
                    onChange={handleFieldChange("licenseNumber")}
                    disabled={isSaving || isProfileCompleted}
                  />
                  {fieldErrors.licenseNumber && <span className={styles.fieldError}>{fieldErrors.licenseNumber}</span>}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="nutritionist-specialty">
                    Specialty
                  </label>
                  <input
                    id="nutritionist-specialty"
                    className={styles.fieldInput}
                    placeholder="CLINICAL"
                    value={form.specialty ?? ""}
                    onChange={handleFieldChange("specialty")}
                    disabled={isSaving || isProfileCompleted}
                  />
                  {fieldErrors.specialty && <span className={styles.fieldError}>{fieldErrors.specialty}</span>}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="nutritionist-accepting">
                    Availability
                  </label>
                  <label className={styles.toggleRow}>
                    <input
                      id="nutritionist-accepting"
                      type="checkbox"
                      checked={form.acceptingNewPatients}
                      onChange={handleFieldChange("acceptingNewPatients")}
                      disabled={isSaving}
                    />
                    Accepting new patients
                  </label>
                </div>

                <div className={`${styles.fieldGroup} ${styles.fieldGroupFull}`}>
                  <label className={styles.fieldLabel} htmlFor="nutritionist-picture">
                    Profile picture URL
                  </label>
                  <input
                    id="nutritionist-picture"
                    className={styles.fieldInput}
                    type="url"
                    placeholder="https://example.com/profile.jpg"
                    value={form.profilePictureUrl}
                    onChange={handleFieldChange("profilePictureUrl")}
                    disabled={isSaving}
                  />
                </div>

                <div className={`${styles.fieldGroup} ${styles.fieldGroupFull}`}>
                  <label className={styles.fieldLabel} htmlFor="nutritionist-bio">
                    Bio
                  </label>
                  <textarea
                    id="nutritionist-bio"
                    className={`${styles.fieldInput} ${styles.textarea}`}
                    maxLength={500}
                    placeholder="Describe your professional experience and care approach."
                    value={form.bio}
                    onChange={handleFieldChange("bio")}
                    disabled={isSaving}
                  />
                  <span className={`${styles.charCount} ${bioCount > 450 ? styles.nearLimit : ""}`}>
                    {bioCount}/500
                  </span>
                  {fieldErrors.bio && <span className={styles.fieldError}>{fieldErrors.bio}</span>}
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className={styles.saveBarVisible}>
          <button type="submit" className={styles.btnSave} disabled={isSaving}>
            {isSaving && <span className={styles.spinner} />}
            {isSaving ? "Saving" : isProfileCompleted ? "Save changes" : "Save and continue"}
          </button>
        </div>
      </form>
    </>
  );

  if (isProfileCompleted) {
    return (
      <SharedLayout
        title="My Profile"
        currentPath={currentPath}
        navigationItems={navigationItems}
        userInitials={userInitials}
        userAvatarUrl={form.profilePictureUrl}
        onNavigate={onNavigate}
        onSettingsClick={() => onNavigate("/account-settings")}
        onProfileClick={() => onNavigate("/professional-profile")}
        onLogout={onSignOut}
        showPageTitle={false}
      >
        {profileContent}
      </SharedLayout>
    );
  }

  return (
    <AuthLayout imageSrc={heroImg}>
      {profileContent}
    </AuthLayout>
  );
}
