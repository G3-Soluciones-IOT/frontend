import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { AuthLayout } from "@/modules/iam/presentation/components/AuthLayout";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import { useI18n } from "@/shared/i18n/useI18n";
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

function getSessionUserId() {
  const session = JSON.parse(localStorage.getItem("session") || "null");
  return session?.user?.id ?? "";
}

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

function getInitials(fullName: string) {
  const names = fullName.trim().split(/\s+/).filter(Boolean);
  const initials = `${names[0]?.charAt(0) ?? ""}${names[1]?.charAt(0) ?? ""}`;
  return initials ? initials.toUpperCase() : "NF";
}

export function NutritionistProfilePage({ currentPath = "/professional-profile", onNavigate, onSignOut }: NutritionistProfilePageProps) {
  const { t } = useI18n();
  const { execute, isSaving, error: saveError, savedAt } = useUpdateProfile();
  const navigationItems = useNavigation();
  const storedProfile = getStoredNutritionistProfile();
  const isProfileCompleted = Boolean(storedProfile) && isStoredNutritionistProfileCompleted();
  const isCreateMode = !isProfileCompleted;
  const [form, setForm] = useState<ProfileForm>(() => getStoredProfile() ?? emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProfileForm, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

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

    if (!form.fullName.trim()) errors.fullName = t("profile.error.fullNameRequired");
    if (!form.licenseNumber.trim()) errors.licenseNumber = t("profile.error.licenseRequired");
    if (!form.specialty.trim()) errors.specialty = t("profile.error.specialtyRequired");
    if (!form.bio.trim()) errors.bio = t("profile.error.bioRequired");
    if (form.bio.length > 500) errors.bio = t("profile.error.bioLength");
    if (form.yearsExperience < 0) errors.yearsExperience = t("profile.error.experienceNegative");

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    const userId = getSessionUserId();
    if (!String(userId).trim()) {
      setSubmitError(t("profile.error.userId"));
      return;
    }

    const profileId = storedProfile?.id ?? userId;
    const updated = isCreateMode
      ? await execute({ userId, ...form } satisfies CreateProfessionalProfileInput, "create")
      : await execute({ id: profileId, ...form } satisfies UpdateProfessionalProfileInput, "update");

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
          {isProfileCompleted ? t("profile.title.completed") : t("profile.title.create")}
        </h1>
        <p className={styles.pageSubtitle}>
          {isProfileCompleted
            ? t("profile.subtitle.completed")
            : t("profile.subtitle.create")}
        </p>
      </div>

      {(saveError || submitError) && <p className={styles.errorBanner}>{saveError || submitError}</p>}

      <form className={styles.onboardingForm} onSubmit={handleSubmit}>
        <div className={styles.onboardingGrid}>
          <aside className={`${styles.card} ${styles.profileCard} ${styles.onboardingPreview}`}>
            {form.profilePictureUrl ? (
              <img src={form.profilePictureUrl} alt="" className={styles.profileAvatar} />
            ) : (
              <span className={styles.profileAvatarPlaceholder}>{userInitials}</span>
            )}

            <h2 className={styles.profileName}>{form.fullName || t("profile.fallbackName")}</h2>
            <p className={styles.profileTitle}>
              {form.acceptingNewPatients ? t("profile.accepting") : t("profile.notAccepting")}
            </p>

            <div className={styles.profileMetaGrid}>
              <div>
                <strong>{form.yearsExperience}</strong>
                <span>{t("profile.years")}</span>
              </div>
              <div>
                <strong>{form.specialty || "-"}</strong>
                <span>{t("profile.specialty")}</span>
              </div>
            </div>

            <div className={styles.verificationBox}>
              <div className={styles.verificationTitle}>
                {t("profile.status")}
                {savedAt && (
                  <span className={styles.verifiedDot}>
                    <CheckIcon />
                  </span>
                )}
              </div>
              <div className={styles.verificationItem}>
                <CheckIcon />
                {hasRequiredFields ? t("profile.readyToSave") : t("profile.missingRequired")}
              </div>
            </div>
          </aside>

          <div className={styles.rightStack}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>
                <BadgeIcon />
                {t("profile.professionalInfo")}
              </h2>

              <div className={styles.formGrid}>
                <div className={`${styles.fieldGroup} ${styles.fieldGroupFull}`}>
                  <label className={styles.fieldLabel} htmlFor="nutritionist-full-name">{t("profile.fullName")}</label>
                  <input id="nutritionist-full-name" className={styles.fieldInput} placeholder="Maria Perez" value={form.fullName} onChange={handleFieldChange("fullName")} disabled={isSaving} />
                  {fieldErrors.fullName && <span className={styles.fieldError}>{fieldErrors.fullName}</span>}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="nutritionist-years">{t("profile.yearsExperience")}</label>
                  <input id="nutritionist-years" className={styles.fieldInput} type="number" min="0" value={form.yearsExperience} onChange={handleFieldChange("yearsExperience")} disabled={isSaving} />
                  {fieldErrors.yearsExperience && <span className={styles.fieldError}>{fieldErrors.yearsExperience}</span>}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="nutritionist-license">{t("profile.licenseNumber")}</label>
                  <input id="nutritionist-license" className={styles.fieldInput} placeholder="CNP-12345" value={form.licenseNumber} onChange={handleFieldChange("licenseNumber")} disabled={isSaving || isProfileCompleted} />
                  {fieldErrors.licenseNumber && <span className={styles.fieldError}>{fieldErrors.licenseNumber}</span>}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="nutritionist-specialty">{t("profile.specialty")}</label>
                  <input id="nutritionist-specialty" className={styles.fieldInput} placeholder="CLINICAL" value={form.specialty} onChange={handleFieldChange("specialty")} disabled={isSaving || isProfileCompleted} />
                  {fieldErrors.specialty && <span className={styles.fieldError}>{fieldErrors.specialty}</span>}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="nutritionist-accepting">{t("profile.availability")}</label>
                  <label className={styles.toggleRow}>
                    <input id="nutritionist-accepting" type="checkbox" checked={form.acceptingNewPatients} onChange={handleFieldChange("acceptingNewPatients")} disabled={isSaving} />
                    {t("profile.accepting")}
                  </label>
                </div>

                <div className={`${styles.fieldGroup} ${styles.fieldGroupFull}`}>
                  <label className={styles.fieldLabel} htmlFor="nutritionist-picture">{t("profile.pictureUrl")}</label>
                  <input id="nutritionist-picture" className={styles.fieldInput} type="url" placeholder="https://example.com/profile.jpg" value={form.profilePictureUrl} onChange={handleFieldChange("profilePictureUrl")} disabled={isSaving} />
                </div>

                <div className={`${styles.fieldGroup} ${styles.fieldGroupFull}`}>
                  <label className={styles.fieldLabel} htmlFor="nutritionist-bio">{t("profile.bio")}</label>
                  <textarea id="nutritionist-bio" className={`${styles.fieldInput} ${styles.textarea}`} maxLength={500} placeholder={t("profile.bio.placeholder")} value={form.bio} onChange={handleFieldChange("bio")} disabled={isSaving} />
                  <span className={`${styles.charCount} ${bioCount > 450 ? styles.nearLimit : ""}`}>{bioCount}/500</span>
                  {fieldErrors.bio && <span className={styles.fieldError}>{fieldErrors.bio}</span>}
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className={styles.saveBarVisible}>
          <button type="submit" className={styles.btnSave} disabled={isSaving}>
            {isSaving && <span className={styles.spinner} />}
            {isSaving ? t("profile.saving") : isProfileCompleted ? t("profile.saveChanges") : t("profile.saveContinue")}
          </button>
        </div>
      </form>
    </>
  );

  if (isProfileCompleted) {
    return (
      <SharedLayout
        title={t("profile.layoutTitle")}
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

  return <AuthLayout imageSrc={heroImg} variant="wide">{profileContent}</AuthLayout>;
}
