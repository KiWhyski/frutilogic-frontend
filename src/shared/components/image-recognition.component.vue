<template>
  <div class="image-recognition-container">
    <!-- Header -->
    <div class="recognition-header">
      <h2>{{ $t('Reconocimiento de Imágenes') }}</h2>
      <p class="subtitle">{{ $t('Detecta y clasifica objetos con inteligencia artificial') }}</p>
    </div>

    <!-- Mensajes de estado -->
    <div v-if="successMessage" class="alert alert-success">
      {{ successMessage }}
    </div>
    <div v-if="error" class="alert alert-error">
      {{ error }}
    </div>
    <div v-if="apiHealthy === false" class="alert alert-warning">
      ⚠️ {{ $t('API de clasificación no disponible') }}
    </div>

    <!-- Contenido principal -->
    <div class="recognition-content">
      <!-- Sección de cámara/Imagen -->
      <div class="camera-section">
        <div class="tabs-control">
          <button
              @click="activeTab = 'camera'"
              :class="{ active: activeTab === 'camera' }"
              class="tab-btn"
          >
            📷 {{ $t('Cámara') }}
          </button>
          <button
              @click="activeTab = 'upload'"
              :class="{ active: activeTab === 'upload' }"
              class="tab-btn"
          >
            📁 {{ $t('Subir Imagen') }}
          </button>
          <button
              @click="openFilePicker"
              :disabled="loading"
              class="btn btn-outline"
          >
            {{ $t('Subir Foto') }}
          </button>
          <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="file-input-hidden"
              @change="handleImageUpload"
          />
        </div>

        <!-- Tab: Cámara -->
        <div v-if="activeTab === 'camera'" class="camera-container">
          <video
              ref="video"
              class="video-stream"
              :width="WEBCAM_WIDTH"
              :height="WEBCAM_HEIGHT"
              playsinline
          ></video>
          <canvas
              ref="canvas"
              :width="WEBCAM_WIDTH"
              :height="WEBCAM_HEIGHT"
              style="display: none;"
          ></canvas>

          <!-- Controles de cámara -->
          <div class="controls">
            <button
                v-if="!cameraReady"
                @click="initializeCamera"
                :disabled="loading"
                class="btn btn-primary"
            >
              {{ $t('Iniciar Reconocimiento') }}
            </button>
            <button
                v-else
                @click="stopRecognition"
                class="btn btn-secondary"
            >
              {{ $t('Detener') }}
            </button>
            <button
                @click="captureImage"
                :disabled="!cameraReady || !currentBestPrediction || loading"
                class="btn btn-success"
            >
              {{ $t('Capturar y Guardar') }}
            </button>
          </div>
        </div>

        <!-- Tab: Subir Imagen -->
        <div v-if="activeTab === 'upload'" class="upload-container">
          <div class="upload-area" @click="triggerFileInput" @drop="handleDrop" @dragover.prevent @dragenter.prevent>
            <input
                ref="fileInput"
                type="file"
                accept="image/*"
                style="display: none;"
                @change="handleFileSelect"
            />
            <div v-if="!uploadedImage" class="upload-placeholder">
              <p class="icon">📤</p>
              <p class="text">{{ $t('Arrastra una imagen aquí o haz clic para seleccionar') }}</p>
              <p class="subtext">{{ $t('Formatos: JPG, PNG, GIF, WebP') }}</p>
            </div>
            <img v-else :src="uploadedImage" class="uploaded-preview" alt="Imagen subida" />
          </div>

          <!-- Controles de imagen subida -->
          <div v-if="uploadedImage" class="controls">
            <button
                @click="classifyUploadedImage"
                :disabled="loading || !uploadedFile"
                class="btn btn-primary"
            >
              {{ $t('Clasificar Imagen') }}
            </button>
            <button
                @click="saveUploadedPrediction"
                :disabled="!currentBestPrediction || loading"
                class="btn btn-success"
            >
              {{ $t('Guardar Predicción') }}
            </button>
            <button
                @click="clearUploadedImage"
                class="btn btn-secondary"
            >
              {{ $t('Limpiar') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Sección de resultados -->
      <div class="results-section">
        <!-- Predicciones en tiempo real -->
        <div class="results-card">
          <h3>{{ $t('Predicciones en Tiempo Real') }}</h3>

          <div v-if="uploadedResult" class="uploaded-result">
            <span class="uploaded-result__title">{{ $t('Resultado de foto subida') }}</span>
            <span class="uploaded-result__value">
              {{ uploadedResult.label }} ({{ (uploadedResult.confidence * 100).toFixed(1) }}%)
            </span>
          </div>

          <div id="label-container" class="predictions-list">
            <div
                v-for="(prediction, index) in currentPredictions"
                :key="index"
                class="prediction-item"
                :class="{ 'high-confidence': prediction.probability > 0.7 }"
            >
              <span class="label">{{ prediction.className }}</span>
              <div class="confidence-bar">
                <div
                    class="confidence-fill"
                    :style="{ width: (prediction.probability * 100) + '%' }"
                ></div>
              </div>
              <span class="percentage">{{ (prediction.probability * 100).toFixed(1) }}%</span>
            </div>
          </div>

          <!-- Predicción actual -->
          <div v-if="currentBestPrediction" class="current-prediction">
            <h4>{{ $t('Detección Actual') }}</h4>
            <div class="prediction-badge">
              <span class="class-name">{{ currentBestPrediction.className }}</span>
              <span class="confidence-badge">
                {{ (currentBestPrediction.probability * 100).toFixed(1) }}%
              </span>
            </div>

            <div class="freshness-status" v-if="freshnessResult">
              <span class="freshness-label">Estado:</span>
              <span class="freshness-chip" :class="`status-${freshnessResult.status}`">
                {{ freshnessResult.text }}
              </span>
            </div>
          </div>
        </div>

        <!-- Historial de predicciones -->
        <div class="history-card">
          <h3>{{ $t('Historial Reciente') }}</h3>
          <div v-if="recentPredictions.length === 0" class="empty-state">
            {{ $t('No hay predicciones registradas aún') }}
          </div>
          <div v-else class="history-list">
            <div
                v-for="prediction in recentPredictions"
                :key="prediction.id"
                class="history-item"
            >
              <span class="label">{{ prediction.label }}</span>
              <span class="confidence">{{ (prediction.confidence * 100).toFixed(1) }}%</span>
              <span class="date">{{ formatDate(prediction.timestamp) }}</span>
              <button
                  @click="removePrediction(prediction.id)"
                  class="btn-delete"
                  :title="$t('Eliminar')"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { usePredictionsStore } from '@/shared/services/predictions.store.js';
import imageClassificationService from '@/shared/services/image-classification.service.js';

const { t } = useI18n();
const predictionsStore = usePredictionsStore();
const DEFAULT_MODEL_URL = import.meta.env.VITE_TM_MODEL_URL || '/my_model/model.js';
const DEFAULT_METADATA_URL = import.meta.env.VITE_TM_METADATA_URL || '/my_model/metadata.json';

/* ─── Estado de cámara y API ─────────────────────────────────────────────── */
const video         = ref(null);
const canvas        = ref(null);
const fileInput     = ref(null);
const cameraReady   = ref(false);
const isRecognizing = ref(false);
const loading       = ref(false);
const error         = ref(null);
const successMessage = ref(null);
const apiHealthy    = ref(null);
const activeTab     = ref('camera');
const uploadedImage = ref(null);
const uploadedFile  = ref(null);
const fileInputRef  = ref(null);
const uploadedResult = ref(null);

const modelURL        = ref('');
const metadataURL     = ref('');

/* ─── Predicciones ───────────────────────────────────────────────────────── */
const currentPredictions = ref([]);
const classificationInProgress = ref(false);

const currentBestPrediction = computed(() => {
  if (!currentPredictions.value.length) return null;
  return currentPredictions.value.reduce((prev, cur) =>
      prev.probability > cur.probability ? prev : cur
  );
});

const freshnessResult = computed(() => {
  if (!currentBestPrediction.value?.className) return null;

  const label = String(currentBestPrediction.value.className).toLowerCase();
  const positiveWords = ['fresco', 'fresh', 'bueno', 'good', 'sano', 'ripe', 'maduro'];
  const negativeWords = ['podrido', 'rotten', 'malo', 'bad', 'spoiled', 'dañado', 'dañado', 'damage'];

  if (negativeWords.some((word) => label.includes(word))) {
    return { status: 'bad', text: 'No esta en buen estado' };
  }

  if (positiveWords.some((word) => label.includes(word))) {
    return { status: 'good', text: 'Esta en buen estado' };
  }

  // Si el modelo no trae una etiqueta semántica de frescura, lo marcamos como indeterminado.
  return { status: 'unknown', text: 'Estado no determinado' };
});

const recentPredictions = computed(() => predictionsStore.recentPredictions);

/* ─── Constantes de cámara ───────────────────────────────────────────────── */
const WEBCAM_WIDTH  = 400;
const WEBCAM_HEIGHT = 300;
const FLIP          = true;
const CLASSIFICATION_INTERVAL = 2000; // Clasificar cada 2 segundos

/* ─── Loop de reconocimiento ──────────────────────────────────────────────── */
let animationFrame = null;
let classificationTimer = null;
let healthCheckTimer = null;

/* ─── Salud de API ───────────────────────────────────────────────────────── */
async function ensureApiAvailable(showError = false) {
  const healthy = await imageClassificationService.checkHealth();
  apiHealthy.value = healthy;

  if (!healthy && showError) {
    error.value = 'La API de clasificación no está disponible';
  }
  return healthy;
}

function startApiHealthMonitoring() {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
    // Auto-configuración: usa el modelo local por defecto sin intervención del usuario.
    if (!modelURL.value) modelURL.value = DEFAULT_MODEL_URL;
    if (!metadataURL.value) metadataURL.value = DEFAULT_METADATA_URL;

    await loadModelWithURLs();
  } catch (err) {
    error.value = 'No se pudo iniciar el reconocimiento. Verifica que el modelo por defecto exista en /public/my_model.';
    console.error('Error initializing model:', err);
  } finally {
    loading.value = false;
  }

  healthCheckTimer = setInterval(async () => {
    apiHealthy.value = await imageClassificationService.checkHealth();
  }, 10000);
}

/* ─── Inicializar cámara ─────────────────────────────────────────────────── */
async function initializeCamera() {
  loading.value = true;
  error.value   = null;

  try {
    // Verificar salud de la API
    if (!await ensureApiAvailable(true)) {
      throw new Error('La API de clasificación no está disponible');
    }

    // Iniciar verificación periódica de salud
    imageClassificationService.startHealthCheck(30000);

    // Acceder a la cámara
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: WEBCAM_WIDTH },
        height: { ideal: WEBCAM_HEIGHT },
        facingMode: 'environment'
      },
      audio: false
    });
    model.value = await window.tmImage.load(modelURL.value, metadataURL.value);

    const container = document.getElementById('webcam-container');
    if (container) container.innerHTML = '';

    webcam.value = new window.tmImage.Webcam(WEBCAM_WIDTH, WEBCAM_HEIGHT, FLIP);
    await webcam.value.setup();
    await webcam.value.play();

    document.getElementById('webcam-container').appendChild(webcam.value.canvas);

    modelLoaded.value   = true;
    isRecognizing.value = true;
    if (video.value) {
      video.value.srcObject = stream;
      video.value.onloadedmetadata = () => {
        video.value.play();
        cameraReady.value = true;
        isRecognizing.value = true;
        startRecognitionLoop();
      };
    }
  } catch (err) {
    cameraReady.value = false;
    error.value = err.message || 'Error al acceder a la cámara';
    console.error('Error initializing camera:', err);
    modelLoaded.value = false;
    error.value = 'Modelo no disponible. Agrega los archivos exportados de Teachable Machine en /public/my_model.';
    console.error('Error loading model:', err);
  } finally {
    loading.value = false;
  }
}

