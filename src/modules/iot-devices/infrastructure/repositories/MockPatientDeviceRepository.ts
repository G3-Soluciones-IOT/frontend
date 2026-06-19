// src/modules/iot-devices/infrastructure/repositories/MockPatientDeviceRepository.ts

import type { PatientOwnDevicesOverview } from "../../domain/models/IoTDevice";
import { mockPatientOwnDevicesOverview } from "../mock/patientDevices.mock";

export interface PatientDeviceRepository {
    getOwnDevices(): Promise<PatientOwnDevicesOverview>;
}

export class MockPatientDeviceRepository implements PatientDeviceRepository {
    async getOwnDevices(): Promise<PatientOwnDevicesOverview> {
        // Reemplazar por HttpPatientDeviceRepository cuando exista backend
        return mockPatientOwnDevicesOverview;
    }
}