import axios from "axios";
import { getAuthSession } from "@/shared/utils/authSession";
import type { NutritionistRepository } from "../../domain/repositories/NutritionistRepository";
import type { ProfessionalProfile } from "../../domain/models/ProfessionalProfile";
import type { UpdateProfessionalProfileInput } from "../../application/dto/UpdateProfessionalProfileInput";
import { nutritionistApi } from "../api/nutritionist.api";
import {
  loadProfileForUser,
  mapUserToProfessionalProfile,
  writeStoredProfileInput,
} from "../mappers/mapUserToProfessionalProfile";

export class HttpNutritionistRepository implements NutritionistRepository {
  async getProfile(): Promise<ProfessionalProfile> {
    try {
      const { data } = await nutritionistApi.get<ProfessionalProfile>("/profile");
      return data;
    } catch (error) {
      if (!axios.isAxiosError(error)) throw error;

      const user = getAuthSession()?.user;
      if (!user) throw new Error("No authenticated user found.");

      return loadProfileForUser(user);
    }
  }

  async updateProfile(input: UpdateProfessionalProfileInput): Promise<ProfessionalProfile> {
    try {
      const { data } = await nutritionistApi.put<ProfessionalProfile>("/profile", input);
      return data;
    } catch (error) {
      if (!axios.isAxiosError(error)) throw error;

      const user = getAuthSession()?.user;
      if (!user) throw new Error("No authenticated user found.");

      writeStoredProfileInput(user.id, input);
      return mapUserToProfessionalProfile(user, input);
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
}