/* ─── Loop de predicción ─────────────────────────────────────────────────── */
function startRecognitionLoop() {
  if (!isRecognizing.value || !cameraReady.value) return;

  // Dibujar el frame actual en el canvas
  drawVideoToCanvas();

  // Clasificar cada CLASSIFICATION_INTERVAL milisegundos
  classificationTimer = setTimeout(async () => {
    if (isRecognizing.value && cameraReady.value && !classificationInProgress.value) {
      await classifyCurrentFrame();
    }
    startRecognitionLoop();
  }, CLASSIFICATION_INTERVAL);

  // Mantener el loop de canvas actualizado
  animationFrame = window.requestAnimationFrame(startRecognitionLoop);
}

function drawVideoToCanvas() {
  if (!canvas.value || !video.value) return;
  const ctx = canvas.value.getContext('2d');
  if (ctx) {
    ctx.drawImage(video.value, 0, 0, WEBCAM_WIDTH, WEBCAM_HEIGHT);
  }
}

async function classifyCurrentFrame() {
  if (!canvas.value || !apiHealthy.value || classificationInProgress.value) return;

  classificationInProgress.value = true;
  try {
    const result = await imageClassificationService.classifyFromCanvas(canvas.value);

    // Actualizar predicciones actuales
    currentPredictions.value = [{
      className: result.className,
      probability: result.probability
    }];
  } catch (err) {
    // Solo registrar errores ocasionales sin mostrar al usuario durante el loop
    if (!apiHealthy.value) {
      apiHealthy.value = false;
      error.value = 'La API no está disponible';
    }
    console.warn('Classification error:', err);
  } finally {
    classificationInProgress.value = false;
  }
}

