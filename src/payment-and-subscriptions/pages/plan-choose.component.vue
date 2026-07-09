<script>
import { PlanService } from "@/payment-and-subscriptions/services/plan.service.js";
import PlanList from "@/payment-and-subscriptions/components/plan-list.component.vue";
import { SubscriptionService } from "@/payment-and-subscriptions/services/subscription.service.js";
import SideNavbar from "@/public/components/side-navbar.vue";
import ToolbarContent from "@/public/components/toolbar-content.component.vue";
import { useAuthenticationStore } from "@/authentication/services/authentication.store.js";

/** UI catalog slots mapped by API planType (not array index). */
const CATALOG_BY_TYPE = {
  Free: { catalogKey: "free", tier: 0 },
  Premium: { catalogKey: "premium", tier: 1 },
  Enterprise: { catalogKey: "enterprise", tier: 2 },
};

export default {
  name: "payment-choose",
  components: { PlanList, SideNavbar, ToolbarContent },
  data() {
    return {
      displayPlans: [],
      currentPlanId: null,
      currentSubscriptionId: null,
      currentPlanType: null,
      error: null,
      loading: false,
      checkoutLoading: false,
    };
  },
  computed: {
    currentTier() {
      const row = this.displayPlans.find((p) => p.planId === this.currentPlanId);
      if (row) return row.tier;
      const byType = CATALOG_BY_TYPE[this.currentPlanType];
      return byType ? byType.tier : -1;
    },
  },
  methods: {
    mapApiPlan(raw) {
      const planType = raw.planType ?? raw.PlanType ?? "Free";
      const slot = CATALOG_BY_TYPE[planType] || CATALOG_BY_TYPE.Free;
      return {
        planId: raw.planId ?? raw.PlanId ?? raw.id ?? raw.Id,
        planType,
        description: raw.description ?? raw.Description ?? "",
        price: Number(raw.price ?? raw.Price ?? raw.amount ?? 0),
        currency: raw.currency ?? raw.Currency ?? "PEN",
        maxProducts: raw.maxProducts ?? raw.MaxProducts,
        maxWarehouses: raw.maxWarehouses ?? raw.MaxWarehouses,
        maxUsers: raw.maxUsers ?? raw.MaxUsers,
        catalogKey: slot.catalogKey,
        tier: slot.tier,
      };
    },

    async getAllPlans() {
      this.error = null;
      try {
        const planService = new PlanService();
        const data = await planService.getAllPlans();
        const list = Array.isArray(data) ? data : [];
        this.displayPlans = list
          .map((p) => this.mapApiPlan(p))
          .filter((p) => p.planId)
          .sort((a, b) => a.tier - b.tier);
      } catch (error) {
        this.error = this.$t("plans-page.load-error");
        console.error(error);
        this.displayPlans = [];
      }
    },

    async checkCurrentPlanAndLoad() {
      this.loading = true;
      try {
        const authStore = useAuthenticationStore();
        const accountId = authStore.currentAccountId || localStorage.getItem("accountId");
        if (accountId) {
          const subscriptionService = new SubscriptionService();
          try {
            const data = await subscriptionService.getCurrentSubscription(accountId);
            this.currentPlanId = data?.planId ?? data?.PlanId ?? null;
            this.currentSubscriptionId = data?.subscriptionId ?? data?.SubscriptionId ?? null;
            this.currentPlanType = data?.planType ?? data?.PlanType ?? null;
          } catch (error) {
            if (error?.response?.status !== 404) {
              console.warn("No active subscription yet:", error);
            }
          }
        }
      } finally {
        await this.getAllPlans();
        this.loading = false;
      }
    },

    async subscribeToPlan(planId) {
      this.error = null;
      this.checkoutLoading = true;
      try {
        const authStore = useAuthenticationStore();
        const accountId = authStore.currentAccountId || localStorage.getItem("accountId");
        if (!accountId) {
          this.error = this.$t("plans-page.no-account");
          return;
        }

        const subscriptionService = new SubscriptionService();
        const data = await subscriptionService.startCheckout(planId, accountId);
        const initPoint = data?.initPoint ?? data?.InitPoint;

        if (initPoint) {
          window.location.href = initPoint;
          return;
        }

        // Free plan activated without Mercado Pago redirect
        this.$router?.push({ name: "Dashboard" });
      } catch (err) {
        console.error("Error subscribing to plan:", err);
        this.error =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          this.$t("plans-page.checkout-error");
      } finally {
        this.checkoutLoading = false;
      }
    },
  },
  created() {
    this.checkCurrentPlanAndLoad();
  },
};
</script>

<template>
  <div class="plan-page-bg">
    <side-navbar />
    <div class="plan-page-main">
      <toolbar-content :page-title="$t('toolbar.plans')" />
      <div class="plan-list-wrapper">
        <p v-if="error" class="plan-page-error" role="alert">{{ error }}</p>
        <p v-if="checkoutLoading" class="plan-page-loading">{{ $t("plans-page.redirecting") }}</p>
        <plan-list
          v-if="!loading"
          :plans="displayPlans"
          :current-plan-id="currentPlanId"
          :current-tier="currentTier"
          @choose="subscribeToPlan"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.plan-page-bg {
  display: flex;
  min-height: 100vh;
  width: 100%;
  background: #f5f5f7;
}

.plan-page-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.plan-list-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
  padding: 2rem 1.25rem 2.5rem;
  box-sizing: border-box;
  background-color: #f5f5f7;
}

.plan-page-error {
  margin: 0 auto 1rem;
  max-width: 960px;
  color: #b00020;
  font-size: 0.9375rem;
}

.plan-page-loading {
  margin: 0 auto 1rem;
  max-width: 960px;
  color: #333;
  font-size: 0.9375rem;
}
</style>
