import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import predictionsService from '@/shared/services/predictions.service.js';

export const usePredictionsStore = defineStore('predictions', () => {
  // Estado reactivo
  const predictions = ref([]);
  const recentPredictions = ref([]);
  const stats = reactive({
    totalPredictions: 0,
    lastPredictionDate: null,
    mostCommonLabel: null,
    averageConfidence: 0
  });
  const loading = ref(false);
  const error = ref(null);
  const successMessage = ref(null);

  // Getters
  const getPredictionById = (id) => {
    return predictions.value.find(p => p.id === id);
  };

  const getPredictionsByLabel = (label) => {
    return predictions.value.filter(p => p.label === label);
  };

  const getHighConfidencePredictions = (minConfidence = 0.8) => {
    return predictions.value.filter(p => p.confidence >= minConfidence);
  };

  // Actions
  /**
   * Guarda una nueva predicción
   */
  async function savePrediction(predictionData) {
    loading.value = true;
    error.value = null;
    try {
      const response = await predictionsService.savePrediction(predictionData);
      predictions.value.unshift(response.data);
      
      // Actualizar predicciones recientes
      recentPredictions.value.unshift(response.data);
      if (recentPredictions.value.length > 5) {
        recentPredictions.value.pop();
      }

      successMessage.value = 'Predicción guardada exitosamente';
      setTimeout(() => {
        successMessage.value = null;
      }, 3000);

      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al guardar la predicción';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Obtiene las predicciones del usuario
   */
  async function fetchUserPredictions(options = {}) {
    loading.value = true;
    error.value = null;
    try {
      const response = await predictionsService.getUserPredictions(options);
      // El servicio siempre devuelve { data: { items, total, page, pageSize } }
      const items = response?.data?.items ?? [];
      predictions.value = items;
      // Mantener hasta 5 predicciones recientes
      recentPredictions.value = items.slice(0, 5);
      return response.data;
    } catch (err) {
      // El servicio ya absorbe errores de red; esto cubre casos inesperados
      error.value = null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Obtiene estadísticas de predicciones
   */
  async function fetchPredictionStats() {
    loading.value = true;
    error.value = null;
    try {
      const response = await predictionsService.getPredictionStats();
      Object.assign(stats, response.data);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al obtener estadísticas';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Elimina una predicción
   */
  async function deletePrediction(predictionId) {
    loading.value = true;
    error.value = null;
    try {
      await predictionsService.deletePrediction(predictionId);
      predictions.value = predictions.value.filter(p => p.id !== predictionId);
      recentPredictions.value = recentPredictions.value.filter(p => p.id !== predictionId);
      
      successMessage.value = 'Predicción eliminada exitosamente';
      setTimeout(() => {
        successMessage.value = null;
      }, 3000);
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al eliminar la predicción';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Limpia el estado
   */
  function clearState() {
    predictions.value = [];
    recentPredictions.value = [];
    Object.assign(stats, {
      totalPredictions: 0,
      lastPredictionDate: null,
      mostCommonLabel: null,
      averageConfidence: 0
    });
    error.value = null;
    successMessage.value = null;
  }

  /**
   * Limpia los mensajes de error y éxito
   */
  function clearMessages() {
    error.value = null;
    successMessage.value = null;
  }

  return {
    // Estado
    predictions,
    recentPredictions,
    stats,
    loading,
    error,
    successMessage,
    // Getters
    getPredictionById,
    getPredictionsByLabel,
    getHighConfidencePredictions,
    // Actions
    savePrediction,
    fetchUserPredictions,
    fetchPredictionStats,
    deletePrediction,
    clearState,
    clearMessages
  };
});

