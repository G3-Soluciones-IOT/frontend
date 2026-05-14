import type { Tip } from "../../domain/models/Tip";
import styles from "../pages/TipsPage.module.css";

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

interface TipRowProps {
  tip: Tip;
  onEdit?: () => void;
}

export function TipRow({ tip, onEdit }: TipRowProps) {
  return (
    <tr>
      <td>
        <div className={styles.titleCell}>
          <div className={styles.tipDot} />
          <span>{tip.title}</span>
        </div>
      </td>
      <td>
        <span className={styles.categoryPill}>{tip.category}</span>
      </td>
      <td>
        <span className={`${styles.statusPill} ${tip.status === "Published" ? styles.statusPublished : styles.statusDraft}`}>
          <span className={styles.statusDot} />
          {tip.status}
        </span>
      </td>
      <td className={styles.dateCell}>{tip.date}</td>
      <td>
        <button
          type="button"
          className={styles.actionButton}
          aria-label={`Edit ${tip.title}`}
          onClick={onEdit}
        >
          <EditIcon />
        </button>
      </td>
    </tr>
  );
}

