import { useState } from "react";
import { Modal } from "./Modal";
import styles from "../pages/TipsPage.module.css";

interface EditTipModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipId?: number;
  tipTitle?: string;
  tipCategory?: string;
  tipContent?: string;
}

export function EditTipModal({
  isOpen,
  onClose,
  tipId,
  tipTitle = "",
  tipCategory = "Nutrition",
  tipContent = "",
}: EditTipModalProps) {
  const [title, setTitle] = useState(tipTitle);
  const [category, setCategory] = useState(tipCategory);
  const [content, setContent] = useState(tipContent);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Update tip:", { tipId, title, category, content });
    onClose();
  };

  const footer = (
    <div className={styles.modalFooterActions}>
      <button type="button" className={styles.secondaryButton} onClick={onClose}>
        Cancel
      </button>
      <button type="button" className={styles.primaryButton} onClick={handleSubmit}>
        Update Tip
      </button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} title="Edit Tip" onClose={onClose} footer={footer}>
      <form className={styles.modalForm} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="edit-tip-title">
            Title
          </label>
          <input
            id="edit-tip-title"
            type="text"
            className={styles.formInput}
            placeholder="Enter tip title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="edit-tip-category">
            Category
          </label>
          <select
            id="edit-tip-category"
            className={styles.formSelect}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Nutrition">Nutrition</option>
            <option value="Recovery">Recovery</option>
            <option value="Diet Planning">Diet Planning</option>
            <option value="Wellness">Wellness</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="edit-tip-content">
            Content
          </label>
          <textarea
            id="edit-tip-content"
            className={styles.formTextarea}
            placeholder="Enter tip content..."
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
      </form>
    </Modal>
  );
}

