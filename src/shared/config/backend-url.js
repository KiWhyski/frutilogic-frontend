/**
 * URL base del backend. En producción (Vercel) debe definirse VITE_API_BASE_URL.
 * Nunca se usa http://localhost:3000 desde un origen HTTPS público: el navegador
 * puede mostrar avisos de “red local” / permisos (Private Network Access).
 */
export function getBackendBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (fromEnv != null && String(fromEnv).trim() !== '') {
    return String(fromEnv).replace(/\/$/, '');
  }
  if (typeof window === 'undefined') {
    return '';
  }
  const h = window.location.hostname;
  if (h === 'localhost' || h === '127.0.0.1') {
    return 'http://localhost:5283/api/v1';
  }
  return '';
}
