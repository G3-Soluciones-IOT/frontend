import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useI18n } from "@/shared/i18n/useI18n";
import {
  getPatientHydrationHistory,
  getPatientHydrationSummary,
  getPatientIotDevices,
  type HydrationRecordResource,
  type HydrationSummaryResource,
  type IotDeviceResource,
} from "../../../infrastructure/api/patientIot.api";
import styles from "../../pages/PatientsPages.module.css";

interface PatientIotDevicesTabProps {
  patientId: string;
}

interface IotTabData {
  devices: IotDeviceResource[];
  hydrationSummary?: HydrationSummaryResource;
  hydrationHistory: HydrationRecordResource[];
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDeviceType(type: string) {
  return type
    .replace(/^SMART_/, "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function clampPercent(value?: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Number(value)));
}

function latestDeviceSync(devices: IotDeviceResource[]) {
  return devices.reduce<string | undefined>((latest, device) => {
    if (!device.lastSeenAt) return latest;
    if (!latest) return device.lastSeenAt;
    return new Date(device.lastSeenAt).getTime() > new Date(latest).getTime() ? device.lastSeenAt : latest;
  }, undefined);
}

function deviceIcon(type: string) {
  return type.includes("BOTTLE") ? <BottleIcon /> : <DeviceIcon />;
}

export function PatientIotDevicesTab({ patientId }: PatientIotDevicesTabProps) {
  const { t } = useI18n();
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(toDateInputValue(today));
  const [data, setData] = useState<IotTabData>({
    devices: [],
    hydrationHistory: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadIotData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [devices, hydrationSummary, hydrationHistory] = await Promise.all([
          getPatientIotDevices(patientId),
          getPatientHydrationSummary(patientId, selectedDate),
          getPatientHydrationHistory(patientId, selectedDate),
        ]);

        if (!mounted) return;
        setData({
          devices,
          hydrationSummary,
          hydrationHistory,
        });
      } catch (err) {
        if (!mounted) return;
        setData({ devices: [], hydrationHistory: [] });
        setError(err instanceof Error ? err.message : t("patients.iot.loadError"));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadIotData();

    return () => {
      mounted = false;
    };
  }, [patientId, selectedDate]);

  const activeDevices = data.devices.filter((device) => device.status === "ACTIVE").length;
  const hydrationProgress = clampPercent(data.hydrationSummary?.progressPercentage);
  const totalHydrationEvents = data.hydrationHistory.length;
  const latestSync = latestDeviceSync(data.devices);

  return (
    <section className={styles.patientIotTab}>
      <div className={styles.iotHero}>
        <div>
          <span className={styles.iotEyebrow}>{t("patients.iot.connectedCare")}</span>
          <h2>{t("patients.detail.tab.iot")}</h2>
          <p className={styles.iotSubtitle}>{t("patients.iot.description")}</p>
        </div>
        <div className={styles.iotHeroIcons} aria-hidden="true">
          <BottleIcon />
          <DeviceIcon />
        </div>
        <label className={styles.iotDateControl}>
          <span>{t("patients.iot.date")}</span>
          <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
        </label>
      </div>

      {loading && <p className={styles.directoryMessage}>{t("patients.iot.loading")}</p>}
      {error && <p className={styles.errorText}>{t("patients.iot.unavailable")}: {error}</p>}

      <div className={styles.iotStatsGrid}>
        <IotStatCard icon={<DeviceIcon />} label={t("patients.iot.registeredDevices")} value={data.devices.length.toString()} detail={`${activeDevices} ${t("patients.iot.active")}`} tone="green" />
        <IotStatCard icon={<BottleIcon />} label={t("patients.iot.hydrationToday")} value={`${data.hydrationSummary?.totalMl ?? 0} ml`} detail={`${hydrationProgress}% ${t("patients.iot.ofGoal")}`} tone="blue" />
        <IotStatCard icon={<ClockIcon />} label={t("patients.iot.waterEvents")} value={totalHydrationEvents.toString()} detail={data.hydrationSummary?.goalReached ? t("patients.iot.goalReached") : t("patients.iot.goalPending")} tone="amber" />
      </div>

      <div className={styles.iotMainGrid}>
        <section className={styles.trackingVisualCard}>
          <div className={styles.trackingVisualHeader}>
            <span className={`${styles.trackingHeaderIcon} ${styles.trackingHeaderIconBlue}`}>H2O</span>
            <div>
              <h3>{t("patients.iot.hydrationSummary")}</h3>
              <p>{t("patients.iot.hydrationSummary.description")}</p>
            </div>
          </div>

          <div className={styles.iotHydrationFocus}>
            <div className={styles.waterRing} style={{ "--progress": `${hydrationProgress}%` } as CSSProperties}>
              <div>
                <strong>{hydrationProgress}%</strong>
                <span>{t("patients.iot.ofDailyGoal")}</span>
              </div>
            </div>
            <div className={styles.iotHydrationNumbers}>
              <strong>{data.hydrationSummary?.totalMl ?? 0} ml</strong>
              <span>{t("patients.iot.goal")}: {data.hydrationSummary?.goalMl ?? 0} ml</span>
              <p>{data.hydrationSummary?.goalReached ? t("patients.iot.hydrationReached") : t("patients.iot.hydrationPending")}</p>
            </div>
          </div>
        </section>

        <section className={styles.trackingVisualCard}>
          <div className={styles.trackingVisualHeader}>
            <span className={`${styles.trackingHeaderIcon} ${styles.trackingHeaderIconBlue}`}><DeviceIcon /></span>
            <div>
              <h3>{t("patients.iot.patientDevices")}</h3>
              <p>{t("patients.iot.latestSync")}: {formatDateTime(latestSync)}</p>
            </div>
          </div>

          <div className={styles.iotDeviceCards}>
            {data.devices.map((device) => (
              <article className={styles.iotDeviceCard} key={device.deviceId}>
                <span className={styles.iotDeviceIcon}>{deviceIcon(device.deviceType)}</span>
                <div>
                  <strong>{formatDeviceType(device.deviceType)}</strong>
                  <small>{device.deviceId}</small>
                </div>
                <span className={device.status === "ACTIVE" ? styles.iotStatusActive : styles.iotStatusInactive}>{device.status}</span>
                <p>{t("patients.iot.lastSeen")} {formatDateTime(device.lastSeenAt)}</p>
              </article>
            ))}
            {data.devices.length === 0 && <p className={styles.emptyState}>{t("patients.iot.noDevices")}</p>}
          </div>
        </section>
      </div>

      <section className={styles.trackingVisualCard}>
        <div className={styles.trackingVisualHeader}>
          <span className={`${styles.trackingHeaderIcon} ${styles.trackingHeaderIconBlue}`}>B</span>
          <div>
            <h3>{t("patients.iot.hydrationEvents")}</h3>
            <p>{t("patients.iot.hydrationEvents.description")}</p>
          </div>
        </div>

        <div className={styles.iotHydrationTimeline}>
          {data.hydrationHistory.map((entry) => (
            <article key={entry.id}>
              <span><ClockIcon /> {formatDateTime(entry.recordedAt)}</span>
              <strong>{entry.amountMl} ml</strong>
              <p>{t("patients.iot.total")} {entry.totalMl} ml - {clampPercent(entry.progressPercentage)}%</p>
            </article>
          ))}
          {data.hydrationHistory.length === 0 && <p className={styles.emptyState}>{t("patients.iot.noHydrationEvents")}</p>}
        </div>
      </section>
    </section>
  );
}

function IotStatCard({ icon, label, value, detail, tone }: { icon: ReactNode; label: string; value: string; detail: string; tone: "green" | "blue" | "amber" }) {
  return (
    <article className={`${styles.iotStatCard} ${styles[`iotStat${tone}`]}`}>
      <div className={styles.iotStatTop}>
        <span className={styles.iotStatIcon}>{icon}</span>
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function BottleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 2h6" />
      <path d="M10 2v4l-2 2v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8l-2-2V2" />
      <path d="M10 13h4v5h-4z" />
    </svg>
  );
}

function DeviceIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="3" />
      <path d="M8 15h8" />
      <path d="M8 11h2l2-3 2 6 2-3h2" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5l3 2" />
    </svg>
  );
}
