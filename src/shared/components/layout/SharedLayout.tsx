import { useEffect, useState, type ReactNode } from "react";
import logo from "@/assets/LogoJameoFit.png";
import styles from "./SharedLayout.module.css";
import { Topbar } from "./Topbar";
import { getStoredNutritionistProfile } from "@/modules/nutritionist/infrastructure/storage/nutritionistProfileStorage";
import { getStoredLanguage, LANGUAGE_CHANGE_EVENT, type AppLanguage } from "@/shared/i18n/language";

export interface NavigationItem {
  label: string;
  href?: string;
  icon: ReactNode;
  group?: "root" | string;
}

export interface SharedLayoutProps {
  children: ReactNode;
  title: string;
  currentPath: string;
  onNavigate: (href: string) => void;
  navigationItems: NavigationItem[];
  breadcrumbs?: string[];
  topbarTabs?: {
    label: string;
    href: string;
    active?: boolean;
  }[];
  showPageTitle?: boolean;
  userInitials?: string;
  userAvatarUrl?: string;
  onSettingsClick?: () => void;
  onNotificationsClick?: () => void;
  onProfileClick?: () => void;
  onLogout?: () => void;
}

const logoutLabels: Record<AppLanguage, string> = {
  English: "Log Out",
  Spanish: "Salir",
  Portuguese: "Sair",
};

const layoutTranslations: Record<AppLanguage, Record<string, string>> = {
  English: {},
  Spanish: {
    Dashboard: "Panel",
    Overview: "Resumen",
    "Recent Logs": "Registros Recientes",
    Patients: "Pacientes",
    "Patient Directory": "Directorio de Pacientes",
    "Patients Overview": "Resumen de Pacientes",
    "Patient Requests": "Solicitudes de Pacientes",
    Directory: "Directorio",
    Requests: "Solicitudes",
    Request: "Solicitudes",
    Communication: "Comunicacion",
    Chat: "Chat",
    Consultations: "Consultas",
    Recommendations: "Recomendaciones",
    Nutritionist: "Nutricionista",
    Recipes: "Recetas",
    "Meal Plans": "Planes de Comida",
    Analytics: "Analiticas",
    Notifications: "Notificaciones",
    "Account Settings": "Configuracion de Cuenta",
    "My Profile": "Mi Perfil",
    Subscriptions: "Suscripciones",
    "Plans & Pricing": "Planes y Precios",
    Content: "Contenido",
    Tips: "Consejos",
    "Tips Library": "Biblioteca de Consejos",
    Admin: "Admin",
    Management: "Gestion",
    Users: "Usuarios",
    "User Details": "Detalles de Usuario",
    "Edit User": "Editar Usuario",
    "Create User": "Crear Usuario",
    New: "Nuevo",
    Edit: "Editar",
  },
  Portuguese: {
    Dashboard: "Painel",
    Overview: "Resumo",
    "Recent Logs": "Registros Recentes",
    Patients: "Pacientes",
    "Patient Directory": "Diretorio de Pacientes",
    "Patients Overview": "Resumo de Pacientes",
    "Patient Requests": "Solicitacoes de Pacientes",
    Directory: "Diretorio",
    Requests: "Solicitacoes",
    Request: "Solicitacoes",
    Communication: "Comunicacao",
    Chat: "Chat",
    Consultations: "Consultas",
    Recommendations: "Recomendacoes",
    Nutritionist: "Nutricionista",
    Recipes: "Receitas",
    "Meal Plans": "Planos Alimentares",
    Analytics: "Analiticas",
    Notifications: "Notificacoes",
    "Account Settings": "Configuracoes da Conta",
    "My Profile": "Meu Perfil",
    Subscriptions: "Assinaturas",
    "Plans & Pricing": "Planos e Precos",
    Content: "Conteudo",
    Tips: "Dicas",
    "Tips Library": "Biblioteca de Dicas",
    Admin: "Admin",
    Management: "Gestao",
    Users: "Usuarios",
    "User Details": "Detalhes do Usuario",
    "Edit User": "Editar Usuario",
    "Create User": "Criar Usuario",
    New: "Novo",
    Edit: "Editar",
  },
};

function translateLayoutText(text: string, language: AppLanguage) {
  return layoutTranslations[language][text] ?? text;
}

