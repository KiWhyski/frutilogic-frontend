<script>
import { ProductService } from '@/inventory-management/services/product.service.js';
import Button from 'primevue/button';
import { InputNumber as PvInputNumber, InputText as PvInputText, Select as PvSelect } from 'primevue';

const productService = new ProductService();

export default {
  name: 'ProductForm',
  components: {
    PvSelect,
    PvInputNumber,
    PvInputText,
    Button,
  },
  props: {
    /** Si viene, modo edición y se carga el producto */
    productId: {
      type: String,
      default: null,
    },
    /** true = dentro de modal: no navega, emite saved / cancelled */
    embedded: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['saved', 'cancelled'],
  data() {
    return {
      product: {
        name: '',
        brandName: '',
        liquorType: '',
        unitPriceAmount: 0,
        minimumStock: 1,
        content: 1,
        imageUrl: '',
      },
      fruitTypes: [
        { label: 'Manzana', value: 'Apples' },
        { label: 'Plátano', value: 'Bananas' },
        { label: 'Naranja', value: 'Oranges' },
        { label: 'Uva', value: 'Grapes' },
        { label: 'Fresa', value: 'Strawberries' },
        { label: 'Mango', value: 'Mangos' },
        { label: 'Piña', value: 'Pineapples' },
        { label: 'Palta', value: 'Avocados' },
        { label: 'Arándano', value: 'Blueberries' },
        { label: 'Kiwi', value: 'Kiwis' },
        { label: 'Pera', value: 'Pears' },
        { label: 'Sandía', value: 'Watermelons' },
        { label: 'Otro', value: 'Others' },
      ],
      brandNames: [
        { label: 'Fruticultores del Sur', value: 'FruticultoresDelSur' },
        { label: 'ExportPerú', value: 'ExportPeru' },
        { label: 'AgroAndes', value: 'AgroAndes' },
        { label: 'Huertos Unión', value: 'HuertosUnion' },
        { label: 'EcoCampo', value: 'EcoCampo' },
        { label: 'El Paraíso Verde', value: 'ElParaisoVerde' },
        { label: 'Valle Fresco', value: 'ValleFresco' },
        { label: 'Costa Natural', value: 'CostaNatural' },
        { label: 'Selva Dorada', value: 'SelvaDorada' },
        { label: 'Sierra Fruits', value: 'SierraFruits' },
        { label: 'Sin marca', value: 'NoBrand' },
      ],
      isEditMode: false,
      selectedFile: null,
      submitting: false,
      existingImageUrl: null,
      newImagePreview: null,
    };
  },
  watch: {
    productId: {
      handler() {
        this.loadProduct();
      },
      immediate: false,
    },
  },
  created() {
    this.loadProduct();
  },
  methods: {
    resetCreateForm() {
      this.product = {
        name: '',
        brandName: '',
        liquorType: '',
        unitPriceAmount: 0,
        minimumStock: 1,
        content: 1,
        imageUrl: '',
      };
      this.selectedFile = null;
      this.newImagePreview = null;
      this.existingImageUrl = null;
      this.isEditMode = false;
    },
    async loadProduct() {
      const id = this.productId;
      if (id) {
        this.isEditMode = true;
        try {
          const data = await productService.getById(id);
          this.product = {
            name: data.name,
            brandName: data.brandName,
            liquorType: data.liquorType,
            unitPriceAmount: data.unitPriceAmount,
            minimumStock: data.minimumStock,
            content: data.content || 1,
            imageUrl: data.imageUrl,
          };
          this.existingImageUrl = data.imageUrl || null;
          this.selectedFile = null;
          this.newImagePreview = null;
        } catch (err) {
          console.error('Error loading product:', err);
        }
      } else {
        this.resetCreateForm();
      }
    },
    uploadImage(event) {
      const file = event.target.files[0];
      if (!file) return;
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.newImagePreview = e.target.result;
        this.product.imageUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    onCancel() {
      if (this.embedded) {
        this.$emit('cancelled');
      } else {
        this.$router.push({ name: 'ProductList' });
      }
    },
    async onSave() {
      if (!String(this.product.name || '').trim() || !this.product.brandName || !this.product.liquorType) {
        this.$toast.add({
          severity: 'warn',
          summary: this.$t('toast.info'),
          detail: this.$t('components.complete-data'),
          life: 3000,
        });
        return;
      }

      this.submitting = true;
      const toast = this.$toast;
      try {
        if (this.isEditMode && this.productId) {
          await productService.updateProduct(this.productId, this.product, this.selectedFile);
          toast.add({
            severity: 'success',
            summary: this.$t('toast.success'),
            detail: this.$t('products.success-updated'),
            life: 3000,
          });
        } else {
          await productService.createProduct(this.product, this.selectedFile);
          toast.add({
            severity: 'success',
            summary: this.$t('toast.success'),
            detail: this.$t('products.success-created'),
            life: 3000,
          });
        }
        if (this.embedded) {
          this.$emit('saved');
        } else {
          this.$router.push({ name: 'ProductList' });
        }
      } catch (error) {
        const detail = error?.userMessage
          || error?.response?.data?.detail
          || (typeof error?.response?.data === 'string' ? error.response.data : null)
          || this.$t('products.save-error');
        toast.add({
          severity: 'error',
          summary: this.$t('toast.error'),
          detail,
          life: 5000,
        });
        console.error('Error saving product:', error);
      } finally {
        this.submitting = false;
      }
    },
  },
};
</script>

<template>
  <div class="form-card" :class="{ 'form-card--embedded': embedded }">
    <h2 v-if="!embedded" class="form-title">
      {{ isEditMode ? $t('products.form-heading-edit') : $t('products.form-heading-new') }}
    </h2>
    <div class="form-grid">
      <div class="form-group">
        <label>{{ $t('products.name') }} <span class="important">*</span></label>
        <pv-input-text v-model="product.name" class="form-input" placeholder="Manzana Fuji" />
      </div>

      <div class="form-group">
        <label>{{ $t('products.brand') }} <span class="important">*</span></label>
        <pv-select
          v-model="product.brandName"
          :options="brandNames"
          option-label="label"
          option-value="value"
          :placeholder="$t('products.placeholder-brand')"
          class="p-select"
        />
      </div>

      <div class="form-group">
        <label>{{ $t('products.liquor-type') }}<span class="important">*</span></label>
        <pv-select
          v-model="product.liquorType"
          :options="fruitTypes"
          option-label="label"
          option-value="value"
          :placeholder="$t('products.placeholder-liquor-type')"
          class="p-select"
        />
      </div>

      <div class="form-group">
        <label>{{ $t('products.price') }} (S/)<span class="important">*</span></label>
        <pv-input-number v-model="product.unitPriceAmount" mode="currency" currency="PEN" locale="es-PE" />
      </div>

      <div class="form-group">
        <label>{{ $t('products.minimum-stock') }}<span class="important">*</span></label>
        <pv-input-number v-model="product.minimumStock" :min="0" />
      </div>

      <div class="form-group">
        <label>{{ $t('products.content-kg') }}</label>
        <pv-input-number v-model="product.content" :min="0.1" :max-fraction-digits="2" suffix=" kg" />
      </div>

      <div class="form-group full-width image-section">
        <label>{{ $t('products.products-image') }}</label>
        <div class="image-upload-container">
          <label for="product-form-file-upload" class="upload-button">
            <span>+ {{ $t('components.upload-file') }}</span>
            <input
              id="product-form-file-upload"
              type="file"
              accept="image/*"
              style="display: none"
              @change="uploadImage"
            />
          </label>
          <span class="file-name">{{ selectedFile ? selectedFile.name : $t('components.no-chosen-file') }}</span>
        </div>

        <div v-if="product.imageUrl && !newImagePreview" class="image-preview">
          <p>{{ $t('components.actual-image') }}:</p>
          <img :src="product.imageUrl" :alt="product.name" />
        </div>

        <div v-if="newImagePreview" class="image-preview">
          <p>{{ $t('components.preview') }}:</p>
          <img :src="newImagePreview" :alt="product.name" />
        </div>
      </div>
    </div>

    <div class="form-actions">
      <div class="right-actions">
        <Button
          :label="embedded ? $t('components.cancel') : $t('products.back')"
          class="cancel-button"
          type="button"
          :disabled="submitting"
          @click="onCancel"
        />
        <Button
          :label="$t('components.save')"
          class="submit-button"
          type="button"
          :loading="submitting"
          :disabled="submitting"
          @click="onSave"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 800px;
  margin: 0 auto;
}

.form-card--embedded {
  box-shadow: none;
  max-width: none;
  margin: 0;
  padding: 0.25rem 0 0;
  border-radius: 0;
}

.form-title {
  color: #333;
  margin-bottom: 2rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group.full-width {
  grid-column: span 2;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #444;
}

.form-input {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.p-select {
  width: 100%;
}

.p-inputnumber {
  width: 100%;
}

.p-inputnumber :deep(input) {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  box-sizing: border-box;
}

.image-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.image-upload-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
}

.upload-button {
  background-color: var(--app-green-accent, #16a34a);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s;
}

.upload-button:hover {
  background-color: var(--app-green-accent-hover, #15803d);
}

.file-name {
  color: #666;
  font-size: 0.9rem;
}

.image-preview {
  margin-top: 1rem;
}

.image-preview img {
  max-width: 200px;
  max-height: 150px;
  border-radius: 6px;
  border: 1px solid #eee;
  margin-top: 0.5rem;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.right-actions {
  display: flex;
  gap: 1rem;
  margin-left: auto;
}

.cancel-button {
  background-color: #f0f0f0;
  color: #333;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.cancel-button:hover {
  background-color: #e0e0e0;
}

.submit-button {
  background-color: var(--app-green-accent, #16a34a);
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-button:hover {
  background-color: var(--app-green-accent-hover, #15803d);
}

.important {
  color: #ea1c18;
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-group.full-width {
    grid-column: span 1;
  }
}
</style>
