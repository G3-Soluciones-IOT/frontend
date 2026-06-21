import type { ProfessionalProfile } from "../../domain/models/ProfessionalProfile";

function getSessionUserId() {
  const session = JSON.parse(localStorage.getItem("session") || "null");
  return session?.user?.id ? String(session.user.id) : "";
}

export function getNutritionistProfileKey(userId = getSessionUserId()) {
  return `nutritionistProfile:${userId}`;
}

export function getNutritionistProfileCompletedKey(userId = getSessionUserId()) {
  return `nutritionistProfileCompleted:${userId}`;
}

export function getStoredNutritionistProfile(userId = getSessionUserId()): ProfessionalProfile | null {
  return JSON.parse(localStorage.getItem(getNutritionistProfileKey(userId)) || "null");
}

export function isStoredNutritionistProfileCompleted(userId = getSessionUserId()) {
  return localStorage.getItem(getNutritionistProfileCompletedKey(userId)) === "true";
}

export function storeNutritionistProfile(profile: ProfessionalProfile) {
  const userId = String(profile.userId || getSessionUserId());
  localStorage.setItem(getNutritionistProfileKey(userId), JSON.stringify(profile));
  localStorage.setItem(getNutritionistProfileCompletedKey(userId), "true");
}

export function clearStoredNutritionistProfile(userId = getSessionUserId()) {
  localStorage.removeItem(getNutritionistProfileKey(userId));
  localStorage.removeItem(getNutritionistProfileCompletedKey(userId));
}