function isActive(currentPath: string, href?: string) {
  if (!href) return false;
  if (currentPath === href) return true;
  if (href === "/nutritionist") {
    return currentPath.startsWith("/nutritionist/recent-logs");
  }
  if (href === "/nutritionist/patients") {
    return currentPath === "/nutritionist/patients" || currentPath === "/nutritionist/patients/overview";
  }
  if (href === "/nutritionist/patients/request") {
    return currentPath.startsWith("/nutritionist/patients/request");
  }
  // Si es un padre, marca como activo si el currentPath comienza con ese href
  if (href === "/patients" || href === "/content") {
    return currentPath.startsWith(href);
  }
  if (href === "/nutritionist/subscriptions") {
    return currentPath.startsWith(href);
  }
  if (href.startsWith("/admin/")) {
    return currentPath.startsWith(href);
  }
  return false;
}

function LogOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function SharedLayout({
  children,
  title,
  currentPath,
  onNavigate,
  navigationItems,
  breadcrumbs = [],
  topbarTabs = [],
  showPageTitle = true,
  userInitials = "SJ",
  userAvatarUrl,
  onSettingsClick,
  onNotificationsClick,
  onProfileClick,
  onLogout,
}: SharedLayoutProps) {
  const [language, setLanguage] = useState<AppLanguage>(getStoredLanguage);
  const storedProfile =
    typeof window !== "undefined"
      ? getStoredNutritionistProfile()
      : null;
  const resolvedAvatarUrl = userAvatarUrl ?? storedProfile?.profilePictureUrl;

  useEffect(() => {
    const updateLanguage = () => setLanguage(getStoredLanguage());

    window.addEventListener("storage", updateLanguage);
    window.addEventListener(LANGUAGE_CHANGE_EVENT, updateLanguage);

    return () => {
      window.removeEventListener("storage", updateLanguage);
      window.removeEventListener(LANGUAGE_CHANGE_EVENT, updateLanguage);
    };
  }, []);

  const translatedTitle = translateLayoutText(title, language);
  const translatedBreadcrumbs = breadcrumbs.map((breadcrumb) => translateLayoutText(breadcrumb, language));
  const translatedTabs = topbarTabs.map((tab) => ({
    ...tab,
    label: translateLayoutText(tab.label, language),
  }));

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }

    localStorage.removeItem("accessToken");
    onNavigate("/sign-in");
  };

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.logoWrap}>
          <img src={logo} alt="JameoFit" className={styles.logo} />
        </div>

        <nav className={styles.nav} aria-label="Main navigation">
          {navigationItems.map((item) => {
            const active = isActive(currentPath, item.href);
            const nested = item.group && item.group !== "root";
            const clickable = Boolean(item.href);

            if (!clickable) {
              return (
                <div
                  key={`${item.group ?? "root"}-${item.label}`}
                  className={`${styles.navItem} ${styles.navItemStatic} ${nested ? styles.navItemNested : ""}`}
                  title={item.label}
                >
                  {nested ? <span className={styles.navSpacer} /> : item.icon}
                  <span>{item.label}</span>
                </div>
              );
            }

            return (
              <button
                key={item.href}
                type="button"
                className={`${styles.navItem} ${active ? styles.navItemActive : ""} ${nested ? styles.navItemNested : ""}`}
                onClick={() => item.href && onNavigate(item.href)}
                title={item.label}
              >
                {nested ? <span className={styles.navSpacer} /> : item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <button type="button" className={styles.logoutButton} onClick={handleLogout} aria-label={logoutLabels[language]}>
            <LogOutIcon />
            <span>{logoutLabels[language]}</span>
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <Topbar
          title={translatedTitle}
          breadcrumbs={translatedBreadcrumbs}
          tabs={translatedTabs}
          userInitials={userInitials}
          userAvatarUrl={resolvedAvatarUrl}
          onSettingsClick={onSettingsClick ?? (() => onNavigate("/account-settings"))}
          onNotificationsClick={onNotificationsClick ?? (() => onNavigate("/notifications"))}
          onProfileClick={onProfileClick}
          onNavigate={onNavigate}
          styles={styles}
        />

        <section className={styles.content}>
          {showPageTitle && <h1 className={styles.pageTitle}>{translatedTitle}</h1>}
          {children}
        </section>
      </main>
    </div>
  );
}
