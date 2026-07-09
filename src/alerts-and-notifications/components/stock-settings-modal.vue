<script>
import { isFrontendOnly } from "@/shared/config/frontend-only.js";
import httpInstance from "@/shared/services/http.instance.js";
import { ProductService } from "@/inventory-management/services/product.service.js";

const productService = new ProductService();

export default {
  name: "stock-settings-modal",
  props: {
    show: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      products: [],
      loading: false,
      error: null,
      saving: false
    };
  },
  watch: {
    show(val) {
      if (val) {
        this.loadProducts();
      }
    }
  },
  methods: {
    async loadProducts() {
      try {
        this.loading = true;
        if (isFrontendOnly()) {
          this.products = [
            { id: '1', name: 'Producto demo', current: 10, min: 5 },
          ];
          return;
        }
        const { data } = await productService.getAllByAccountId();
        this.products = data.map(product => ({
          id: product.productId,
          name: product.name,
          current: product.totalStockInStore,
          min: product.minimumStock,
        }));
      } catch (err) {
        this.error = "Error loading products";
        console.error(err);
      } finally {
        this.loading = false;
      }
    },
    async updateMinStock(product) {
      try {
        this.saving = true;
        if (isFrontendOnly()) {
          this.$emit('stock-updated');
          return;
        }
        await httpInstance.patch(`products/${product.id}/minimum-stock`, {
          newMinimumStock: product.min
        });
        this.$emit('stock-updated');
      } catch (err) {
        this.error = "Error updating stock minimum";
        console.error(err);
      } finally {
        this.saving = false;
      }
    },
    closeModal() {
      this.$emit('close');
    }
  }
}
</script>

<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ $t('alerts.minimum-stock.title') }}</h2>
        <button class="close-button" @click="closeModal">×</button>
      </div>
      
      <div class="modal-body">
        <div v-if="loading" class="loading">{{ $t('alerts.minimum-stock.loading') }}</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        
        <table v-else class="products-table">
          <thead>
            <tr>
              <th>{{ $t('alerts.minimum-stock.form.product') }}</th>
              <th>{{ $t('alerts.minimum-stock.form.actual-stock') }}</th>
              <th>{{ $t('alerts.minimum-stock.form.minimum-stock') }}</th>
              <th>{{ $t('alerts.minimum-stock.form.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.id">
              <td>{{ product.name }}</td>
              <td>{{ product.current }}</td>
              <td>
                <input 
                  type="number" 
                  v-model.number="product.min" 
                  min="1"
                  class="stock-input"
                >
              </td>
              <td>
                <button 
                  class="save-button"
                  @click="updateMinStock(product)"
                  :disabled="saving"
                >
                  {{ saving ? 'Guardando...' : 'Guardar' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  color: #1d1d1f;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
}

.close-button:hover {
  color: #1d1d1f;
}

.modal-body {
  padding: 1.5rem;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
}

.products-table th,
.products-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.products-table th {
  background: #f5f5f7;
  font-weight: 600;
  color: #424245;
}

.stock-input {
  width: 80px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.stock-input:focus {
  border-color: rgba(0, 0, 0, 0.12);
  outline: none;
  box-shadow: none;
}

.save-button {
  background: var(--app-green-accent, #16a34a);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.875rem;
  transition: background-color 0.2s ease;
}

.save-button:hover {
  background: var(--app-green-accent-hover, #15803d);
}

.save-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error {
  color: #d90429;
  text-align: center;
  padding: 1rem;
  background: #fff5f5;
  border-radius: 4px;
  margin: 1rem 0;
}
</style> 