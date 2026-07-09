import httpInstance from "@/shared/services/http.instance.js";
import { isFrontendOnly } from "@/shared/config/frontend-only.js";

const accountStatusEndpoint = import.meta.env.VITE_ACCOUNT_STATUS_ENDPOINT_PATH;

import { useAuthenticationStore } from '@/authentication/services/authentication.store.js';

const accountCurrentBenefitsLimitsEndpoint = import.meta.env.VITE_ACCOUNT_CURRENT_BENEFITS_LIMITS;

export class AccountService {
    constructor() {
        this.baseUrl = import.meta.env.VITE_BASE_API_URL;
        this.endpoint = import.meta.env.VITE_ACCOUNT_ENDPOINT_PATH; // Ej: '/api/v1/accounts'
        this.accountCurrentBenefitsLimitsEndpoint = accountCurrentBenefitsLimitsEndpoint;
    }

    getCurrentAccountId() {
        const store = useAuthenticationStore();
        return store.currentAccountId;
    }

    async getAccountStatus(accountId) {
        if (isFrontendOnly()) {
            return { accountStatus: 'ACTIVE' };
        }
        const endpoint = accountStatusEndpoint.replace('{accountId}', accountId);
        const response = await httpInstance.get(endpoint, {
        });
        console.log("🧾 Response from account status:", response.data);
        return response.data;
    }

    async getCurrentAccountBenefitsLimits() {
        if (isFrontendOnly()) {
            return { maxProducts: 50, maxWarehouses: 5, limits: [] };
        }
        const accountId = this.getCurrentAccountId();
        try {
            const response = await httpInstance.get(`accounts/${accountId}/subscriptions`);
            const data = response.data ?? {};
            return {
                maxProducts: data.maxProducts ?? 0,
                maxWarehouses: data.maxWarehouses ?? 0,
                limits: [],
            };
        } catch (error) {
            console.error("Error fetching current account benefits limits:", error);
            throw error;
        }
    }


}