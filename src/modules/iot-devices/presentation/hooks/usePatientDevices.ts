import { useEffect, useState } from "react";
import { getPatientDevicesOverviewUseCase } from "../../application/use-cases/getPatientDevicesOverviewUseCase";
import { MockIoTDeviceRepository } from "../../infrastructure/repositories/MockIoTDeviceRepository";
import type { PatientDevicesOverview } from "../../domain/models/IoTDevice";

const repository = new MockIoTDeviceRepository();
const getPatientDevicesOverview = getPatientDevicesOverviewUseCase(repository);

export function usePatientDevices(patientId: string) {
    const [overview, setOverview] = useState<PatientDevicesOverview | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            setIsLoading(true);
            try {
                const data = await getPatientDevicesOverview(patientId);
                if (mounted) setOverview(data);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        load();
        return () => { mounted = false; };
    }, [patientId]);

    return { overview, isLoading };
}