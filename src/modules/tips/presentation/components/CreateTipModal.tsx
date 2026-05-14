import { useState } from "react";
import { Modal } from "./Modal";
import styles from "../pages/TipsPage.module.css";

interface CreateTipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTipModal({ isOpen, onClose }: CreateTipModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Nutrition");
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Create tip:", { title, category, content });
    setTitle("");
    setContent("");
    onClose();
  };

  const footer = (
    <div className={styles.modalFooterActions}>
      <button type="button" className={styles.secondaryButton} onClick={onClose}>
        Cancel
      </button>
      <button type="button" className={styles.primaryButton} onClick={handleSubmit}>
        Create Tip
      </button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} title="Create New Tip" onClose={onClose} footer={footer}>
      <form className={styles.modalForm} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="tip-title">
            Title
          </label>
          <input
            id="tip-title"
            type="text"
            className={styles.formInput}
            placeholder="Enter tip title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="tip-category">
            Category
          </label>
          <select
            id="tip-category"
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
          <label className={styles.formLabel} htmlFor="tip-content">
            Content
          </label>
          <textarea
            id="tip-content"
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

