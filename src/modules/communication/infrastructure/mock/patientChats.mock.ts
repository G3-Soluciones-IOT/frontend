import type { PatientChat } from "../../domain/models/PatientChat";

export const demoOutgoingMessage = "Me llegaron alertas de que no estas cumpliendo con tus objetivos";
export const demoIncomingMessage = "Hola, si he estado teniendo algunas dificultades para usar los dispositivos :(";

export const mockPatientChats: PatientChat[] = [
  {
    id: "chat-michael-chen",
    patient: {
      id: "michael-chen",
      userId: "12",
      name: "Michael Chen",
      initials: "MC",
      avatarTone: "photo",
      connectionStatus: "ONLINE",
      connectionLabel: "Online now",
      recordPath: "/nutritionist/patients/michael-chen",
      statsPath: "/nutritionist/patients/tracking",
    },
    preview: "I've been sticking to the meal plan, but I'm feeling a bit more fatigued...",
    lastActivityLabel: "10:42 AM",
    messages: [
      {
        id: "message-1",
        author: "NUTRITIONIST",
        text: "Hi Michael, checking in on your hydration goals for this week. How are we looking on hitting that 3L daily target?",
        time: "9:32 AM",
        status: "READ",
      },
      {
        id: "message-2",
        author: "PATIENT",
        text: "Morning! I've been doing pretty well, mostly hitting about 2.5L. It's tough during back-to-back meetings though.",
        time: "10:15 AM",
      },
      {
        id: "message-3",
        author: "NUTRITIONIST",
        text: "That's great progress! For the meetings, try keeping a large visual bottle on your desk. We can adjust the target slightly if needed, but 2.5L is a solid baseline.",
        time: "10:20 AM",
        status: "READ",
      },
      {
        id: "message-4",
        author: "PATIENT",
        text: "I've been sticking to the meal plan, but I'm feeling a bit more fatigued than usual during my evening workouts. Could the lower carb intake be causing this?",
        time: "10:42 AM",
      },
    ],
  },
  {
    id: "chat-sarah-jenkins",
    patient: {
      id: "sarah-jenkins",
      userId: "18",
      name: "Sarah Jenkins",
      initials: "SJ",
      avatarTone: "green",
      connectionStatus: "AWAY",
      connectionLabel: "Away",
      recordPath: "/nutritionist/patients/sarah-jenkins",
      statsPath: "/nutritionist/patients/tracking",
    },
    preview: "Thanks for the updated macro targets!",
    lastActivityLabel: "Yesterday",
    messages: [
      {
        id: "message-sarah-1",
        author: "PATIENT",
        text: "Thanks for the updated macro targets!",
        time: "Yesterday",
      },
    ],
  },
  {
    id: "chat-david-johnson",
    patient: {
      id: "david-johnson",
      userId: "25",
      name: "David Johnson",
      initials: "DJ",
      avatarTone: "blue",
      connectionStatus: "OFFLINE",
      connectionLabel: "Offline",
      recordPath: "/nutritionist/patients/david-johnson",
      statsPath: "/nutritionist/patients/tracking",
    },
    preview: "Can we reschedule Thursday's call?",
    lastActivityLabel: "Mon",
    messages: [
      {
        id: "message-david-1",
        author: "PATIENT",
        text: "Can we reschedule Thursday's call?",
        time: "Mon",
      },
    ],
  },
];

export const availableChatPatients = [
  {
    id: "emma-watson",
    userId: "30",
    name: "Emma Watson",
    initials: "EW",
    avatarTone: "green",
    connectionStatus: "ONLINE",
    connectionLabel: "Online now",
    recordPath: "/nutritionist/patients/emma-watson",
    statsPath: "/nutritionist/patients/tracking",
  },
] as const;
