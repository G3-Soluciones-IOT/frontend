export type {
    DeviceType,
    DeviceConnectionStatus,
    DeviceBattery,
    IoTDeviceSummary,
    HydrationLogEntry,
    HydrationWeekPoint,
    SmartBottleData,
    DetectedFoodEstimate,
    WeightTrendPoint,
    SmartScaleData,
    VitalsSnapshot,
    WearableSensorData,
    PatientDevicesOverview,
} from "./domain/models/IoTDevice";

export type { IoTDeviceRepository } from "./domain/repositories/IoTDeviceRepository";
export { getPatientDevicesOverviewUseCase } from "./application/use-cases/getPatientDevicesOverviewUseCase";
export { MockIoTDeviceRepository } from "./infrastructure/repositories/MockIoTDeviceRepository";
export { IoTDevicesPage } from "./presentation/pages/IoTDevicesPage";
export { usePatientDevices } from "./presentation/hooks/usePatientDevices";