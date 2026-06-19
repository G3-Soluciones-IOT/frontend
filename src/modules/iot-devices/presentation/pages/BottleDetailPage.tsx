import { SharedLayout } from "@/shared/components/layout";
import { navigationConfig } from "@/shared/constants/navigation.config";
import { usePatientOwnDevices } from "../hooks/usePatientOwnDevices";
import styles from "./BottleDetailPage.module.css";

interface BottleDetailPageProps {
    currentPath: string;
    onNavigate: (href: string) => void;
}

export function BottleDetailPage({ currentPath, onNavigate }: BottleDetailPageProps) {
    const { overview, isLoading } = usePatientOwnDevices();

    if (isLoading || !overview || !overview.smartBottle) {
        return (
            <SharedLayout
                title="Botella Inteligente"
                currentPath={currentPath}
                onNavigate={onNavigate}
                navigationItems={navigationConfig.patient}
                breadcrumbs={["Mis Dispositivos", "Botella Inteligente"]}
            >
                <div style={{ textAlign: "center", padding: "40px" }}>Cargando información...</div>
            </SharedLayout>
        );
    }

    const { smartBottle } = overview;
    const progressPct = Math.min(100, Math.round((smartBottle.currentLiters / smartBottle.goalLiters) * 100));

    return (
        <SharedLayout
            title="Botella Inteligente"
            currentPath={currentPath}
            onNavigate={onNavigate}
            navigationItems={navigationConfig.patient}
            breadcrumbs={["Mis Dispositivos", "Botella Inteligente"]}
        >
            <button type="button" className={styles.backButton} onClick={() => onNavigate("/patient/iot-devices")}>
                ← Volver a Mis Dispositivos
            </button>

            <div className={styles.heroRow}>
                <div className={styles.bottleVisualWrap}>
                    <div className={styles.bottleShell}>
                        <div className={styles.bottleFill} style={{ height: `${progressPct}%` }} />
                    </div>
                </div>

                <div className={styles.heroStats}>
          <span className={styles.heroValue}>
            {smartBottle.currentLiters}L <span className={styles.heroGoal}>/ {smartBottle.goalLiters}L</span>
          </span>
                    <span className={styles.heroSub}>{progressPct}% de tu meta diaria</span>
                    <p className={styles.lastDrinkText}>
                        Último sorbo: <strong>{smartBottle.lastDrinkAmountMl} ml</strong> a las {smartBottle.lastDrinkLabel}
                    </p>
                </div>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{smartBottle.stats.avgDailyLiters}L</span>
                    <span className={styles.statLabel}>Promedio diario</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{smartBottle.stats.weeklyAverageLiters}L</span>
                    <span className={styles.statLabel}>Promedio semanal</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{smartBottle.stats.daysGoalReachedThisWeek}/7</span>
                    <span className={styles.statLabel}>Días con meta cumplida</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{smartBottle.stats.longestStreakDays} días</span>
                    <span className={styles.statLabel}>Racha más larga</span>
                </div>
            </div>

            <section className={styles.panel}>
                <h2 className={styles.panelTitle}>Hidratación semanal</h2>
                <div className={styles.barChart}>
                    {smartBottle.weeklyHydration.map((point) => {
                        const h = Math.round((point.liters / smartBottle.goalLiters) * 100);
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
            </section>

            <section className={styles.panel}>
                <h2 className={styles.panelTitle}>Registros recientes</h2>
                <ul className={styles.entryList}>
                    {smartBottle.recentEntries.map((entry) => (
                        <li key={entry.id} className={styles.entryRow}>
                            <span className={styles.entryTime}>{entry.timeLabel}</span>
                            <span>{entry.amountMl} ml</span>
                        </li>
                    ))}
                </ul>
            </section>
        </SharedLayout>
    );
}