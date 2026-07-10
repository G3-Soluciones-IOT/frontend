import type { ReactNode } from "react";
import styles from "./AuthLayout.module.css";
import logo from "@/assets/LogoJameoFit.png";

interface AuthLayoutProps {
  children: ReactNode;
  imageSrc?: string;
  variant?: "default" | "wide";
}

function JameoFitIcon() {
  return (
    <img
      src={logo}
      alt="JameoFit Logo"
      width={100}
      height={30}
    />
  );
}

export function AuthLayout({ children, imageSrc, variant = "default" }: AuthLayoutProps) {
  const isWide = variant === "wide";

  return (
    <div className={`${styles.authRoot} ${isWide ? styles.authRootWide : ""}`}>
      <aside className={styles.visualPanel} aria-hidden="true">

        {/* Imagen de fondo */}
        {imageSrc && (
          <img src={imageSrc} alt="" className={styles.visualImage} />
        )}

        {/* Overlay oscuro encima de la imagen */}
        <div className={styles.visualOverlay} />

        
      </aside>

      <main className={`${styles.formPanel} ${isWide ? styles.formPanelWide : ""}`}>
        <div className={`${styles.formCard} ${isWide ? styles.formCardWide : ""}`}>
          <div className={styles.formLogo}>
            
              <JameoFitIcon />
        
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
