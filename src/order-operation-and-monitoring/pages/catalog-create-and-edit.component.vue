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
            <label>{{ $t('catalog.name') }}</label>
            <InputText class="Input" v-model="newProduct.name" />
          </div>
          <div class="field">
            <label>{{ $t('catalog.type') }}</label>
            <InputText class="Input" v-model="newProduct.productType" />
          </div>
          <div class="field">
            <label>{{ $t('catalog.brand') }}</label>
            <InputText class="Input" v-model="newProduct.brand" />
          </div>
          <div class="field">
            <label>{{ $t('catalog.content-kg') }}</label>
            <pv-input-number
                v-model="newProduct.content"
                :min="0"
                inputStyle="background-color: white; color: black; padding: 0.5rem; border: 3px solid #26021C; border-radius: 15px;"
            />

          </div>
          <div class="field">
            <label>{{ $t('catalog.price-pen') }}</label>
            <pv-input-number
                v-model="newProduct.price"
                mode="currency"
                currency="PEN"
                locale="es-PE"
                :min="0"
                inputStyle="background-color: white; color: black; padding: 0.5rem; border: 3px solid #26021C; border-radius: 15px;"
            />
          </div>

          <div class="buttons">
            <Button :label="$t('catalog.save')" @click="onSave" class="p-button-primary" />
            <Button :label="$t('catalog.reset')" @click="resetForm" class="p-button-secondary" />
          </div>

          <div v-if="showError" class="error">{{ $t('catalog.complete-fields') }}</div>
        </div>
      </div>
    </div>
  </SideNavbar>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { CatalogService } from '@/order-operation-and-monitoring/services/catalog.service';
import { useAuthenticationStore } from '@/authentication/services/authentication.store';

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

    const catalog = ref({ catalogId: 0, name: '', accountId: '', isPublished: false });
    const catalogItems = ref([]);
    const isEditMode = ref(false);
    const showError = ref(false);

    const newProduct = ref({
      name: '', productType: '', content: 0, brand: '', price: null
    });

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
        await loadCatalogItems();
      }
    };

    const onSave = async () => {
      if (!catalog.value.name.trim()) {
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

    const resetForm = () => {
      newProduct.value = {
        name: '',
        productType: '',
        content: 0,
        brand: '',
        price: null
      };
    };

    onMounted(loadCatalog);

    return {
      catalog,
      catalogItems,
      isEditMode,
      newProduct,
      showError,
      onSave,
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
