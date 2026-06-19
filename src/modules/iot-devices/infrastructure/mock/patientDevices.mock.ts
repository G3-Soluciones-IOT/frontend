// src/modules/iot-devices/infrastructure/mock/patientDevices.mock.ts

import type { PatientOwnDevicesOverview } from "../../domain/models/IoTDevice";

export const mockPatientOwnDevicesOverview: PatientOwnDevicesOverview = {
    patientName: "Carlos Ramírez",
    devices: [
        {
            id: "device-smart-bottle",
            name: "Botella Inteligente",
            type: "smart_bottle",
            status: "connected",
            battery: { percentage: 18 },
            lastSyncLabel: "Hace 3 min",
            lastReadingLabel: "1.68 L registrados hoy",
            availability: "available",
            alerts: [
                {
                    id: "alert-battery-low",
                    severity: "warning",
                    message: "Batería baja. Recarga el dispositivo pronto para no perder registros.",
                    actionLabel: "Entendido",
                },
            ],
        },
        {
            id: "device-smart-scale",
            name: "Báscula Inteligente",
            type: "smart_scale",
            status: "disconnected",
            battery: { percentage: 72 },
            lastSyncLabel: "Hace 2 horas",
            lastReadingLabel: "Última medición: 135g",
            availability: "available",
            alerts: [
                {
                    id: "alert-disconnected",
                    severity: "error",
                    message: "Dispositivo desconectado. Verifica que esté encendido y conectado a la misma red WiFi.",
                    actionLabel: "Ver pasos para reconectar",
                },
                {
                    id: "alert-data-loss",
                    severity: "info",
                    message: "Los datos del dispositivo se sincronizarán automáticamente cuando se restablezca la conexión.",
                },
            ],
        },
        {
            id: "device-wearable-sensor",
            name: "Sensor Vestible",
            type: "wearable_sensor",
            status: "disconnected",
            battery: { percentage: 0 },
            lastSyncLabel: "No disponible",
            lastReadingLabel: "No disponible aún",
            availability: "coming_soon",
            alerts: [],
        },
    ],
    smartBottle: {
        device: {
            id: "device-smart-bottle",
            name: "Botella Inteligente",
            type: "smart_bottle",
            status: "connected",
            battery: { percentage: 18 },
            lastSyncLabel: "Hace 3 min",
        },
        currentLiters: 1.68,
        goalLiters: 2,
        lastDrinkLabel: "10:15 AM",
        lastDrinkAmountMl: 220,
        weeklyHydration: [
            { day: "Lun", liters: 1.9, goalReached: false },
            { day: "Mar", liters: 2.1, goalReached: true },
            { day: "Mié", liters: 1.5, goalReached: false },
            { day: "Jue", liters: 2.2, goalReached: true },
            { day: "Vie", liters: 1.7, goalReached: false },
            { day: "Sáb", liters: 1.68, goalReached: false },
            { day: "Dom", liters: 0, goalReached: false },
        ],
        recentEntries: [
            { id: "h-1", amountMl: 220, timeLabel: "10:15 AM" },
            { id: "h-2", amountMl: 250, timeLabel: "08:40 AM" },
            { id: "h-3", amountMl: 300, timeLabel: "07:05 AM" },
        ],
    },
    smartScale: {
        device: {
            id: "device-smart-scale",
            name: "Báscula Inteligente",
            type: "smart_scale",
            status: "disconnected",
            battery: { percentage: 72 },
            lastSyncLabel: "Hace 2 horas",
        },
        currentWeightGrams: 135,
        isStable: true,
        detectedFood: {
            name: "Manzana Gala",
            weightGrams: 135,
            estimatedCalories: 70,
            estimatedCarbsGrams: 19,
        },
        weightTrend: [
            { label: "L", value: 120 },
            { label: "M", value: 140 },
            { label: "M", value: 110 },
            { label: "J", value: 150 },
            { label: "V", value: 135 },
        ],
    },
    wearableSensor: null,
};