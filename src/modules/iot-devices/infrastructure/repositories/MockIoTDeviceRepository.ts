import type { IoTDeviceRepository } from "../../domain/repositories/IoTDeviceRepository";
import type { PatientDevicesOverview } from "../../domain/models/IoTDevice";
import { mockPatientDevicesOverview } from "../mock/devices.mock";

export class MockIoTDeviceRepository implements IoTDeviceRepository {
    async getPatientOverview(_patientId:string): Promise<PatientDevicesOverview> {
        // Cuando exista backend, esta clase se reemplaza por una
        // HttpIoTDeviceRepository que llame al endpoint real (ej. GET /devices/{patientId})
        return mockPatientDevicesOverview;
    }
}