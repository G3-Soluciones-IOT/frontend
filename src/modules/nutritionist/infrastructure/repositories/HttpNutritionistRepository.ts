import type { NutritionistRepository } from "../../domain/repositories/NutritionistRepository";
import type { ProfessionalProfile } from "../../domain/models/ProfessionalProfile";
import type { UpdateProfessionalProfileInput } from "../../application/dto/UpdateProfessionalProfileInput";
import { nutritionistApi } from "../api/nutritionist.api";

export class HttpNutritionistRepository implements NutritionistRepository {
  async getProfile(): Promise<ProfessionalProfile> {
    const { data } = await nutritionistApi.get<ProfessionalProfile>("/profile");
    return data;
  }

  async updateProfile(input: UpdateProfessionalProfileInput): Promise<ProfessionalProfile> {
    const { data } = await nutritionistApi.put<ProfessionalProfile>("/profile", input);
    return data;
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