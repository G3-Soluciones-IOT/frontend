import { useState } from "react";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import { useI18n } from "@/shared/i18n/useI18n";
import type { TranslationKey } from "@/shared/i18n/translations";
import type { ConsultationRequest, ConsultationRequestStatus } from "../../domain/models/ConsultationRequest";
import { useConsultationRequests } from "../hooks/useConsultationRequests";
import styles from "./ConsultationsPage.module.css";

interface ConsultationsPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

type FilterValue = "ALL" | ConsultationRequestStatus;

const filters: { labelKey: TranslationKey; value: FilterValue }[] = [
  { labelKey: "consultations.filter.all", value: "ALL" },
  { labelKey: "consultations.status.requested", value: "REQUESTED" },
  { labelKey: "consultations.status.confirmed", value: "CONFIRMED" },
  { labelKey: "consultations.status.completed", value: "COMPLETED" },
  { labelKey: "consultations.status.cancelled", value: "CANCELLED" },
  { labelKey: "consultations.status.rejected", value: "REJECTED" },
];

function FilterIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.3 2.3 4.9-5.6" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function PatientAvatar({ request }: { request: ConsultationRequest }) {
  return (
    <span className={styles.avatar}>
      {request.patient.initials}
    </span>
  );
}

function StatusPill({ status, t }: { status: ConsultationRequestStatus; t: (key: TranslationKey) => string }) {
  const labels: Record<ConsultationRequestStatus, TranslationKey> = {
    REQUESTED: "consultations.status.requested",
    CONFIRMED: "consultations.status.confirmed",
    REJECTED: "consultations.status.rejected",
    CANCELLED: "consultations.status.cancelled",
    COMPLETED: "consultations.status.completed",
  };
  return (
    <span className={`${styles.statusPill} ${styles[`status${status}`]}`}>
      <span />
      {t(labels[status])}
    </span>
  );
}

export function ConsultationsPage({ currentPath, onNavigate }: ConsultationsPageProps) {
  const { t } = useI18n();
  const [activeFilter, setActiveFilter] = useState<FilterValue>("ALL");
  const { requests, isLoading, error, updatingId, approve, reject, complete, cancel } = useConsultationRequests(
    activeFilter === "ALL" ? undefined : { status: activeFilter },
  );

  const showingCount = requests.length;

  return (
    <SharedLayout
      title={t("consultations.layout.title")}
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={useNavigation()}
      breadcrumbs={[t("consultations.breadcrumb.communication"), t("consultations.breadcrumb.consultations")]}
      showPageTitle={false}
    >
      <section className={styles.pageShell}>
        <header className={styles.hero}>
          <h1>{t("consultations.title")}</h1>
          <p>{t("consultations.description")}</p>
        </header>

        <article className={styles.panel}>
          <div className={styles.filterBar}>
            <div className={styles.filterLabel}>
              <FilterIcon />
              <span>{t("consultations.filter.label")}</span>
            </div>
            <div className={styles.filterButtons} aria-label={t("consultations.filter.aria")}>
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={`${styles.filterButton} ${activeFilter === filter.value ? styles.filterButtonActive : ""}`}
                  onClick={() => setActiveFilter(filter.value)}
                >
                  {t(filter.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t("consultations.table.patient")}</th>
                  <th>{t("consultations.table.reason")}</th>
                  <th>{t("consultations.table.dateTime")}</th>
                  <th>{t("consultations.table.status")}</th>
                  <th>{t("consultations.table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <div className={styles.patientCell}>
                        <PatientAvatar request={request} />
                        <div>
                          <strong>{request.patient.name}</strong>
                          <span>ID: {request.patient.id} - User {request.patient.userId}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.reasonCell}>
                        <strong>{request.reason}</strong>
                        <span>{request.description}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.dateCell}>
                        <strong>{request.requestedDateLabel}</strong>
                        <span>{request.requestedTimeRange}</span>
                        <small>{request.durationMinutes || 0} min</small>
                      </div>
                    </td>
                    <td>
                      <StatusPill status={request.status} t={t} />
                    </td>
                    <td>
                      <div className={styles.actions}>
                        {request.status === "REQUESTED" && (
                          <>
                            <button
                              type="button"
                              className={styles.approveButton}
                              aria-label={`${t("consultations.action.confirm")} ${request.patient.name}`}
                              disabled={updatingId === request.id}
                              onClick={() => approve(request.id)}
                            >
                              <CheckCircleIcon />
                            </button>
                            <button
                              type="button"
                              className={styles.rejectButton}
                              aria-label={`${t("consultations.action.reject")} ${request.patient.name}`}
                              disabled={updatingId === request.id}
                              onClick={() => reject(request.id)}
                            >
                              <XCircleIcon />
                            </button>
                          </>
                        )}
                        {request.status === "CONFIRMED" && (
                          <>
                            <button
                              type="button"
                              className={styles.completeButton}
                              aria-label={`${t("consultations.action.complete")} ${request.patient.name}`}
                              disabled={updatingId === request.id}
                              onClick={() => complete(request.id)}
                            >
                              <ClockIcon />
                            </button>
                            <button
                              type="button"
                              className={styles.rejectButton}
                              aria-label={`${t("consultations.action.cancel")} ${request.patient.name}`}
                              disabled={updatingId === request.id}
                              onClick={() => cancel(request.id)}
                            >
                              <XCircleIcon />
                            </button>
                          </>
                        )}
                        {request.meetingUrl && (
                          <a className={styles.meetingLink} href={request.meetingUrl} target="_blank" rel="noreferrer">
                            {t("consultations.action.link")}
                          </a>
                        )}
                        {request.status !== "REQUESTED" && request.status !== "CONFIRMED" && !request.meetingUrl && (
                          <span className={styles.noAction}>-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!isLoading && requests.length === 0 && (
              <div className={styles.emptyState}>
                <strong>{t("consultations.empty.title")}</strong>
                <span>{t("consultations.empty.description")}</span>
              </div>
            )}

            {isLoading && <div className={styles.loadingOverlay}>{t("consultations.loading")}</div>}
          </div>

          <footer className={styles.footer}>
            <p>{t("consultations.footer.showing")} {showingCount} {showingCount === 1 ? t("consultations.footer.singular") : t("consultations.footer.plural")}</p>
          </footer>
        </article>
      </section>
    </SharedLayout>
  );
}
