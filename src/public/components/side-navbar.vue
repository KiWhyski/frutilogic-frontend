<script>
import { useRouter } from 'vue-router';
import { useAuthenticationStore } from '@/authentication/services/authentication.store.js';

/** Ancho fijo del sidebar (debe coincidir con `--sidenav-width` en estilos). */
export const SIDENAV_WIDTH_PX = 280;

export default {
  name: 'side-navbar',
  setup() {
    const router = useRouter();
    const authStore = useAuthenticationStore();

    const handleSignOut = async () => {
      await authStore.signOut(router);
    };

    return {
      handleSignOut,
      sidenavWidthPx: SIDENAV_WIDTH_PX,
    };
  },
};
</script>

<template>
  <div
    class="sidenav-container"
    :class="{ 'sidenav-container--with-slot': !!$slots.default }"
    :style="{ '--sidenav-width': `${sidenavWidthPx}px` }"
  >
    <aside class="sidenav" role="navigation" aria-label="Navegación principal">
      <div class="sidenav-inner">
        <div class="sidenav-logo-zone">
          <slot name="logo">
            <router-link to="/dashboard" custom v-slot="{ navigate }">
              <button
                type="button"
                class="sidenav-brand"
                :aria-label="$t('toolbar.dashboard')"
                @click="navigate"
              >
                <span class="sidenav-brand__text">
                  <span class="sidenav-brand__title">FrutiLogic</span>
                  <span class="sidenav-brand__subtitle">{{ $t('toolbar.brandSubtitle') }}</span>
                </span>
              </button>
            </router-link>
            <div class="sidenav-quick">
              <router-link to="/profile" custom v-slot="{ navigate, isActive }">
                <button
                  type="button"
                  class="sidenav-pill sidenav-pill--outline"
                  :class="{ 'router-link-active': isActive }"
                  @click="navigate"
                >
                  <i class="pi pi-user sidenav-pill__icon" aria-hidden="true"></i>
                  <span>{{ $t('toolbar.profile') }}</span>
                </button>
              </router-link>
            </div>
          </slot>
        </div>

        <div class="sidenav-divider" role="presentation" />

        <nav class="sidenav-main" aria-label="Aplicación">
          <ul class="nav-list">
            <li>
              <router-link to="/dashboard" custom v-slot="{ navigate, isActive }">
                <button
                  type="button"
                  class="nav-item"
                  :class="{ 'router-link-active': isActive }"
                  @click="navigate"
                >
                  <i class="pi pi-chart-bar nav-item__icon" aria-hidden="true"></i>
                  <span class="nav-item__label">{{ $t('toolbar.dashboard') }}</span>
                </button>
              </router-link>
            </li>
            <li>
              <router-link to="/products" custom v-slot="{ navigate, isActive }">
                <button
                  type="button"
                  class="nav-item"
                  :class="{ 'router-link-active': isActive }"
                  @click="navigate"
                >
                  <i class="pi pi-box nav-item__icon" aria-hidden="true"></i>
                  <span class="nav-item__label">{{ $t('toolbar.storage') }}</span>
                </button>
              </router-link>
            </li>
            <li>
              <router-link to="/warehouses" custom v-slot="{ navigate, isActive }">
                <button
                  type="button"
                  class="nav-item"
                  :class="{ 'router-link-active': isActive }"
                  @click="navigate"
                >
                  <i class="pi pi-warehouse nav-item__icon" aria-hidden="true"></i>
                  <span class="nav-item__label">{{ $t('toolbar.inventory') }}</span>
                </button>
              </router-link>
            </li>
            <li>
              <router-link to="/alerts" custom v-slot="{ navigate, isActive }">
                <button
                  type="button"
                  class="nav-item"
                  :class="{ 'router-link-active': isActive }"
                  @click="navigate"
                >
                  <i class="pi pi-bell nav-item__icon" aria-hidden="true"></i>
                  <span class="nav-item__label">{{ $t('toolbar.alerts') }}</span>
                </button>
              </router-link>
            </li>
            <li>
              <router-link to="/image-recognition" custom v-slot="{ navigate, isActive }">
                <button
                  type="button"
                  class="nav-item"
                  :class="{ 'router-link-active': isActive }"
                  @click="navigate"
                >
                  <i class="pi pi-camera nav-item__icon" aria-hidden="true"></i>
                  <span class="nav-item__label">{{ $t('Reconocer Imágenes') }}</span>
                </button>
              </router-link>
            </li>
            <li>
              <router-link to="/catalog" custom v-slot="{ navigate, isActive }">
                <button
                  type="button"
                  class="nav-item"
                  :class="{ 'router-link-active': isActive }"
                  @click="navigate"
                >
                  <i class="pi pi-book nav-item__icon" aria-hidden="true"></i>
                  <span class="nav-item__label">{{ $t('dashboard.access-catalogs') }}</span>
                </button>
              </router-link>
            </li>
            <li>
              <router-link to="/orders" custom v-slot="{ navigate, isActive }">
                <button
                  type="button"
                  class="nav-item"
                  :class="{ 'router-link-active': isActive }"
                  @click="navigate"
                >
                  <i class="pi pi-shopping-cart nav-item__icon" aria-hidden="true"></i>
                  <span class="nav-item__label">{{ $t('toolbar.order') }}</span>
                </button>
              </router-link>
            </li>
          </ul>
        </nav>

        <div class="sidenav-divider" role="presentation" />

        <div class="sidenav-footer">
          <router-link :to="{ name: 'PlanChoose' }" custom v-slot="{ navigate, isActive }">
            <button
              type="button"
              class="sidenav-pill sidenav-pill--outline sidenav-footer__pill"
              :class="{ 'router-link-active': isActive }"
              @click="navigate"
            >
              <i class="pi pi-wallet sidenav-pill__icon" aria-hidden="true"></i>
              <span>{{ $t('toolbar.plans') }}</span>
            </button>
          </router-link>
          <button
            type="button"
            class="sidenav-pill sidenav-pill--danger sidenav-footer__pill"
            @click="handleSignOut"
          >
            <i class="pi pi-power-off sidenav-pill__icon" aria-hidden="true"></i>
            <span>{{ $t('toolbar.sign-out') }}</span>
          </button>
        </div>
      </div>
    </aside>
    <main v-if="$slots.default" class="content">
      <slot></slot>
    </main>
  </div>
