import styles from "../../pages/PatientsPages.module.css";

interface PatientPlaceholderTabProps {
  title: string;
  description: string;
}

export function PatientPlaceholderTab({ title, description }: PatientPlaceholderTabProps) {
  return (
    <section className={styles.patientTabPlaceholder}>
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}
