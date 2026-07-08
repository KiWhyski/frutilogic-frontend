/**
 * Modo solo-frontend: sin backend real (axios mock, login simulado, etc.).
 * En producción solo se activa si VITE_FRONTEND_ONLY=true explícitamente.
 */
export function isFrontendOnly() {
  const flag = import.meta.env.VITE_FRONTEND_ONLY;
  if (import.meta.env.PROD) {
    return flag === 'true';
  }
  return flag !== 'false';
}
