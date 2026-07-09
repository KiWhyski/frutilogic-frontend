<script>
import AlertItem from "@/alerts-and-notifications/components/alert-item.component.vue";
import StockSettingsModal from "@/alerts-and-notifications/components/stock-settings-modal.vue";
import ExpirationSettingsModal from "@/alerts-and-notifications/components/expiration-settings-modal.vue";
import { fetchAllStockAlerts, fetchAllExpirationAlerts } from "@/alerts-and-notifications/services/alert.service.js";

export default {
  name: "alert-list",
  components: {
    AlertItem,
    StockSettingsModal,
    ExpirationSettingsModal
  },
  props: {
    title: {
      type: String,
      required: true
    },
    alerts: {
      type: Array,
      required: true
    },
    linkText: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      validator: (value) => ["stock", "expiration"].includes(value)
    }
  },
  data() {
    return {
      showAll: false,
      allAlerts: [],
      showSettings: false
    };
  },
  methods: {
    async handleViewAll() {
      if (!this.showAll) {
        this.showAll = true;
        if (this.type === 'stock') {
          this.allAlerts = await fetchAllStockAlerts();
        } else {
          this.allAlerts = await fetchAllExpirationAlerts();
        }
      } else {
        this.showAll = false;
        this.allAlerts = [];
      }
    },
    openSettings() {
      this.showSettings = true;
    },
    closeSettings() {
      this.showSettings = false;
    },
    handleSettingsUpdated() {
      this.$emit("alerts-updated");
    }
  }
};
</script>

<template>
  <div class="alert-card">
    <div class="card-header">
      <h2 class="card-title">{{ title }}</h2>
      <button 
        v-if="type === 'stock' || type === 'expiration'"
        class="settings-button"
        @click="openSettings"
        :title="type === 'stock' ? 'Configurar stock mínimo' : 'Configurar días de expiración'"
      >
        <i class="pi pi-cog"></i>
      </button>
    </div>
    
    <div v-if="showAll ? allAlerts.length === 0 : alerts.length === 0" class="no-alerts">
      <i :class="type === 'stock' ? 'pi pi-box' : 'pi pi-calendar'" class="no-alerts-icon"></i>
      <p class="no-alerts-message">
        {{ type === 'stock' 
          ? $t('alerts.no-content')
          : $t('alerts.no-expired')
        }}
      </p>
      <p class="no-alerts-submessage">
        {{ type === 'stock'
          ? $t('alerts.no-content-description')
          : $t('alerts.no-expired-description')
        }}
      </p>
    </div>
    
    <AlertItem 
      v-else
      v-for="alert in showAll ? allAlerts : alerts" 
      :key="alert.id" 
      :alert="alert" 
    />
    
    <a v-if="alerts.length > 0" href="#" class="card-link" @click.prevent="handleViewAll">
      {{ showAll ? 'Show less' : linkText }}
    </a>

    <StockSettingsModal
      v-if="type === 'stock'"
      :show="showSettings"
      @close="closeSettings"
      @stock-updated="handleSettingsUpdated"
    />
    <ExpirationSettingsModal
      v-if="type === 'expiration'"
      :show="showSettings"
      @close="closeSettings"
      @settings-updated="handleSettingsUpdated"
    />
  </div>
</template>

<style scoped>
.alert-card {
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  flex: 1 1 320px;
  min-width: 280px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #1d1d1f;
  margin: 0;
}

.settings-button {
  background: none;
  border: none;
  color: var(--app-green-accent, #16a34a);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.settings-button:hover {
  background-color: rgba(22, 163, 74, 0.08);
  color: var(--app-green-accent-hover, #15803d);
}

.card-link {
  display: inline-block;
  margin-top: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--app-green-accent, #16a34a);
  text-decoration: none;
  cursor: pointer;
}

.card-link:hover {
  color: var(--app-green-accent-hover, #15803d);
  text-decoration: underline;
}

.no-alerts {
  text-align: center;
  padding: 2rem 1rem;
  color: #6e6e73;
}

.no-alerts-icon {
  font-size: 2.25rem;
  color: #aeaeb2;
  margin-bottom: 1rem;
}

.no-alerts-message {
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  margin-bottom: 0.5rem;
  color: #1d1d1f;
}

.no-alerts-submessage {
  font-size: 0.875rem;
  color: #86868b;
  max-width: 280px;
  margin: 0 auto;
  line-height: 1.4;
}
</style>