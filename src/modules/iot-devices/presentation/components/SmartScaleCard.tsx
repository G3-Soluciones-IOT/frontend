// src/modules/iot-devices/presentation/components/SmartScaleCard.tsx

import type { SmartScaleData } from "../../domain/models/IoTDevice";
import styles from "../pages/IoTDevicesPage.module.css";

interface SmartScaleCardProps {
    data: SmartScaleData;
}

export function SmartScaleCard({ data }: SmartScaleCardProps) {
    const maxTrend = Math.max(...data.weightTrend.map((p) => p.value));

    return (
        <section className={styles.card}>
            <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>⚖️ Báscula Inteligente</h2>
                <span className={styles.cardSubtitle}>Peso de porción</span>
            </div>

            <div className={styles.scaleDisplay}>
                <span className={styles.scaleWeight}>{data.currentWeightGrams}g</span>
                <span className={data.isStable ? styles.stabilityPillStable : styles.stabilityPillReading}>
          {data.isStable ? "Estable" : "Leyendo…"}
        </span>
            </div>

            <div className={styles.foodDetected}>
                <span className={styles.foodName}>{data.detectedFood.name}</span>
                <span className={styles.foodMacros}>
          {data.detectedFood.estimatedCalories} kcal · {data.detectedFood.estimatedCarbsGrams}g carbos
        </span>
            </div>

            <p className={styles.weeklyChartTitle}>Tendencia (últimas 5 mediciones)</p>
            <div className={styles.barChart}>
                {data.weightTrend.map((point, i) => {
                    const h = Math.round((point.value / maxTrend) * 100);
                    return (
                        <div key={i} className={styles.barColumn}>
                            <div className={styles.barTrack}>
                                <div className={`${styles.bar} ${styles.barHighlight}`} style={{ height: `${h}%` }} />
                            </div>
                            <span className={styles.chartLabel}>{point.label}</span>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}