/**
 * @fileoverview HTTP client configuration using axios
 * @module httpInstance
 */
import axios from "axios";
import {authenticationInterceptor} from "@/authentication/services/authentication.interceptor.js";
import { isFrontendOnly } from "@/shared/config/frontend-only.js";
import { resolveFrontendMockPayload } from "@/shared/services/http.frontend-mock.js";

const PRODUCTION_API_BASE = "https://frutilogic-platform-api-production.up.railway.app/api/v1/";

function resolveApiBaseUrl() {
  const fromBase = import.meta.env.VITE_BASE_API_URL;
  if (fromBase != null && String(fromBase).trim() !== "") {
    return String(fromBase).trim().replace(/\/?$/, "/");
  }

  const fromApi = import.meta.env.VITE_API_URL;
  if (fromApi != null && String(fromApi).trim() !== "") {
    return `${String(fromApi).trim().replace(/\/$/, "")}/`;
  }

  if (import.meta.env.PROD) {
    console.warn("[http] VITE_BASE_API_URL no definida; usando API de producción por defecto.");
    return PRODUCTION_API_BASE;
  }

  return "http://localhost:5283/api/v1/";
}

/**
 * Configured axios instance for making HTTP requests
 * @const {import('axios').AxiosInstance}
 */
const httpInstance = axios.create({
    baseURL: resolveApiBaseUrl(),
    headers: { 'Content-Type': 'application/json' },
});

httpInstance.interceptors.request.use(authenticationInterceptor);

if (isFrontendOnly()) {
  httpInstance.defaults.adapter = async (config) => {
    const data = resolveFrontendMockPayload(config);
    return {
      data,
      status: 200,
      statusText: "OK",
      headers: {},
      config,
      request: {},
    };
  };
}

export default httpInstance;
