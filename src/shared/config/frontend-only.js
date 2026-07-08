/**
 * Modo solo-frontend: sin backend real (axios mock, login simulado, etc.).
 * Desactivado por defecto en producción.
 */
export function isFrontendOnly() {
  return import.meta.env.VITE_FRONTEND_ONLY === 'true';
}
