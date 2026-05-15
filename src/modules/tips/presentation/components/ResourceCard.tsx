import type { TipResource } from "../../domain/models/Tip";
import styles from "../pages/TipsPage.module.css";

function ResourceBadge({ label }: { label: TipResource["assetLabel"] }) {
  return <span className={styles.mediaBadge}>{label}</span>;
}

interface ResourceCardProps {
  item: TipResource;
}

export function ResourceCard({ item }: ResourceCardProps) {
  return (
    <article className={styles.resourceCard}>
      <div className={`${styles.resourceMedia} ${item.variant === "dark" ? styles.resourceMediaDark : styles.resourceMediaLight}`}>
        <ResourceBadge label={item.assetLabel} />
      </div>
      <div className={styles.resourceBody}>
        <div>
          <h3 className={styles.resourceTitle}>{item.title}</h3>
          <p className={styles.resourceDesc}>{item.description}</p>
        </div>
        <div className={styles.resourceMeta}>
          <span className={styles.metaItem}>↓ {item.downloads}</span>
          <span className={styles.metaItem}>◔ {item.views}</span>
        </div>
      </div>
    </article>
  );
}

