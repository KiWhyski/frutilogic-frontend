<script>
export default {
  name: "payment-cancel",
  methods: {
    goToPlans() {
      this.$router.push({ name: "PlanChoose" });
    },
    goToDashboard() {
      this.$router.push("/dashboard");
    },
  },
};
</script>

<template>
  <div class="cancel-container">
    <div class="card">
      <h2 class="title">{{ $t("plans-page.cancel-title") }}</h2>
      <p class="message">{{ $t("plans-page.cancel-message") }}</p>
      <button class="primary" @click="goToPlans">{{ $t("plans-page.go-plans") }}</button>
      <button class="secondary" @click="goToDashboard">{{ $t("plans-page.go-dashboard") }}</button>
    </div>
  </div>
</template>

<style scoped>
.cancel-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #fff;
  padding: 2rem;
}
.card {
  max-width: 480px;
  width: 100%;
  text-align: center;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}
.title {
  margin-bottom: 0.75rem;
}
.message {
  color: #555;
  margin-bottom: 1.25rem;
}
.primary,
.secondary {
  margin: 0.35rem;
  padding: 0.75rem 1.5rem;
  border-radius: 45px;
  border: none;
  cursor: pointer;
}
.primary {
  background: var(--app-green-accent, #16a34a);
  color: #fff;
}
.secondary {
  background: transparent;
  border: 1px solid #ccc;
}
</style>
