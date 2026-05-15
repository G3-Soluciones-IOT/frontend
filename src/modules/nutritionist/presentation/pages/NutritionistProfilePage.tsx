import { useMemo, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { SharedLayout } from "@/shared/components/layout";
import { navigationConfig } from "@/shared/constants/navigation.config";
import styles from "./NutritionistProfile.module.css";
import { useNutritionistProfile } from "../hooks/useNutritionistProfile";
import { useUpdateProfile } from "../hooks/useUpdateProfile";
import type { ExperienceRange, ProfessionalProfile, Specialty } from "../../domain/models/ProfessionalProfile";
import type { UpdateProfessionalProfileInput } from "../../application/dto/UpdateProfessionalProfileInput";

interface NutritionistProfilePageProps {
  currentPath?: string;
  onNavigate: (href: string) => void;
  onSignOut?: () => void;
}

type ProfileForm = UpdateProfessionalProfileInput;

const emptyForm: ProfileForm = {
  firstName: "Sarah",
  lastName: "Jenkins",
  professionalTitle: "Registered Dietitian & Sports Nutritionist",
  bio: "Passionate about helping athletes and active individuals optimize their performance through evidence-based nutrition strategies. With over 8 years of clinical experience...",
  primaryCertification: "RD, CSSD",
  specialties: [
    { id: "sports-nutrition", label: "Sports Nutrition" },
    { id: "keto", label: "Keto" },
    { id: "weight-management", label: "Weight Management" },
  ],
  experienceRange: "6-10 years",
};

const experienceOptions: ExperienceRange[] = [
  "0-1 years",
  "1-3 years",
  "3-5 years",
  "6-10 years",
  "10+ years",
];

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
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

function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M17 8l-5-5-5 5" />
      <path d="M12 3v12" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function getInitials(profile: Pick<ProfessionalProfile, "firstName" | "lastName"> | ProfileForm) {
  const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.trim();
  return initials ? initials.toUpperCase() : "NF";
}

function toForm(profile: ProfessionalProfile): ProfileForm {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    professionalTitle: profile.professionalTitle,
    bio: profile.bio,
    primaryCertification: profile.primaryCertification,
    specialties: profile.specialties,
    experienceRange: profile.experienceRange,
  };
}

function createSpecialty(label: string): Specialty {
  return {
    id: label.trim().toLowerCase().replace(/\s+/g, "-"),
    label: label.trim(),
  };
}

