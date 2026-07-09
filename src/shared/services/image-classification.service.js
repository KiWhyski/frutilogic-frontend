import axios from 'axios';

/**
 * Servicio para interactuar con la API de clasificación de frutas
 * Endpoints: POST /api/v1/classify y GET /api/v1/health
 */
class ImageClassificationService {
  constructor() {
    // En desarrollo: usa URL relativa (proxy de Vite redirige a puerto 5000)
    // En producción: usa URL configurada en .env
    this.baseURL = import.meta.env.VITE_CLASSIFICATION_API_URL || (import.meta.env.MODE === 'development' ? '/api/v1' : 'http://localhost:5000/api/v1');
    this.healthCheckInterval = null;
    this.isHealthy = false;
    this.endpoints = {
      classify: '/classify',
      health: '/health'
    };
  }

  /**
   * Inicia la verificación periódica de salud de la API
   * @param {number} interval - Intervalo en milisegundos (default: 30000 = 30 segundos)
   */
  startHealthCheck(interval = 30000) {
    this.stopHealthCheck();
    this.healthCheckInterval = setInterval(() => {
      this.checkHealth();
    }, interval);
    // Hacer una verificación inmediata
    this.checkHealth();
  }

  /**
   * Detiene la verificación periódica de salud
   */
  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Verifica la salud de la API
   * @returns {Promise<boolean>} true si la API está disponible
   */
  async checkHealth() {
    try {
      const response = await axios.get(
        `${this.baseURL}${this.endpoints.health}`,
        { timeout: 5000 }
      );
      this.isHealthy = response.status === 200;
      console.log('API Health Check:', this.isHealthy ? 'Healthy ✓' : 'Unhealthy ✗');
      return this.isHealthy;
    } catch (error) {
      this.isHealthy = false;
      console.warn('API Health Check Failed:', error.message);
      return false;
    }
  }

  /**
   * Obtiene el estado de salud actual de la API sin hacer una nueva solicitud
   * @returns {boolean} Estado actual de salud
   */
  getHealthStatus() {
    return this.isHealthy;
  }

  /**
   * Clasifica una imagen usando la API
   * @param {File|Blob} imageFile - Archivo de imagen a clasificar
   * @returns {Promise<Object>} Resultado de la clasificación con etiqueta y confianza
   */
  async classifyImage(imageFile) {
    if (!imageFile) {
      throw new Error('Se requiere un archivo de imagen');
    }

    if (!this.isHealthy && !await this.checkHealth()) {
      throw new Error('La API de clasificación no está disponible');
    }

    try {
      const normalizedFile = await this.normalizeImageFile(imageFile);
      const img = new Image();

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(normalizedFile);
      });

      if (img.width < 300 || img.height < 300) {
        throw new Error("La imagen tiene una resolución demasiado baja.");
      }
      const fileName = normalizedFile?.name || imageFile?.name || 'image.jpg';
      const formData = new FormData();
      // El backend .NET expone el parametro como imageFile.
      formData.append('imageFile', normalizedFile, fileName);

      const response = await axios.post(
        `${this.baseURL}${this.endpoints.classify}`,
        formData,
        {
          timeout: 30000
        }
      );

      return {
        success: true,
        className: response.data.class || response.data.label || 'Unknown',
        probability: response.data.confidence || response.data.probability || 0,
        rawResponse: response.data
      };
    } catch (error) {
      console.error('Classification error:', error);
      const validationErrors = error.response?.data?.errors;
      const validationMessage = validationErrors && typeof validationErrors === 'object'
        ? Object.values(validationErrors).flat().join(', ')
        : null;
      const apiMessage =
        error.response?.data?.message ||
        error.response?.data?.title ||
        error.response?.data?.detail ||
        validationMessage ||
        (Array.isArray(error.response?.data?.errors)
          ? error.response.data.errors.join(', ')
          : null);

      throw new Error(
        apiMessage ||
        error.message || 
        'Error al clasificar la imagen'
      );
    }
  }

  /**
   * Convierte imagen a JPEG estandar para evitar fallos de decodificacion en backend
   * y limita dimensiones para reducir payload.
   * @param {File|Blob} file
   * @returns {Promise<File>}
   */
  async normalizeImageFile(file) {

    return new Promise((resolve, reject) => {

      const reader = new FileReader();

      reader.onload = () => {

        const img = new Image();

        img.onload = () => {

          const TARGET_SIZE = 640;

          const canvas = document.createElement("canvas");
          canvas.width = TARGET_SIZE;
          canvas.height = TARGET_SIZE;

          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("No se pudo preparar la imagen."));
            return;
          }

          // Fondo blanco
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, TARGET_SIZE, TARGET_SIZE);

          // Mantener proporción
          const scale = Math.min(
              TARGET_SIZE / img.width,
              TARGET_SIZE / img.height
          );

          const newWidth = img.width * scale;
          const newHeight = img.height * scale;

          const x = (TARGET_SIZE - newWidth) / 2;
          const y = (TARGET_SIZE - newHeight) / 2;

          ctx.drawImage(
              img,
              x,
              y,
              newWidth,
              newHeight
          );

          canvas.toBlob(

              (blob) => {

                if (!blob) {
                  reject(new Error("No se pudo convertir la imagen."));
                  return;
                }

                resolve(
                    new File(
                        [blob],
                        "image.jpg",
                        {
                          type: "image/jpeg"
                        }
                    )
                );

              },

              "image/jpeg",

              0.98

          );

        };

        img.onerror = () =>
            reject(new Error("Formato de imagen no compatible."));

        img.src = reader.result;

      };

      reader.onerror = () =>
          reject(new Error("No se pudo leer la imagen."));

      reader.readAsDataURL(file);

    });

  }

  /**
   * Clasifica una imagen desde un canvas o video element
   * @param {HTMLCanvasElement} canvas - Canvas con la imagen
   * @returns {Promise<Object>} Resultado de la clasificación
   */
  async classifyFromCanvas(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('No se pudo generar la imagen desde el canvas'));
            return;
          }

          const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
          this.classifyImage(file)
            .then(resolve)
            .catch(reject);
        },
        'image/jpeg',
          0.98
      );
    });
  }

  /**
   * Carga una imagen desde un archivo local para visualizar
   * @param {File} file - Archivo de imagen
   * @returns {Promise<string>} URL de datos de la imagen
   */
  loadImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Error al leer archivo'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Dibuja una imagen desde URL de datos en un canvas
   * @param {string} imageSrc - URL de datos o ruta imagen
   * @param {HTMLCanvasElement} canvas - Canvas destino
   * @returns {Promise<void>}
   */
  drawImageToCanvas(imageSrc, canvas) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        resolve();
      };
      img.onerror = () => reject(new Error('Error al cargar imagen'));
      img.src = imageSrc;
    });
  }

  /**
   * Destructor - Detiene la verificación de salud
   */
  destroy() {
    this.stopHealthCheck();
  }
}

export default new ImageClassificationService();

