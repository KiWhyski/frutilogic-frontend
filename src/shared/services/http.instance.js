import axios from "axios";
import {authenticationInterceptor} from "@/authentication/services/authentication.interceptor.js";
import { isFrontendOnly } from "@/shared/config/frontend-only.js";
import { getApiBaseUrlWithSlash, normalizeApiPath } from "@/shared/config/backend-url.js";
import { resolveFrontendMockPayload } from "@/shared/services/http.frontend-mock.js";

const httpInstance = axios.create({
    baseURL: getApiBaseUrlWithSlash(),
    headers: { 'Content-Type': 'application/json' },
});

httpInstance.interceptors.request.use((config) => {
    if (config.url) {
        config.url = normalizeApiPath(config.url);
    }
    // FormData needs the browser/axios to set multipart boundary automatically.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
        if (config.headers) {
            delete config.headers['Content-Type'];
            delete config.headers['content-type'];
        }
    }
    return config;
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
