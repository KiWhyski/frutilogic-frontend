<script>
import {
  getInventoryErrorMessage,
  InventoryService,
} from "@/inventory-management/services/inventory.service.js";
import { ProductService } from "@/inventory-management/services/product.service.js";
import { WarehouseService } from "@/inventory-management/services/warehouse.service.js";
import { Select as PvSelect } from "primevue";

const inventoryService = new InventoryService();
const productService = new ProductService();

export default {
  name: 'inventory-products',
  components: {PvSelect},
  data() {
    return {
      availableProducts: [],
      addProductDialog: false,
      addProductData: {
        selectedProductId: null,
        quantity: 1,
        expirationDate: null
      },
      products: [],
      productDialog: false,
      stockDialog: false,
      deleteProductDialog: false,
      deleteProductsDialog: false,
      product: {},
      selectedProducts: null,
      searchQuery: '',
      submitted: false,
      statuses: [
        { label: 'WithStock', value: 'WithStock' },
        { label: 'OutOfStock', value: 'OutOfStock' }
      ],
      warehouseId: null,
      stockOperation: 'add',
      stockData: {
        quantity: 1,
        expirationDate: null
      },
      transferDialogVisible: false,
      transferWarehouseOptions: [],
      transferTargetWarehouseId: null,
    };
  },
  watch: {
    '$route.params.warehouseId': {
      immediate: false,
      handler(id) {
        this.warehouseId = id ?? null;
        this.searchQuery = '';
        this.refreshProducts();
      },
    },
  },
  created() {
    this.warehouseId = this.$route.params.warehouseId ?? null;
  },
  async mounted() {
    try {
      await this.refreshProducts();
    } catch (error) {
      console.error(error);
    }
  },
  methods: {
    async fetchAvailableProducts() {
      const accountId = 'test-acc';
      const response = await productService.getAllByAccountId(accountId);
      this.availableProducts = response.data;
    },
    async openAddProductDialog() {
      await this.fetchAvailableProducts();
      this.addProductData = {
        selectedProductId: null,
        quantity: 1,
        expirationDate: new Date()
      };
      this.addProductDialog = true;
    },
    async handleAddProduct() {
      try {
        const formattedDate = this.toDateOnlyString(this.addProductData.expirationDate);

        await inventoryService.addProduct(
            this.addProductData.selectedProductId,
            this.warehouseId,
            this.addProductData.quantity,
            formattedDate
        );

        this.$toast.add({
          severity: 'success',
          summary: this.$t('toast.success'),
          detail: this.$t('inventory.stock-added'),
          life: 3000
        });

        this.addProductDialog = false;
        await this.refreshProducts();
      } catch (error) {
        this.$toast.add({
          severity: 'error',
          summary: this.$t('toast.error'),
          detail: getInventoryErrorMessage(error, this.$t('inventory.error-past-date')),
          life: 5000
        });
      }
    },
    async openTransferDialog() {
      const n = this.transferSelectedCount;
      if (n === 0) {
        this.$toast.add({
          severity: 'warn',
          summary: this.$t('toast.info'),
          detail: this.$t('inventory.transfer-select-products'),
          life: 4000,
        });
        return;
      }

      let options = [];
      try {
        const warehouseService = new WarehouseService();
        const list = await warehouseService.getWarehousesByAccountId();
        options = list.map((w) => ({ warehouseId: w.warehouseId, name: w.name }));
      } catch (e) {
        console.warn(e);
      }

      options = options.filter((w) => w.warehouseId !== this.warehouseId);

      if (options.length === 0) {
        this.$toast.add({
          severity: 'error',
          summary: this.$t('toast.error'),
          detail: this.$t('inventory.transfer-error-no-destinations'),
          life: 5000,
        });
        return;
      }

      this.transferWarehouseOptions = options;
      this.transferTargetWarehouseId = options[0].warehouseId;
      this.transferDialogVisible = true;
    },
    async confirmTransfer() {
      if (!this.transferTargetWarehouseId) return;
      const target = this.transferWarehouseOptions.find(
        (w) => w.warehouseId === this.transferTargetWarehouseId
      );
      const n = this.transferSelectedCount;
      if (this.selectedProducts.some((product) => product.currentStock <= 0)) {
        this.$toast.add({
          severity: 'error',
          summary: this.$t('toast.error'),
          detail: this.$t('inventory.stock-reduced-error'),
          life: 5000,
        });
        return;
      }

      try {
        await Promise.all(this.selectedProducts.map((product) =>
          inventoryService.transferProduct(
            product.productId,
            this.warehouseId,
            this.transferTargetWarehouseId,
            product.currentStock,
            product.bestBeforeDate
          )
        ));
        this.$toast.add({
          severity: 'success',
          summary: this.$t('toast.success'),
          detail: `${n} producto(s) transferido(s) a «${target?.name ?? this.transferTargetWarehouseId}».`,
          life: 4500,
        });
        this.transferDialogVisible = false;
        this.selectedProducts = null;
        await this.refreshProducts();
      } catch (error) {
        this.$toast.add({
          severity: 'error',
          summary: this.$t('toast.error'),
          detail: getInventoryErrorMessage(error),
          life: 5000,
        });
      }
    },
    async refreshProducts() {
      if (!this.warehouseId) {
        this.products = [];
        return;
      }
      try {
        this.products = await inventoryService.getAllProductsByWarehouseId(this.warehouseId);
      } catch (e) {
        console.error(e);
        this.products = [];
      }
    },
    formatCurrency(value) {
      return value ? value.toLocaleString('es-Pe', {style: 'currency', currency: 'PEN'}) : '';
    },
    toDateOnlyString(date) {
      return date.getFullYear() + '-' +
          String(date.getMonth() + 1).padStart(2, '0') + '-' +
          String(date.getDate()).padStart(2, '0');
    },
    openStockDialog(product, operation = 'add') {
      this.product = {...product};
      this.stockOperation = operation;

      this.stockData = {
        quantity: 1,
        expirationDate: product.bestBeforeDate
            ? new Date(product.bestBeforeDate + 'T12:00:00')
            : new Date()
      };

      this.stockDialog = true;
    },
    async handleStockOperation() {
      try {
        if (!this.stockData.expirationDate) {
          this.$toast.add({
            severity: 'error',
            summary: this.$t('toast.error'),
            detail:  this.$t('inventory.valid-date'),
            life: 5000
          });
          return;
        }

        if (this.stockOperation === 'subtract' && this.stockData.quantity > this.product.currentStock) {
          this.$toast.add({
            severity: 'error',
            summary: this.$t('toast.error'),
            detail: this.$t('inventory.stock-reduced-error'),
            life: 5000
          });
          return;
        }

        const formattedDate = this.toDateOnlyString(this.stockData.expirationDate);

        if (this.stockOperation === 'add') {
          console.log(formattedDate);
          await inventoryService.addStock(
              this.product.productId,
              this.warehouseId,
              this.stockData.quantity,
              formattedDate
          );
        } else {
          await inventoryService.subtractStock(
              this.product.productId,
              this.warehouseId,
              this.stockData.quantity,
              formattedDate
          );
        }

        this.$toast.add({
          severity: 'success',
          summary: this.$t('toast.success'),
          detail: this.stockOperation === 'add'
              ? this.$t('inventory.stock-added')
              : this.$t('inventory.stock-reduced'),
          life: 3000
        });

        await this.refreshProducts();
        this.stockDialog = false;
      } catch (error) {
        this.$toast.add({
          severity: 'error',
          summary: 'Error',
          detail: getInventoryErrorMessage(error, 'Error processing stock operation'),
          life: 5000
        });
      }
    },
    async handleDeleteProduct() {
      try {
        if (this.product.currentStock !== 0) {
          throw new Error(this.$t('inventory.delete-product-current-stock'));
        }

        await inventoryService.deleteInventory(this.product.inventoryId);

        this.$toast.add({
          severity: 'success',
          summary: this.$t('toast.success'),
          detail: this.$t('inventory.product-deleted'),
          life: 3000
        });

        await this.refreshProducts();
        this.deleteProductDialog = false;

      } catch (error) {

        this.$toast.add({
          severity: 'error',
          summary: this.$t('toast.error'),
          detail: getInventoryErrorMessage(error, this.$t('inventory.delete-product-current-stock')),
          life: 5000
        });

        this.deleteProductDialog = false;
      }
    },
    confirmDeleteProduct(product) {
      this.product = product;
      this.deleteProductDialog = true;
    },
    exportCSV() {
      this.$refs.dt?.exportCSV();
    },
    getStatusLabel(status) {
      switch (status) {
        case 'WithStock': return 'success';
        case 'OutOfStock': return 'danger';
        case 'LowStock': return 'warning';
        default: return null;
      }
    }
  },
  computed: {
    addProductMinDate() {
      return new Date(new Date().setDate(new Date().getDate() + 1));
    },
    filteredInventoryProducts() {
      const q = (this.searchQuery || '').trim().toLowerCase();
      if (!q) {
        return this.products;
      }
      return this.products.filter((p) => {
        const hay = [p.name, p.type, p.productId, p.bestBeforeDate, p.status]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    },
    hasNoSearchMatches() {
      return (
        this.products.length > 0 &&
        this.filteredInventoryProducts.length === 0 &&
        (this.searchQuery || '').trim() !== ''
      );
    },
    transferSelectedCount() {
      return Array.isArray(this.selectedProducts) ? this.selectedProducts.length : 0;
    },
  },
};
</script>

<template>
  <div class="inventory-page">
    <div class="products-toolbar">
      <div class="products-toolbar__inner">
        <div class="search-field">
          <i class="pi pi-search search-field__icon" aria-hidden="true" />
          <input
            v-model="searchQuery"
            type="search"
            class="search-field__input"
            :class="{ 'search-field__input--has-clear': searchQuery }"
            :placeholder="$t('inventory.search-placeholder')"
            :aria-label="$t('inventory.search-placeholder')"
            autocomplete="off"
            enterkeyhint="search"
          />
          <button
            v-show="searchQuery"
            type="button"
            class="search-field__clear"
            :aria-label="$t('products.search-clear')"
            @click="searchQuery = ''"
          >
            <i class="pi pi-times" aria-hidden="true" />
          </button>
        </div>
        <div class="limits-pill" role="status">
          <span class="limits-pill__icon-wrap" aria-hidden="true">
            <i class="pi pi-box limits-pill__icon" />
          </span>
          <p class="limits-pill__text">
            {{ $t('inventory.summary-pill', { count: products.length }) }}
          </p>
        </div>
      </div>
    </div>

    <div v-if="products.length > 0 && hasNoSearchMatches" class="search-empty">
      <p class="search-empty__text">{{ $t('inventory.search-no-results') }}</p>
    </div>

    <div v-else class="inventory-panel">
      <pv-toolbar class="inventory-panel__toolbar">
        <template #start>
          <pv-button
            :label="$t('components.add')"
            icon="pi pi-plus-circle"
            class="inv-toolbar-btn inv-toolbar-btn--primary mr-2"
            @click="openAddProductDialog"
          />
          <pv-button
            :label="$t('inventory.transfer-product')"
            icon="pi pi-arrow-right"
            class="inv-toolbar-btn inv-toolbar-btn--outline mr-2"
            @click="openTransferDialog"
          />
        </template>
        <template #end>
          <pv-button
            :label="$t('components.export')"
            icon="pi pi-upload"
            class="inv-toolbar-btn inv-toolbar-btn--ghost"
            @click="exportCSV($event)"
          />
        </template>
      </pv-toolbar>

      <pv-data-table
          ref="dt"
          class="inventory-data-table"
          v-model:selection="selectedProducts"
          :value="filteredInventoryProducts"
          dataKey="id"
          :paginator="true"
          :rows="10"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          :rowsPerPageOptions="[5, 10, 25]"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products"
      >
        <template #header>
          <h4 class="table-section-title">{{ $t('inventory.manage-products') }}</h4>
        </template>

          <pv-column selectionMode="multiple" style="width: 3rem" :exportable="false" />
          <pv-column field="name" :header="$t('inventory.name')" sortable style="min-width: 8rem" />
          <pv-column field="type" :header="$t('inventory.liquor-type')" sortable style="min-width: 8rem" />
          <pv-column field="imageUrl" :header="$t('inventory.image')" sortable style="min-width: 8rem">
            <template #body="slotProps">
              <img v-if="slotProps.data.imageUrl" :src="slotProps.data.imageUrl" alt="Product" class="rounded" style="width: 64px" />
            </template>
          </pv-column>
          <pv-column field="unitPriceAmount" :header="$t('inventory.unit-price')" sortable style="min-width: 8rem">
            <template #body="slotProps">
              {{ formatCurrency(slotProps.data.unitPriceAmount) }}
            </template>
          </pv-column>
          <pv-column field="minimumStock" :header="$t('inventory.minimum-stock')" sortable style="min-width: 10rem" />
          <pv-column field="currentStock" :header="$t('inventory.current-stock')" sortable style="min-width: 8rem" />
          <pv-column field="status" :header="$t('inventory.state')" sortable style="min-width: 8rem">
            <template #body="slotProps">
              <pv-tag :value="$t(`inventory.status.${slotProps.data.status}`)" :severity="getStatusLabel(slotProps.data.status)"/>
            </template>
          </pv-column>
          <pv-column field="bestBeforeDate" :header="$t('inventory.best-date-before')" sortable style="min-width: 8rem"/>
          <pv-column :exportable="false" style="min-width: 8rem">
            <template #body="slotProps">
              <pv-button icon="pi pi-plus" outlined rounded class="mr-2"
                         @click="openStockDialog(slotProps.data, 'add')" />
              <pv-button icon="pi pi-minus" outlined rounded severity="warning" class="mr-2"
                         @click="openStockDialog(slotProps.data, 'subtract')" />
              <pv-button icon="pi pi-trash" outlined rounded severity="danger"
                         @click="confirmDeleteProduct(slotProps.data)"/>
            </template>
          </pv-column>
        </pv-data-table>
    </div>

      <pv-dialog v-model:visible="stockDialog" :style="{ width: '500px' }"
                 :header="stockOperation === 'add' ? $t('inventory.stock-added-title') : $t('inventory.stock-reduced-title')"
                 :modal="true">
        <div class="edit-dialog">
          <div class="image-container">
            <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" class="product-image"/>
          </div>

          <div class="form-grid">
            <div class="col-span-2">
              <label class="block font-bold mb-2">{{ $t('inventory.product-id') }}</label>
              <pv-tag :value="product.productId" class="w-full" />
            </div>

            <div>
              <label class="block font-bold mb-2">{{ $t('inventory.name') }}</label>
              <pv-input-text :modelValue="product.name" disabled />
            </div>

            <div>
              <label class="block font-bold mb-2">{{ $t('inventory.liquor-type') }}</label>
              <pv-input-text :modelValue="product.type" disabled />
            </div>

            <div>
              <label class="block font-bold mb-2">{{ $t('inventory.unit-price') }}</label>
              <pv-input-number
                  :modelValue="product.unitPriceAmount"
                  disabled
                  mode="currency"
                  currency="PEN"
                  locale="es-PE"
              />
            </div>

            <div>
              <label class="block font-bold mb-2">{{ $t('inventory.current-stock') }}</label>
              <pv-input-number :modelValue="product.currentStock" disabled />
            </div>
            <div class="combined-row">
              <div class="quantity-field">
                <label class="block font-bold mb-2">
                  {{ stockOperation === 'add' ? $t('inventory.quantity-add') : $t('inventory.quantity-reduce') }}
                </label>
                <pv-input-number
                    v-model="stockData.quantity"
                    :min="1"
                    :max="stockOperation === 'subtract' ? product.currentStock : null"
                    showButtons
                    :step="1"
                    mode="decimal"
                    :disabled="stockOperation === 'subtract' && product.currentStock <= 0"
                />
              </div>

              <div class="date-field">
                <label class="block font-bold mb-2">
                  {{ stockOperation === 'add' ? $t('inventory.best-date-before') : $t('inventory.best-date-before') }}
                </label>
                <pv-date-picker
                    v-model="stockData.expirationDate"
                    dateFormat="yy-mm-dd"
                    showIcon
                    :minDate="stockOperation === 'add' ? new Date() : null"
                    :showButtonBar="true"
                    inputId="expiration-date"
                />
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="dialog-footer">
            <pv-button :label="$t('components.cancel')" icon="pi pi-times" @click="stockDialog = false" class="p-button-text cancel-btn" />
            <pv-button
                :label="stockOperation === 'add' ? $t('components.save') : $t('components.save')"
                icon="pi pi-check"
                @click="handleStockOperation"
                :class="{
            'p-button-success': stockOperation === 'add',
            'p-button-warning': stockOperation === 'subtract'
          }"
                class="action-btn"
            />
          </div>
        </template>
      </pv-dialog>

      <pv-dialog v-model:visible="addProductDialog" :style="{ width: '450px' }" :modal="true" :header="$t('inventory.add-product')">
        <div class="formgrid grid">
          <div class="field col-12">
            <label class="block mb-2">{{ $t('inventory.select-product') }}</label>
            <pv-select
                v-model="addProductData.selectedProductId"
                :options="availableProducts"
                optionLabel="name"
                optionValue="productId"
                :placeholder="$t('inventory.select-product')"
                filter
            />
          </div>
          <div class="field col-6">
            <label class="block mb-2">{{ $t('inventory.quantity-add') }}</label>
            <pv-input-number v-model="addProductData.quantity" :min="1" showButtons />
          </div>
          <div class="field col-6">
            <label class="block mb-2">{{ $t('inventory.best-date-before') }}</label>
            <pv-date-picker
                v-model="addProductData.expirationDate"
                dateFormat="yy-mm-dd"
                showIcon
                :minDate="addProductMinDate"
                :showButtonBar="true"
            />
          </div>
        </div>
        <template #footer>
          <pv-button :label="$t('components.cancel')" icon="pi pi-times" @click="addProductDialog = false" class="p-button-text" />
          <pv-button :label="$t('components.save')" icon="pi pi-check" @click="handleAddProduct" class="p-button-success" :disabled="!addProductData.selectedProductId"/>
        </template>
      </pv-dialog>

      <pv-dialog v-model:visible="deleteProductDialog" :style="{ width: '450px' }" :header="$t('common.confirmation')" :modal="true">
        <div class="flex items-center gap-4">
          <i class="pi pi-exclamation-triangle !text-3xl" />
          <span>{{ $t('inventory.confirm-delete-product') }}</span>
        </div>
        <template #footer>
          <pv-button :label="$t('components.cancel')" icon="pi pi-times" text @click="deleteProductDialog = false" />
          <pv-button :label="$t('components.confirm')" icon="pi pi-check" severity="danger" @click="handleDeleteProduct" />
        </template>
      </pv-dialog>

      <pv-dialog
        v-model:visible="transferDialogVisible"
        :header="$t('inventory.transfer-dialog-title')"
        :modal="true"
        :draggable="false"
        :style="{ width: 'min(480px, 92vw)' }"
      >
        <p class="transfer-dialog__hint">
          {{ $t('inventory.transfer-dialog-hint', { count: transferSelectedCount }) }}
        </p>
        <div class="transfer-dialog__field">
          <label class="transfer-dialog__label">{{ $t('inventory.transfer-target-warehouse') }}</label>
          <pv-select
            v-model="transferTargetWarehouseId"
            :options="transferWarehouseOptions"
            optionLabel="name"
            optionValue="warehouseId"
            :placeholder="$t('inventory.transfer-target-warehouse')"
            class="w-full"
          />
        </div>
        <template #footer>
          <pv-button
            :label="$t('components.cancel')"
            icon="pi pi-times"
            text
            class="p-button-text"
            @click="transferDialogVisible = false"
          />
          <pv-button
            :label="$t('inventory.transfer-confirm')"
            icon="pi pi-check"
            class="p-button-success"
            :disabled="!transferTargetWarehouseId"
            @click="confirmTransfer"
          />
        </template>
      </pv-dialog>

  </div>
</template>

<style scoped>
.inventory-page {
  --inv-font:
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 0 2rem;
  font-family: var(--inv-font);
}

.products-toolbar {
  max-width: 1280px;
  margin: 0 auto 1.5rem;
  padding: 0 0.5rem;
}

.products-toolbar__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem 1.25rem;
  padding: 0.875rem 1rem 0.875rem 1.125rem;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 6px 20px rgba(0, 0, 0, 0.04);
}

