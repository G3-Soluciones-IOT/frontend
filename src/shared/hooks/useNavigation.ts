import { useEffect, useMemo, useState } from "react";
import { navigationConfig } from "@/shared/constants/navigation.config";
import { getStoredLanguage, LANGUAGE_CHANGE_EVENT, type AppLanguage } from "@/shared/i18n/language";

type NavigationRole = keyof typeof navigationConfig;

const navigationTranslations: Record<AppLanguage, Record<string, string>> = {
  English: {},
  Spanish: {
    Dashboard: "Panel",
    Patients: "Pacientes",
    Directory: "Directorio",
    Request: "Solicitudes",
    Communication: "Comunicacion",
    Chat: "Chat",
    Consultations: "Consultas",
    Recommendations: "Recomendaciones",
    "Nutrition Library": "Biblioteca Nutricional",
    Recipes: "Recetas",
    "Meal Plans": "Planes de Comida",
    Analytics: "Analiticas",
    Tracking: "Seguimiento",
    Messages: "Mensajes",
    Appointments: "Citas",
    Management: "Gestion",
    Users: "Usuarios",
    Ingredients: "Ingredientes",
  },
  Portuguese: {
    Dashboard: "Painel",
    Patients: "Pacientes",
    Directory: "Diretorio",
    Request: "Solicitacoes",
    Communication: "Comunicacao",
    Chat: "Chat",
    Consultations: "Consultas",
    Recommendations: "Recomendacoes",
    "Nutrition Library": "Biblioteca Nutricional",
    Recipes: "Receitas",
    "Meal Plans": "Planos Alimentares",
    Analytics: "Analiticas",
    Tracking: "Acompanhamento",
    Messages: "Mensagens",
    Appointments: "Consultas",
    Management: "Gestao",
    Users: "Usuarios",
    Ingredients: "Ingredientes",
  },
};

function toNavigationRole(role: unknown): NavigationRole | null {
  if (role === "ROLE_NUTRITIONIST" || role === "nutritionist") {
    return "nutritionist";
  }

  if (role === "ROLE_PATIENT" || role === "patient") {
    return "patient";
  }

  if (role === "ROLE_ADMIN" || role === "admin") {
    return "admin";
  }

  return null;
}

export function useNavigation() {
  const [language, setLanguage] = useState<AppLanguage>(getStoredLanguage);
  const session =
      typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("session") || "null")
          : null;

  const role = toNavigationRole(session?.user?.roles?.[0] ?? session?.user?.role);
  const items = role ? navigationConfig[role] : navigationConfig.nutritionist;

  useEffect(() => {
    const updateLanguage = () => setLanguage(getStoredLanguage());

    window.addEventListener("storage", updateLanguage);
    window.addEventListener(LANGUAGE_CHANGE_EVENT, updateLanguage);

    return () => {
      window.removeEventListener("storage", updateLanguage);
      window.removeEventListener(LANGUAGE_CHANGE_EVENT, updateLanguage);
    };
  }, []);

  return useMemo(() => {
    const translations = navigationTranslations[language];

    return items.map((item) => ({
      ...item,
      label: translations[item.label] ?? item.label,
    }));
  }, [items, language]);
}
