<template>
  <SideNavbar>
    <ToolbarContent :pageTitle="isEditMode ? $t('catalog.edit-title') : $t('catalog.new-title')" />
    <div class="catalog-row">
      <div class="catalog-form">
        <div class="p-fluid">
          <div class="field">
            <label for="catalogName">{{ $t('catalog.name-label') }}</label>
            <InputText id="catalogName" class="Input" v-model="catalog.name" required />
          </div>

          <h3>{{ $t('catalog.add-product') }}</h3>

          <div class="field">
            <label>Almacén</label>
            <select class="Input" v-model="selectedWarehouseId" :disabled="isEditMode" @change="loadWarehouseProducts">
              <option value="">Selecciona un almacén</option>
              <option v-for="warehouse in warehouses" :key="warehouse.warehouseId || warehouse.id"
                      :value="warehouse.warehouseId || warehouse.id">
                {{ warehouse.name }}
              </option>
            </select>
          </div>
          <div class="field">
            <label>Producto con stock</label>
            <select class="Input" v-model="selectedProductId">
              <option value="">Selecciona un producto</option>
              <option v-for="product in availableProducts" :key="product.productId" :value="product.productId">
                {{ product.name }} ({{ product.quantity }} disponibles)
              </option>
            </select>
          </div>
          <div class="field">
            <label>Stock a publicar</label>
            <pv-input-number v-model="stockToPublish" :min="1" :max="selectedProductStock" />
          </div>

          <div class="buttons">
            <Button :label="$t('catalog.save')" @click="onSave" class="p-button-primary" />
            <Button label="Agregar producto" @click="addProduct" :disabled="!isEditMode" class="p-button-primary" />
            <Button :label="$t('catalog.reset')" @click="resetForm" class="p-button-secondary" />
          </div>

          <div v-if="showError" class="error">{{ $t('catalog.complete-fields') }}</div>
          <ul v-if="catalogItems.length">
            <li v-for="item in catalogItems" :key="item.id">
              {{ item.name }} — {{ item.availableStock }} disponibles
              <Button icon="pi pi-trash" text severity="danger" @click="removeProduct(item.id)" />
            </li>
          </ul>
        </div>
      </div>
    </div>
  </SideNavbar>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { CatalogService } from '@/order-operation-and-monitoring/services/catalog.service';
import { useAuthenticationStore } from '@/authentication/services/authentication.store';
import { WarehouseService } from '@/inventory-management/services/warehouse.service';
import { InventoryService } from '@/inventory-management/services/inventory.service';

import SideNavbar from '@/public/components/side-navbar.vue';
import ToolbarContent from '@/public/components/toolbar-content.component.vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';

