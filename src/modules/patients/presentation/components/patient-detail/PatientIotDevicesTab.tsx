import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  getPatientHydrationHistory,
  getPatientHydrationSummary,
  getPatientIotDevices,
  getPatientLatestWeightMeasurement,
  getPatientWeightHistory,
  type HydrationRecordResource,
  type HydrationSummaryResource,
  type IotDeviceResource,
  type WeightMeasurementResource,
} from "../../../infrastructure/api/patientIot.api";
import styles from "../../pages/PatientsPages.module.css";

interface PatientIotDevicesTabProps {
  patientId: string;
}

interface IotTabData {
  devices: IotDeviceResource[];
  hydrationSummary?: HydrationSummaryResource;
  hydrationHistory: HydrationRecordResource[];
  latestWeight?: WeightMeasurementResource;
  weightHistory: WeightMeasurementResource[];
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
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

function measurementLabel(type?: string) {
  if (!type) return "-";
  return type.replace(/_/g, " ").toLowerCase();
}

export function PatientIotDevicesTab({ patientId }: PatientIotDevicesTabProps) {
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(toDateInputValue(today));
  const [data, setData] = useState<IotTabData>({
    devices: [],
    hydrationHistory: [],
    weightHistory: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const from = toDateInputValue(addDays(new Date(selectedDate), -6));
    const to = selectedDate;

    const loadIotData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [devices, hydrationSummary, hydrationHistory, latestWeight, weightHistory] = await Promise.all([
          getPatientIotDevices(patientId),
          getPatientHydrationSummary(patientId, selectedDate),
          getPatientHydrationHistory(patientId, selectedDate),
          getPatientLatestWeightMeasurement(patientId).catch(() => undefined),
          getPatientWeightHistory(patientId, from, to),
        ]);

        if (!mounted) return;
        setData({
          devices,
          hydrationSummary,
          hydrationHistory,
          latestWeight,
          weightHistory,
        });
      } catch (err) {
        if (!mounted) return;
        setData({ devices: [], hydrationHistory: [], weightHistory: [] });
        setError(err instanceof Error ? err.message : "No se pudo cargar la data IoT.");
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
  const totalWeightGrams = data.weightHistory.reduce((total, entry) => total + Number(entry.grams || 0), 0);

  return (
    <section className={styles.patientIotTab}>
      <div className={styles.patientOverviewTitle}>
        <div>
          <h2>IoT Devices</h2>
          <p className={styles.iotSubtitle}>Smart Bottle and Smart Food Scale readings for nutrition evaluation.</p>
        </div>
        <label className={styles.iotDateControl}>
          <span>Date</span>
          <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
        </label>
      </div>

      {loading && <p className={styles.directoryMessage}>Loading IoT data...</p>}
      {error && <p className={styles.errorText}>IoT endpoint unavailable: {error}</p>}

      <div className={styles.iotStatsGrid}>
        <IotStatCard label="Registered Devices" value={data.devices.length.toString()} detail={`${activeDevices} active`} tone="green" />
        <IotStatCard label="Hydration Today" value={`${data.hydrationSummary?.totalMl ?? 0} ml`} detail={`${hydrationProgress}% of goal`} tone="blue" />
        <IotStatCard label="Water Events" value={totalHydrationEvents.toString()} detail={data.hydrationSummary?.goalReached ? "Goal reached" : "Goal pending"} tone="amber" />
        <IotStatCard label="Scale Total" value={`${totalWeightGrams} g`} detail={`${data.weightHistory.length} readings`} tone="purple" />
      </div>

      <div className={styles.iotMainGrid}>
        <section className={styles.trackingVisualCard}>
          <div className={styles.trackingVisualHeader}>
            <span className={`${styles.trackingHeaderIcon} ${styles.trackingHeaderIconBlue}`}>H2O</span>
            <div>
              <h3>Hydration Summary</h3>
              <p>Daily Smart Bottle progress</p>
            </div>
          </div>

          <div className={styles.iotHydrationFocus}>
            <div className={styles.waterRing} style={{ "--progress": `${hydrationProgress}%` } as CSSProperties}>
              <div>
                <strong>{hydrationProgress}%</strong>
                <span>of daily goal</span>
              </div>
            </div>
            <div className={styles.iotHydrationNumbers}>
              <strong>{data.hydrationSummary?.totalMl ?? 0} ml</strong>
              <span>Goal: {data.hydrationSummary?.goalMl ?? 0} ml</span>
              <p>{data.hydrationSummary?.goalReached ? "Hydration goal reached." : "Hydration goal still pending."}</p>
            </div>
          </div>
        </section>

        <section className={styles.trackingVisualCard}>
          <div className={styles.trackingVisualHeader}>
            <span className={`${styles.trackingHeaderIcon} ${styles.trackingHeaderIconAmber}`}>S</span>
            <div>
              <h3>Latest Food Scale Reading</h3>
              <p>Most recent Smart Food Scale measurement</p>
            </div>
          </div>

          <div className={styles.iotScaleFocus}>
            <strong>{data.latestWeight?.grams ?? 0} <span>g</span></strong>
            <p>{measurementLabel(data.latestWeight?.measurementType)}</p>
            <small>{formatDateTime(data.latestWeight?.recordedAt)} · {data.latestWeight?.deviceId ?? "No device"}</small>
          </div>
        </section>
      </div>

      <div className={styles.iotMainGrid}>
        <section className={styles.trackingVisualCard}>
          <div className={styles.trackingVisualHeader}>
            <span className={`${styles.trackingHeaderIcon} ${styles.trackingHeaderIconBlue}`}>D</span>
            <div>
              <h3>Patient Devices</h3>
              <p>Registered IoT devices and last connection</p>
            </div>
          </div>

          <div className={styles.tableScroll}>
            <table className={styles.iotTable}>
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {data.devices.map((device) => (
                  <tr key={device.deviceId}>
                    <td><strong>{device.deviceId}</strong></td>
                    <td>{formatDeviceType(device.deviceType)}</td>
                    <td><span className={device.status === "ACTIVE" ? styles.iotStatusActive : styles.iotStatusInactive}>{device.status}</span></td>
                    <td>{formatDateTime(device.lastSeenAt)}</td>
                  </tr>
                ))}
                {data.devices.length === 0 && (
                  <tr>
                    <td colSpan={4}>No IoT devices found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.trackingVisualCard}>
          <div className={styles.trackingVisualHeader}>
            <span className={`${styles.trackingHeaderIcon} ${styles.trackingHeaderIconAmber}`}>W</span>
            <div>
              <h3>Scale History</h3>
              <p>Food portion measurements from the selected range</p>
            </div>
          </div>

          <div className={styles.iotHistoryList}>
            {data.weightHistory.slice(0, 6).map((entry) => (
              <article key={entry.id}>
                <span>{entry.grams} g</span>
                <div>
                  <strong>{measurementLabel(entry.measurementType)}</strong>
                  <small>{formatDateTime(entry.recordedAt)} · {entry.deviceId}</small>
                </div>
              </article>
            ))}
            {data.weightHistory.length === 0 && <p className={styles.emptyState}>No scale measurements found.</p>}
          </div>
        </section>
      </div>

      <section className={styles.trackingVisualCard}>
        <div className={styles.trackingVisualHeader}>
          <span className={`${styles.trackingHeaderIcon} ${styles.trackingHeaderIconBlue}`}>B</span>
          <div>
            <h3>Hydration Events</h3>
            <p>Smart Bottle intake history for the selected day</p>
          </div>
        </div>

        <div className={styles.iotHydrationTimeline}>
          {data.hydrationHistory.map((entry) => (
            <article key={entry.id}>
              <span>{formatDateTime(entry.recordedAt)}</span>
              <strong>{entry.amountMl} ml</strong>
              <p>Total {entry.totalMl} ml · {clampPercent(entry.progressPercentage)}%</p>
            </article>
          ))}
          {data.hydrationHistory.length === 0 && <p className={styles.emptyState}>No hydration events found.</p>}
        </div>
      </section>
    </section>
  );
}

function IotStatCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: "green" | "blue" | "amber" | "purple" }) {
  return (
    <article className={`${styles.iotStatCard} ${styles[`iotStat${tone}`]}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}
