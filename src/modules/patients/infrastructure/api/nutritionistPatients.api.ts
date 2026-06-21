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

export interface UserProfileResource {
  id: number;
  userId?: number | string;
  gender: string;
  height: number;
  weight: number;
  userScore: number;
  birthDate: string;
  activityLevelId: number;
  activityLevelName: string;
  objectiveId: number;
  objectiveName: string;
  allergyNames: string[];
}

export interface MacroResource {
  id?: number;
  calories: number;
  carbs: number;
  proteins: number;
  fats: number;
}

export interface TrackingMealPlanEntryResource {
  id: number;
  recipeId: number;
  mealPlanType: string;
  dayNumber: number;
}

export interface TrackingResource {
  id: number;
  userId: number | string;
  date: string;
  consumedMacros: MacroResource;
  mealPlanEntries: TrackingMealPlanEntryResource[];
}

export interface MacroProgressResource {
  consumed: number;
  target: number;
  percentage: number;
}

export interface TrackingProgressResource {
  calories: MacroProgressResource;
  carbs: MacroProgressResource;
  proteins: MacroProgressResource;
  fats: MacroProgressResource;
}

export interface TrackingGoalResource {
  id: number;
  userId: number | string;
  targetMacros: MacroResource;
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

export async function getUserProfiles() {
  const endpoint = "/api/v1/user-profiles";

  try {
    const response = await fetch(apiUrl(endpoint), {
      headers: authHeaders(),
    });
    return await readJson<UserProfileResource[]>(response);
  } catch (error) {
    if (API_BASE_URL.includes("localhost:3001")) {
      const response = await fetch(apiUrl("/userProfiles"));
      if (!response.ok) return [] as UserProfileResource[];
      return readJson<UserProfileResource[]>(response);
    }

    throw error;
  }
}

function buildProgressFromTrackingAndGoal(tracking?: TrackingResource, goal?: TrackingGoalResource): TrackingProgressResource | null {
  if (!tracking?.consumedMacros || !goal?.targetMacros) return null;

  const buildMetric = (consumed: number, target: number): MacroProgressResource => ({
    consumed,
    target,
    percentage: target > 0 ? Number(((consumed / target) * 100).toFixed(2)) : 0,
  });

  return {
    calories: buildMetric(tracking.consumedMacros.calories, goal.targetMacros.calories),
    carbs: buildMetric(tracking.consumedMacros.carbs, goal.targetMacros.carbs),
    proteins: buildMetric(tracking.consumedMacros.proteins, goal.targetMacros.proteins),
    fats: buildMetric(tracking.consumedMacros.fats, goal.targetMacros.fats),
  };
}

export async function getTrackingByUser(userId: number | string) {
  const endpoint = `/api/v1/tracking/user/${userId}`;

  try {
    const response = await fetch(apiUrl(endpoint), {
      headers: authHeaders(),
    });
    return await readJson<TrackingResource>(response);
  } catch (error) {
    if (API_BASE_URL.includes("localhost:3001")) {
      const params = new URLSearchParams({ userId: String(userId) });
      const response = await fetch(apiUrl(`/trackings?${params.toString()}`));
      const items = await readJson<TrackingResource[]>(response);
      return items[0] ?? null;
    }

    throw error;
  }
}

export async function getTrackingGoalByUser(userId: number | string) {
  const endpoint = `/api/v1/tracking-goals/user/${userId}`;

  try {
    const response = await fetch(apiUrl(endpoint), {
      headers: authHeaders(),
    });
    return await readJson<TrackingGoalResource>(response);
  } catch (error) {
    if (API_BASE_URL.includes("localhost:3001")) {
      const params = new URLSearchParams({ userId: String(userId) });
      const response = await fetch(apiUrl(`/trackingGoals?${params.toString()}`));
      const items = await readJson<TrackingGoalResource[]>(response);
      return items[0] ?? null;
    }

    throw error;
  }
}

export async function getTrackingProgressByUser(userId: number | string) {
  const endpoint = `/api/v1/tracking/user/${userId}/progress`;

  try {
    const response = await fetch(apiUrl(endpoint), {
      headers: authHeaders(),
    });
    return await readJson<TrackingProgressResource>(response);
  } catch (error) {
    if (API_BASE_URL.includes("localhost:3001")) {
      const params = new URLSearchParams({ userId: String(userId) });
      const response = await fetch(apiUrl(`/trackingProgress?${params.toString()}`));

      if (response.ok) {
        const items = await readJson<Array<TrackingProgressResource & { userId?: number | string }>>(response);
        if (items[0]) return items[0];
      }

      const [tracking, goal] = await Promise.all([
        getTrackingByUser(userId),
        getTrackingGoalByUser(userId),
      ]);
      return buildProgressFromTrackingAndGoal(tracking ?? undefined, goal ?? undefined);
    }

    throw error;
  }
}

export async function getMealPlanEntriesByTracking(trackingId: number | string) {
  const endpoint = `/api/v1/meal-plan-entries/tracking/${trackingId}`;

  try {
    const response = await fetch(apiUrl(endpoint), {
      headers: authHeaders(),
    });
    return await readJson<TrackingMealPlanEntryResource[]>(response);
  } catch (error) {
    if (API_BASE_URL.includes("localhost:3001")) {
      const params = new URLSearchParams({ trackingId: String(trackingId) });
      const response = await fetch(apiUrl(`/mealPlanEntries?${params.toString()}`));
      if (!response.ok) return [] as TrackingMealPlanEntryResource[];
      return readJson<TrackingMealPlanEntryResource[]>(response);
    }

    throw error;
  }
}

export async function getConsumedMacrosByTracking(trackingId: number | string) {
  const endpoint = `/api/v1/macronutrients/consumed/tracking/${trackingId}`;

  try {
    const response = await fetch(apiUrl(endpoint), {
      headers: authHeaders(),
    });
    return await readJson<MacroResource>(response);
  } catch (error) {
    if (API_BASE_URL.includes("localhost:3001")) {
      const params = new URLSearchParams({ trackingId: String(trackingId) });
      const response = await fetch(apiUrl(`/consumedMacronutrients?${params.toString()}`));
      if (!response.ok) return null;
      const items = await readJson<Array<MacroResource & { trackingId?: number | string }>>(response);
      return items[0] ?? null;
    }

    throw error;
  }
}
