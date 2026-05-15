export interface ConsultationPreview {
  id: string;
  patientName: string;
  initials: string;
  time: string;
  modality: string;
  status?: string;
  tone: "blue" | "slate";
}

export interface MealLogPreview {
  id: string;
  patientName: string;
  mealType: string;
  calories: string;
  status: "Approved" | "Review Needed" | "Logged";
}

export const dashboardSummary = {
  activePatients: 42,
  aiSummary:
    "Based on recent uploads, 3 patients show significant improvement in their macros adherence. Patient 'Sarah J.' requires attention regarding sodium intake.",
  tags: ["Macros Adherence", "Sodium Alert"],
};

export const todayConsultations: ConsultationPreview[] = [
  {
    id: "consultation-sarah-jenkins",
    patientName: "Sarah Jenkins",
    initials: "SJ",
    time: "10:00 AM",
    modality: "Video",
    status: "Upcoming",
    tone: "blue",
  },
  {
    id: "consultation-mark-ronson",
    patientName: "Mark Ronson",
    initials: "MR",
    time: "1:30 PM",
    modality: "Clinic",
    tone: "slate",
  },
];

export const recentMealLogs: MealLogPreview[] = [
  {
    id: "meal-log-emma-watson",
    patientName: "Emma Watson",
    mealType: "Breakfast",
    calories: "450 kcal",
    status: "Approved",
  },
  {
    id: "meal-log-john-doe",
    patientName: "John Doe",
    mealType: "Lunch",
    calories: "820 kcal",
    status: "Review Needed",
  },
  {
    id: "meal-log-liam-smith",
    patientName: "Liam Smith",
    mealType: "Dinner",
    calories: "610 kcal",
    status: "Logged",
  },
];
