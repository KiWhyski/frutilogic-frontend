import { useAuthenticationStore } from "./authentication.store.js";

/**
 * Adds Bearer token when available (localStorage or active session).
 */
export const authenticationInterceptor = (config) => {
    const authenticationStore = useAuthenticationStore();
    const token = authenticationStore.currentToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
};
