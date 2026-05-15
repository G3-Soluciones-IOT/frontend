import { useMemo, useState } from "react";
import { SharedLayout } from "@/shared/components/layout";
import { navigationConfig } from "@/shared/constants/navigation.config";
import { useTips } from "../hooks/useTips";
import { TipRow } from "../components/TipRow";
import { ResourceCard } from "../components/ResourceCard";
import { CreateTipModal } from "../components/CreateTipModal";
import { EditTipModal } from "../components/EditTipModal";
import { mockTipResources } from "../../infrastructure/mock/tips.mock";
import styles from "./TipsPage.module.css";

interface TipsPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 16V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 10l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function TipsPage({ currentPath, onNavigate }: TipsPageProps) {
  const { tips, isLoading } = useTips();
  const [query, setQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTipId, setSelectedTipId] = useState<number | undefined>();

  const filteredTips = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) return tips;

    return tips.filter((tip) => {
      const haystack = [tip.title, tip.category, tip.status, tip.date].join(" ").toLowerCase();
      return haystack.includes(normalized);
    });
  }, [query, tips]);

  const totalEntries = tips.length;
  const shownEntries = filteredTips.length;
  const fromEntry = shownEntries > 0 ? 1 : 0;

  if (isLoading) {
    return (
      <SharedLayout
        title="Tips Library"
        currentPath={currentPath}
        onNavigate={onNavigate}
        navigationItems={navigationConfig.nutritionist}
        breadcrumbs={["Content", "Tips"]}
      >
        <div style={{ textAlign: "center", padding: "40px" }}>Loading tips...</div>
      </SharedLayout>
    );
  }

  return (
    <SharedLayout
      title="Tips Library"
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={navigationConfig.nutritionist}
      breadcrumbs={["Content", "Tips"]}
    >
      <div className={styles.pageShell}>
        <div className={styles.heroRow}>
          <div className={styles.heroCopy}>
            <p className={styles.pageIntro}>Manage and publish nutritional guidance and daily tips.</p>
          </div>

          <button type="button" className={styles.createButton} onClick={() => setIsCreateModalOpen(true)}>
            <PlusIcon />
            Create New Tip
          </button>
        </div>

        <div className={styles.contentGrid}>
          <section className={styles.panel}>
            <header className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Recent Tips</h2>

              <div className={styles.toolbar}>
                <div className={styles.searchFieldWrap}>
                  <span className={styles.searchIcon}>
                    <SearchIcon />
                  </span>
                  <input
                    className={styles.searchInput}
                    type="search"
                    placeholder="Search tips..."
                    aria-label="Search tips"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>

                <button type="button" className={styles.filterButton} aria-label="Filter tips">
                  <FilterIcon />
                </button>
              </div>
            </header>

            {shownEntries > 0 ? (
              <>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTips.map((tip) => (
                        <TipRow
                          key={tip.id}
                          tip={tip}
                          onEdit={() => {
                            setSelectedTipId(tip.id);
                            setIsEditModalOpen(true);
                          }}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                <footer className={styles.tableFooter}>
                  <p className={styles.footerText}>
                    Showing {fromEntry} to {shownEntries} of {totalEntries} entries
                  </p>

                  <div className={styles.pager}>
                    <button type="button" className={styles.pagerButton} aria-label="Previous page">
                      <ChevronLeftIcon />
                    </button>
                    <button type="button" className={styles.pagerButton} aria-label="Next page">
                      <ChevronRightIcon />
                    </button>
                  </div>
                </footer>
              </>
            ) : (
              <div className={styles.emptyState}>
                <h3>No tips found</h3>
                <p>Try a different search term or clear the current filter to view the library.</p>
                <button type="button" className={styles.secondaryButton} onClick={() => setQuery("")}>
                  Clear search
                </button>
              </div>
            )}
          </section>

          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <h2 className={styles.panelTitle}>Educational Library</h2>
              <button type="button" className={styles.textButton}>
                View All
              </button>
            </div>

            <div className={styles.resourceStack}>
              {mockTipResources.map((item) => (
                <ResourceCard key={item.id} item={item} />
              ))}

              <button type="button" className={styles.uploadCard}>
                <span className={styles.uploadIcon}>
                  <UploadIcon />
                </span>
                <span className={styles.uploadText}>Upload New Resource</span>
              </button>
            </div>
          </aside>
        </div>
      </div>

      <CreateTipModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

      <EditTipModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} tipId={selectedTipId} />
    </SharedLayout>
  );
}