</template>

<style scoped>
.sidenav-container {
  --sidenav-width: 280px;
  --sidenav-green-deep: #174d32;
  /* Mismo verde que badge "Bajo" (riesgo de vencimiento) en dashboard */
  --sidenav-green-accent: var(--app-green-accent, #16a34a);
  --sidenav-green-accent-hover: var(--app-green-accent-hover, #15803d);
  --sidenav-green-soft: #e6f4ed;
  --sidenav-green-muted: #3f6b52;
  /* Separación solo arriba y abajo (lateral izquierdo pegado a la pantalla) */
  --sidenav-float: 14px;
  min-height: 100vh;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  align-self: stretch;
  /* Mismo blanco que el panel: los márgenes arriba/abajo no muestran gris */
  background-color: #ffffff;
  box-sizing: border-box;
  flex: 0 0 var(--sidenav-width);
  width: var(--sidenav-width);
  min-width: var(--sidenav-width);
  max-width: var(--sidenav-width);
  padding: var(--sidenav-float) 0;
}

.sidenav-container--with-slot {
  flex: 1 1 auto;
  width: 100%;
  max-width: none;
  min-width: 0;
  padding: var(--sidenav-float) 0;
  background-color: #ffffff;
}

.sidenav {
  flex: 0 0 var(--sidenav-width);
  width: var(--sidenav-width);
  background-color: #ffffff;
  box-sizing: border-box;
  /* Fijo al viewport: no baja al hacer scroll en la página */
  position: fixed;
  left: 0;
  top: var(--sidenav-float);
  height: calc(100vh - 2 * var(--sidenav-float));
  max-height: calc(100vh - 2 * var(--sidenav-float));
  min-height: 0;
  z-index: 1000;
  /* Esquinas solo a la derecha: el borde izquierdo va al ras de la pantalla */
  border-radius: 0 20px 20px 0;
  border: none;
  /* Sombra estilo Apple: suave, difusa, varias capas (separación del contenido) */
  box-shadow:
    1px 0 0 rgba(0, 0, 0, 0.045),
    4px 4px 16px rgba(0, 0, 0, 0.04),
    12px 12px 40px rgba(0, 0, 0, 0.06),
    24px 0 80px -24px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.sidenav-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
}

.sidenav-logo-zone {
  flex-shrink: 0;
  padding: 18px 14px 14px;
  background-color: #ffffff;
}

/* Marca centrada (título + subtítulo) */
.sidenav-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  width: 100%;
  margin: 0 0 14px;
  padding: 0;
  border: none;
  text-decoration: none;
  outline: none;
  color: inherit;
  background: transparent;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  font: inherit;
}

.sidenav-brand:focus-visible {
  border-radius: 12px;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.12);
}

