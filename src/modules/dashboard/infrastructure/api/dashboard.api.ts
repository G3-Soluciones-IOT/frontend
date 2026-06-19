import axios from "axios";
import type {DashboardData, UpcomingAppointment} from "../../domain/models/Dashboard";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

export const dashboardApi = axios.create({
    baseURL: `${BASE_URL}/dashboard`,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 10_000,
});

export async function fetchDashboardData(): Promise<DashboardData> {
    const response = await dashboardApi.get<DashboardData>("");
    return response.data;
}

export async function addUpcomingAppointment(
    newAppointment: UpcomingAppointment,
    currentData: DashboardData
): Promise<DashboardData> {
    // Estructuramos el nuevo objeto completo reflejando datos crudos
    const updatedData: DashboardData = {
        ...currentData,
        upcomingAppointments: [newAppointment, ...currentData.upcomingAppointments],
        stats: {
            ...currentData.stats,
            consultationsToday: {
                ...currentData.stats.consultationsToday,
                total: currentData.stats.consultationsToday.total + 1 // Aumenta automáticamente
            }
        }
    };

    const response = await dashboardApi.put<DashboardData>("", updatedData);
    return response.data;
}