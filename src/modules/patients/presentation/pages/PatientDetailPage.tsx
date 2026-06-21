import { useEffect, useState } from "react";
import { patientDetail } from "../../infrastructure/mock/patients.mock";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import {
  getPatientUserSummaries,
  getTrackingByUser,
  getTrackingGoalByUser,
  getTrackingProgressByUser,
  getUserProfiles,
  type PatientUserSummary,
  type TrackingGoalResource,
  type TrackingProgressResource,
  type TrackingResource,
  type UserProfileResource,
} from "../../infrastructure/api/nutritionistPatients.api";
import styles from "./PatientsPages.module.css";

interface PatientDetailPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

const weightMin = Math.min(...patientDetail.weightSeries.map((point) => point.value));
const weightMax = Math.max(...patientDetail.weightSeries.map((point) => point.value));
const chartWidth = 820;
const chartHeight = 230;
const chartPadding = { top: 18, right: 22, bottom: 34, left: 52 };
const innerWidth = chartWidth - chartPadding.left - chartPadding.right;
const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom;
const yAxisLabels = [88, 86, 84, 82];

function getChartY(value: number) {
  const normalized = (value - weightMin) / Math.max(weightMax - weightMin, 0.1);
  return chartPadding.top + innerHeight - normalized * (innerHeight * 0.82 + 12);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "P";
}

function calculateAge(birthDate?: string) {
  if (!birthDate) return patientDetail.age;

  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return patientDetail.age;

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return age;
}

function formatHeight(height?: number) {
  if (!height || !Number.isFinite(height)) return `${patientDetail.heightCm} cm`;
  return height > 3 ? `${height} cm` : `${height.toFixed(2)} m`;
}

function formatWeight(weight?: number) {
  if (!weight || !Number.isFinite(weight)) return `${patientDetail.weightKg} kg`;
  return `${weight} kg`;
}