.search-field {
  position: relative;
  flex: 1 1 min(100%, 240px);
  min-width: 0;
  max-width: 440px;
}

.search-field__icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.9rem;
  color: #aeaeb2;
  pointer-events: none;
}

.search-field__input {
  width: 100%;
  box-sizing: border-box;
  height: 44px;
  padding: 0 14px 0 2.55rem;
  font-size: 0.9375rem;
  line-height: 1.35;
  letter-spacing: -0.01em;
  color: #1d1d1f;
  background: #f5f5f7;
  border: 1px solid transparent;
  border-radius: 10px;
  outline: none;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.search-field__input--has-clear {
  padding-right: 2.65rem;
}

.search-field__input::placeholder {
  color: #86868b;
}

.search-field__input:hover {
  background: #ebebed;
}

.search-field__input:focus {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.12);
  box-shadow: none;
  outline: none;
}

.search-field__clear {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #86868b;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.search-field__clear:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #1d1d1f;
}

.search-field__clear .pi {
  font-size: 0.75rem;
}

.limits-pill {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  max-width: min(100%, 360px);
  padding: 0.5rem 0.9rem 0.5rem 0.65rem;
  background: linear-gradient(180deg, #fafafa 0%, #f5f5f7 100%);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
}

.limits-pill__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.limits-pill__icon {
  font-size: 0.95rem;
  color: #6e6e73;
}

.limits-pill__text {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  letter-spacing: -0.015em;
  color: #424245;
  text-align: left;
  font-variant-numeric: tabular-nums;
}

.search-empty {
  max-width: 1280px;
  margin: 2rem auto 0;
  padding: 2rem 1rem;
  text-align: center;
}

.search-empty__text {
  margin: 0;
  font-size: 0.9375rem;
  color: #86868b;
  line-height: 1.5;
}

.inventory-panel {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 6px 20px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.inventory-panel__toolbar {
  margin: 0 !important;
  padding: 0.75rem 1rem 1rem !important;
  border: none !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06) !important;
  border-radius: 0 !important;
  background: transparent !important;
}

.table-section-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #1d1d1f;
  font-family: var(--inv-font);
}

