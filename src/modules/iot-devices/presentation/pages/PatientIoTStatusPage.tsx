import { SharedLayout } from "@/shared/components/layout";
import { navigationConfig } from "@/shared/constants/navigation.config";
import { usePatientOwnDevices } from "../hooks/usePatientOwnDevices";
import type { IoTDeviceSummaryWithAlerts, DeviceAlertSeverity } from "../../domain/models/IoTDevice";
import { BottleIcon, ScaleIcon, WearableIcon, BatteryIcon } from "../components/IoTIcons";
import styles from "./PatientIoTStatusPage.module.css";

interface PatientIoTStatusPageProps {
    currentPath: string;
    onNavigate: (href: string) => void;
}

// ── Helpers ──────────────────────────────────────────────────────

function deviceIcon(type: IoTDeviceSummaryWithAlerts["type"]) {
    if (type === "smart_bottle") return <BottleIcon />;
    if (type === "smart_scale") return <ScaleIcon />;
    return <WearableIcon />;
}

function statusLabel(status: IoTDeviceSummaryWithAlerts["status"]) {
    if (status === "connected") return "Conectado";
    if (status === "syncing") return "Sincronizando";
    return "Desconectado";
}

function statusClass(status: IoTDeviceSummaryWithAlerts["status"]) {
    if (status === "connected") return styles.pillConnected;
    if (status === "syncing") return styles.pillSyncing;
    return styles.pillDisconnected;
}

function alertBannerClass(severity: DeviceAlertSeverity) {
    if (severity === "error") return styles.alertError;
    if (severity === "warning") return styles.alertWarning;
    return styles.alertInfo;
}

function alertIconEmoji(severity: DeviceAlertSeverity) {
    if (severity === "error") return "🔴";
    if (severity === "warning") return "🟡";
    return "🔵";
}

function hasErrors(devices: IoTDeviceSummaryWithAlerts[]) {
    return devices.some((d) =>
        d.availability === "available" &&
        d.alerts.some((a) => a.severity === "error")
    );
}

// ── Componente de card por dispositivo ───────────────────────────

