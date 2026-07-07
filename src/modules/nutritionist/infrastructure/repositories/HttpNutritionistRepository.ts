import type { NutritionistRepository } from "../../domain/repositories/NutritionistRepository";
import type { ProfessionalProfile } from "../../domain/models/ProfessionalProfile";
import type { CreateProfessionalProfileInput } from "../../application/dto/CreateProfessionalProfileInput";
import type { UpdateProfessionalProfileInput } from "../../application/dto/UpdateProfessionalProfileInput";
import { nutritionistApi } from "../api/nutritionist.api";
import { API_BASE_URL, apiUrl } from "@/app/config/env";
import axios from "axios";

export class HttpNutritionistRepository implements NutritionistRepository {
  async getProfile(): Promise<ProfessionalProfile> {
    const session = JSON.parse(localStorage.getItem("session") || "null");
    const userId = session?.user?.id;
    const { data } = await nutritionistApi.get<ProfessionalProfile>(
      `/by-user?userId=${encodeURIComponent(String(userId))}`,
    );
    return data;
  }

  async createProfile(input: CreateProfessionalProfileInput): Promise<ProfessionalProfile> {
    if (API_BASE_URL.includes("localhost:3001")) {
      return this._createProfileInJsonServer(input);
    }

    try {
      const { data } = await nutritionistApi.post<ProfessionalProfile>("", input);
      return data;
    } catch (error) {
      if (!axios.isAxiosError(error) || error.response?.status !== 404 || !API_BASE_URL.includes("localhost:3001")) {
        throw error;
      }

      return this._createProfileInJsonServer(input);
    }
  }

  async updateProfile(input: UpdateProfessionalProfileInput): Promise<ProfessionalProfile> {
    const { id, ...body } = input;
    if (API_BASE_URL.includes("localhost:3001")) {
      return this._upsertProfileInJsonServer(id, body);
    }

    try {
      const { data } = await nutritionistApi.put<ProfessionalProfile>(`/${id}`, body);
      return data;
    } catch (error) {
      if (!axios.isAxiosError(error) || error.response?.status !== 404 || !API_BASE_URL.includes("localhost:3001")) {
        throw error;
      }

      return this._upsertProfileInJsonServer(id, body);
    }
  }

  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const form = new FormData();
    form.append("avatar", file);
    const { data } = await nutritionistApi.post<{ avatarUrl: string }>("/profile/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  }

  async uploadCertification(file: File): Promise<{ fileUrl: string }> {
    const form = new FormData();
    form.append("certification", file);
    const { data } = await nutritionistApi.post<{ fileUrl: string }>("/profile/certification", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  }

  private async _upsertProfileInJsonServer(
    id: number | string,
    body: Omit<UpdateProfessionalProfileInput, "id">
  ): Promise<ProfessionalProfile> {
    const profile: ProfessionalProfile = {
      id,
      userId: id,
      licenseNumber: "",
      specialty: "",
      ...body,
    };

    const updateResponse = await fetch(apiUrl(`/nutritionists/${id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    if (updateResponse.ok) {
      return updateResponse.json();
    }

    const createResponse = await fetch(apiUrl("/nutritionists"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    if (!createResponse.ok) {
      throw new Error("Failed to save nutritionist profile.");
    }

    return createResponse.json();
  }

  private async _createProfileInJsonServer(input: CreateProfessionalProfileInput): Promise<ProfessionalProfile> {
    const profile: Omit<ProfessionalProfile, "id"> = {
      ...input,
    };

    const createResponse = await fetch(apiUrl("/nutritionists"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    if (!createResponse.ok) {
      throw new Error("Failed to create nutritionist profile.");
    }

    return createResponse.json();
  }
}
