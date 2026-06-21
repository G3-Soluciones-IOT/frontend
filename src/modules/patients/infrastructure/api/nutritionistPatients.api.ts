import { API_BASE_URL, apiUrl } from "@/app/config/env";

export interface NutritionistPatientRelation {
  id: number;
  nutritionistId: number;
  patientUserId: number;
  serviceType: string;
  startDate?: string;
  scheduledAt?: string;
  accepted: boolean;
  requestedAt?: string;
}

export interface PatientUserSummary {
  id: number | string;
  username?: string;
  fullName?: string;
  email?: string;
}

function authHeaders() {
  const token = localStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function localRelationsByNutritionist(nutritionistId: number | string) {
  const params = new URLSearchParams({ nutritionistId: String(nutritionistId) });
  const response = await fetch(apiUrl(`/nutritionistPatients?${params.toString()}`));
  return readJson<NutritionistPatientRelation[]>(response);
}

async function localApproveRelation(id: number) {
  const currentResponse = await fetch(apiUrl(`/nutritionistPatients/${id}`));
  const current = await readJson<NutritionistPatientRelation>(currentResponse);

  const response = await fetch(apiUrl(`/nutritionistPatients/${id}`), {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ ...current, accepted: true }),
  });

  await readJson<NutritionistPatientRelation>(response);
}

async function localDeleteRelation(id: number) {
  const response = await fetch(apiUrl(`/nutritionistPatients/${id}`), {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}

export async function getNutritionistPatientRelations(nutritionistId: number | string) {
  const endpoint = `/api/v1/nutritionist-patients/nutritionist/${nutritionistId}`;

  try {
    const response = await fetch(apiUrl(endpoint), {
      headers: authHeaders(),
    });
    return await readJson<NutritionistPatientRelation[]>(response);
  } catch (error) {
    if (API_BASE_URL.includes("localhost:3001")) {
      return localRelationsByNutritionist(nutritionistId);
    }

    throw error;
  }
}

export async function approveNutritionistPatientRelation(id: number) {
  const endpoint = `/api/v1/nutritionist-patients/${id}/approve`;

  try {
    const response = await fetch(apiUrl(endpoint), {
      method: "PUT",
      headers: authHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    if (API_BASE_URL.includes("localhost:3001")) {
      await localApproveRelation(id);
      return;
    }

    throw error;
  }
}

export async function deleteNutritionistPatientRelation(id: number) {
  const endpoint = "/api/v1/nutritionist-patients";

  try {
    const response = await fetch(apiUrl(endpoint), {
      method: "DELETE",
      headers: authHeaders(),
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    if (API_BASE_URL.includes("localhost:3001")) {
      await localDeleteRelation(id);
      return;
    }

    throw error;
  }
}

export async function getPatientUserSummaries() {
  if (!API_BASE_URL.includes("localhost:3001")) {
    return [] as PatientUserSummary[];
  }

  const response = await fetch(apiUrl("/users"));
  return readJson<PatientUserSummary[]>(response);
}
