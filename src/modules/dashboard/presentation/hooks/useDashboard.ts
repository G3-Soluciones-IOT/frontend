import { useState, useEffect } from "react";
import type { DashboardData, UpcomingAppointment } from "../../domain/models/Dashboard";
import { fetchDashboardData, addUpcomingAppointment } from "../../infrastructure/api/dashboard.api";

export function useDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function loadData() {
            try {
                setIsLoading(true);
                const result = await fetchDashboardData();
                if (isMounted) {
                    setData(result);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    if (err instanceof Error) {
                        setError(err.message);
                    } else {
                        setError("Error desconocido en la carga de datos");
                    }
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        loadData();

        return () => {
            isMounted = false;
        };
    }, []);

    // Mutation Command para agregar la consulta por Axios de verdad
    const createNewConsultation = async (newAppointment: UpcomingAppointment) => {
        if (!data) return;
        try {
            const updatedData = await addUpcomingAppointment(newAppointment, data);
            setData(updatedData);
        } catch (err) {
            console.error(err);
            alert("No se pudo registrar la nueva consulta en el servidor db.json");
        }
    };

    return { data, isLoading, error, createNewConsultation };
}