/* ─── Capturar imagen ────────────────────────────────────────────────────── */
async function captureImage() {
  if (!canvas.value || !currentBestPrediction.value) {
    error.value = 'No hay predicción para guardar';
    return;
  }

  loading.value = true;
  error.value   = null;

  try {
    const imageBase64 = canvas.value.toDataURL('image/jpeg', 0.8);

    await predictionsStore.savePrediction({
      label:      currentBestPrediction.value.className,
      confidence: currentBestPrediction.value.probability,
      imageBase64,
      metadata: {
        source: 'API Classification',
        freshnessStatus: freshnessResult.value?.status || 'unknown',
        freshnessText: freshnessResult.value?.text || 'Estado no determinado',
        cameraWidth:    WEBCAM_WIDTH,
        cameraHeight:   WEBCAM_HEIGHT
      }
    });

    successMessage.value = `${t('Predicción guardada')}: ${currentBestPrediction.value.className}`;
    setTimeout(() => { successMessage.value = null; }, 3000);
  } catch (err) {
    error.value = err.message || 'Error al guardar la predicción';
    console.error('Error capturing image:', err);
  } finally {
    loading.value = false;
  }
}

function openFilePicker() {
  fileInputRef.value?.click();
}

function readFileAsImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve({ img, imageBase64: reader.result });
      img.onerror = () => reject(new Error('No se pudo procesar la imagen seleccionada'));
      img.src = reader.result;
    };

    reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado'));
    reader.readAsDataURL(file);
  });
}

