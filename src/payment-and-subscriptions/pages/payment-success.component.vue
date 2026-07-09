<script>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { SubscriptionService } from "@/payment-and-subscriptions/services/subscription.service.js";
import { useAuthenticationStore } from "@/authentication/services/authentication.store.js";

export default {
  name: "payment-success",
  setup() {
    const router = useRouter();
    const authStore = useAuthenticationStore();
    const subscriptionService = new SubscriptionService();
    const status = ref("checking");
    const planLabel = ref("");

    onMounted(async () => {
      const accountId = authStore.currentAccountId || localStorage.getItem("accountId");
      if (!accountId) {
        status.value = "ok";
        return;
      }

      try {
        // Webhook activates the plan; poll a few times in case MP is slightly delayed.
        for (let i = 0; i < 5; i++) {
          try {
            const data = await subscriptionService.getCurrentSubscription(accountId);
            const planStatus = String(data?.status || "").toLowerCase();
            if (planStatus === "active" || data?.planType) {
              planLabel.value = data?.planType || "";
              status.value = "ok";
              return;
            }
          } catch {
            // keep polling
          }
          await new Promise((r) => setTimeout(r, 1500));
        }
        status.value = "pending";
      } catch (error) {
        console.error("Error checking subscription after payment:", error);
        status.value = "pending";
      }
    });

    const goToDashboard = () => {
      router.push("/dashboard");
    };

    const goToPlans = () => {
      router.push({ name: "PlanChoose" });
    };

    return {
      status,
      planLabel,
      goToDashboard,
      goToPlans,
    };
  },
};
</script>

<template>
  <div class="confirmation-container">
    <div class="card">
      <h2 class="title">{{ $t("plans-page.success-title") }}</h2>
      <p v-if="status === 'checking'" class="message">{{ $t("plans-page.success-checking") }}</p>
      <template v-else-if="status === 'ok'">
        <p class="message">{{ $t("plans-page.success-message") }}</p>
        <p v-if="planLabel" class="message">{{ $t("plans-page.success-plan", { plan: planLabel }) }}</p>
      </template>
      <template v-else>
        <p class="message">{{ $t("plans-page.success-pending") }}</p>
      </template>
      <button class="dashboard-button" @click="goToDashboard">
        {{ $t("plans-page.go-dashboard") }}
      </button>
      <button class="secondary-button" @click="goToPlans">
        {{ $t("plans-page.go-plans") }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.confirmation-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #ffffff;
  padding: 2rem;
}

.card {
  background-color: #ffffff;
  padding: 2rem 3rem;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.title {
  font-size: 1.8rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.message {
  font-size: 1.1rem;
  color: #555;
  margin-bottom: 0.8rem;
}

.dashboard-button {
  margin-top: 1.5rem;
  padding: 0.8rem 2rem;
  background-color: var(--app-green-accent, #16a34a);
  color: white;
  border: none;
  border-radius: 45px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.dashboard-button:hover {
  background-color: var(--app-green-accent-hover, #15803d);
}

.secondary-button {
  margin-top: 0.75rem;
  margin-left: 0.5rem;
  padding: 0.8rem 2rem;
  background: transparent;
  color: #333;
  border: 1px solid #ccc;
  border-radius: 45px;
  font-size: 1rem;
  cursor: pointer;
}
</style>
