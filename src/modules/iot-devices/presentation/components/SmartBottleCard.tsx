// src/modules/iot-devices/presentation/components/SmartBottleCard.tsx

import type { SmartBottleData } from "../../domain/models/IoTDevice";
import styles from "../pages/IoTDevicesPage.module.css";

interface SmartBottleCardProps {
    data: SmartBottleData;
}

export function SmartBottleCard({ data }: SmartBottleCardProps) {
    const progressPct = Math.min(100, Math.round((data.currentLiters / data.goalLiters) * 100));

    return (
        <section className={styles.card}>
            <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>💧 Botella Inteligente</h2>
                <span className={styles.cardSubtitle}>Hidratación diaria</span>
            </div>

            <div className={styles.bottleLayout}>
                <div className={styles.bottleVisualWrap}>
                    <div className={styles.bottleShell}>
                        <div
                            className={styles.bottleFill}
                            style={{ height: `${progressPct}%` }}
                        />
                    </div>
                </div>
                <div className={styles.bottleStats}>
                    <div className={styles.progressCircleWrap}>
                        <span className={styles.progressValue}>{progressPct}%</span>
                        <span className={styles.progressSub}>
              {data.currentLiters}L / {data.goalLiters}L
            </span>
                    </div>
                    <div className={styles.progressBarTrack}>
            <span
                className={styles.progressBarValue}
                style={{ width: `${progressPct}%` }}
            />
                    </div>
                    <p className={styles.lastDrinkText}>
                        Último sorbo: <strong>{data.lastDrinkAmountMl} ml</strong> a las {data.lastDrinkLabel}
                    </p>
                </div>
            </div>

            <p className={styles.weeklyChartTitle}>Hidratación semanal</p>
            <div className={styles.barChart}>
                {data.weeklyHydration.map((point) => {
                    const h = Math.round((point.liters / data.goalLiters) * 100);
                    return (
                        <div key={point.day} className={styles.barColumn}>
                            <div className={styles.barTrack}>
                                <div
                                    className={`${styles.bar} ${point.goalReached ? styles.barHighlight : ""}`}
                                    style={{ height: `${h}%` }}
                                />
                            </div>
                            <span className={styles.chartLabel}>{point.day}</span>
                        </div>
                    );
                })}
            </div>

            <ul className={styles.entryList}>
                {data.recentEntries.map((entry) => (
                    <li key={entry.id} className={styles.entryRow}>
                        <span className={styles.entryTime}>{entry.timeLabel}</span>
                        <span>{entry.amountMl} ml</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}