/* Toolbar: primario verde app, secundarios neutros */
.inventory-page :deep(.inv-toolbar-btn.inv-toolbar-btn--primary) {
  background: var(--app-green-accent, #16a34a) !important;
  border-color: var(--app-green-accent, #16a34a) !important;
  color: #ffffff !important;
}

.inventory-page :deep(.inv-toolbar-btn.inv-toolbar-btn--primary:hover) {
  background: var(--app-green-accent-hover, #15803d) !important;
  border-color: var(--app-green-accent-hover, #15803d) !important;
  color: #ffffff !important;
}

.inventory-page :deep(.inv-toolbar-btn.inv-toolbar-btn--outline) {
  background: #ffffff !important;
  border: 1px solid rgba(0, 0, 0, 0.12) !important;
  color: #1d1d1f !important;
}

.inventory-page :deep(.inv-toolbar-btn.inv-toolbar-btn--outline:hover) {
  background: #f5f5f7 !important;
  border-color: rgba(0, 0, 0, 0.16) !important;
  color: var(--app-green-accent, #16a34a) !important;
}

.inventory-page :deep(.inv-toolbar-btn.inv-toolbar-btn--ghost) {
  background: transparent !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  color: #424245 !important;
}

.inventory-page :deep(.inv-toolbar-btn.inv-toolbar-btn--ghost:hover) {
  background: #f5f5f7 !important;
  border-color: rgba(0, 0, 0, 0.14) !important;
  color: #1d1d1f !important;
}

/* Tabla: cabecera y cuerpo alineados con el resto de la UI */
.inventory-page :deep(.inventory-data-table .p-datatable-header) {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: #ffffff;
}

.inventory-page :deep(.inventory-data-table .p-datatable-thead > tr > th) {
  background: #fafafa;
  color: #6e6e73;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border-color: rgba(0, 0, 0, 0.06);
  padding: 0.75rem 1rem;
  font-family: var(--inv-font);
}

.inventory-page :deep(.inventory-data-table .p-datatable-tbody > tr) {
  transition: background-color 0.15s ease;
}

.inventory-page :deep(.inventory-data-table .p-datatable-tbody > tr:hover) {
  background: rgba(0, 0, 0, 0.02) !important;
}

.inventory-page :deep(.inventory-data-table .p-datatable-tbody > tr > td) {
  border-color: rgba(0, 0, 0, 0.06);
  padding: 0.75rem 1rem;
  font-size: 0.9375rem;
  color: #1d1d1f;
  font-family: var(--inv-font);
}

.inventory-page :deep(.inventory-data-table .p-paginator) {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding: 0.75rem 1rem;
  background: #fafafa;
  font-family: var(--inv-font);
}

.inventory-page :deep(.inventory-data-table .p-tag.p-tag-success) {
  background: rgba(22, 163, 74, 0.12) !important;
  color: var(--app-green-accent-hover, #15803d) !important;
}

.inventory-page :deep(.inventory-data-table .p-tag.p-tag-danger) {
  background: rgba(220, 38, 38, 0.1) !important;
  color: #b91c1c !important;
}

.inventory-page :deep(.inventory-data-table .p-button.p-button-outlined) {
  border-color: rgba(0, 0, 0, 0.12);
}

.inventory-page :deep(.inventory-data-table .p-button.p-button-outlined:hover) {
  border-color: rgba(0, 0, 0, 0.18);
  background: #f5f5f7;
}

.edit-dialog {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.image-container {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.product-image {
  max-width: 220px;
  max-height: 220px;
  object-fit: contain;
  border-radius: 0.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;
}

.form-grid .col-span-2 {
  grid-column: span 2;
}

.combined-row {
  grid-column: span 2;
  display: flex;
  gap: 1rem;
  align-items: flex-end;
}

.quantity-field {
  flex: 1;
}

.date-field {
  flex: 1;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
  padding: 1rem 0;
  border-top: 1px solid #e5e7eb;
}

.transfer-dialog__hint {
  margin: 0 0 1.25rem;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: #6e6e73;
}

.transfer-dialog__field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.transfer-dialog__label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1d1d1f;
}

.inventory-page :deep(.p-button-success:not(:disabled)) {
  background: var(--app-green-accent, #16a34a) !important;
  border-color: var(--app-green-accent, #16a34a) !important;
}

.inventory-page :deep(.p-button-success:not(:disabled):hover) {
  background: var(--app-green-accent-hover, #15803d) !important;
  border-color: var(--app-green-accent-hover, #15803d) !important;
}

</style>