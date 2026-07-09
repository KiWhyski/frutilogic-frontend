<script>
export default {
  name: "PlanItem",
  props: {
    plan: {
      type: Object,
      required: true,
    },
    currentPlanId: { type: String, required: false },
    currentTier: { type: Number, default: -1 },
  },
  computed: {
    catalogKey() {
      return this.plan.catalogKey || "free";
    },
    cardMessages() {
      return this.$tm(`plans-page.cards.${this.catalogKey}`) || {};
    },
    /** Precio desde el API; texto i18n para “Gratis” / “al mes”. */
    formattedPrice() {
      const p = this.plan.price;
      if (!Number.isFinite(Number(p)) || Number(p) === 0) {
        return this.$t("plans-page.price-free");
      }
      const currency = this.plan.currency || "PEN";
      return Number(p).toLocaleString("es-PE", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },
    priceLine() {
      if (this.formattedPrice === this.$t("plans-page.price-free")) {
        return this.formattedPrice;
      }
      const freq = String(this.plan.planType || "").toLowerCase() === "enterprise"
        ? this.$t("plans-page.per-year")
        : this.$t("plans-page.per-month");
      return `${this.formattedPrice} ${freq}`;
    },
    displayTitle() {
      return this.cardMessages.title || this.plan.description || this.plan.planType || "";
    },
    featureList() {
      const m = this.cardMessages;
      const fromI18n = m && Array.isArray(m.features) ? [...m.features] : [];
      if (this.plan.maxWarehouses != null) {
        fromI18n.unshift(this.$t("plans-page.feature-warehouses", { n: this.plan.maxWarehouses }));
      }
      if (this.plan.maxProducts != null) {
        fromI18n.unshift(this.$t("plans-page.feature-products", { n: this.plan.maxProducts }));
      }
      return fromI18n;
    },
    isCurrentPlan() {
      return this.plan.planId === this.currentPlanId;
    },
    /** No permitir bajar de plan (ej. de Estándar a Esencial). */
    isDowngradeBlocked() {
      if (this.currentTier < 0) return false;
      return this.plan.tier < this.currentTier;
    },
    buttonDisabled() {
      return this.isCurrentPlan || this.isDowngradeBlocked;
    },
    buttonLabel() {
      if (this.isCurrentPlan) return this.$t("plans-page.btn-current");
      if (this.isDowngradeBlocked) return this.$t("plans-page.btn-unavailable");
      return this.$t("plans-page.btn-subscribe");
    },
  },
  methods: {
    choosePlan() {
      if (!this.buttonDisabled) {
        this.$emit("choose", this.plan.planId);
      }
    },
  },
};
</script>

<template>
  <article class="plan-card">
    <header class="plan-card__head">
      <h2 class="plan-card__title">{{ displayTitle }}</h2>
      <p class="plan-card__price">{{ priceLine }}</p>
      <p class="plan-card__units">{{ cardMessages.unitsLine }}</p>
      <p class="plan-card__billing">{{ cardMessages.billingLine }}</p>
    </header>

    <hr class="plan-card__rule" />

    <ul class="plan-card__features">
      <li v-for="(line, idx) in featureList" :key="idx">
        <i class="pi pi-check plan-card__check" aria-hidden="true"></i>
        <span>{{ line }}</span>
      </li>
    </ul>

    <footer class="plan-card__foot">
      <button
        type="button"
        class="plan-card__btn"
        :disabled="buttonDisabled"
        @click="choosePlan"
      >
        {{ buttonLabel }}
      </button>
    </footer>
  </article>
</template>

<style scoped>
.plan-card {
  /* Mismo verde global que perfil / dashboard (--app-green-accent) */
  --plan-green: var(--app-green-accent, #16a34a);
  --plan-green-hover: var(--app-green-accent-hover, #15803d);
  --plan-border: rgba(22, 163, 74, 0.2);
  --plan-text: #111111;

  background: #ffffff;
  width: 100%;
  max-width: 440px;
  margin: 0 auto;
  padding: 2rem 2.25rem 1.75rem;
  border-radius: 22px;
  border: 1px solid var(--plan-border);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 8px 24px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    "Helvetica Neue",
    Arial,
    sans-serif;
}

.plan-card__head {
  text-align: left;
}

.plan-card__title {
  margin: 0 0 0.75rem;
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--plan-green);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.plan-card__price {
  margin: 0 0 0.35rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--plan-green);
  line-height: 1.35;
}

.plan-card__units {
  margin: 0 0 0.35rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--plan-text);
  line-height: 1.4;
}

.plan-card__billing {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 400;
  color: var(--plan-text);
  line-height: 1.45;
}

.plan-card__rule {
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  margin: 1.25rem 0 1.15rem;
}

.plan-card__features {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
}

.plan-card__features li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.65rem;
  font-size: 0.9375rem;
  font-weight: 400;
  color: var(--plan-text);
  line-height: 1.45;
}

.plan-card__features li:last-child {
  margin-bottom: 0;
}

.plan-card__check {
  flex-shrink: 0;
  margin-top: 0.15rem;
  font-size: 0.85rem;
  color: var(--plan-green);
}

.plan-card__foot {
  margin-top: 1.5rem;
  padding-top: 0.25rem;
}

.plan-card__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 9rem;
  padding: 0.55rem 1.5rem;
  border: none;
  border-radius: 999px;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: #ffffff;
  background: var(--plan-green);
  cursor: pointer;
  transition:
    background 0.2s ease,
    opacity 0.2s ease,
    transform 0.1s ease;
}

.plan-card__btn:hover:not(:disabled) {
  background: var(--plan-green-hover);
}

.plan-card__btn:active:not(:disabled) {
  transform: scale(0.98);
}

.plan-card__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
