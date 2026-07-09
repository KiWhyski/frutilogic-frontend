import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Redireccionar requests de API (excepto clasificación) a json-server en puerto 3000
      '/api/v1/predictions': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // Mantener la clasificación de imágenes en puerto 5000
      '/api/v1/classify': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/api/v1/health': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Auth endpoints en puerto 3000
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})