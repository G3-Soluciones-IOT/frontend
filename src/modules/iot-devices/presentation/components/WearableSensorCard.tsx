// src/modules/iot-devices/presentation/components/WearableSensorCard.tsx

import type { WearableSensorData } from "../../domain/models/IoTDevice";
import { HeartPulseIcon, FootstepsIcon, ThermometerIcon } from "./IoTIcons";
import styles from "../pages/IoTDevicesPage.module.css";

interface WearableSensorCardProps {
    data: WearableSensorData;
}

export function WearableSensorCard({ data }: WearableSensorCardProps) {
    const { vitals } = data;
    return (
        <section className={styles.card}>
            <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>🩺 Sensor Vestible</h2>
                <span className={styles.cardSubtitle}>Actualizado {data.lastUpdatedLabel}</span>
            </div>

            <div className={styles.vitalsGrid}>
                <div className={styles.vitalCard}>
                    <span className={styles.vitalIcon}><HeartPulseIcon /></span>
                    <span className={styles.vitalValue}>{vitals.heartRateBpm}</span>
                    <span className={styles.vitalLabel}>bpm</span>
                </div>
                <div className={styles.vitalCard}>
                    <span className={styles.vitalIcon}><FootstepsIcon /></span>
                    <span className={styles.vitalValue}>{vitals.steps.toLocaleString()}</span>
                    <span className={styles.vitalLabel}>pasos</span>
                </div>
                <div className={styles.vitalCard}>
                    <span className={styles.vitalIcon}><ThermometerIcon /></span>
                    <span className={styles.vitalValue}>{vitals.bodyTemperatureCelsius}°</span>
                    <span className={styles.vitalLabel}>temp. corporal</span>
                </div>
            </div>
        </section>
    );
}