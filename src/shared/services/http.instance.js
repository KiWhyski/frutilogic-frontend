/**
 * @fileoverview HTTP client configuration using axios
 * @module httpInstance
 */
import axios from "axios";
import {authenticationInterceptor} from "@/authentication/services/authentication.interceptor.js";
import { isFrontendOnly } from "@/shared/config/frontend-only.js";
import { resolveFrontendMockPayload } from "@/shared/services/http.frontend-mock.js";

/**
 * Configured axios instance for making HTTP requests
 * @const {import('axios').AxiosInstance}
 * @description Creates a pre-configured axios instance with base URL and default headers
 * @property {string} baseURL - The base URL for all requests from environment variable
 * @property {Object} headers - Default headers for all requests
 * @property {string} headers.Content-Type - Sets JSON as the default content type
 */
const httpInstance = axios.create({
    baseURL: import.meta.env.VITE_BASE_API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Add request interceptor to add authentication token
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