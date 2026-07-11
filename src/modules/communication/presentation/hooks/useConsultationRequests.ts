import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { apiUrl } from "@/app/config/env";
import type { ListConsultationRequestsInput } from "../../application/dto/ListConsultationRequestsInput";
import type { ConsultationRequest, ConsultationRequestStatus } from "../../domain/models/ConsultationRequest";

interface AppointmentResponse {
  id: number;
  nutritionistPatientId: number;
  nutritionistId: number;
  nutritionistUserId: number;
  patientUserId: number;
  scheduledAt: string;
  durationMinutes: number;
  status: ConsultationRequestStatus;
  reason?: string | null;
  notes?: string | null;
  meetingUrl?: string | null;
  requestedAt?: string | null;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
}

interface PatientProfileResponse {
  id?: number;
  name?: string | null;
  email?: string | null;
}

const appointmentStatuses: ConsultationRequestStatus[] = [
  "REQUESTED",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
];

const statusActions: Partial<Record<ConsultationRequestStatus, string>> = {
  REQUESTED: "confirm",
  CONFIRMED: "complete",
};

function authHeaders() {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...authHeaders(),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || `HTTP ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-PE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTimeRange(value: string, durationMinutes: number) {
  const start = new Date(value);
  if (Number.isNaN(start.getTime())) return "-";
  const end = new Date(start.getTime() + Math.max(durationMinutes || 0, 0) * 60_000);
  const formatter = new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return durationMinutes > 0 ? `${formatter.format(start)} - ${formatter.format(end)}` : formatter.format(start);
}

function initialsFromName(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || "P";
}

function mapAppointment(appointment: AppointmentResponse, profile?: PatientProfileResponse): ConsultationRequest {
  const patientName = profile?.name?.trim() || `Paciente #${appointment.patientUserId}`;
  const notes = appointment.notes?.trim() || "";
  return {
    id: String(appointment.id),
    numericId: appointment.id,
    nutritionistPatientId: appointment.nutritionistPatientId,
    patient: {
      id: profile?.id ? `#${profile.id}` : `#USR-${appointment.patientUserId}`,
      userId: appointment.patientUserId,
      name: patientName,
      initials: initialsFromName(patientName),
    },
    reason: appointment.reason?.trim() || "Consulta nutricional",
    description: notes || appointment.meetingUrl || "Sin notas adicionales",
    requestedDateLabel: formatDateLabel(appointment.scheduledAt),
    requestedTimeRange: formatTimeRange(appointment.scheduledAt, appointment.durationMinutes),
    durationMinutes: appointment.durationMinutes,
    meetingUrl: appointment.meetingUrl ?? undefined,
    notes,
    status: appointment.status,
  };
}

async function loadPatientProfiles(appointments: AppointmentResponse[]) {
  const uniqueUserIds = Array.from(new Set(appointments.map((appointment) => appointment.patientUserId).filter(Boolean)));
  const entries = await Promise.all(
    uniqueUserIds.map(async (userId) => {
      try {
        const profile = await fetchJson<PatientProfileResponse>(`/api/v1/profiles/by-user/${userId}`);
        return [userId, profile] as const;
      } catch {
        return [userId, undefined] as const;
      }
    }),
  );
  return new Map(entries);
}

export function useConsultationRequests(input?: ListConsultationRequestsInput) {
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const status = input?.status;

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const suffix = params.toString() ? `?${params.toString()}` : "";
      const appointments = await fetchJson<AppointmentResponse[]>(`/api/v1/appointments/me${suffix}`);
      const profilesByUserId = await loadPatientProfiles(appointments);
      const mapped = appointments
        .map((appointment) => mapAppointment(appointment, profilesByUserId.get(appointment.patientUserId)))
        .sort((a, b) => a.requestedDateLabel.localeCompare(b.requestedDateLabel));
      setRequests(mapped);
    } catch (loadError) {
      const fallbackMessage = axios.isAxiosError(loadError)
        ? loadError.response?.data?.message
        : loadError instanceof Error
          ? loadError.message
          : null;
      setRequests([]);
      setError(fallbackMessage || "No se pudieron cargar las consultas.");
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const totals = useMemo(() => {
    return appointmentStatuses.reduce(
      (acc, currentStatus) => {
        acc[currentStatus] = requests.filter((request) => request.status === currentStatus).length;
        return acc;
      },
      { ALL: requests.length } as Record<ConsultationRequestStatus | "ALL", number>,
    );
  }, [requests]);

  const updateAppointment = async (id: string, action: "confirm" | "reject" | "complete" | "cancel") => {
    setUpdatingId(id);
    setError(null);
    try {
      const updated = await fetchJson<AppointmentResponse>(`/api/v1/appointments/${id}/${action}`, {
        method: "PATCH",
      });
      const profilesByUserId = await loadPatientProfiles([updated]);
      const mapped = mapAppointment(updated, profilesByUserId.get(updated.patientUserId));
      setRequests((current) => {
        if (status && mapped.status !== status) return current.filter((request) => request.id !== id);
        return current.map((request) => (request.id === id ? mapped : request));
      });
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : "No se pudo actualizar la consulta.";
      setError(message);
    } finally {
      setUpdatingId(null);
    }
  };

  const approve = (id: string) => updateAppointment(id, "confirm");
  const reject = (id: string) => updateAppointment(id, "reject");
  const complete = (id: string) => updateAppointment(id, "complete");
  const cancel = (id: string) => updateAppointment(id, "cancel");

  return {
    requests,
    isLoading,
    error,
    totals,
    updatingId,
    approve,
    reject,
    complete,
    cancel,
    refresh: loadRequests,
    primaryActionForStatus: (requestStatus: ConsultationRequestStatus) => statusActions[requestStatus],
  };
}
