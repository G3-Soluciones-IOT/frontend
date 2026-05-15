import type { ReactNode } from "react";
import styles from "./AuthLayout.module.css";
import logo from "@/assets/LogoJameoFit.png";

interface AuthLayoutProps {
  children: ReactNode;
  imageSrc?: string;
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

export function AuthLayout({ children, imageSrc }: AuthLayoutProps) {
  return (
    <div className={styles.authRoot}>
      <aside className={styles.visualPanel} aria-hidden="true">

        {/* Imagen de fondo */}
        {imageSrc && (
          <img src={imageSrc} alt="" className={styles.visualImage} />
        )}

        {/* Overlay oscuro encima de la imagen */}
        <div className={styles.visualOverlay} />

        
      </aside>

      <main className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.formLogo}>
            
              <JameoFitIcon />
        
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}