async function handleImageUpload(event) {
  const file = event.target?.files?.[0];
  if (!file) return;

  try {
    if (!modelLoaded.value || !model.value) {
      await initializeModel();
    }
    if (!model.value) {
      throw new Error('El modelo no está disponible para analizar la imagen');
    }

    loading.value = true;
    error.value = null;

    const { img, imageBase64 } = await readFileAsImage(file);
    const predictions = await model.value.predict(img);
    currentPredictions.value = predictions;

    if (currentBestPrediction.value) {
      uploadedResult.value = {
        label: currentBestPrediction.value.className,
        confidence: currentBestPrediction.value.probability
      };
      await predictionsStore.savePrediction({
        label: currentBestPrediction.value.className,
        confidence: currentBestPrediction.value.probability,
        imageBase64,
        metadata: {
          allPredictions: predictions,
          source: 'file-upload'
        }
      });
      successMessage.value = `${t('Resultado')}: ${currentBestPrediction.value.className} (${(currentBestPrediction.value.probability * 100).toFixed(1)}%)`;
      setTimeout(() => { successMessage.value = null; }, 3000);
    }
  } catch (err) {
    error.value = err.message || 'Error al analizar la imagen cargada';
    console.error('Error uploading image for prediction:', err);
  } finally {
    loading.value = false;
    if (fileInputRef.value) fileInputRef.value.value = '';
  }
}

