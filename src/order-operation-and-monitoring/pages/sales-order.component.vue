<template>
  <div class="order-container">
      <Card v-for="order in orders" :key="order.id" class="order-card">
        <template #title>
          <div class="order-title">
            {{ $t('orders.sales.order-ref', { id: order.id }) }}
          </div>
        </template>

        <template #content>
          <div class="order-content">
            <p><strong>{{ $t('orders.sales.date') }}:</strong> {{ formatDate(order.date) }}</p>
            <p><strong>{{ $t('orders.sales.buyer') }}:</strong> {{ order.buyer.email }}</p>
            <p>
              <strong>{{ $t('orders.sales.status') }}:</strong>
              <span :class="'st-' + order.status">{{ translateOrderStatus(order.status) }}</span>
              <Button
                  size="small"
                  icon="pi pi-pencil"
                  text
                  @click="openStatusDialog(order)"
              />
            </p>
            <p><strong>{{ $t('orders.sales.total') }}:</strong> {{ formatPrice(order.totalAmount) }}</p>

            <h4>{{ $t('orders.sales.items') }}</h4>
            <ul>
              <li v-for="item in order.items" :key="item.id">
                {{ item.name }} - {{ formatPrice(item.unitPrice) }}
              </li>
            </ul>
          </div>
        </template>
      </Card>

    <Dialog
        v-model:visible="showDialog"
        modal
        :header="$t('orders.sales.change-status')"
        :style="{ width: '25rem' }"
    >
      <div class="p-fluid">
        <Dropdown
            v-model="selectedStatus"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            :placeholder="$t('orders.sales.select-status')"
        />

        <div class="dlg-actions">
          <Button :label="$t('components.cancel')" severity="secondary" @click="showDialog=false" />
          <Button :label="$t('components.save')" icon="pi pi-check" @click="applyStatusChange" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script>
import { useAuthenticationStore } from '@/authentication/services/authentication.store.js';
import { PurchaseOrderService }   from '@/order-operation-and-monitoring/services/purchase-order.service.js';

import Card           from 'primevue/card';
import Button         from 'primevue/button';
import Dialog         from 'primevue/dialog';
import Dropdown       from 'primevue/dropdown';

export default {
  name: 'SalesOrderComponent',
  components: {
    Card,
    Button,
    Dialog,
    Dropdown
  },

  data() {
    return {
      orders: [],
      showDialog: false,
      currentOrder: null,
      selectedStatus: null
    };
  },

  computed: {
    statusOptions() {
      if (!this.currentOrder) return [];
      const options = {
        Processing: [
          { label: 'Confirmar', value: 'confirm', apiStatus: 'Confirmed' },
          { label: this.$t('orders.sales.status-canceled'), value: 'cancel', apiStatus: 'Canceled' }
        ],
        Confirmed: [
          { label: 'Marcar como enviado', value: 'ship', apiStatus: 'Deliverying' },
          { label: this.$t('orders.sales.status-canceled'), value: 'cancel', apiStatus: 'Canceled' }
        ],
        Deliverying: [
          { label: this.$t('orders.sales.status-canceled'), value: 'cancel', apiStatus: 'Canceled' }
        ]
      };
      return options[this.currentOrder.status] ?? [];
    }
  },

  methods: {
    translateOrderStatus(status) {
      const key = {
        Received: 'orders.sales.status-received',
        Processing: 'orders.sales.status-inprocess',
        Confirmed: 'orders.sales.status-inprocess',
        Deliverying: 'orders.sales.status-arrived',
        Arrived: 'orders.sales.status-arrived',
        Canceled: 'orders.sales.status-canceled'
      }[status];
      return key ? this.$t(key) : status;
    },

    formatDate(date) {
      const raw = typeof date === 'object' && date?._date ? date._date : date;
      return raw
          ? new Date(raw).toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' })
          : 'Fecha inválida';
    },

    formatPrice(amount = 0) {
      return Number.isFinite(amount)
          ? amount.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 })
          : 'S/0.00';
    },

    async loadOrders() {
      try {
        const supplierAccountId = useAuthenticationStore().account?.accountId;
        if (!supplierAccountId) return;

        const resp = await new PurchaseOrderService().getAll({ supplierAccountId });
        this.orders = resp.map(o => ({
          ...o,
          totalAmount: Number(o.totalAmount) || 0,
          date: o.date?._date ?? o.date
        }));

        console.log('Orders received by the supplier:', this.orders);
      } catch (e) {
        console.error('Error loading supplier orders:', e);
      }
    },

    openStatusDialog(order) {
      if (order.status === 'Canceled') {
        alert('No puedes cambiar el estado de una orden cancelada.');
        return;
      }
      this.currentOrder   = order;
      this.selectedStatus = null;
      this.showDialog     = true;
    },

    async applyStatusChange() {
      if (!this.currentOrder || this.selectedStatus == null) return;

      try {
        const svc = new PurchaseOrderService();
        await svc.updateStatus(this.currentOrder.id, this.selectedStatus);
        this.currentOrder.status = this.statusOptions.find(opt => opt.value === this.selectedStatus).apiStatus;
        this.showDialog = false;
      } catch (e) {
        console.error('Error updating status', e);
        alert('No se pudo cambiar el estado.');
      }
    }
  },

  mounted() {
    this.loadOrders();
  }
};
</script>

