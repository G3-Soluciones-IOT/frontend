import { useState } from "react";
import { SharedLayout } from "@/shared/components/layout";
import { navigationConfig } from "@/shared/constants/navigation.config";
import type { ConsultationRequest, ConsultationRequestStatus } from "../../domain/models/ConsultationRequest";
import { useConsultationRequests } from "../hooks/useConsultationRequests";
import styles from "./ConsultationsPage.module.css";

interface ConsultationsPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

type FilterValue = "ALL" | ConsultationRequestStatus;

const filters: { label: string; value: FilterValue }[] = [
  { label: "All Requests", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
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

function MoreIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {direction === "left" ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
    </svg>
  );
}

function PatientAvatar({ request }: { request: ConsultationRequest }) {
  return (
    <span className={`${styles.avatar} ${styles[request.patient.avatarTone]}`}>
      {request.patient.avatarTone === "blue" ? request.patient.initials : <span />}
    </span>
  );
}

function StatusPill({ status }: { status: ConsultationRequestStatus }) {
  const label = status === "PENDING" ? "Pending" : "Confirmed";
  return (
    <span className={`${styles.statusPill} ${status === "PENDING" ? styles.statusPending : styles.statusConfirmed}`}>
      <span />
      {label}
    </span>
  );
}

export function ConsultationsPage({ currentPath, onNavigate }: ConsultationsPageProps) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("ALL");
  const { requests, isLoading, error, approve } = useConsultationRequests(
    activeFilter === "ALL" ? undefined : { status: activeFilter },
  );

  const showingCount = requests.length;

  return (
    <SharedLayout
      title="Communication"
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={navigationConfig.nutritionist}
      breadcrumbs={["Communication", "Consultations"]}
      showPageTitle={false}
    >
      <section className={styles.pageShell}>
        <header className={styles.hero}>
          <h1>Consultation Requests</h1>
          <p>Manage your upcoming patient appointments and requests.</p>
        </header>

        <article className={styles.panel}>
          <div className={styles.filterBar}>
            <div className={styles.filterLabel}>
              <FilterIcon />
              <span>Filter by status</span>
            </div>
            <div className={styles.filterButtons} aria-label="Filter consultation requests by status">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={`${styles.filterButton} ${activeFilter === filter.value ? styles.filterButtonActive : ""}`}
                  onClick={() => setActiveFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Reason for visit</th>
                  <th>Requested date & time</th>
                  <th>Status</th>
                  <th>Actions</th>
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
                          <span>ID: {request.patient.id}</span>
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
                      </div>
                    </td>
                    <td>
                      <StatusPill status={request.status} />
                    </td>
                    <td>
                      <div className={styles.actions}>
                        {request.status === "PENDING" && (
                          <button type="button" className={styles.approveButton} aria-label={`Approve ${request.patient.name}`} onClick={() => approve(request.id)}>
                            <CheckCircleIcon />
                          </button>
                        )}
                        <button type="button" className={styles.moreButton} aria-label={`More actions for ${request.patient.name}`}>
                          <MoreIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {isLoading && <div className={styles.loadingOverlay}>Loading requests...</div>}
          </div>

          <footer className={styles.footer}>
            <p>Showing {showingCount > 0 ? 1 : 0} to {showingCount} of 24 requests</p>
            <nav className={styles.pagination} aria-label="Consultation request pages">
              <button type="button" aria-label="Previous page" disabled>
                <ChevronIcon direction="left" />
              </button>
              <button type="button" className={styles.pageActive}>1</button>
              <button type="button">2</button>
              <button type="button">3</button>
              <span>...</span>
              <button type="button" aria-label="Next page">
                <ChevronIcon direction="right" />
              </button>
            </nav>
          </footer>
        </article>
      </section>
    </SharedLayout>
  );
}