/* ─── Detener reconocimiento ─────────────────────────────────────────────── */
function stopRecognition() {
  isRecognizing.value = false;
  if (animationFrame) window.cancelAnimationFrame(animationFrame);
  if (classificationTimer) clearTimeout(classificationTimer);
  if (video.value && video.value.srcObject) {
    video.value.srcObject.getTracks().forEach(track => track.stop());
  }
  cameraReady.value = false;
  imageClassificationService.stopHealthCheck();
}

/* ─── Procesar imágenes subidas ───────────────────────────────────────────── */
function triggerFileInput() {
  if (fileInput.value) {
    fileInput.value.click();
  }
}

function handleFileSelect(event) {
  const file = event.target.files?.[0];
  if (file) {
    loadUploadedImage(file);
  }
}

function handleDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  const files = event.dataTransfer?.files;
  if (files?.length > 0) {
    loadUploadedImage(files[0]);
  }
}

async function loadUploadedImage(file) {
  if (!file.type.startsWith('image/')) {
    error.value = 'Por favor selecciona una imagen válida';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    uploadedFile.value = file;
    uploadedImage.value = await imageClassificationService.loadImageFile(file);
    currentPredictions.value = [];
  } catch (err) {
    error.value = 'Error al cargar la imagen';
    console.error('Error loading image:', err);
  } finally {
    loading.value = false;
  }
}

async function classifyUploadedImage() {
  if (!uploadedFile.value) {
    error.value = 'No hay imagen para clasificar';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    if (!await ensureApiAvailable(true)) {
      return;
    }

    const result = await imageClassificationService.classifyImage(uploadedFile.value);
    currentPredictions.value = [{
      className: result.className,
      probability: result.probability
    }];
    successMessage.value = `${t('Clasificación exitosa')}: ${result.className}`;
    setTimeout(() => { successMessage.value = null; }, 3000);
  } catch (err) {
    const baseMessage = err?.message || 'Error al clasificar imagen';
    error.value = baseMessage.includes('status code 500')
      ? 'La API devolvio un error interno al clasificar. Prueba con otra imagen (JPG/PNG) o revisa logs del backend.'
      : baseMessage;
    console.error('Classification error:', err);
  } finally {
    loading.value = false;
  }
}

async function saveUploadedPrediction() {
  if (!currentBestPrediction.value || !uploadedImage.value) {
    error.value = 'No hay predicción para guardar';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    await predictionsStore.savePrediction({
      label: currentBestPrediction.value.className,
      confidence: currentBestPrediction.value.probability,
      imageBase64: uploadedImage.value,
      metadata: {
        source: 'File Upload',
        freshnessStatus: freshnessResult.value?.status || 'unknown',
        freshnessText: freshnessResult.value?.text || 'Estado no determinado',
        fileName: uploadedFile.value?.name || 'uploaded'
      }
    });

    successMessage.value = `${t('Predicción guardada')}: ${currentBestPrediction.value.className}`;
    setTimeout(() => { successMessage.value = null; }, 3000);
  } catch (err) {
    error.value = err?.response?.status === 500
      ? 'No se pudo guardar la prediccion por un error del backend de historial.'
      : (err.message || 'Error al guardar predicción');
    console.error('Error saving prediction:', err);
  } finally {
    loading.value = false;
  }
}

