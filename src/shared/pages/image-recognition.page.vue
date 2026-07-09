<template>
  <div class="recognition-layout">
    <side-navbar />
    <div class="recognition-main">
      <div class="recognition-page">
        <image-recognition-component />

        <!-- Sección adicional: Información sobre cómo funciona -->
        <div class="info-section">
          <div class="info-card">
            <h3>{{ $t('Cómo funciona') }}</h3>
            <ol>
              <li>{{ $t('Presiona "Iniciar Reconocimiento" para acceder a tu cámara web') }}</li>
              <li>{{ $t('El modelo de inteligencia artificial analizará lo que ve la cámara') }}</li>
              <li>{{ $t('Verás predicciones en tiempo real en el lado derecho') }}</li>
              <li>{{ $t('Presiona "Capturar y Guardar" para guardar una predicción') }}</li>
              <li>{{ $t('Accede a tu historial en cualquier momento') }}</li>
            </ol>
          </div>

          <div class="info-card">
            <h3>{{ $t('Consejos para mejores resultados') }}</h3>
            <ul>
              <li>{{ $t('Asegúrate de tener buena iluminación') }}</li>
              <li>{{ $t('Posiciona el objeto directamente frente a la cámara') }}</li>
              <li>{{ $t('Evita reflejos de luz directa') }}</li>
              <li>{{ $t('Intenta desde diferentes ángulos') }}</li>
              <li>{{ $t('La confianza superior al 80% es generalmente buena') }}</li>
            </ul>
          </div>

          <div class="info-card">
            <h3>{{ $t('Clases reconocidas') }}</h3>
            <div class="classes-list">
              <span v-for="cls in recognizedClasses" :key="cls" class="class-badge">
                {{ cls }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { usePredictionsStore } from '@/shared/services/predictions.store.js';
import ImageRecognitionComponent from '@/shared/components/image-recognition.component.vue';
import SideNavbar from '@/public/components/side-navbar.vue';

const { t } = useI18n();
const predictionsStore = usePredictionsStore();

// Las clases reconocidas por tu modelo
const recognizedClasses = ref([
  'Manzana',
  'Plátano',
  'Naranja',
  'Fresa',
  'Uva'
  // Reemplaza con tus clases reales
]);

// Cargar estadísticas cuando el componente se monta
const stats = computed(() => predictionsStore.stats);
</script>

<style scoped>
.recognition-layout {
  min-height: 100vh;
  display: flex;
  align-items: stretch;
}

.recognition-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.recognition-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 24px 32px;
  min-height: 100%;
  background: #ffffff;
}

/* Sección de información */
.info-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 40px;
}

.info-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.info-card h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
  font-size: 1.3rem;
}

.info-card ol,
.info-card ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
  line-height: 1.8;
}

.info-card li {
  margin-bottom: 10px;
}

.info-card li:last-child {
  margin-bottom: 0;
}

/* Lista de clases */
.classes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.class-badge {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 15px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: transform 0.3s;
}

.class-badge:hover {
  transform: translateY(-2px);
}

/* Responsive */
@media (max-width: 768px) {
  .recognition-page {
    padding: 15px;
  }

  .info-section {
    grid-template-columns: 1fr;
  }

  .info-card {
    padding: 20px;
  }
}
</style>

