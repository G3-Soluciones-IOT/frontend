import { SharedLayout } from "@/shared/components/layout";
import { navigationConfig } from "@/shared/constants/navigation.config";
import styles from "./PaymentsPages.module.css";
import { useSubscriptionPlans } from "../hooks/useSubscriptionPlans";
import type { SubscriptionPlan } from "../../domain/models/SubscriptionPlan";

interface PaymentsPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlanCard({ plan }: { plan: SubscriptionPlan }) {
  const billingLabel = plan.billingPeriod === "MONTHLY" ? "/month" : "/year";
  const badgeColor = plan.isPopular ? "transparent" : "#DCE3F2";
  const badgeTextColor = plan.isPopular ? "#10B34C" : "#3D4A3C";

  return (
    <article className={`${styles.card} ${plan.isPopular ? styles.cardPopular : ""}`}>
      {plan.isPopular && <div className={styles.popularBadge}>Most Popular</div>}

      <div className={styles.cardBody}>
        <div className={styles.cardHeader}>
          <span
            className={styles.badgePill}
            style={{
              background: badgeColor,
              color: badgeTextColor,
              fontWeight: "700",
            }}
          >
            {plan.tag}
          </span>
        </div>

        <h3 className={styles.tierHeading}>{plan.name}</h3>

        <div className={styles.priceRow}>
          <div className={styles.priceValue}>
            <span className={styles.priceAmount}>${plan.price}</span>
            <span className={styles.pricePeriod}>{billingLabel}</span>
          </div>
        </div>

        <p className={styles.cardCopy}>{plan.description}</p>

        <ul className={styles.checkList}>
          {plan.features.map((feature) => (
            <li key={feature}>
              <CheckIcon />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className={styles.cardFooter}>
          <button
            type="button"
            className={`${styles.editButton} ${plan.isPopular ? styles.editButtonPrimary : ""}`}
          >
            Edit Plan
          </button>
        </div>
      </div>
    </article>
  );
}

export function PaymentsPage({ currentPath, onNavigate }: PaymentsPageProps) {
  const { plans, isLoading } = useSubscriptionPlans();

  if (isLoading) {
    return (
      <SharedLayout
        title="Plans & Pricing"
        currentPath={currentPath}
        onNavigate={onNavigate}
        navigationItems={navigationConfig.nutritionist}
        breadcrumbs={["Subscriptions"]}
      >
        <div className={styles.headerRow}>
          <div>
            <p className={styles.pageIntro}>Configure your subscription offerings for patients.</p>
          </div>
          <div>
            <button type="button" className={styles.createButton}>
              + Create New Plan
            </button>
          </div>
        </div>
        <div style={{ textAlign: "center", padding: "40px" }}>Loading plans...</div>
      </SharedLayout>
    );
  }

  return (
    <SharedLayout
      title="Plans & Pricing"
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={navigationConfig.nutritionist}
      breadcrumbs={["Subscriptions"]}
    >
      <div className={styles.headerRow}>
        <div>
          <p className={styles.pageIntro}>Configure your subscription offerings for patients.</p>
        </div>

        <div>
          <button type="button" className={styles.createButton}>
            + Create New Plan
          </button>
        </div>
      </div>

      <div className={styles.cardsGrid}>
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </SharedLayout>
  );
}
