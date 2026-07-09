<template>
  <Card class="catalog-card">
    <template #title>
      <div class="catalog-header">
        <span class="catalog-info">
          <strong>{{ $t('catalog.catalog-name-prefix') }}</strong> {{ catalog?.name }} |
          <strong>{{ $t('catalog.created-label') }}</strong> {{ formatDate(catalog?.dateCreated) }}
        </span>
        <div class="actions">
          <Button :label="$t('catalog.publish')" @click="onPublish" severity="info" class="publish" />
          <Button :label="$t('catalog.edit')" @click="goToEdit" class="edit" />
        </div>
      </div>
    </template>

    <template #content>
      <h3>{{ $t('catalog.products-in-catalog') }}</h3>
      <DataTable
          :value="catalogItems"
          :paginator="true"
          :rows="5"
          :rowsPerPageOptions="[5, 10, 25]"
          class="p-datatable-striped"
      >
        <Column field="name" :header="$t('catalog.name')" />
        <Column field="content" :header="$t('catalog.col-content')">
          <template #body="{ data }">{{ data.content }} kg</template>
        </Column>
        <Column field="productType" :header="$t('catalog.col-type')" />
        <Column field="brand" :header="$t('catalog.brand')" />
        <Column :header="$t('catalog.col-price')">
          <template #body="{ data }">{{ formatPrice(data.unitPrice) }}</template>
        </Column>
        <Column :header="$t('catalog.actions')" style="width: 100px;">
          <template #body="{ data }">
            <Button icon="pi pi-trash" severity="danger" text @click="deleteItem(data.id)" />
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>
</template>

<script>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';

import Card from 'primevue/card';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

import {CatalogService} from '@/order-operation-and-monitoring/services/catalog.service.js';
export default {
  name: 'CatalogItem',
  props: {
    catalog: Object
  },
  components: {
    Card,
    Button,
    DataTable,
    Column
  },
  setup(props) {
    const router = useRouter();
    const toast = useToast();
    const catalogService = new CatalogService();

    const catalogItems = ref([]);

    async function loadCatalogItems(catalogId) {
      if (!catalogId) return;
      try {
        catalogItems.value = await catalogService.getCatalogItems(catalogId);
      } catch (e) {
        console.error('Error cargando ítems:', e);
      }
    }

    watch(
        () => props.catalog?.catalogId ?? props.catalog?.id,
        (catalogId) => loadCatalogItems(catalogId),
        { immediate: true }
    );

    async function deleteItem(itemId) {
      const catalogId = props.catalog?.catalogId ?? props.catalog?.id;
      if (!catalogId || !itemId) return;

      if (!confirm('¿Eliminar este producto del catálogo?')) return;
      try {
        await catalogService.deleteCatalogItem(catalogId, itemId);
        catalogItems.value = catalogItems.value.filter(i => i.id !== itemId);
        toast.add({ severity: 'info', summary: 'Producto eliminado', life: 2200 });
      } catch (err) {
        console.error('[CatalogItem] error al eliminar:', err);
        toast.add({ severity: 'error', summary: 'No se pudo eliminar', life: 3000 });
      }
    }

    const goToEdit = () => {
      const catalogId = props.catalog?.catalogId ?? props.catalog?.id;
      if (catalogId) {
        router.push(`/catalog/edit/${catalogId}`);
      }
    };

    async function onPublish () {
      const catalogId = props.catalog?.catalogId ?? props.catalog?.id;
      if (!catalogId) return;

      const ok = confirm('¿Deseas publicar este catálogo?');
      if (!ok) return;

      try {
        await catalogService.publishCatalog(catalogId);
        toast.add({ severity: 'success', summary: 'Catálogo publicado', life: 2500 });
      } catch (err) {
        console.error('[CatalogItem] error al publicar:', err);
        toast.add({ severity: 'error', summary: 'No se pudo publicar', life: 3000 });
      }
    }

    const formatDate = (d) => new Date(d).toLocaleDateString('es-PE');
    const formatPrice = (p) => `S/ ${Number(p).toFixed(2)}`;

    return {
      catalogItems,
      deleteItem,
      goToEdit,
      onPublish,
      formatPrice,
      formatDate
    };
  }
};
</script>

<style scoped>
.catalog-card {
  display: flex;
  flex-direction: column;
  padding: 2rem;
  background-color: #fff;
  border-radius: 15px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}
.catalog-container {
  padding: 2rem;
  background-color: #f5f0eb;
}

.catalog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.catalog-info {
  font-size: 1.5rem;
  color: #263238;
  margin-bottom: 2rem;
}

.actions {
  margin-left: 0.5rem;
  margin-bottom: 2rem;
  .edit {
    background-color: #890E4F;
    color: white;
    font-size: 1.2rem;
    border: none;
    padding: 0.5rem 1.6rem;
    border-radius: 45px;
  }
  .edit:hover {
    background-color: #6E0081;
    color: white;
    border: none;
  }
  .publish {
    background-color: white;
    color: #890E4F;
    font-size: 1.2rem;
    border: #890E4F 4px solid;
    padding: 0.5rem 1.6rem;
    border-radius: 45px;
  }
  .publish:hover {
    border: #6E0081 4px solid;
    background-color: white;
    color: #6E0081;
  }
}

</style>
