import type { IoTDeviceSummary } from "../../domain/models/IoTDevice";
import { BottleIcon, ScaleIcon, WearableIcon, BatteryIcon } from "./IoTIcons";
import styles from "../pages/IoTDevicesPage.module.css";

function deviceIcon(type: IoTDeviceSummary["type"]) {
    if (type === "smart_bottle") return <BottleIcon />;
    if (type === "smart_scale") return <ScaleIcon />;
    return <WearableIcon />;
}

function statusLabel(status: IoTDeviceSummary["status"]) {
    if (status === "connected") return "Conectado";
    if (status === "syncing") return "Sincronizando";
    return "Desconectado";
}

function statusPillClass(status: IoTDeviceSummary["status"], s: Record<string, string>) {
    const base = s.statusPill;
    if (status === "connected") return `${base} ${s.statusConnected}`;
    if (status === "syncing") return `${base} ${s.statusSyncing}`;
    return `${base} ${s.statusDisconnected}`;
}

interface DeviceStatusPanelProps {
    devices: IoTDeviceSummary[];
}

export function DeviceStatusPanel({ devices }: DeviceStatusPanelProps) {
    return (
        <aside className={styles.statusPanel}>
            <h2 className={styles.panelTitle}>Estado de dispositivos</h2>
            <ul className={styles.statusList}>
                {devices.map((device) => (
                    <li key={device.id} className={styles.statusRow}>
                        <span className={styles.statusIcon}>{deviceIcon(device.type)}</span>
                        <div className={styles.statusInfo}>
                            <span className={styles.statusName}>{device.name}</span>
                            <span className={statusPillClass(device.status, styles)}>
                {statusLabel(device.status)}
              </span>
                            <div className={styles.batteryWrap}>
                                <BatteryIcon percentage={device.battery.percentage} />
                                <span className={styles.batteryText}>{device.battery.percentage}%</span>
                            </div>
                            <span className={styles.lastSync}>{device.lastSyncLabel}</span>
                        </div>
                    </li>
                ))}
            </ul>
        </aside>
    );
}