.sidenav-brand__text {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.15;
  width: 100%;
  text-align: center;
}

.sidenav-brand__title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--sidenav-green-deep);
  letter-spacing: -0.02em;
}

.sidenav-brand__subtitle {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--sidenav-green-muted);
}

.sidenav-quick {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidenav-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  text-decoration: none;
  border: none;
  cursor: pointer;
  box-sizing: border-box;
  appearance: none;
  -webkit-appearance: none;
  font-family: inherit;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    opacity 0.15s ease;
}

.sidenav-pill__icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.sidenav-pill--outline {
  background: #ffffff;
  border: 1px solid rgba(60, 60, 67, 0.15);
  color: rgba(60, 60, 67, 0.88);
}

.sidenav-pill--outline:hover {
  background: rgba(60, 60, 67, 0.04);
}

.sidenav-pill--outline.router-link-active {
  background: var(--sidenav-green-accent);
  border-color: var(--sidenav-green-accent);
  color: #ffffff;
}

.sidenav-pill--outline.router-link-active:hover {
  background: var(--sidenav-green-accent-hover);
  border-color: var(--sidenav-green-accent-hover);
  color: #ffffff;
}

.sidenav-pill--outline.router-link-active .sidenav-pill__icon {
  color: rgba(255, 255, 255, 0.95);
}

.sidenav-pill--danger {
  background: rgba(255, 59, 48, 0.12);
  color: #a30f0f;
}

.sidenav-pill--danger:hover {
  background: rgba(255, 59, 48, 0.18);
}

.sidenav-divider {
  flex-shrink: 0;
  height: 1px;
  margin: 0 14px;
  background: rgba(60, 60, 67, 0.08);
}

.sidenav-main {
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 10px 8px;
  -webkit-overflow-scrolling: touch;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 12px;
  text-decoration: none;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: rgba(60, 60, 67, 0.85);
  background: transparent;
  appearance: none;
  -webkit-appearance: none;
  font-family: inherit;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.nav-item:hover {
  background-color: rgba(60, 60, 67, 0.06);
  color: #1d1d1f;
}

.nav-item.router-link-active {
  background-color: var(--sidenav-green-accent);
  color: #ffffff;
  font-weight: 600;
}

.nav-item.router-link-active:hover {
  background-color: var(--sidenav-green-accent-hover);
  color: #ffffff;
}

.nav-item__icon {
  font-size: 1.125rem;
  width: 1.5rem;
  margin-right: 10px;
  color: rgba(60, 60, 67, 0.55);
  flex-shrink: 0;
  transition: color 0.15s ease;
}

.nav-item:hover .nav-item__icon {
  color: var(--sidenav-green-accent);
}

.nav-item.router-link-active .nav-item__icon {
  color: rgba(255, 255, 255, 0.95);
}

.nav-item__label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidenav-footer {
  flex-shrink: 0;
  padding: 12px 14px 18px;
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: #ffffff;
}

.sidenav-footer__pill {
  flex-shrink: 0;
}

.content {
  flex: 1;
  min-width: 0;
  /* El aside está `position: fixed`, no reserva espacio en el flujo: sin esto el
     toolbar y el scroll quedarían debajo del panel lateral. */
  margin-left: var(--sidenav-width);
  padding: 20px;
  overflow-y: auto;
  box-sizing: border-box;
  background-color: #ffffff;
}
</style>
