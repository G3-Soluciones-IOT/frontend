export type PatientStatus = "active" | "on_hold" | "completed";
export type AlertSeverity = "high" | "warning" | "info";

export interface PatientsOverviewStats {
  totalPatients: number;
  todaysAlerts: number;
  upcomingConsultations: number;
}

export interface PatientAlert {
  id: string;
  patientId: string;
  patientName: string;
  avatarLabel: string;
  alertType: string;
  severity: AlertSeverity;
  lastSync: string;
}

export interface PatientDirectoryItem {
  id: string;
  name: string;
  email: string;
  avatarLabel: string;
  goal: string;
  phase: string;
  lastActivity: string;
  status: PatientStatus;
}

export interface WeightPoint {
  label: string;
  value: number;
}

export interface MacroDistribution {
  protein: number;
  carbs: number;
  fats: number;
}

export interface PatientInsight {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  timestamp?: string;
  tone?: "critical" | "positive" | "neutral";
}

export interface PatientDetail {
  id: string;
  name: string;
  age: number;
  heightCm: number;
  weightKg: number;
  statusLabel: string;
  primaryGoal: string;
  planTags: string[];
  hydrationLiters: number;
  hydrationTargetLiters: number;
  caloriesConsumed: number;
  caloriesTarget: number;
  macros: MacroDistribution;
  weightSeries: WeightPoint[];
  smartAnalysis: PatientInsight;
}

export interface HydrationDay {
  day: string;
  amount: number;
  targetReached: boolean;
}

export interface TrackingMetric {
  label: string;
  value: string;
  supportingText: string;
  icon: "heart" | "activity";
}

export interface TrackingInsight {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  actionLabel: string;
  tone: "critical" | "positive" | "neutral";
}

export interface PatientTrackingSnapshot {
  patientId: string;
  protocol: string;
  dateRangeLabel: string;
  metrics: TrackingMetric[];
  hydrationWeek: HydrationDay[];
  insights: TrackingInsight[];
}
