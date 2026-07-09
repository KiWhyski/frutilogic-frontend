<template>
  <SideNavbar>
    <div class="order-container-page">
      <div class="purchase-order-wrapper">
        <div class="actions">
          <router-link to="/catalog" class="new-order-button">
            <i class="pi pi-plus" style="margin-right: 0.5rem;"></i>
            {{ $t('orders.new-order') }}
          </router-link>
        </div>

        <PurchaseOrderListComponent :orders="orders" />
      </div>
    </div>
  </SideNavbar>
</template>

<script>
import PurchaseOrderListComponent from "@/order-operation-and-monitoring/components/purchase-order-list.component.vue";
import SideNavbar from "@/public/components/side-navbar.vue";
import ToolbarContent from "@/public/components/toolbar-content.component.vue";

export default {
  name: 'PurchaseOrder',
  components: {
    ToolbarContent,
    SideNavbar,
    PurchaseOrderListComponent
  },
  props: {
    orders: {
      type: Array,
      default: () => []
    }
  }
};
</script>

<style scoped>
.actions {
  margin-bottom: 1rem;
  text-align: right;
}

.order-container-page {
  background-color: #ffffff;
  min-height: 100vh;
  padding: 2rem;
}

.new-order-button {
  background-color: #5A033A;
  color: white;
  padding: 0.7rem 1.5rem;
  border: none;
  border-radius: 45px;
  text-decoration: none;
  font-weight: bold;
  font-size: 1.3rem;
}
</style>
