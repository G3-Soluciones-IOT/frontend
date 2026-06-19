export type DeviceType = "smart_bottle" | "smart_scale" | "wearable_sensor";
export type DeviceConnectionStatus = "connected" | "disconnected" | "syncing";

export interface DeviceBattery {
    percentage: number;
}

export interface IoTDeviceSummary {
    id: string;
    name: string;
    type: DeviceType;
    status: DeviceConnectionStatus;
    battery: DeviceBattery;
    lastSyncLabel: string;
}

export interface HydrationLogEntry {
    id: string;
    amountMl: number;
    timeLabel: string;
}

export interface HydrationWeekPoint {
    day: string;
    liters: number;
    goalReached: boolean;
}

export interface SmartBottleData {
    device: IoTDeviceSummary;
    currentLiters: number;
    goalLiters: number;
    lastDrinkLabel: string;
    lastDrinkAmountMl: number;
    weeklyHydration: HydrationWeekPoint[];
    recentEntries: HydrationLogEntry[];
    stats: SmartBottleStats; // 🆕
}

export interface DetectedFoodEstimate {
    name: string;
    weightGrams: number;
    estimatedCalories: number;
    estimatedCarbsGrams: number;
}

export interface WeightTrendPoint {
    label: string;
    value: number;
}

export interface SmartScaleData {
    device: IoTDeviceSummary;
    currentWeightGrams: number;
    isStable: boolean;
    detectedFood: DetectedFoodEstimate;
    weightTrend: WeightTrendPoint[];
    stats: SmartScaleStats; // 🆕
}

export interface VitalsSnapshot {
    heartRateBpm: number;
    steps: number;
    bodyTemperatureCelsius: number;
}

export interface WearableSensorData {
    device: IoTDeviceSummary;
    vitals: VitalsSnapshot;
    lastUpdatedLabel: string;
}

export interface PatientDevicesOverview {
    patientId: string;
    patientName: string;
    patientEmail: string;
    devices: IoTDeviceSummary[];
    smartBottle: SmartBottleData;
    smartScale: SmartScaleData;
    wearableSensor: WearableSensorData;
}
export type DeviceAlertSeverity = "error" | "warning" | "info";

export interface DeviceAlert {
    id: string;
    severity: DeviceAlertSeverity;
    message: string;
    actionLabel?: string;
}

export type DeviceAvailability = "available" | "coming_soon";

// Versión extendida del resumen que incluye alertas
export interface IoTDeviceSummaryWithAlerts extends IoTDeviceSummary {
    alerts: DeviceAlert[];
    availability: DeviceAvailability;
    lastReadingLabel: string;
}

export interface PatientOwnDevicesOverview {
    patientName: string;
    devices: IoTDeviceSummaryWithAlerts[];
    smartBottle: SmartBottleData | null;
    smartScale: SmartScaleData | null;
    wearableSensor: WearableSensorData | null;
}
export interface SmartBottleStats {
    avgDailyLiters: number;
    weeklyAverageLiters: number;
    monthlyAverageLiters: number;
    daysGoalReachedThisWeek: number;
    longestStreakDays: number;
}

// ── Detalle extendido de Báscula ────────────────────────────────

export interface FoodLogEntry {
    id: string;
    foodName: string;
    weightGrams: number;
    estimatedCalories: number;
    estimatedCarbsGrams: number;
    dateLabel: string;
    timeLabel: string;
    emoji: string;
    photoVariant: "light" | "dark";
}

export interface SmartScaleStats {
    mealsLoggedToday: number;
    totalLogsThisWeek: number;
    averageCaloriesPerMeal: number;
    foodLog: FoodLogEntry[];
}