function profileForPatient(profiles: UserProfileResource[], patientId: string) {
  return profiles.find((profile) => String(profile.userId) === patientId)
    ?? profiles.find((profile) => String(profile.id) === patientId)
    ?? null;
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export function PatientDetailPage({ currentPath, onNavigate }: PatientDetailPageProps) {
  const patientId = currentPath.split("/").filter(Boolean).at(-1) || patientDetail.id;
  const trackingPath = `/nutritionist/patients/${patientId}/tracking`;
  const [profile, setProfile] = useState<UserProfileResource | null>(null);
  const [patientUser, setPatientUser] = useState<PatientUserSummary | null>(null);
  const [tracking, setTracking] = useState<TrackingResource | null>(null);
  const [trackingProgress, setTrackingProgress] = useState<TrackingProgressResource | null>(null);
  const [trackingGoal, setTrackingGoal] = useState<TrackingGoalResource | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const patientName =
    patientUser?.fullName
    || patientUser?.username
    || (profile ? `Patient #${profile.userId ?? profile.id}` : patientDetail.name);
  const patientAge = calculateAge(profile?.birthDate);
  const patientHeight = formatHeight(profile?.height);
  const patientWeight = formatWeight(profile?.weight);
  const patientObjective = profile?.objectiveName || patientDetail.primaryGoal;
  const patientActivityLevel = profile?.activityLevelName || "Moderate";
  const patientTags = profile?.allergyNames?.length
    ? profile.allergyNames.map((allergy) => `Allergy: ${allergy}`)
    : patientDetail.planTags;
  const consumedCalories = trackingProgress?.calories.consumed ?? tracking?.consumedMacros.calories ?? patientDetail.caloriesConsumed;
  const targetCalories = trackingProgress?.calories.target ?? trackingGoal?.targetMacros.calories ?? patientDetail.caloriesTarget;
  const calorieProgress = clampPercent(Math.round(trackingProgress?.calories.percentage ?? ((consumedCalories / targetCalories) * 100)));
  const consumedProteins = trackingProgress?.proteins.consumed ?? tracking?.consumedMacros.proteins ?? patientDetail.macros.protein;
  const proteinProgress = clampPercent(Math.round(trackingProgress?.proteins.percentage ?? ((consumedProteins / (trackingGoal?.targetMacros.proteins ?? 160)) * 100)));
  const consumedCarbs = trackingProgress?.carbs.consumed ?? tracking?.consumedMacros.carbs ?? patientDetail.macros.carbs;
  const carbsProgress = clampPercent(Math.round(trackingProgress?.carbs.percentage ?? ((consumedCarbs / (trackingGoal?.targetMacros.carbs ?? 220)) * 100)));
  const consumedFats = trackingProgress?.fats.consumed ?? tracking?.consumedMacros.fats ?? patientDetail.macros.fats;
  const fatsProgress = clampPercent(Math.round(trackingProgress?.fats.percentage ?? ((consumedFats / (trackingGoal?.targetMacros.fats ?? 70)) * 100)));

  const hydrationProgress = Math.round((patientDetail.hydrationLiters / patientDetail.hydrationTargetLiters) * 100);
  const points = patientDetail.weightSeries.map((point, index) => {
    const x = chartPadding.left + (index * innerWidth) / Math.max(patientDetail.weightSeries.length - 1, 1);
    const y = getChartY(point.value);
    return { ...point, x, y };
  });
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  useEffect(() => {
    let mounted = true;

    const loadPatientProfile = async () => {
      setLoadingProfile(true);
      setProfileError(null);

      try {
        const [profiles, users] = await Promise.all([
          getUserProfiles(),
          getPatientUserSummaries(),
        ]);
        const nextProfile = profileForPatient(profiles, patientId);
        const nextUser = users.find((user) => String(user.id) === String(nextProfile?.userId ?? patientId)) ?? null;
        const trackingUserId = nextProfile?.userId ?? patientId;
        const [nextTracking, nextProgress, nextGoal] = await Promise.all([
          getTrackingByUser(trackingUserId),
          getTrackingProgressByUser(trackingUserId),
          getTrackingGoalByUser(trackingUserId),
        ]);

        if (!mounted) return;
        setProfile(nextProfile);
        setPatientUser(nextUser);
        setTracking(nextTracking);
        setTrackingProgress(nextProgress);
        setTrackingGoal(nextGoal);
      } catch (err) {
        if (!mounted) return;
        setProfileError(err instanceof Error ? err.message : "Failed to load patient profile.");
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    };

    loadPatientProfile();

    return () => {
      mounted = false;
    };
  }, [patientId]);

  return (
    <SharedLayout
      title={patientName}
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={useNavigation()}
      breadcrumbs={["Patients", "Directory", patientName]}
      showPageTitle={false}
    >
      <div className={styles.stack}>
        <button type="button" className={styles.backButton} onClick={() => onNavigate("/nutritionist/patients/directory")}>
          &larr; Back to Patients Directory
        </button>

        <div className={styles.detailGrid}>
          <section className={`${styles.panel} ${styles.profileCard}`}>
            <div className={styles.profileAvatar}>{getInitials(patientName)}</div>
            <div>
              <div className={styles.profileHeader}>
                <div>
                  <h2 className={styles.profileName}>{patientName}</h2>
                  <p className={styles.muted}>
                    {patientAge} years old - {patientHeight} - {patientWeight}
                  </p>
                  {loadingProfile && <p className={styles.personSubtext}>Loading profile data...</p>}
                  {profileError && <p className={styles.personSubtext}>Using mock data: {profileError}</p>}
                </div>
                <div className={styles.profileActions}>
                  <span className={styles.pill}>{patientDetail.statusLabel}</span>
                  <button type="button" className={styles.trackingButton} onClick={() => onNavigate(trackingPath)}>
                    Tracking
                  </button>
                </div>
              </div>

              <div className={styles.goalCard}>
                <p className={styles.goalTitle}>Objective</p>
                <p className={styles.goalValue}>{patientObjective}</p>
                <div className={styles.tagsRow}>
                  <span className={styles.tag}>Activity: {patientActivityLevel}</span>
                  {patientTags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <aside className={`${styles.panel} ${styles.analysisCard}`}>
            <h3 className={styles.analysisTitle}>{patientDetail.smartAnalysis.title}</h3>
            <p className={styles.muted}>{patientDetail.smartAnalysis.description}</p>
            <button type="button" className={styles.primaryButton} onClick={() => onNavigate(trackingPath)}>
              View Tracking
            </button>
          </aside>
        </div>

        <section className={`${styles.panel} ${styles.chartCard}`}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Weight Progression</h3>
            <select className={styles.rangeSelect} defaultValue="last-30">
              <option value="last-30">Last 30 Days</option>
            </select>
          </div>

          <div className={styles.lineChartFrame}>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className={styles.lineChartSvg} aria-label="Weight progression chart">
              {yAxisLabels.map((label) => {
                const y = chartPadding.top + ((88 - label) / 6) * innerHeight;
                return (
                  <g key={label}>
                    <text x={14} y={y + 4} className={styles.axisLabel}>
                      {label}k
                    </text>
                    <line
                      x1={chartPadding.left}
                      y1={y}
                      x2={chartWidth - chartPadding.right}
                      y2={y}
                      className={styles.gridLine}
                    />
                  </g>
                );
              })}

              <line
                x1={chartPadding.left}
                y1={chartHeight - chartPadding.bottom}
                x2={chartWidth - chartPadding.right}
                y2={chartHeight - chartPadding.bottom}
                className={styles.baseLine}
              />

              <path d={linePath} className={styles.weightLine} />

              {points.map((point) => (
                <g key={point.label}>
                  <circle cx={point.x} cy={point.y} r="4.5" className={styles.weightDot} />
                  <text
                    x={point.x}
                    y={chartHeight - 10}
                    textAnchor="middle"
                    className={styles.axisBottomLabel}
                  >
                    {point.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </section>

        <div className={styles.bottomGrid}>
          <section className={styles.miniPanel}>
            <h3 className={`${styles.panelTitle} ${styles.panelTitleSm}`}>Hydration</h3>
            <div className={styles.circleProgress}>
              <div className={styles.circleValue}>
                <div>{patientDetail.hydrationLiters}L</div>
                <small>/ {patientDetail.hydrationTargetLiters}.0L Target</small>
              </div>
            </div>
            <p className={styles.muted}>
              {hydrationProgress >= 80
                ? "On track. Remind patient to drink 500ml post-workout."
                : "Below target. Consider adjusting reminders around afternoon meals."}
            </p>
          </section>

          <section className={styles.miniPanel}>
            <div className={styles.panelHeader}>
              <h3 className={`${styles.panelTitle} ${styles.panelTitleSm}`}>Daily Calories</h3>
              <span className={styles.pill}>{tracking?.date ?? "Today"}</span>
            </div>
            <p className={styles.muted}>
              Consumed <strong>{consumedCalories.toLocaleString()}</strong> /{" "}
              <strong>{targetCalories.toLocaleString()} kcal</strong>
            </p>
            <div className={styles.macroProgress}>
              <span style={{ width: `${calorieProgress}%`, background: "linear-gradient(90deg, #16a34a 0%, #22c55e 100%)" }} />
            </div>

            <div className={styles.macroCards}>
              <article className={styles.macroCard}>
                <h4>Protein</h4>
                <p className={styles.macroValue}>{consumedProteins}g</p>
                <div className={styles.macroProgress}>
                  <span style={{ width: `${proteinProgress}%`, background: "#6479b7" }} />
                </div>
              </article>
              <article className={styles.macroCard}>
                <h4>Carbs</h4>
                <p className={styles.macroValue}>{consumedCarbs}g</p>
                <div className={styles.macroProgress}>
                  <span style={{ width: `${carbsProgress}%`, background: "#0e8cc7" }} />
                </div>
              </article>
              <article className={styles.macroCard}>
                <h4>Fats</h4>
                <p className={styles.macroValue}>{consumedFats}g</p>
                <div className={styles.macroProgress}>
                  <span style={{ width: `${fatsProgress}%`, background: "#f59e0b" }} />
                </div>
              </article>
            </div>

            {tracking?.mealPlanEntries?.length ? (
              <div className={styles.assignedMeals}>
                <h4>Assigned meals</h4>
                <div className={styles.tagsRow}>
                  {tracking.mealPlanEntries.map((entry) => (
                    <span key={entry.id} className={styles.tag}>
                      {entry.mealPlanType} - Day {entry.dayNumber}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </SharedLayout>
  );
}
