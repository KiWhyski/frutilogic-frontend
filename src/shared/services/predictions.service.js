import axios from 'axios';
import { useAuthenticationStore } from '@/authentication/services/authentication.store.js';

/**
 * Servicio para interactuar con el backend de predicciones
 * Utiliza Teachable Machine para reconocimiento de imágenes
 */
class PredictionsService {
  constructor() {
    // En desarrollo: usa URL relativa (proxy de Vite redirige)
    // En producción: usa URL configurada en .env
    this.baseURL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'development' ? '/api/v1' : 'http://localhost:3000/api/v1');
    this.endpoints = {
      predictions: '/predictions',
      deletePrediction: (id) => `/predictions/${id}`,
    };
  }

  /**
   * Envía una predicción al backend
   * @param {Object} predictionData - Datos de la predicción
   * @param {string} predictionData.label - Etiqueta de la clase detectada
   * @param {number} predictionData.confidence - Confianza de 0 a 1
   * @param {string} predictionData.imageBase64 - Imagen en base64 (opcional)
   * @param {Object} predictionData.metadata - Metadatos adicionales (opcional)
   * @returns {Promise<Object>} Respuesta del servidor
   */
  async savePrediction(predictionData) {
    const authStore = useAuthenticationStore();
    try {
      const response = await axios.post(
        `${this.baseURL}${this.endpoints.predictions}`,
        {
          label: predictionData.label,
          confidence: predictionData.confidence,
          imageBase64: predictionData.imageBase64 || null,
          metadata: predictionData.metadata || {},
          userId: authStore.user?.id || null,
          timestamp: new Date().toISOString()
        },
        {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      // json-server devuelve el objeto directamente (no envuelto en .data)
      return { data: response.data };
    } catch (error) {
      console.error('Error saving prediction:', error);
      throw error;
    }
  }

  /**
   * Obtiene las predicciones del usuario.
   * Compatible con json-server (?userId=X&_page=N&_limit=N)
   * y con APIs REST convencionales (/predictions/user?page=N&pageSize=N).
   */
  async getUserPredictions(options = {}) {
    const authStore = useAuthenticationStore();
    const page     = Number(options.page     || 1);
    const pageSize = Number(options.pageSize || 10);
    const empty    = { data: { items: [], total: 0, page, pageSize } };

    // Estrategia 1: json-server – GET /predictions?userId=X&_page=N&_limit=N
    try {
      const params = new URLSearchParams({
        _page:  page,
        _limit: pageSize,
        ...(authStore.user?.id  && { userId:  authStore.user.id }),
        ...(options.label       && { label:   options.label })
      });

      const response = await axios.get(
        `${this.baseURL}${this.endpoints.predictions}?${params}`,
        { headers: { Authorization: `Bearer ${authStore.token}` } }
      );

      // json-server devuelve array; APIs REST pueden devolver { items, total }
      if (Array.isArray(response.data)) {
        const items = response.data;
        const total = Number(response.headers?.['x-total-count'] ?? items.length);
        return { data: { items, total, page, pageSize } };
      }

      // API REST convencional
      if (response.data?.items) return response.data;

      return empty;
    } catch (err) {
      // 404 o error de red → el módulo de IA sigue funcionando sin historial
      if (err?.response?.status === 404 || err?.code === 'ERR_NETWORK') return empty;
      console.error('Error fetching predictions:', err);
      return empty; // no romper la UI
    }
  }

  /**
   * Obtiene estadísticas de predicciones del usuario
   * @returns {Promise<Object>} Estadísticas
   */
  async getPredictionStats() {
    try {
      const authStore = useAuthenticationStore();
      const response = await axios.get(
        `${this.baseURL}${this.endpoints.getPredictionStats}`,
        {
          headers: {
            Authorization: `Bearer ${authStore.token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching prediction stats:', error);
      throw error;
    }
  }

  /**
   * Elimina una predicción por ID
   * @param {string} predictionId - ID de la predicción
   * @returns {Promise<void>}
   */
  async deletePrediction(predictionId) {
    const authStore = useAuthenticationStore();
    try {
      await axios.delete(
        `${this.baseURL}${this.endpoints.deletePrediction(predictionId)}`,
        { headers: { Authorization: `Bearer ${authStore.token}` } }
      );
    } catch (error) {
      console.error('Error deleting prediction:', error);
      throw error;
    }
  }

  /**
   * Carga un modelo de Teachable Machine
   * @param {string} modelURL - URL a model.json
   * @param {string} metadataURL - URL a metadata.json
   * @returns {Promise<Object>} Modelo cargado
   */
  async loadTeachableMachineModel(modelURL, metadataURL) {
    try {
      // Cargar TensorFlow desde CDN si no está disponible
      if (!window.tf) {
        await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js');
      }

      // Cargar Teachable Machine desde CDN si no está disponible
      if (!window.tmImage) {
        await this.loadScript('https://cdn.jsdelivr.net/npm/@teachablemachine/image@latest/dist/teachablemachine-image.min.js');
      }

      // Esperar a que las librerías estén disponibles
      if (!window.tmImage) {
        throw new Error('Teachable Machine library failed to load');
      }

      const model = await window.tmImage.load(modelURL, metadataURL);
      return model;
    } catch (error) {
      console.error('Error loading Teachable Machine model:', error);
      throw error;
    }
  }

  /**
   * Carga un script externo dinámicamente
   * @param {string} src - URL del script
   * @returns {Promise<void>}
   */
  loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }
}

export default new PredictionsService();
