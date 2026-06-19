// src/modules/iot-devices/presentation/pages/ScaleDetailPage.tsx

import { SharedLayout } from "@/shared/components/layout";
import { navigationConfig } from "@/shared/constants/navigation.config";
import { usePatientOwnDevices } from "../hooks/usePatientOwnDevices";
import styles from "./ScaleDetailPage.module.css";

interface ScaleDetailPageProps {
    currentPath: string;
    onNavigate: (href: string) => void;
}

export function ScaleDetailPage({ currentPath, onNavigate }: ScaleDetailPageProps) {
    const { overview, isLoading } = usePatientOwnDevices();

    if (isLoading || !overview || !overview.smartScale) {
        return (
            <SharedLayout
                title="Báscula Inteligente"
                currentPath={currentPath}
                onNavigate={onNavigate}
                navigationItems={navigationConfig.patient}
                breadcrumbs={["Mis Dispositivos", "Báscula Inteligente"]}
            >
                <div style={{ textAlign: "center", padding: "40px" }}>Cargando información...</div>
            </SharedLayout>
        );
    }

    const { smartScale } = overview;

    return (
        <SharedLayout
            title="Báscula Inteligente"
            currentPath={currentPath}
            onNavigate={onNavigate}
            navigationItems={navigationConfig.patient}
            breadcrumbs={["Mis Dispositivos", "Báscula Inteligente"]}
        >
            <button type="button" className={styles.backButton} onClick={() => onNavigate("/patient/iot-devices")}>
                ← Volver a Mis Dispositivos
            </button>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{smartScale.stats.mealsLoggedToday}</span>
                    <span className={styles.statLabel}>Comidas registradas hoy</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{smartScale.stats.totalLogsThisWeek}</span>
                    <span className={styles.statLabel}>Registros esta semana</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{smartScale.stats.averageCaloriesPerMeal} kcal</span>
                    <span className={styles.statLabel}>Promedio por comida</span>
                </div>
            </div>

            <section className={styles.panel}>
                <h2 className={styles.panelTitle}>Última medición</h2>
                <div className={styles.lastMeasure}>
          <span className={`${styles.foodPhoto} ${styles.foodPhotoLight}`}>
            <span className={styles.foodEmoji}>🍎</span>
          </span>
                    <div>
                        <strong className={styles.lastFoodName}>{smartScale.detectedFood.name}</strong>
                        <p className={styles.lastFoodMeta}>
                            {smartScale.detectedFood.weightGrams}g · {smartScale.detectedFood.estimatedCalories} kcal ·{" "}
                            {smartScale.detectedFood.estimatedCarbsGrams}g carbos
                        </p>
                    </div>
                </div>
            </section>

            <section className={styles.panel}>
                <h2 className={styles.panelTitle}>Historial de comidas registradas</h2>
                <div className={styles.foodLogGrid}>
                    {smartScale.stats.foodLog.map((entry) => (
                        <article key={entry.id} className={styles.foodCard}>
              <span
                  className={`${styles.foodPhoto} ${entry.photoVariant === "dark" ? styles.foodPhotoDark : styles.foodPhotoLight}`}
              >
                <span className={styles.foodEmoji}>{entry.emoji}</span>
              </span>
                            <div className={styles.foodCardBody}>
                                <strong className={styles.foodCardName}>{entry.foodName}</strong>
                                <span className={styles.foodCardMeta}>
                  {entry.weightGrams}g · {entry.estimatedCalories} kcal
                </span>
                                <span className={styles.foodCardTime}>
                  {entry.dateLabel} · {entry.timeLabel}
                </span>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </SharedLayout>
    );
}