function clearUploadedImage() {
  uploadedImage.value = null;
  uploadedFile.value = null;
  currentPredictions.value = [];
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

/* ─── Eliminar predicción ────────────────────────────────────────────────── */
async function removePrediction(predictionId) {
  try {
    await predictionsStore.deletePrediction(predictionId);
  } catch (err) {
    error.value = 'Error al eliminar la predicción';
  }
}

/* ─── Formatear fecha ────────────────────────────────────────────────────── */
function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString(undefined, {
    year:   'numeric',
    month:  'short',
    day:    'numeric',
    hour:   '2-digit',
    minute: '2-digit'
  });
}

/* ─── Ciclo de vida ──────────────────────────────────────────────────────── */
onMounted(async () => {
  apiHealthy.value = await ensureApiAvailable(false);
  startApiHealthMonitoring();

  try {
    await predictionsStore.fetchUserPredictions({ pageSize: 5 });
    await initializeModel();
  } catch (err) {
    // El módulo de clasificación debe seguir funcionando aunque el backend de historial no esté activo.
  }
});

onUnmounted(() => {
  stopRecognition();
  if (animationFrame) window.cancelAnimationFrame(animationFrame);
  if (classificationTimer) clearTimeout(classificationTimer);
  if (healthCheckTimer) clearInterval(healthCheckTimer);
  imageClassificationService.destroy();
});
</script>

<style scoped>
/* ─── Contenedor principal ───────────────────────────────────────────────── */
.image-recognition-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

/* ─── Header ─────────────────────────────────────────────────────────────── */
.recognition-header {
  margin-bottom: 30px;
  text-align: center;
}

.recognition-header h2 {
  margin: 0 0 10px;
  font-size: 2rem;
  color: #333;
}

.subtitle {
  margin: 0;
  font-size: 1rem;
  color: #666;
}

/* ─── Alertas ────────────────────────────────────────────────────────────── */
.alert {
  padding: 15px 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  font-weight: 500;
}

.alert-success {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.alert-error {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.alert-warning {
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  color: #856404;
}

/* ─── Layout principal ───────────────────────────────────────────────────── */
.recognition-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
}

@media (max-width: 1024px) {
  .recognition-content {
    grid-template-columns: 1fr;
  }
}

/* ─── Sección de cámara ──────────────────────────────────────────────────── */
.camera-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ─── Tabs de navegación ──────────────────────────────────────────────────── */
.tabs-control {
  display: flex;
  gap: 10px;
  border-bottom: 2px solid #ecf0f1;
}

.tab-btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
  position: relative;
  bottom: -2px;
}

.tab-btn:hover {
  color: #3498db;
}

.tab-btn.active {
  color: #3498db;
  border-bottom-color: #3498db;
}

.camera-container {
  background: #f5f5f5;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 4 / 3;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.webcam-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.video-stream {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #000;
}