function DeviceCard({
                        device,
                        onNavigate,
                    }: {
    device: IoTDeviceSummaryWithAlerts;
    onNavigate: (href: string) => void;
}) {
    const isComingSoon = device.availability === "coming_soon";

    const handleClick = () => {
        if (isComingSoon) return;
        if (device.type === "smart_bottle") onNavigate("/patient/iot-devices/bottle");
        if (device.type === "smart_scale") onNavigate("/patient/iot-devices/scale");
    };

    return (
        <article
            className={`${styles.deviceCard} ${isComingSoon ? styles.deviceCardComingSoon : styles.deviceCardClickable}`}
            onClick={handleClick}
            role={isComingSoon ? undefined : "button"}
            tabIndex={isComingSoon ? undefined : 0}
            onKeyDown={(e) => {
                if (!isComingSoon && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    handleClick();
                }
            }}
        >
            {isComingSoon && (
                <div className={styles.comingSoonBadge}>Próximamente</div>
            )}

            <div className={styles.deviceCardHeader}>
                <span className={`${styles.deviceIconWrap} ${isComingSoon ? styles.deviceIconGray : ""}`}>
                    {deviceIcon(device.type)}
                </span>
                <div className={styles.deviceMeta}>
                    <span className={styles.deviceName}>{device.name}</span>
                    {!isComingSoon && (
                        <span className={`${styles.statusPill} ${statusClass(device.status)}`}>
                            {statusLabel(device.status)}
                        </span>
                    )}
                </div>
                {!isComingSoon && (
                    <div className={styles.batterySection}>
                        <BatteryIcon percentage={device.battery.percentage} />
                        <span className={styles.batteryPct}>{device.battery.percentage}%</span>
                    </div>
                )}
            </div>

            {isComingSoon ? (
                <p className={styles.comingSoonText}>
                    Este dispositivo estará disponible próximamente. Podrás monitorear tus signos vitales en tiempo real.
                </p>
            ) : (
                <>
                    <div className={styles.lastReading}>
                        <span className={styles.lastReadingLabel}>Último registro</span>
                        <span className={styles.lastReadingValue}>{device.lastReadingLabel}</span>
                        <span className={styles.lastSyncTime}>{device.lastSyncLabel}</span>
                    </div>

                    {device.alerts.length > 0 && (
                        <ul className={styles.alertList}>
                            {device.alerts.map((alert) => (
                                <li
                                    key={alert.id}
                                    className={`${styles.alertBanner} ${alertBannerClass(alert.severity)}`}
                                >
                                    <span className={styles.alertIcon}>{alertIconEmoji(alert.severity)}</span>
                                    <div className={styles.alertBody}>
                                        <p className={styles.alertMessage}>{alert.message}</p>
                                        {alert.actionLabel && (
                                            <button type="button" className={styles.alertAction}>
                                                {alert.actionLabel}
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    {device.alerts.length === 0 && device.status === "connected" && (
                        <div className={styles.okBanner}>
                            ✅ Todo funciona correctamente
                        </div>
                    )}
                </>
            )}

            {!isComingSoon && (
                <span className={styles.viewMoreLink}>Ver más detalles →</span>
            )}
        </article>
    );
}

// ── Página principal ─────────────────────────────────────────────

export function PatientIoTStatusPage({ currentPath, onNavigate }: PatientIoTStatusPageProps) {
    const { overview, isLoading } = usePatientOwnDevices();

    if (isLoading || !overview) {
        return (
            <SharedLayout
                title="Mis Dispositivos"
                currentPath={currentPath}
                onNavigate={onNavigate}
                navigationItems={navigationConfig.patient}
                breadcrumbs={["Mis Dispositivos"]}
            >
                <div style={{ textAlign: "center", padding: "40px" }}>Cargando dispositivos...</div>
            </SharedLayout>
        );
    }

    const withErrors = hasErrors(overview.devices);
    const availableDevices = overview.devices.filter((d) => d.availability === "available");
    const errorCount = availableDevices.filter((d) =>
        d.alerts.some((a) => a.severity === "error")
    ).length;

    return (
        <SharedLayout
            title="Mis Dispositivos"
            currentPath={currentPath}
            onNavigate={onNavigate}
            navigationItems={navigationConfig.patient}
            breadcrumbs={["Mis Dispositivos"]}
        >
            <div className={styles.page}>

                {/* Banner general de error si hay algún dispositivo con problema */}
                {withErrors && (
                    <div className={styles.globalErrorBanner}>
                        <span className={styles.globalErrorIcon}>⚠️</span>
                        <div>
                            <strong>
                                {errorCount === 1
                                    ? "1 dispositivo necesita atención"
                                    : `${errorCount} dispositivos necesitan atención`}
                            </strong>
                            <p>Revisa los detalles abajo para solucionar los problemas.</p>
                        </div>
                    </div>
                )}

                {/* Resumen rápido */}
                <div className={styles.summaryRow}>
                    <div className={styles.summaryCard}>
                        <span className={styles.summaryNumber}>
                            {availableDevices.filter((d) => d.status === "connected").length}
                        </span>
                        <span className={styles.summaryLabel}>Conectados</span>
                    </div>
                    <div className={styles.summaryCard}>
                        <span className={`${styles.summaryNumber} ${errorCount > 0 ? styles.summaryNumberError : ""}`}>
                            {errorCount}
                        </span>
                        <span className={styles.summaryLabel}>Con errores</span>
                    </div>
                    <div className={styles.summaryCard}>
                        <span className={styles.summaryNumber}>
                            {availableDevices.filter((d) =>
                                d.alerts.some((a) => a.severity === "warning")
                            ).length}
                        </span>
                        <span className={styles.summaryLabel}>Advertencias</span>
                    </div>
                </div>

                {/* Cards de dispositivos */}
                <div className={styles.devicesGrid}>
                    {overview.devices.map((device) => (
                        <DeviceCard
                            key={device.id}
                            device={device}
                            onNavigate={onNavigate}
                        />
                    ))}
                </div>

                {/* Sección de ayuda */}
                <section className={styles.helpSection}>
                    <h2 className={styles.helpTitle}>¿Necesitas ayuda con tus dispositivos?</h2>
                    <div className={styles.helpGrid}>
                        <div className={styles.helpCard}>
                            <span className={styles.helpEmoji}>🔌</span>
                            <strong>Dispositivo desconectado</strong>
                            <p>Asegúrate de que el dispositivo esté encendido y conectado a la misma red WiFi que usaste al configurarlo.</p>
                        </div>
                        <div className={styles.helpCard}>
                            <span className={styles.helpEmoji}>🔋</span>
                            <strong>Batería baja</strong>
                            <p>Recarga usando el cable USB-C incluido. La botella tarda aprox. 2 horas en cargarse completamente.</p>
                        </div>
                        <div className={styles.helpCard}>
                            <span className={styles.helpEmoji}>🔄</span>
                            <strong>Problemas de sincronización</strong>
                            <p>Abre la app, ve a este apartado y espera 30 segundos. Si persiste, apaga y enciende el dispositivo.</p>
                        </div>
                    </div>
                </section>

            </div>
        </SharedLayout>
    );
}