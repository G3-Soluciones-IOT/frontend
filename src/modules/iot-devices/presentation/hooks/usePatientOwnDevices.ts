// src/modules/iot-devices/presentation/hooks/usePatientOwnDevices.ts

import { useEffect, useState } from "react";
import { MockPatientDeviceRepository } from "../../infrastructure/repositories/MockPatientDeviceRepository";
import type { PatientOwnDevicesOverview } from "../../domain/models/IoTDevice";

const repository = new MockPatientDeviceRepository();

export function usePatientOwnDevices() {
    const [overview, setOverview] = useState<PatientOwnDevicesOverview | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setIsLoading(true);
            try {
                const data = await repository.getOwnDevices();
                if (mounted) setOverview(data);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, []);

    return { overview, isLoading };
}