/* ─── Área de Upload ──────────────────────────────────────────────────────── */
.upload-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.upload-area {
  background: white;
  border: 2px dashed #3498db;
  border-radius: 12px;
  padding: 40px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  aspect-ratio: 4 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.upload-area:hover {
  border-color: #2980b9;
  background-color: #f0f8ff;
}

.upload-placeholder {
  text-align: center;
  pointer-events: none;
}

.upload-placeholder .icon {
  font-size: 3rem;
  margin: 0 0 15px;
}

.upload-placeholder .text {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 10px;
}

.upload-placeholder .subtext {
  font-size: 0.9rem;
  color: #999;
  margin: 0;
}

.uploaded-preview {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* ─── Spinner ────────────────────────────────────────────────────────────── */
/* Estilos removidos ya que no se usan con la API */

/* ─── Controles ──────────────────────────────────────────────────────────── */
.controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  flex: 1;
  min-width: 150px;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.btn-secondary {
  background-color: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #7f8c8d;
  transform: translateY(-2px);
}

.btn-success {
  background-color: #27ae60;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: #229954;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
}

.btn-outline {
  background-color: #ffffff;
  color: #2c3e50;
  border: 2px solid #d1d5db;
}

.btn-outline:hover:not(:disabled) {
  background-color: #f3f4f6;
  transform: translateY(-2px);
}

.file-input-hidden {
  display: none;
}

.btn-delete {
  width: 30px;
  height: 30px;
  padding: 0;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  transition: all 0.3s ease;
}

.btn-delete:hover {
  background-color: #c0392b;
  transform: scale(1.1);
}

/* ─── Sección de resultados ──────────────────────────────────────────────── */
.results-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.results-card,
.history-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.results-card h3,
.history-card h3 {
  margin: 0 0 20px;
  font-size: 1.3rem;
  color: #333;
}

.uploaded-result {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
  padding: 12px;
  border-radius: 10px;
  background: #eef6ff;
  border: 1px solid #cfe3ff;
}

.uploaded-result__title {
  font-size: 0.85rem;
  color: #1f4f8a;
  font-weight: 600;
}

.uploaded-result__value {
  font-size: 1rem;
  color: #0f172a;
  font-weight: 700;
}

/* ─── Predicciones ───────────────────────────────────────────────────────── */
.predictions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.prediction-item {
  padding: 12px;
  border-radius: 8px;
  background-color: #f9f9f9;
  border-left: 4px solid #bdc3c7;
  transition: all 0.3s ease;
}

.prediction-item.high-confidence {
  border-left-color: #27ae60;
  background-color: #f0fdf4;
}

.label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.confidence-bar {
  width: 100%;
  height: 8px;
  background-color: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.confidence-fill {
  height: 100%;
  background: linear-gradient(90deg, #e74c3c, #f39c12, #27ae60);
  transition: width 0.3s ease;
}

.percentage {
  font-size: 0.9rem;
  color: #666;
  font-weight: 600;
}

.current-prediction {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
}

.current-prediction h4 {
  margin: 0 0 15px;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.9;
}

.freshness-status {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.freshness-label {
  font-weight: 600;
  opacity: 0.9;
}

.freshness-chip {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
}

.freshness-chip.status-good {
  background: rgba(39, 174, 96, 0.25);
  border: 1px solid rgba(39, 174, 96, 0.5);
}

.freshness-chip.status-bad {
  background: rgba(231, 76, 60, 0.25);
  border: 1px solid rgba(231, 76, 60, 0.5);
}

.freshness-chip.status-unknown {
  background: rgba(241, 196, 15, 0.25);
  border: 1px solid rgba(241, 196, 15, 0.5);
}

.prediction-badge {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.class-name {
  font-size: 1.5rem;
  font-weight: bold;
}

.confidence-badge {
  background-color: rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 1.1rem;
  font-weight: 600;
}

/* ─── Historial ──────────────────────────────────────────────────────────── */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 15px;
  align-items: center;
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border-left: 4px solid #3498db;
  transition: all 0.3s ease;
}

.history-item:hover {
  background-color: #f0f0f0;
  transform: translateX(4px);
}

.history-item .label {
  margin: 0;
  font-weight: 600;
  color: #333;
}

.history-item .confidence {
  font-weight: 600;
  color: #27ae60;
  text-align: center;
  min-width: 50px;
}

.history-item .date {
  font-size: 0.85rem;
  color: #999;
  white-space: nowrap;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-style: italic;
}

/* ─── Responsive ─────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .history-item {
    grid-template-columns: 1fr auto auto;
    gap: 8px;
  }

  .history-item .date {
    grid-column: 1;
    order: 3;
    font-size: 0.75rem;
  }
}
</style>