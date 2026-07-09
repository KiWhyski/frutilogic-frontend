import { isFrontendOnly } from '@/shared/config/frontend-only.js';
import httpInstance from '@/shared/services/http.instance.js';
import { useAuthenticationStore } from '@/authentication/services/authentication.store.js';

const DEFAULT_SETTINGS = { id: 1, expirationAlertMargin: 30, stockAlertEnabled: true };

export const fetchSettings = async () => {
    if (isFrontendOnly()) return [DEFAULT_SETTINGS];
    return [DEFAULT_SETTINGS];
};

export const updateSettings = async (settings) => {
    return { ...DEFAULT_SETTINGS, ...settings };
};

function expirationSettingsKey() {
    const accountId = useAuthenticationStore().currentAccountId || 'anonymous';
    return `expiration-alert-settings:${accountId}`;
}

export const getExpirationSettings = async () => {
    const stored = localStorage.getItem(expirationSettingsKey());
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
};

export const updateExpirationSettings = async (days) => {
    if (days < 1 || days > 30) {
        throw new Error('Los días de anticipación deben estar entre 1 y 30');
    }
    const settings = { ...DEFAULT_SETTINGS, expirationAlertMargin: days };
    localStorage.setItem(expirationSettingsKey(), JSON.stringify(settings));

    if (!isFrontendOnly()) {
        const accountId = useAuthenticationStore().currentAccountId;
        if (!accountId) throw new Error('No hay una cuenta activa.');
        await httpInstance.post(`accounts/${accountId}/alerts/expiration-scan`, null, {
            params: { daysAhead: days },
        });
    }

    return settings;
};
