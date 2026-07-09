<template>
  <SideNavbar>
    <ToolbarContent :pageTitle="$t('orders.title')" />

    <div
      class="orders-wrapper"
      :class="{ 'orders-wrapper--restricted': !isSupplier && !isFruitStoreOwner }"
    >
      <SalesOrderComponent
        v-if="isSupplier"
        :orders="orders"
      />

      <PurchaseOrder
        v-if="isFruitStoreOwner"
        :orders="orders"
      />

      <div
        v-if="!isSupplier && !isFruitStoreOwner"
        class="no-access"
        role="status"
        aria-live="polite"
      >
        <div class="no-access-card">
          <div class="no-access-icon" aria-hidden="true">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M14 21V15a10 10 0 0 1 20 0v6"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <rect
                x="10"
                y="21"
                width="28"
                height="22"
                rx="5.5"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <circle cx="24" cy="31" r="1.75" fill="currentColor" />
            </svg>
          </div>
          <h2 class="no-access-title">{{ $t('orders.no-access-title') }}</h2>
          <p class="no-access-lede">{{ $t('orders.no-access-lede') }}</p>
        </div>
      </div>
    </div>
  </SideNavbar>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useAuthenticationStore } from '@/authentication/services/authentication.store.js';
import { PurchaseOrderService } from '@/order-operation-and-monitoring/services/purchase-order.service.js';
import { isFruitStoreOwner as checkFruitStoreOwner, isSupplier as checkSupplier } from '@/shared/utils/account-role.js';

import SideNavbar from '@/public/components/side-navbar.vue';
import ToolbarContent from '@/public/components/toolbar-content.component.vue';

import SalesOrderComponent from '@/order-operation-and-monitoring/pages/sales-order.component.vue';
import PurchaseOrder from '@/order-operation-and-monitoring/pages/purchase-order.component.vue';

export default {
  name: 'OrdersComponent',
  components: {
    SideNavbar,
    ToolbarContent,
    SalesOrderComponent,
    PurchaseOrder,
  },
  setup() {
    const authStore = useAuthenticationStore();
    const orderSrv = new PurchaseOrderService();

    const orders = ref([]);
    const isSupplier = ref(false);
    const isFruitStoreOwner = ref(false);

    const loadOrders = async () => {
      const account = authStore.account;

      if (!account?.accountRole) {
        console.error('Cuenta sin rol, imposible cargar órdenes');
        return;
      }

      try {
        if (checkSupplier(account.accountRole)) {
          isSupplier.value = true;
          orders.value = await orderSrv.getAll({ supplierAccountId: account.accountId });
        } else if (checkFruitStoreOwner(account.accountRole)) {
          isFruitStoreOwner.value = true;
          orders.value = await orderSrv.getAll({ buyerAccountId: account.accountId });
        } else {
          console.warn('Rol no reconocido:', account.accountRole);
        }
      } catch (err) {
        console.error('❌ Error al obtener órdenes:', err.response?.data || err);
      }
    };

    onMounted(loadOrders);

    return {
      orders,
      isSupplier,
      isFruitStoreOwner,
      loadOrders,
    };
  },
};
</script>

<style scoped>
.orders-wrapper {
  flex: 1;
  padding: 1rem;
  min-height: calc(100vh - 80px);
  background: #ffffff;
}

.orders-wrapper--restricted {
  padding: 0;
  background: #ffffff;
}

.no-access {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 120px);
  padding: clamp(2rem, 6vw, 4rem) 1.25rem;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    'SF Pro Text',
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
}

.no-access-card {
  width: 100%;
  max-width: 400px;
  padding: 2.75rem 2rem 2.5rem;
  text-align: center;
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  /* Ligera sombra para separar el bloque del fondo blanco */
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.05);
}

.no-access-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
  color: #aeaeb2;
}

.no-access-icon svg {
  width: 52px;
  height: 52px;
}

.no-access-title {
  margin: 0 0 0.75rem;
  font-size: 1.375rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.25;
  color: #1d1d1f;
}

.no-access-lede {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: -0.01em;
  color: #6e6e73;
}
</style>
