import { SharedLayout } from "@/shared/components/layout";
import { navigationConfig } from "@/shared/constants/navigation.config";
import { usePatientDevices } from "../hooks/usePatientDevices";
import { SmartBottleCard } from "../components/SmartBottleCard";
import { SmartScaleCard } from "../components/SmartScaleCard";
import { WearableSensorCard } from "../components/WearableSensorCard";
import { DeviceStatusPanel } from "../components/DeviceStatusPanel";
import styles from "./IoTDevicesPage.module.css";

interface IoTDevicesPageProps {
    currentPath: string;
    onNavigate: (href: string) => void;
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

export function IoTDevicesPage({ currentPath, onNavigate }: IoTDevicesPageProps) {
    const { overview, isLoading } = usePatientDevices("michael-chen");

    if (isLoading || !overview) {
        return (
            <SharedLayout
                title="Dispositivos IoT"
                currentPath={currentPath}
                onNavigate={onNavigate}
                navigationItems={navigationConfig.nutritionist}
                breadcrumbs={["Patients", "Dispositivos IoT"]}
            >
                <div style={{ textAlign: "center", padding: "40px" }}>Cargando dispositivos...</div>
            </SharedLayout>
        );
    }

    return (
        <SharedLayout
            title="Dispositivos IoT"
            currentPath={currentPath}
            onNavigate={onNavigate}
            navigationItems={navigationConfig.nutritionist}
            breadcrumbs={["Patients", "Directory", overview.patientName, "Dispositivos IoT"]}
        >
            <div className={styles.patientMiniCard}>
                <span className={styles.patientAvatar}>{getInitials(overview.patientName)}</span>
                <div>
                    <span className={styles.patientName}>{overview.patientName}</span>
                    <span className={styles.patientEmail}>{overview.patientEmail}</span>
                </div>
            </div>

            <div className={styles.layoutGrid}>
                <div className={styles.mainColumn}>
                    <SmartBottleCard data={overview.smartBottle} />
                    <div className={styles.lowerCardsGrid}>
                        <SmartScaleCard data={overview.smartScale} />
                        <WearableSensorCard data={overview.wearableSensor} />
                    </div>
                </div>
                <DeviceStatusPanel devices={overview.devices} />
            </div>
        </SharedLayout>
    );
}