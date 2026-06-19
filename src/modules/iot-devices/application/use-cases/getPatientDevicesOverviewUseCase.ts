import type { IoTDeviceRepository } from "../../domain/repositories/IoTDeviceRepository";

export function getPatientDevicesOverviewUseCase(repository: IoTDeviceRepository) {
    return (patientId: string) => {
        return repository.getPatientOverview(patientId);
    };
}