export default {
  name: 'CatalogCreateAndEdit',
  components: {
    SideNavbar,
    ToolbarContent,
    Button,
    InputText,
    InputNumber
  },
  setup() {
    const route = useRoute();
    const catalogService = new CatalogService();
    const authStore = useAuthenticationStore();
    const warehouseService = new WarehouseService();
    const inventoryService = new InventoryService();

    const catalog = ref({ catalogId: 0, name: '', accountId: '', isPublished: false });
    const catalogItems = ref([]);
    const isEditMode = ref(false);
    const showError = ref(false);

    const warehouses = ref([]);
    const warehouseProducts = ref([]);
    const selectedWarehouseId = ref('');
    const selectedProductId = ref('');
    const stockToPublish = ref(1);
    const availableProducts = computed(() =>
      warehouseProducts.value.filter(product =>
        Number(product.currentStock ?? product.quantity ?? product.Quantity ?? 0) > 0 &&
        !catalogItems.value.some(item => item.id === (product.productId ?? product.ProductId))
      ).map(product => ({
        ...product,
        productId: product.productId ?? product.ProductId,
        name: product.name ?? product.Name ?? 'Producto',
        quantity: Number(product.currentStock ?? product.quantity ?? product.Quantity ?? 0)
      }))
    );
    const selectedProductStock = computed(() =>
      availableProducts.value.find(product => product.productId === selectedProductId.value)?.quantity ?? 1
    );

    const loadCatalogItems = async () => {
      if (!catalog.value.catalogId) return;

      catalogItems.value = await catalogService.getCatalogItems(catalog.value.catalogId);
      console.log('[LOAD] items de catálogo', catalogItems.value);
    };

    const loadCatalog = async () => {
      const id = route.params.catalogId;
      if (id) {
        isEditMode.value = true;
        const loaded = await catalogService.getCatalogById(String(id));
        catalog.value = { ...loaded, catalogId: loaded.id };
        selectedWarehouseId.value = loaded.warehouseId || '';
        if (selectedWarehouseId.value) await loadWarehouseProducts();
        await loadCatalogItems();
      }
    };

    const loadWarehouseProducts = async () => {
      selectedProductId.value = '';
      warehouseProducts.value = selectedWarehouseId.value
        ? await inventoryService.getAllProductsByWarehouseId(selectedWarehouseId.value)
        : [];
    };

    const onSave = async () => {
      if (!catalog.value.name.trim()) {
        showError.value = true;
        return;
      }
      if (!isEditMode.value && !selectedWarehouseId.value) {
        showError.value = true;
        return;
      }

      const accountId = authStore.currentAccountId;
      if (!accountId) {
        alert('Account not found');
        return;
      }

      const payload = {
        name: catalog.value.name.trim(),
        description: catalog.value.name.trim(),
        contactEmail: authStore.currentUsername || 'contacto@frutilogic.com',
        warehouseId: selectedWarehouseId.value,
      };

      try {
        if (isEditMode.value) {
          await catalogService.updateCatalog(catalog.value.catalogId || catalog.value.id, payload);
        } else {
          const created = await catalogService.createCatalog(payload, accountId);
          catalog.value = { ...created, catalogId: created.id };
          isEditMode.value = true;
        }
        alert(isEditMode.value ? 'Catálogo guardado' : 'Catálogo creado');
      } catch (err) {
        console.error('Error saving catalog:', err);
      }
    };

    const addProduct = async () => {
      const quantity = Number(stockToPublish.value);
      if (!selectedProductId.value || quantity < 1 || quantity > selectedProductStock.value) {
        showError.value = true;
        return;
      }
      await catalogService.addCatalogItem({
        catalogId: catalog.value.catalogId || catalog.value.id,
        productId: selectedProductId.value,
        warehouseId: selectedWarehouseId.value,
        stock: quantity
      });
      await loadCatalogItems();
      await loadWarehouseProducts();
      stockToPublish.value = 1;
      showError.value = false;
    };

    const removeProduct = async (productId) => {
      await catalogService.deleteCatalogItem(catalog.value.catalogId || catalog.value.id, productId);
      await loadCatalogItems();
      await loadWarehouseProducts();
    };

    const resetForm = () => {
      selectedProductId.value = '';
      stockToPublish.value = 1;
      showError.value = false;
    };

    onMounted(async () => {
      warehouses.value = await warehouseService.getWarehousesByAccountId();
      await loadCatalog();
    });

    return {
      catalog,
      catalogItems,
      isEditMode,
      warehouses,
      availableProducts,
      selectedWarehouseId,
      selectedProductId,
      selectedProductStock,
      stockToPublish,
      showError,
      onSave,
      addProduct,
      removeProduct,
      loadWarehouseProducts,
      resetForm
    };
  }
};
</script>


<style scoped>
.catalog-row {
  gap: 2rem;
  padding: 2rem;
}

.catalog-form {
  padding: 2rem;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 0 8px rgba(0,0,0,0.1);
}

.p-fluid {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  font-family: 'Inter', sans-serif;
  font-size: 1.2rem;
}


.field {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  label {
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: #5A033A;
  }
  .Input {
    width: 100%;
    padding: 0.5rem;
    border: 3px solid #26021C;
    border-radius: 15px;
    font-size: 1rem;
    background-color: white;
    color: black;
  }
  .Input:focus {
    border-color: #6E0081;
    outline: none;
  }
  .InputNumber {
    width: 100%;
    padding: 0.5rem;
    border: 3px solid #26021C;
    border-radius: 15px;
    font-size: 1rem;
    background-color: white;
    color: black;
    ::v-deep(.p-inputtext) {
      padding: 0.5rem;
      border: 3px solid #26021C;
      border-radius: 15px;
      font-size: 1rem;
      background-color: white !important;
      color: black !important;
    }
    ::v-deep(.p-inputnumber) {
      border: none;
    }
  }
}

.buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  .p-button-primary {
    background-color: #5A033A;
    color: white;
    border-radius: 45px;
    border: none;
    padding: 0.5rem 1.5rem;
  }
  .p-button-secondary {
    background-color: white;
    color: #5A033A;
    border-radius: 45px;
    border: #5A033A 3px solid;
    padding: 0.5rem 1.5rem;
  }
  .p-button-secondary:hover {
    background-color: #6E0081;
    border-color: #6E0081;
    color: white;
  }
  .p-button-primary:hover {
    background-color: #6E0081;
    border-color: #6E0081;
    color: white;
  }
}

.error {
  color: red;
  margin-top: 1rem;
}
</style>
