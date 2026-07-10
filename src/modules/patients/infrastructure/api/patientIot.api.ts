import { apiUrl } from "@/app/config/env";

export interface IotDeviceResource {
  deviceId: string;
  userId: number;
  deviceType: "SMART_BOTTLE" | "SMART_SCALE" | string;
  status: "ACTIVE" | "INACTIVE" | string;
  registeredAt: string;
  lastSeenAt: string;
}

export interface HydrationSummaryResource {
  userId: number;
  date: string;
  totalMl: number;
  goalMl: number;
  progressPercentage: number;
  goalReached: boolean;
}

export interface HydrationRecordResource {
  id: number;
  userId: number;
  deviceId: string;
  amountMl: number;
  totalMl: number;
  goalMl: number;
  progressPercentage: number;
  goalReached: boolean;
  recordedAt: string;
}

export interface WeightMeasurementResource {
  id: number;
  userId: number;
  deviceId: string;
  grams: number;
  measurementType: string;
  recordedAt: string;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("accessToken");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function fetchIotJson<T>(path: string): Promise<T> {
  const response = await fetch(apiUrl(path), {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getPatientIotDevices(userId: number | string) {
  return fetchIotJson<IotDeviceResource[]>(`/api/v1/iot/devices/${userId}`);
}

export function getPatientHydrationSummary(userId: number | string, date: string) {
  return fetchIotJson<HydrationSummaryResource>(
    `/api/v1/iot/hydration/${userId}/summary?date=${encodeURIComponent(date)}`,
  );
}

export function getPatientHydrationHistory(userId: number | string, date: string) {
  return fetchIotJson<HydrationRecordResource[]>(
    `/api/v1/iot/hydration/${userId}?date=${encodeURIComponent(date)}`,
  );
}

export function getPatientLatestWeightMeasurement(userId: number | string) {
  return fetchIotJson<WeightMeasurementResource>(`/api/v1/iot/weight/${userId}/latest`);
}

export function getPatientWeightHistory(userId: number | string, from: string, to: string) {
  const params = new URLSearchParams({ from, to });
  return fetchIotJson<WeightMeasurementResource[]>(`/api/v1/iot/weight/${userId}/history?${params.toString()}`);
}
