import type { NavigationItem } from "@/shared/components/layout";
import { DashboardIcon, UsersIcon, MessageIcon, FileIcon, ChartIcon, ScreenIcon } from "./navigation-icons";

// Configuración de navegación por rol
export const navigationConfig = {
  nutritionist: [
    { label: "Dashboard", href: "/nutritionist", icon: <DashboardIcon />, group: "root" },
    { label: "Patients", href: "/nutritionist/patients", icon: <UsersIcon />, group: "root" },
    { label: "Overview", href: "/nutritionist/patients/overview", icon: null, group: "patients" },
    { label: "Directory", href: "/nutritionist/patients/directory", icon: null, group: "patients" },
    { label: "Tracking", href: "/nutritionist/patients/tracking", icon: null, group: "patients" },
    { label: "Communication", href: "/communication", icon: <MessageIcon />, group: "root" },
    { label: "Chat", href: "/communication/chat", icon: null, group: "communication" },
    { label: "Consultations", href: "/communication/consultations", icon: null, group: "communication" },
    { label: "Recommendations", href: "/communication/recommendations", icon: null, group: "communication" },
    { label: "Content", href: "/content", icon: <FileIcon />, group: "root" },
    { label: "Tips", href: "/content/tips", icon: null, group: "content" },
    { label: "Analytics", href: "/analytics", icon: <ChartIcon />, group: "root" },
    { label: "Subscriptions", href: "/nutritionist/subscriptions", icon: <ScreenIcon />, group: "root" },
  ] as NavigationItem[],

  patient: [
    { label: "Dashboard", href: "/patient", icon: <DashboardIcon />, group: "root" },
    { label: "Meal Plans", href: "/patient/meal-plans", icon: <FileIcon />, group: "root" },
    { label: "Tracking", href: "/patient/tracking", icon: <ChartIcon />, group: "root" },
    { label: "Messages", href: "/patient/messages", icon: <MessageIcon />, group: "root" },
    { label: "Appointments", href: "/patient/appointments", icon: <DashboardIcon />, group: "root" },
  ] as NavigationItem[],

  admin: [
    { label: "Dashboard", href: "/admin", icon: <DashboardIcon />, group: "root" },
    { label: "User Management", href: "/admin/users", icon: <UsersIcon />, group: "root" },
    { label: "Content Library", href: "/admin/content", icon: <FileIcon />, group: "root" },
    { label: "Settings", href: "/admin/settings", icon: <ScreenIcon />, group: "root" },
  ] as NavigationItem[],
} as const;


