import { SharedLayout } from "@/shared/components/layout";
import { navigationConfig } from "@/shared/constants/navigation.config";
import { useDashboard } from "../hooks/useDashboard";
import type { UpcomingAppointment } from "../../domain/models/Dashboard";
import {
  UsersIcon,
  ScreenIcon,
  BellIcon,
  WaterDropIcon,
  FireIcon,
  AlertTriangleIcon,
} from "../../../../shared/constants/navigation-icons.tsx";
import styles from "./DashboardPage.module.css";
import {useState} from "react";

interface DashboardPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

// Funciones de maquillaje del Frontend
const formatNumber = (num: number) => new Intl.NumberFormat("es-PE").format(num);

const formatTime = (isoString: string) => {
  return new Date(isoString).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getRelativeTime = (isoString: string) => {
  const timeMs = new Date(isoString).getTime();
  const deltaSeconds = Math.round((Date.now() - timeMs) / 1000);
  if (deltaSeconds < 60) return "Hace un momento";
  if (deltaSeconds < 3600) return `Hace ${Math.floor(deltaSeconds / 60)} min`;
  if (deltaSeconds < 86400) return `Hace ${Math.floor(deltaSeconds / 3600)} horas`;
  return `Hace ${Math.floor(deltaSeconds / 86400)} días`;
};

export function DashboardPage({ currentPath, onNavigate }: DashboardPageProps) {
  const { data, isLoading, error, createNewConsultation } = useDashboard();
  const [activeTab, setActiveTab] = useState<"overview" | "logs">("overview");

  if (isLoading || !data) {
    return (
        <SharedLayout title="Dashboard" currentPath={currentPath} onNavigate={onNavigate} navigationItems={navigationConfig.nutritionist} breadcrumbs={["Dashboard"]}>
          <div style={{ textAlign: "center", padding: "40px" }}>Cargando datos crudos...</div>
        </SharedLayout>
    );
  }

  if (error) {
    return (
        <SharedLayout title="Dashboard" currentPath={currentPath} onNavigate={onNavigate} navigationItems={navigationConfig.nutritionist} breadcrumbs={["Dashboard"]}>
          <div style={{ textAlign: "center", padding: "40px", color: "red" }}>⚠️ Error de conexión: {error}</div>
        </SharedLayout>
    );
  }

  // Handler para disparar una consulta real vía Axios
  const handleCreateConsultation = () => {
    const nombresDePrueba = ["Andrés Soto", "Clara Belón", "Diego Ramos", "Lucía Torres"];
    const tiposDePrueba = ["Control Nutricional", "Evaluación de Grasa", "Seguimiento IoT"];

    const randomNombre = nombresDePrueba[Math.floor(Math.random() * nombresDePrueba.length)];
    const randomTipo = tiposDePrueba[Math.floor(Math.random() * tiposDePrueba.length)];

    const nuevaCita: UpcomingAppointment = {
      id: `app-${Date.now()}`,
      patientName: randomNombre,
      date: new Date().toISOString(), // Tiempo crudo de hoy
      type: randomTipo,
      avatar: randomNombre.split(" ").map(n => n[0]).join(""),
    };

    createNewConsultation(nuevaCita);
  };

  return (
      <SharedLayout
          title="Dashboard"
          currentPath={currentPath}
          onNavigate={onNavigate}
          navigationItems={navigationConfig.nutritionist}
          breadcrumbs={["Dashboard", activeTab === "overview" ? "Overview" : "Recent Logs"]}
      >
        <div className={styles.container}>

          {/* REQUISITO: Barra Superior de Pestañas (Sub-navigation en el Topbard) */}
          <nav className={styles.subTopbar}>
            <button
                className={`${styles.tabButton} ${activeTab === "overview" ? styles.tabButtonActive : ""}`}
                onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
                className={`${styles.tabButton} ${activeTab === "logs" ? styles.tabButtonActive : ""}`}
                onClick={() => alert("Recent logs estará disponible próximamente.")}
            >
              Recent Logs
            </button>
          </nav>

          {activeTab === "overview" && (
              <>
                {/* Cabecera del Dashboard */}
                <header className={styles.header}>
                  <div>
                    <h1 className={styles.title}>Panel General</h1>
                    <p className={styles.subtitle}>Resumen cuantitativo extraído de los dispositivos de tus pacientes.</p>
                  </div>
                  {/* REQUISITO: Botón de Nueva Consulta que dispara el Command */}
                  <button className={styles.btnPrimary} onClick={handleCreateConsultation}>
                    + Nueva Consulta
                  </button>
                </header>

                {/* Tarjetas de Estadísticas */}
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={`${styles.statIconWrap} ${styles.iconBlue}`}><UsersIcon /></div>
                    <div className={styles.statInfo}>
                      <span className={styles.statTitle}>Pacientes Activos</span>
                      <span className={styles.statValue}>{formatNumber(data.stats.activePatients.value)}</span>
                      {/* REQUISITO: Recuadro verde para la tendencia */}
                      <div className={styles.trendBadge}>
                        ↑ {data.stats.activePatients.trendPercentage}%
                      </div>
                    </div>
                  </div>

                  <div className={styles.statCard}>
                    <div className={`${styles.statIconWrap} ${styles.iconPurple}`}><ScreenIcon /></div>
                    <div className={styles.statInfo}>
                      <span className={styles.statTitle}>Consultas Hoy</span>
                      <span className={styles.statValue}>{data.stats.consultationsToday.total}</span>
                      <span className={styles.statSubtext}>{data.stats.consultationsToday.pending} pendientes</span>
                    </div>
                  </div>

                  <div className={styles.statCard}>
                    <div className={`${styles.statIconWrap} ${styles.iconRed}`}><BellIcon /></div>
                    <div className={styles.statInfo}>
                      <span className={styles.statTitle}>Alertas IoT</span>
                      <span className={styles.statValue}>{data.stats.iotAlerts.total}</span>
                      <span className={styles.statSubtext}>{data.stats.iotAlerts.requiresAttention} requieren atención</span>
                      end</div>
                  </div>
                </div>

                {/* Grid de Paneles Inferiores */}
                <div className={styles.dashboardGrid}>

                  {/* Panel Próximas Consultas */}
                  <section className={styles.panel}>
                    <div className={styles.panelHeader}>
                      <h2 className={styles.panelTitle}>Próximas Consultas</h2>
                      <button className={styles.viewAllBtn}>Ver todos</button>
                    </div>
                    <div className={styles.appointmentList}>
                      {data.upcomingAppointments.map((app) => (
                          <div key={app.id} className={styles.appointmentItem}>
                            <div className={styles.appLeft}>
                              <div className={styles.avatar}>{app.avatar}</div>
                              <div className={styles.appInfo}>
                                <span className={styles.appName}>{app.patientName}</span>
                                <span className={styles.appType}>{app.type}</span>
                              </div>
                            </div>
                            <div className={styles.appRight}>
                              <div className={styles.appTime}>{formatTime(app.date)}</div>
                              <span className={styles.statusDot}></span>
                            </div>
                          </div>
                      ))}
                    </div>
                  </section>

                  {/* Panel Actividad Reciente */}
                  <section className={styles.panel}>
                    <div className={styles.panelHeader}>
                      <h2 className={styles.panelTitle}>Actividad Reciente</h2>
                    </div>
                    <div className={styles.activityList}>
                      {data.recentActivities.map((act) => (
                          <div key={act.id} className={styles.activityItem}>
                            {act.type === "water" && <span className={`${styles.activityIconWrap} ${styles.bgWater}`}><WaterDropIcon /></span>}
                            {act.type === "calories" && <span className={`${styles.activityIconWrap} ${styles.bgCalories}`}><FireIcon /></span>}
                            {act.type === "alert" && <span className={`${styles.activityIconWrap} ${styles.bgAlert}`}><AlertTriangleIcon /></span>}
                            <div className={styles.activityContent}>
                              <p className={styles.activityText}>
                                <strong>{act.patientName}</strong> {act.action}
                              </p>
                              <span className={styles.activityTime}>{getRelativeTime(act.timestamp)}</span>
                            </div>
                          </div>
                      ))}
                    </div>
                  </section>

                </div>
              </>
          )}
        </div>
      </SharedLayout>
  );
}