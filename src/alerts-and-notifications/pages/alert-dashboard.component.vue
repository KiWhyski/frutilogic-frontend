<script>
import SideNavbar from "@/public/components/side-navbar.vue";
import ToolbarContent from "@/public/components/toolbar-content.component.vue";
import AlertList from "@/alerts-and-notifications/components/alert-list.component.vue";
import { fetchStockAlerts, fetchExpirationAlerts } from "@/alerts-and-notifications/services/alert.service.js";

export default {
  name: "alert-dashboard",
  components: { SideNavbar, ToolbarContent, AlertList },
  data() {
    return {
      stockAlerts: [],
      expirationAlerts: [],
      loading: true,
      error: null
    };
  },
  methods: {
    async loadAlerts() {
      this.loading = true;
      this.error = null;
      try {
        const [stock, expiration] = await Promise.all([
          fetchStockAlerts(),
          fetchExpirationAlerts()
        ]);
        this.stockAlerts = stock;
        this.expirationAlerts = expiration;
      } catch (err) {
        this.error = "Error loading alerts.";
        console.error(err);
      } finally {
        this.loading = false;
      }
    },
    async handleAlertsUpdated() {
      await this.loadAlerts();
    }
  },
  async mounted() {
    await this.loadAlerts();
  }
}
</script>

<template>
  <div class="alerts-bg">
    <side-navbar />
    <div class="alerts-main">
      <toolbar-content :pageTitle="$t('alerts.title')" />
      <div class="alerts-content">
        <div v-if="loading" class="alerts-loading">{{ $t('alerts.loading-dashboard') }}</div>
        <div v-else-if="error" class="error-msg" role="alert">{{ error }}</div>
        <template v-else>
          <AlertList 
            :title="$t('alerts.urgent-restocking')"
            :alerts="stockAlerts" 
            linkText="View all alerts"
            type="stock"
            @alerts-updated="handleAlertsUpdated"
          />
          <AlertList 
            :title="$t('alerts.next-to-expire')"
            :alerts="expirationAlerts" 
            linkText="See all products"
            type="expiration"
            @alerts-updated="handleAlertsUpdated"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.alerts-bg {
  background: #ffffff;
  min-height: 100vh;
  width: 100%;
  display: flex;
}
.alerts-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.alerts-content {
  padding: 2rem;
  display: flex;
  gap: 1.75rem;
  flex-wrap: wrap;
  max-width: 1280px;
  margin: 0 auto;
  box-sizing: border-box;
  width: 100%;
}

.alerts-loading {
  width: 100%;
  padding: 2rem 1rem;
  text-align: center;
  font-size: 0.9375rem;
  color: #86868b;
}

.error-msg {
  width: 100%;
  color: #b91c1c;
  font-weight: 500;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border: 1px solid rgba(185, 28, 28, 0.15);
  border-radius: 10px;
  font-size: 0.9375rem;
}
</style>