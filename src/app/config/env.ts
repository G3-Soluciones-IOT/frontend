// Centraliza la configuración de entorno expuesta por Vite.
// Usa la variable VITE_API_BASE_URL desde el archivo `.env` en la raíz
// del proyecto (ej: VITE_API_BASE_URL=https://jameofit.duckdns.org)

const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:3001";

// Normalizamos quitando la barra final para evitar // al concatenar rutas
export const API_BASE_URL = raw.replace(/\/$/, "");

// Función utilitaria para construir URLs absolutas de la API
export function apiUrl(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${p}`;
}

