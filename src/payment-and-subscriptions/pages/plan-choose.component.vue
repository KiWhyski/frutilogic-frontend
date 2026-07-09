<script>
import { PlanService } from "@/payment-and-subscriptions/services/plan.service.js";
import PlanList from "@/payment-and-subscriptions/components/plan-list.component.vue";
import { SubscriptionService } from "@/payment-and-subscriptions/services/subscription.service.js";
import SideNavbar from "@/public/components/side-navbar.vue";
import ToolbarContent from "@/public/components/toolbar-content.component.vue";

/** Dos planes fijos en UI (es-ES); se enlazan los planId del API por posición cuando existen. */
const CATALOG_SLOTS = [
  { catalogKey: "esencial", tier: 0, fallbackPlanId: "plan_esencial" },
  { catalogKey: "estandar", tier: 1, fallbackPlanId: "plan_estandar" },
];

export default {
  name: "payment-choose",
  components: { PlanList, SideNavbar, ToolbarContent },
  data() {
    return {
      apiPlans: [],
      displayPlans: [],
      currentPlanId: null,
      error: null,
    };
  },
  computed: {
    currentTier() {
      const row = this.displayPlans.find((p) => p.planId === this.currentPlanId);
      return row ? row.tier : -1;
    },
  },
  methods: {
    buildDisplayPlans() {
      this.displayPlans = CATALOG_SLOTS.map((slot, i) => {
        const raw = this.apiPlans[i];
        const api = raw && typeof raw === "object" ? { ...raw } : {};
        return {
          ...api,
          catalogKey: slot.catalogKey,
          tier: slot.tier,
          planId: api.planId ?? slot.fallbackPlanId,
        };
      });
    },

    async getAllPlans() {
      this.error = null;
      try {
        const planService = new PlanService();
        const data = await planService.getAllPlans();
        this.apiPlans = Array.isArray(data) ? data : [];
        this.buildDisplayPlans();
      } catch (error) {
        this.error = this.$t("plans-page.load-error");
        console.error(error);
        this.apiPlans = [];
        this.buildDisplayPlans();
      }
    },

    async checkCurrentPlanAndLoad() {
      try {
        const accountId = localStorage.getItem("accountId");
        if (accountId) {
          const subscriptionService = new SubscriptionService();
          const data = await subscriptionService.getCurrentSubscription(accountId);
          this.currentPlanId = data?.planId ?? null;
        }
      } catch (error) {
        console.warn("No active subscription yet:", error);
      } finally {
        await this.getAllPlans();
      }
    },

    async subscribeToPlan(planId) {
      try {
        const accountId = localStorage.getItem("accountId");
        const subscriptionService = new SubscriptionService();
        const data = await subscriptionService.subscribeToPlan(planId, accountId);

        if (data?.initPoint) {
          window.location.href = data.initPoint;
          return;
        }

        this.$router?.push({ name: "Dashboard" });
      } catch (err) {
        console.error("Error subscribing to plan:", err);
        this.error = this.$t("plans-page.load-error");
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
        <plan-list
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
</style>
