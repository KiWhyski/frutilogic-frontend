<template>
  <article class="product-card">
    <div class="product-card__media">
      <img
        v-if="showImage"
        :src="product.imageUrl"
        :alt="displayName"
        class="product-card__img"
        loading="lazy"
        @error="onImageError"
      />
      <div v-else class="product-card__placeholder" aria-hidden="true">
        <i class="pi pi-image" />
      </div>
    </div>

    <div class="product-card__body">
      <h3 class="product-card__title">{{ displayName }}</h3>
      <p class="product-card__meta">
        <span class="product-card__brand">{{ displayBrand }}</span>
        <span class="product-card__dot" aria-hidden="true">·</span>
        <span class="product-card__type">{{ displayFruitType }}</span>
      </p>

      <dl class="product-card__stats">
        <div class="product-card__stat">
          <dt class="product-card__stat-label">{{ $t('products.card.price') }}</dt>
          <dd class="product-card__stat-value">{{ displayPrice }}</dd>
        </div>
        <div class="product-card__stat">
          <dt class="product-card__stat-label">{{ $t('products.card.minimum-stock') }}</dt>
          <dd class="product-card__stat-value">{{ displayMinimumStock }}</dd>
        </div>
      </dl>
    </div>

    <footer class="product-card__footer">
      <button
        type="button"
        class="product-card__action"
        :aria-label="$t('components.edit')"
        @click="$emit('edit', product.productId)"
      >
        <i class="pi pi-pencil" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="product-card__action product-card__action--danger"
        :aria-label="$t('components.delete')"
        @click="$emit('delete', product.productId)"
      >
        <i class="pi pi-trash" aria-hidden="true" />
      </button>
    </footer>
  </article>
</template>

<script>
import { Product } from '@/inventory-management/model/product.entity.js';

export default {
  name: 'ProductItem',
  props: {
    product: { type: Product, required: true },
  },
  data() {
    return {
      imageFailed: false,
    };
  },
  computed: {
    showImage() {
      return Boolean(this.product.imageUrl) && !this.imageFailed;
    },
    displayName() {
      return this.product.name;
    },
    displayBrand() {
      return this.product.brandName;
    },
    displayFruitType() {
      return this.product.liquorType;
    },
    displayPrice() {
      const amount = this.product.unitPriceAmount ?? 0;
      return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
      }).format(amount);
    },
    displayMinimumStock() {
      return this.product.updatedMinimumStock ?? this.product.minimumStock ?? 0;
    },
  },
  watch: {
    product: {
      handler() {
        this.imageFailed = false;
      },
      deep: true,
    },
  },
  methods: {
    onImageError() {
      this.imageFailed = true;
    },
  },
};
</script>

<style scoped>
.product-card {
  --card-radius: 18px;
  --card-border: rgba(0, 0, 0, 0.06);
  --card-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  --card-shadow-hover: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #ffffff;
  border-radius: var(--card-radius);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-shadow);
  overflow: hidden;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    'SF Pro Text',
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
  transition:
    box-shadow 0.25s ease,
    border-color 0.25s ease;
}

.product-card:hover {
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: var(--card-shadow-hover);
}

.product-card__media {
  position: relative;
  aspect-ratio: 4 / 3;
  background: #f5f5f7;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.product-card__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 1rem 1.25rem;
  box-sizing: border-box;
}

.product-card__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #c7c7cc;
  font-size: 2rem;
}

.product-card__body {
  flex: 1;
  padding: 1.125rem 1.25rem 0.75rem;
  min-height: 0;
}

.product-card__title {
  margin: 0 0 0.35rem;
  font-size: 1.0625rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.3;
  color: #1d1d1f;
}

.product-card__meta {
  margin: 0 0 1rem;
  font-size: 0.8125rem;
  font-weight: 400;
  line-height: 1.4;
  letter-spacing: -0.01em;
  color: #86868b;
}

.product-card__dot {
  margin: 0 0.2em;
  opacity: 0.85;
}

.product-card__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem 1rem;
  margin: 0;
}

.product-card__stat {
  margin: 0;
}

.product-card__stat-label {
  margin: 0 0 0.2rem;
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #aeaeb2;
}

.product-card__stat-value {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: #1d1d1f;
}

.product-card__footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem 1rem;
  margin-top: auto;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  background: rgba(255, 255, 255, 0.6);
}

.product-card__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: #424245;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.product-card__action:hover {
  background: #f5f5f7;
  border-color: rgba(0, 0, 0, 0.14);
  color: #1d1d1f;
}

.product-card__action:not(.product-card__action--danger):hover {
  color: var(--app-green-accent, #16a34a);
  border-color: rgba(0, 0, 0, 0.12);
  background: #f5f5f7;
}

.product-card__action:active {
  transform: scale(0.96);
}

.product-card__action--danger {
  color: #6e6e73;
  border-color: rgba(0, 0, 0, 0.08);
}

.product-card__action--danger:hover {
  color: #c41e3a;
  border-color: rgba(196, 30, 58, 0.25);
  background: rgba(196, 30, 58, 0.06);
}
</style>
