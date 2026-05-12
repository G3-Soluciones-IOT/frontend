import type {
  PatientAlert,
  PatientDetail,
  PatientDirectoryItem,
  PatientsOverviewStats,
  PatientTrackingSnapshot,
} from "../../domain/models/Patient";

export const patientsOverviewStats: PatientsOverviewStats = {
  totalPatients: 124,
  todaysAlerts: 8,
  upcomingConsultations: 5,
};

export const patientAlerts: PatientAlert[] = [
  {
    id: "alert-1",
    patientId: "michael-chen",
    patientName: "Michael Chen",
    avatarLabel: "MC",
    alertType: "Activity Spike: HR > 150bpm",
    severity: "high",
    lastSync: "10 mins ago",
  },
  {
    id: "alert-2",
    patientId: "sarah-rodriguez",
    patientName: "Sarah Rodriguez",
    avatarLabel: "SR",
    alertType: "Nutritional Deviation: Low Protein Intake",
    severity: "warning",
    lastSync: "1 hr ago",
  },
  {
    id: "alert-3",
    patientId: "emma-davis",
    patientName: "Emma Davis",
    avatarLabel: "ED",
    alertType: "Sleep Disturbance Pattern Detected",
    severity: "info",
    lastSync: "3 hrs ago",
  },
];

export const patientDirectory: PatientDirectoryItem[] = [
  {
    id: "elena-rodriguez",
    name: "Elena Rodriguez",
    email: "elena.r@example.com",
    avatarLabel: "ER",
    goal: "Weight Loss",
    phase: "Target -10kg",
    lastActivity: "Oct 24, 2023",
    status: "active",
  },
  {
    id: "marcus-johnson",
    name: "Marcus Johnson",
    email: "marcus.j@example.com",
    avatarLabel: "MJ",
    goal: "Muscle Gain",
    phase: "Hypertrophy phase",
    lastActivity: "Oct 22, 2023",
    status: "on_hold",
  },
  {
    id: "michael-chen",
    name: "Michael Chen",
    email: "michael.c@example.com",
    avatarLabel: "MC",
    goal: "Body Recomposition",
    phase: "Lean muscle focus",
    lastActivity: "Oct 25, 2023",
    status: "active",
  },
  {
    id: "david-chen",
    name: "David Chen",
    email: "d.chen@example.com",
    avatarLabel: "DC",
    goal: "Maintenance",
    phase: "Post-rehab diet",
    lastActivity: "Sep 15, 2023",
    status: "completed",
  },
  {
    id: "sarah-jenkins",
    name: "Sarah Jenkins",
    email: "s.jenkins@example.com",
    avatarLabel: "SJ",
    goal: "Health Optimization",
    phase: "Cholesterol mgmt",
    lastActivity: "Oct 25, 2023",
    status: "active",
  },
];

export const patientDetail: PatientDetail = {
  id: "michael-chen",
  name: "Michael Chen",
  age: 34,
  heightCm: 182,
  weightKg: 85,
  statusLabel: "Active Plan",
  primaryGoal: "Body Recomposition & Lean Muscle Gain",
  planTags: ["High Protein", "Moderate Deficit"],
  hydrationLiters: 2.4,
  hydrationTargetLiters: 3,
  caloriesConsumed: 1850,
  caloriesTarget: 2200,
  macros: {
    protein: 140,
    carbs: 180,
    fats: 65,
  },
  weightSeries: [
    { label: "W1", value: 86.8 },
    { label: "W2", value: 86.5 },
    { label: "W3", value: 85.9 },
    { label: "W4", value: 86.2 },
    { label: "W5", value: 85.4 },
    { label: "W6", value: 85.0 },
  ],
  smartAnalysis: {
    id: "analysis-1",
    title: "Smart Analysis",
    description:
      "Michael's adherence to the hydration protocol has improved by 20% this week. Consider adjusting protein timing around evening workouts for optimal recovery.",
    actionLabel: "Review Patient Details",
    tone: "positive",
  },
};

export const patientTracking: PatientTrackingSnapshot = {
  patientId: "michael-chen",
  protocol: "Alpha-Fitness",
  dateRangeLabel: "Last 7 Days",
  metrics: [
    {
      label: "Weekly Carbs",
      value: "72 bpm",
      supportingText: "-2% vs last week",
      icon: "heart",
    },
    {
      label: "Weekly Calories",
      value: "8,432",
      supportingText: "84% of 10k goal",
      icon: "activity",
    },
  ],
  hydrationWeek: [
    { day: "Mon", amount: 1.9, targetReached: false },
    { day: "Tue", amount: 2.3, targetReached: false },
    { day: "Wed", amount: 3.0, targetReached: true },
    { day: "Thu", amount: 2.1, targetReached: false },
    { day: "Fri", amount: 2.6, targetReached: false },
    { day: "Sat", amount: 2.9, targetReached: true },
    { day: "Sun", amount: 1.4, targetReached: false },
  ],
  insights: [
    {
      id: "insight-1",
      title: "Low Protein Intake Detected",
      description:
        "Based on recent meal logs, protein intake is 30% below optimal recovery threshold for current activity levels.",
      timestamp: "Today, 09:30 AM",
      actionLabel: "Review Diet Plan",
      tone: "critical",
    },
    {
      id: "insight-2",
      title: "Consistent Activity Spike",
      description:
        "Patient has maintained an elevated heart rate zone for 45 minutes, marking a positive trend in cardiovascular endurance.",
      timestamp: "Yesterday, 18:45 PM",
      actionLabel: "View Workout Details",
      tone: "positive",
    },
    {
      id: "insight-3",
      title: "Sleep Pattern Improvement",
      description:
        "Deep sleep duration increased by 15% over the weekend. Suggest maintaining current evening wind-down routine.",
      timestamp: "Mon, 07:00 AM",
      actionLabel: "Keep Protocol",
      tone: "neutral",
    },
  ],
};
