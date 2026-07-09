const PRODUCTION_API_ORIGIN = "https://frutilogic-platform-api-production.up.railway.app";
const API_VERSION_PATH = "/api/v1";

function ensureApiV1Base(url) {
  const trimmed = String(url).trim().replace(/\/+$/, "");
  if (trimmed.endsWith("/api/v1")) {
    return trimmed;
  }
  if (trimmed.endsWith("/api")) {
    return `${trimmed}/v1`;
  }
  return `${trimmed}${API_VERSION_PATH}`;
}

/**
 * URL base del backend sin barra final (ej. .../api/v1).
 */
export function getBackendBaseUrl() {
  const candidates = [
    import.meta.env.VITE_API_BASE_URL,
    import.meta.env.VITE_API_URL,
    import.meta.env.VITE_BASE_API_URL,
  ];

  for (const candidate of candidates) {
    if (candidate != null && String(candidate).trim() !== "") {
      return ensureApiV1Base(candidate);
    }
  }

  if (import.meta.env.PROD) {
    return `${PRODUCTION_API_ORIGIN}${API_VERSION_PATH}`;
  }

  if (typeof window !== "undefined") {
    const h = window.location.hostname;
    if (h === "localhost" || h === "127.0.0.1") {
      return `http://localhost:5283${API_VERSION_PATH}`;
    }
  }

  return "";
}

/**
 * Une base y path evitando barras duplicadas.
 */
export function joinApiPath(base, path) {
  const normalizedBase = String(base ?? "").trim().replace(/\/+$/, "");
  const normalizedPath = String(path ?? "").trim().replace(/^\/+/, "");
  if (!normalizedBase) return normalizedPath;
  if (!normalizedPath) return normalizedBase;
  return `${normalizedBase}/${normalizedPath}`;
}

/**
 * Rutas relativas para axios (sin / al inicio).
 */
export function normalizeApiPath(path) {
  return String(path ?? "").replace(/^\/+/, "");
}

/**
 * URL base con barra final para axios (ej. .../api/v1/).
 */
export function getApiBaseUrlWithSlash() {
  const base = getBackendBaseUrl();
  return base ? `${base}/` : "";
}