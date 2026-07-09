import { isFrontendOnly } from '@/shared/config/frontend-only.js';

const DEFAULT_SETTINGS = { id: 1, expirationAlertMargin: 30, stockAlertEnabled: true };

export const fetchSettings = async () => {
    if (isFrontendOnly()) return [DEFAULT_SETTINGS];
    return [DEFAULT_SETTINGS];
};

export const updateSettings = async (settings) => {
    return { ...DEFAULT_SETTINGS, ...settings };
};

export const getExpirationSettings = async () => DEFAULT_SETTINGS;

export const updateExpirationSettings = async (days) => {
    if (days < 1 || days > 30) {
        throw new Error('Los días de anticipación deben estar entre 1 y 30');
    }
    return { ...DEFAULT_SETTINGS, expirationAlertMargin: days };
};
