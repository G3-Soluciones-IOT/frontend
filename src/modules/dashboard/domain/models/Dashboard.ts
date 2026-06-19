export interface DashboardStats {
    activePatients: { value: number; trendPercentage: number; trendIsPositive: boolean };
    consultationsToday: { total: number; pending: number };
    iotAlerts: { total: number; requiresAttention: number };
}

export interface UpcomingAppointment {
    id: string;
    patientName: string;
    date: string; // Fecha en formato ISO
    type: string;
    avatar: string;
}

export interface RecentActivity {
    id: string;
    type: "water" | "calories" | "alert" | "success";
    patientName: string;
    action: string;
    timestamp: string; // Fecha en formato ISO
}

export interface DashboardData {
    stats: DashboardStats;
    upcomingAppointments: UpcomingAppointment[];
    recentActivities: RecentActivity[];
}