<style scoped>
:root {
  --primary-900: #5A033A;   /* fruta / marca */
  --primary-700: #6E0081;   /* púrpura oscuro  */
  --accent-100 : #ffffff;   /* lienzo de vista */
  --text-900   : #242424;
  --text-600   : #555;
}

/* =============  LAYOUT ============= */
.order-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
  background: var(--accent-100);
  min-height: 100vh;
}

/* ======  ORDER CARD  ====== */
.order-card {
  border-radius: 1.25rem;
  border: 3px solid var(--primary-900);
  overflow: hidden;
  box-shadow: 0 6px 12px rgba(0, 0, 0, .08);
  background-color: #fff;
  transition: transform .2s ease, box-shadow .2s ease;
}
.order-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, .12);
}

/* ----- header / título ----- */
.order-title {
  font-weight: 700;
  font-size: 1.5rem;
  padding: .75rem 1.25rem;
  background: linear-gradient(135deg, var(--primary-900), var(--primary-700));
  color: #5A033A;
}

/* ----- contenido ----- */
.order-content {
  padding: 1.5rem;
  color: var(--text-600);
  line-height: 1.4;
}
.order-content p {
  color: #4E4E4E;
}
.order-content h4 {
  margin: 1rem 0 .5rem;
  color: #4E4E4E;
  font-weight: 600;
}
.order-content ul {
  list-style: disc;
  padding-left: 1.25rem;
  margin: .25rem 0 0;
  color: #4E4E4E;
}
.order-content li {
  margin-bottom: .25rem;
  color: #4E4E4E;
}

/* ======  STATUS CHIP  ====== */
.st-Received,
.st-InProcess,
.st-Arrived,
.st-Canceled {
  padding: .25rem .75rem;
  border-radius: 9999px;
  font-size: .75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .035em;
  color: #fff;
}
.st-Received   { background: #2e8b57; }
.st-InProcess  { background: #ff9800; }
.st-Arrived    { background: #2196f3; }
.st-Canceled   { background: #e53935; }

/* ======  BUTTONS  ====== */
.p-button {
  border-radius: 9999px !important;
}
.p-button.p-button-text {
  color: var(--primary-700);
}
.p-button.p-button-text:hover {
  background: var(--primary-700);
  color: #fff;
}

/* ======  DIALOG ====== */
.p-dialog {
  border-radius: 1rem;
}
.p-dialog-header {
  background: var(--primary-900);
  color: #fff;
}
.p-dialog .p-button {
  min-width: 110px;
}
.dlg-actions {
  display: flex;
  justify-content: flex-end;
  gap: .75rem;
  margin-top: 2rem;
}
</style>
