<template>
  <SideNavbar>
    <ToolbarContent :pageTitle="$t('catalog.title')" />
    <div class="container-catalogs">
      <div v-if="isSupplier" class="add-catalog-btn">
        <Button :label="$t('catalog.new')" icon="pi pi-plus" @click="goToNewCatalog" />
      </div>

      <CatalogList v-if="isSupplier" :catalogs="catalogs" />

      <CatalogForOrders v-if="isFruitStoreOwner" :catalogCards="catalogs" />
    </div>
  </SideNavbar>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { useAuthenticationStore } from '@/authentication/services/authentication.store.js';
import { CatalogService } from '@/order-operation-and-monitoring/services/catalog.service.js';
import { isFruitStoreOwner as checkFruitStoreOwner, isSupplier as checkSupplier } from '@/shared/utils/account-role.js';

import CatalogList       from '@/order-operation-and-monitoring/components/catalog-list.component.vue';
import CatalogForOrders  from '@/order-operation-and-monitoring/pages/catalog-for-orders.component.vue';
import ToolbarContent    from '@/public/components/toolbar-content.component.vue';
import SideNavbar        from '@/public/components/side-navbar.vue';
import Button            from 'primevue/button';

export default {
  name: 'CatalogComponent',
  components: {
    SideNavbar,
    ToolbarContent,
    CatalogList,
    CatalogForOrders,
    Button
  },
  setup() {
    const router            = useRouter();
    const catalogService    = new CatalogService();
    const authStore         = useAuthenticationStore();   // ← obtenemos el store

    const catalogs          = ref([]);
    const isSupplier        = ref(false);
    const isFruitStoreOwner = ref(false);

    const goToNewCatalog = () => {
      router.push('/catalog/new');
    };

    onMounted(async () => {
      const account = authStore.account;
      console.log('Cuenta actual:', account);

      if (!account?.accountRole) {
        console.error('Cuenta no válida o sin rol');
        return;
      }

      try {
        if (checkSupplier(account.accountRole)) {
          isSupplier.value = true;
          catalogs.value   = await catalogService.getCatalogsByAccount(account.accountId);
        } else if (checkFruitStoreOwner(account.accountRole)) {
          isFruitStoreOwner.value = true;
          catalogs.value           = await catalogService.getPublishedCatalogs();
        } else {
          console.warn('Rol no reconocido:', account.accountRole);
        }
      } catch (err) {
        console.error('Error cargando catálogos:', err);
      }
    });

    return {
      catalogs,
      isSupplier,
      isFruitStoreOwner,
      goToNewCatalog
    };
  }
};
</script>


<style scoped>
.add-catalog-btn {
  margin: 1rem;
  Button {
    background-color: #5A033A;
    color: white;
    border: none;
    border-radius: 45px;

  }
  Button:hover {
    background-color: #6E0081;
    color: white;
  }
}
.container-catalogs {
  background-color: #ffffff;
  padding: 1rem;
}

</style>
