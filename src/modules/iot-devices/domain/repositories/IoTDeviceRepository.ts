import type { PatientDevicesOverview } from "../models/IoTDevice";

export interface IoTDeviceRepository {
    getPatientOverview(patientId: string): Promise<PatientDevicesOverview>;
}