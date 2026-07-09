import httpInstance from "@/shared/services/http.instance.js";
import { useAuthenticationStore } from "@/authentication/services/authentication.store.js";

export class SubscriptionService {
    getAccountId(explicitAccountId) {
        if (explicitAccountId) return explicitAccountId;
        const store = useAuthenticationStore();
        return store.currentAccountId || localStorage.getItem("accountId");
    }

    async subscribeToPlan(planId, accountId) {
        const id = this.getAccountId(accountId);
        const response = await httpInstance.post(`accounts/${id}/subscriptions`, {
            selectedPlanId: planId,
        });
        return response.data;
    }

    async upgradeSubscription(planId, accountId, subscriptionId) {
        const id = this.getAccountId(accountId);
        const response = await httpInstance.put(
            `accounts/${id}/subscriptions/${subscriptionId}`,
            { newPlanId: planId }
        );
        return response.data;
    }

    async getCurrentSubscription(accountId) {
        const id = this.getAccountId(accountId);
        const response = await httpInstance.get(`accounts/${id}/subscriptions`);
        return response.data;
    }

    /**
     * Creates or upgrades a subscription and returns Mercado Pago checkout URL when needed.
     */
    async startCheckout(planId, accountId) {
        const id = this.getAccountId(accountId);
        let current = null;
        try {
            current = await this.getCurrentSubscription(id);
        } catch (error) {
            if (error?.response?.status !== 404) throw error;
        }

        const hasActivePaid =
            current?.subscriptionId &&
            current?.status &&
            String(current.status).toLowerCase() !== "pendingpayment" &&
            String(current.planType || "").toLowerCase() !== "free";

        if (hasActivePaid && current.subscriptionId) {
            return this.upgradeSubscription(planId, id, current.subscriptionId);
        }

        try {
            return await this.subscribeToPlan(planId, id);
        } catch (error) {
            // Active free/pending subscription already exists → upgrade path
            const message = error?.response?.data?.detail
                || error?.response?.data?.message
                || error?.message
                || "";
            if (current?.subscriptionId && /active subscription already exists/i.test(message)) {
                return this.upgradeSubscription(planId, id, current.subscriptionId);
            }
            throw error;
        }
    }
}
