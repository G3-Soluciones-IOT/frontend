import type { ConsultationRequest } from "../../domain/models/ConsultationRequest";

export const mockConsultationRequests: ConsultationRequest[] = [
  {
    id: "consultation-elena-rodriguez",
    patient: {
      id: "PT-8924",
      name: "Elena Rodriguez",
      initials: "ER",
      avatarTone: "photo-woman",
    },
    reason: "Weight loss plateau",
    description: "Stuck at current weight for 3 weeks despite adhering to meal plan.",
    requestedDateLabel: "Oct 24, 2023",
    requestedTimeRange: "10:00 AM - 10:30 AM",
    status: "PENDING",
  },
  {
    id: "consultation-marcus-johnson",
    patient: {
      id: "PT-1105",
      name: "Marcus Johnson",
      initials: "MJ",
      avatarTone: "blue",
    },
    reason: "New dietary allergy",
    description: "Recently diagnosed with gluten intolerance. Need meal plan adjustment.",
    requestedDateLabel: "Oct 24, 2023",
    requestedTimeRange: "02:15 PM - 03:00 PM",
    status: "CONFIRMED",
  },
  {
    id: "consultation-david-chen",
    patient: {
      id: "PT-4421",
      name: "David Chen",
      initials: "DC",
      avatarTone: "photo-man",
    },
    reason: "Marathon prep review",
    description: "Checking carb-loading strategy for upcoming race.",
    requestedDateLabel: "Oct 25, 2023",
    requestedTimeRange: "09:00 AM - 09:45 AM",
    status: "PENDING",
  },
  {
    id: "consultation-sarah-jenkins",
    patient: {
      id: "PT-2983",
      name: "Sarah Jenkins",
      initials: "SJ",
      avatarTone: "photo-woman",
    },
    reason: "Monthly check-in",
    description: "Standard progress review and macronutrient adjustments.",
    requestedDateLabel: "Oct 25, 2023",
    requestedTimeRange: "11:30 AM - 12:00 PM",
    status: "CONFIRMED",
  },
];
