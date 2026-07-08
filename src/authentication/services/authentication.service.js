import httpInstance from "@/shared/services/http.instance.js";
import { normalizeApiPath } from "@/shared/config/backend-url.js";
import { parseAuthResponse } from "@/authentication/services/auth.session.js";

function mapAccountRole(role) {
    if (role === 'LiquorStoreOwner') return 'Liquor Store Owner';
    if (role === 'Supplier') return 'Supplier';
    return role;
}

function extractErrorMessage(error) {
    const data = error?.response?.data;
    if (typeof data === 'string' && data.trim()) return data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (data?.title) return data.title;
    return error?.message || 'Error de autenticación';
}

export class AuthenticationService {
    signIn(email, password) {
        return httpInstance.post(normalizeApiPath(import.meta.env.VITE_AUTH_SIGNIN_ENDPOINT || 'sign-in'), {
            email: String(email).trim(),
            password,
        });
    }

    signUp({ email, password, name, businessName, role }) {
        return httpInstance.post(normalizeApiPath(import.meta.env.VITE_AUTH_SIGNUP_ENDPOINT || 'sign-up'), {
            email: String(email).trim(),
            password,
            name: name || businessName,
            businessName: businessName || name,
            role,
        });
    }

    async fetchAccountRole(accountId) {
        const response = await httpInstance.get(`accounts/${accountId}`);
        return mapAccountRole(response.data?.role);
    }

    async ensureFreePlanActivated(accountId) {
        if (!accountId) return;
        try {
            const plansResponse = await httpInstance.get(normalizeApiPath(import.meta.env.VITE_PLAN_ENDPOINT_PATH || 'plans'));
            const plans = Array.isArray(plansResponse.data) ? plansResponse.data : [];
            const freePlan = plans.find((plan) => String(plan.planType ?? plan.PlanType).toLowerCase() === 'free');
            if (!freePlan?.planId) return;

            await httpInstance.post(`accounts/${accountId}/subscriptions`, {
                selectedPlanId: freePlan.planId,
            });
        } catch {
            // Account may already be active — safe to ignore.
        }
    }

    async completeSignIn(response) {
        const session = parseAuthResponse(response.data);
        if (!session.token) {
            throw new Error('El servidor no devolvió un token de sesión');
        }

        if (!session.accountRole && session.accountId) {
            try {
                session.accountRole = await this.fetchAccountRole(session.accountId);
            } catch {
                session.accountRole = 'Liquor Store Owner';
            }
        }

        return session;
    }

    async sendRecoveryCode(email) {
        return httpInstance.post(
            normalizeApiPath(import.meta.env.VITE_SEND_RECOVERY_CODE_ENDPOINT || 'users/recovery-code'),
            { email: String(email).trim() }
        );
    }

    async verifyRecoveryCode(email, code) {
        const response = await httpInstance.post(
            normalizeApiPath(import.meta.env.VITE_VERIFY_RECOVERY_CODE_ENDPOINT || 'users/verify-recovery-code'),
            { email: String(email).trim(), code }
        );
        return response.data;
    }

    async resetPassword(email, newPassword) {
        const response = await httpInstance.put(
            normalizeApiPath(import.meta.env.VITE_RESET_PASSWORD_ENDPOINT || 'users/reset-password'),
            { email: String(email).trim(), newPassword }
        );
        return response.data;
    }
}

export { extractErrorMessage, mapAccountRole };