export function NutritionistProfilePage({ currentPath = "/nutritionist", onNavigate, onSignOut }: NutritionistProfilePageProps) {
  const { profile, isLoading, setProfile } = useNutritionistProfile();
  const { execute, isSaving, error: saveError, savedAt } = useUpdateProfile();
  const [draftForm, setDraftForm] = useState<ProfileForm | null>(null);
  const [newSpecialty, setNewSpecialty] = useState("");
  const [showSpecialtyInput, setShowSpecialtyInput] = useState(false);

  const form = draftForm ?? (profile ? toForm(profile) : emptyForm);

  const fullName = `Dr. ${`${form.firstName} ${form.lastName}`.trim() || "Sarah Jenkins"}`;
  const bioCount = form.bio.length;
  const hasChanges = useMemo(() => {
    if (!profile) return false;
    return JSON.stringify(form) !== JSON.stringify(toForm(profile));
  }, [form, profile]);

  const updateForm = (updater: (current: ProfileForm) => ProfileForm) => {
    setDraftForm((current) => updater(current ?? (profile ? toForm(profile) : emptyForm)));
  };

  const handleFieldChange =
    (field: keyof ProfileForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      updateForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const addSpecialty = () => {
    const label = newSpecialty.trim();
    if (!label || form.specialties.length >= 5) return;

    const exists = form.specialties.some(
      (specialty) => specialty.label.toLowerCase() === label.toLowerCase()
    );
    if (exists) {
      setNewSpecialty("");
      setShowSpecialtyInput(false);
      return;
    }

    updateForm((current) => ({
      ...current,
      specialties: [...current.specialties, createSpecialty(label)],
    }));
    setNewSpecialty("");
    setShowSpecialtyInput(false);
  };

  const handleSpecialtyKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addSpecialty();
    }

    if (event.key === "Escape") {
      setNewSpecialty("");
      setShowSpecialtyInput(false);
    }
  };

  const removeSpecialty = (id: string) => {
    updateForm((current) => ({
      ...current,
      specialties: current.specialties.filter((specialty) => specialty.id !== id),
    }));
  };

  const resetForm = () => {
    setDraftForm(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const updated = await execute(form);
    if (updated) {
      setProfile(updated);
      setDraftForm(null);
    }
  };

  if (isLoading) {
    return (
      <SharedLayout
        title="Profile Information"
        currentPath={currentPath}
        navigationItems={navigationConfig.nutritionist}
        userInitials={getInitials(form)}
        onNavigate={onNavigate}
        onSettingsClick={() => onNavigate("/account-settings")}
        onLogout={onSignOut}
      >
        <div className={styles.pageHeading}>
          <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
          <div className={`${styles.skeleton} ${styles.skeletonText}`} />
        </div>
        <div className={styles.profileGrid}>
          <div className={`${styles.card} ${styles.profileCard}`}>
            <div className={`${styles.skeleton} ${styles.skeletonAvatar}`} />
            <div className={`${styles.skeleton} ${styles.skeletonText}`} />
          </div>
          <div className={styles.rightStack}>
            <div className={`${styles.card} ${styles.skeletonPanel}`} />
            <div className={`${styles.card} ${styles.skeletonPanel}`} />
          </div>
        </div>
      </SharedLayout>
    );
  }

  return (
    <SharedLayout
      title="Profile Information"
      currentPath={currentPath}
      navigationItems={navigationConfig.nutritionist}
      userInitials={getInitials(form)}
      onNavigate={onNavigate}
      onSettingsClick={() => onNavigate("/account-settings")}
      onLogout={onSignOut}
    >
      <div className={styles.pageHeading}>
        <h1 className={styles.pageTitle}>Professional Profile</h1>
        <p className={styles.pageSubtitle}>
          Manage your public credentials, specialties, and biographical information.
        </p>
      </div>

      {saveError && <p className={styles.errorBanner}>{saveError}</p>}

      <form onSubmit={handleSubmit}>
        <div className={styles.profileGrid}>
          <aside className={`${styles.card} ${styles.profileCard}`}>
            <button type="button" className={styles.avatarWrap} aria-label="Update profile photo">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className={styles.profileAvatar} />
              ) : (
                <span className={styles.profileAvatarPlaceholder}>{getInitials(form)}</span>
              )}
              <span className={styles.avatarEditBadge}>
                <EditIcon />
              </span>
            </button>

            <h2 className={styles.profileName}>{fullName}</h2>
            <p className={styles.profileTitle}>{form.professionalTitle || "Nutritionist"}</p>
            <div className={styles.profileCardDivider} />

            <button type="button" className={styles.btnPrimary}>
              <UploadIcon />
              Save Changes
            </button>
            <button type="button" className={styles.btnOutline}>
              Preview Public Profile
            </button>

            <div className={styles.verificationBox}>
              <div className={styles.verificationTitle}>
                Verification Status
                <span className={styles.verifiedDot}>
                  <CheckIcon />
                </span>
              </div>
              <div className={styles.verificationItem}>
                <CheckIcon />
                Identity Verified
              </div>
              <div className={styles.verificationItem}>
                <CheckIcon />
                Credentials Verified
              </div>
            </div>
          </aside>

          <div className={styles.rightStack}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>
                <BadgeIcon />
                Basic Information
              </h2>

              <div className={styles.formGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="nutritionist-first-name">
                    First name
                  </label>
                  <input
                    id="nutritionist-first-name"
                    className={styles.fieldInput}
                    value={form.firstName}
                    onChange={handleFieldChange("firstName")}
                    disabled={isSaving}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="nutritionist-last-name">
                    Last name
                  </label>
                  <input
                    id="nutritionist-last-name"
                    className={styles.fieldInput}
                    value={form.lastName}
                    onChange={handleFieldChange("lastName")}
                    disabled={isSaving}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="nutritionist-title">
                    Professional Title
                  </label>
                  <input
                    id="nutritionist-title"
                    className={styles.fieldInput}
                    placeholder="Registered Dietitian"
                    value={form.professionalTitle}
                    onChange={handleFieldChange("professionalTitle")}
                    disabled={isSaving}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="nutritionist-experience">
                    Years of Experience
                  </label>
                  <select
                    id="nutritionist-experience"
                    className={styles.fieldSelect}
                    value={form.experienceRange}
                    onChange={handleFieldChange("experienceRange")}
                    disabled={isSaving}
                  >
                    {experienceOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={`${styles.fieldGroup} ${styles.fieldGroupFull}`}>
                  <label className={styles.fieldLabel} htmlFor="nutritionist-bio">
                    Professional Bio
                  </label>
                  <textarea
                    id="nutritionist-bio"
                    className={`${styles.fieldInput} ${styles.textarea}`}
                    maxLength={500}
                    placeholder="Share your nutrition care approach."
                    value={form.bio}
                    onChange={handleFieldChange("bio")}
                    disabled={isSaving}
                  />
                  <span className={`${styles.charCount} ${bioCount > 450 ? styles.nearLimit : ""}`}>
                    {bioCount}/500
                  </span>
                </div>
              </div>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>
                <BadgeIcon />
                Credentials & Specialties
              </h2>

              <div className={styles.formGrid}>
                <div className={`${styles.fieldGroup} ${styles.fieldGroupFull}`}>
                  <label className={styles.fieldLabel} htmlFor="nutritionist-certification">
                    Primary certification
                  </label>
                  <div className={styles.certRow}>
                    <input
                      id="nutritionist-certification"
                      className={styles.fieldInput}
                      placeholder="Nutrition license or certification"
                      value={form.primaryCertification}
                      onChange={handleFieldChange("primaryCertification")}
                      disabled={isSaving}
                    />
                    <button type="button" className={styles.uploadBtn} aria-label="Upload certification">
                      <UploadIcon />
                    </button>
                  </div>
                </div>

                <div className={`${styles.fieldGroup} ${styles.fieldGroupFull}`}>
                  <span className={styles.fieldLabel}>Specialties (Select up to 5)</span>
                  <div className={styles.tagsWrap}>
                    {form.specialties.map((specialty) => (
                      <span key={specialty.id} className={styles.tag}>
                        {specialty.label}
                        <button
                          type="button"
                          className={styles.tagRemove}
                          aria-label={`Remove ${specialty.label}`}
                          onClick={() => removeSpecialty(specialty.id)}
                          disabled={isSaving}
                        >
                          <XIcon />
                        </button>
                      </span>
                    ))}

                    {showSpecialtyInput ? (
                      <input
                        className={styles.tagInput}
                        value={newSpecialty}
                        onChange={(event) => setNewSpecialty(event.target.value)}
                        onBlur={addSpecialty}
                        onKeyDown={handleSpecialtyKeyDown}
                        autoFocus
                        maxLength={32}
                        disabled={isSaving}
                      />
                    ) : (
                      <button
                        type="button"
                        className={styles.tagAdd}
                        onClick={() => setShowSpecialtyInput(true)}
                        disabled={isSaving || form.specialties.length >= 5}
                      >
                        <PlusIcon />
                        Add specialty
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className={styles.saveBar}>
          <span className={styles.saveBarInfo}>
            {hasChanges ? (
              <strong>Unsaved changes</strong>
            ) : savedAt ? (
              `Saved ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            ) : (
              "Profile is up to date"
            )}
          </span>

          <div className={styles.saveBarActions}>
            {savedAt && !hasChanges && (
              <span className={styles.savedBadge}>
                <CheckIcon />
                Saved
              </span>
            )}
            <button type="button" className={styles.btnOutline} onClick={resetForm} disabled={!hasChanges || isSaving}>
              Discard
            </button>
            <button type="submit" className={styles.btnSave} disabled={!hasChanges || isSaving}>
              {isSaving && <span className={styles.spinner} />}
              {isSaving ? "Saving" : "Save changes"}
            </button>
          </div>
        </div>
      </form>
    </SharedLayout>
  );
}
