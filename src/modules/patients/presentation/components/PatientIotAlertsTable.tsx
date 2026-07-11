import { useEffect, useState } from "react";
import { apiUrl } from "@/app/config/env";
import { useI18n } from "@/shared/i18n/useI18n";
import {
  getNutritionistPatientRelations,
  getPatientUserSummaries,
  type NutritionistPatientRelation,
  type PatientUserSummary,
} from "../../infrastructure/api/nutritionistPatients.api";
import {
  getPatientIotDevices,
  type IotDeviceResource,
} from "../../infrastructure/api/patientIot.api";
import styles from "../pages/PatientsPages.module.css";

interface PatientIotAlertsTableProps {
  onNavigate: (href: string) => void;
}

interface SessionUser {
  id?: number | string;
}

interface NutritionistProfile {
  id: number | string;
}

interface PatientProfilePreview {
  name?: string;
  fullName?: string;
  username?: string;
  email?: string;
}

interface PatientIotRow {
  patientUserId: number | string;
  patientName: string;
  devices: IotDeviceResource[];
}

function getSessionUser(): SessionUser | null {
  const session = JSON.parse(localStorage.getItem("session") || "null");
  return session?.user ?? null;
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(apiUrl(path), {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function getNutritionistIdByUser(userId?: number | string) {
  if (!userId) return null;
  const profile = await fetchJson<NutritionistProfile>(
    `/api/v1/nutritionists/by-user?userId=${encodeURIComponent(String(userId))}`,
  );
  return profile.id;
}

async function getPatientProfileName(patientUserId: number | string, fallbackName: string) {
  const profile = await fetchJson<PatientProfilePreview>(
    `/api/v1/profiles/by-user/${encodeURIComponent(String(patientUserId))}`,
  ).catch(() => null);

  return profile?.name || profile?.fullName || profile?.username || fallbackName;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "P";
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

function latestDeviceSync(devices: IotDeviceResource[]) {
  return devices.reduce<string | undefined>((latest, device) => {
    if (!device.lastSeenAt) return latest;
    if (!latest) return device.lastSeenAt;
    return new Date(device.lastSeenAt).getTime() > new Date(latest).getTime() ? device.lastSeenAt : latest;
  }, undefined);
}

function deviceSummary(devices: IotDeviceResource[]) {
  if (devices.length === 0) return "No devices";
  const types = Array.from(new Set(devices.map((device) => formatDeviceType(device.deviceType))));
  return types.join(", ");
}

function statusLabel(devices: IotDeviceResource[]) {
  const activeCount = devices.filter((device) => device.status === "ACTIVE").length;
  if (devices.length === 0) return "No devices";
  return `${activeCount}/${devices.length} active`;
}

function statusClass(devices: IotDeviceResource[]) {
  const activeCount = devices.filter((device) => device.status === "ACTIVE").length;
  if (devices.length === 0) return `${styles.severityPill} ${styles.severityInfo}`;
  if (activeCount === 0) return `${styles.severityPill} ${styles.severityHigh}`;
  if (activeCount < devices.length) return `${styles.severityPill} ${styles.severityWarning}`;
  return `${styles.severityPill} ${styles.severityInfo}`;
}

async function buildPatientIotRow(relation: NutritionistPatientRelation, users: PatientUserSummary[]) {
  const patient = users.find((user) => String(user.id) === String(relation.patientUserId));
  const fallbackName = patient?.fullName || patient?.username || `Patient #${relation.patientUserId}`;

  const [patientName, devices] = await Promise.all([
    getPatientProfileName(relation.patientUserId, fallbackName),
    getPatientIotDevices(relation.patientUserId).catch(() => []),
  ]);

  return {
    patientUserId: relation.patientUserId,
    patientName,
    devices,
  } satisfies PatientIotRow;
}

export function PatientIotAlertsTable({ onNavigate }: PatientIotAlertsTableProps) {
  const { t } = useI18n();
  const [rows, setRows] = useState<PatientIotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadPatientDevices() {
      const sessionUser = getSessionUser();
      setLoading(true);
      setError(null);

      try {
        const nutritionistId = await getNutritionistIdByUser(sessionUser?.id);
        if (!nutritionistId) throw new Error("No active nutritionist profile found.");

        const [relations, users] = await Promise.all([
          getNutritionistPatientRelations(nutritionistId),
          getPatientUserSummaries(),
        ]);

        const acceptedRelations = relations.filter((relation) => relation.accepted);
        const nextRows = await Promise.all(
          acceptedRelations.map((relation) => buildPatientIotRow(relation, users)),
        );

        if (!mounted) return;
        setRows(
          nextRows.sort((first, second) => {
            const firstTime = new Date(latestDeviceSync(first.devices) ?? 0).getTime();
            const secondTime = new Date(latestDeviceSync(second.devices) ?? 0).getTime();
            return secondTime - firstTime;
          }),
        );
      } catch (err) {
        if (!mounted) return;
        setRows([]);
        setError(err instanceof Error ? err.message : "Failed to load patient IoT devices.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadPatientDevices();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className={`${styles.panel} ${styles.panelBorderBlend}`}>
      <div className={styles.panelHeader}>
        <h2 className={`${styles.panelTitle} ${styles.panelTitleSm}`}>
          <span className={styles.panelIcon}>IoT</span>
          {t("dashboard.iot.title")}
        </h2>
        <span className={styles.pill}>{t("dashboard.iot.realDevices")}</span>
      </div>

      {loading && <p className={styles.directoryMessage}>{t("dashboard.iot.loading")}</p>}
      {error && <p className={styles.errorText}>{t("dashboard.iot.unavailable")}: {error}</p>}

      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t("dashboard.iot.patientName")}</th>
              <th>{t("dashboard.iot.devices")}</th>
              <th>{t("dashboard.iot.status")}</th>
              <th>{t("dashboard.iot.lastSync")}</th>
              <th>{t("dashboard.iot.action")}</th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.map((row) => (
              <tr key={row.patientUserId}>
                <td>
                  <div className={styles.personCell}>
                    <span className={styles.avatar}>{getInitials(row.patientName)}</span>
                    <span className={styles.personName}>{row.patientName}</span>
                  </div>
                </td>
                <td>{deviceSummary(row.devices)}</td>
                <td>
                  <span className={statusClass(row.devices)}>
                    {statusLabel(row.devices)}
                  </span>
                </td>
                <td className={styles.muted}>{formatDateTime(latestDeviceSync(row.devices))}</td>
                <td>
                  <button
                    type="button"
                    className={styles.actionLink}
                    onClick={() => onNavigate(`/nutritionist/patients/${row.patientUserId}`)}
                  >
                    {t("dashboard.iot.reviewDevices")}
                  </button>
                </td>
              </tr>
            ))}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5}>{t("dashboard.iot.empty")}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
