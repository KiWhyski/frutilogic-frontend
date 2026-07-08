import httpInstance from "@/shared/services/http.instance.js";

export class SubscriptionService {
    async subscribeToPlan(planId, accountId) {
        const response = await httpInstance.post(`accounts/${accountId}/subscriptions`, {
            selectedPlanId: planId,
        });
        return response.data;
    }

    async upgradeSubscription(planId, accountId, subscriptionId) {
        const response = await httpInstance.put(
            `accounts/${accountId}/subscriptions/${subscriptionId}`,
            { newPlanId: planId }
        );
        return response.data;
    }

    async getCurrentSubscription(accountId) {
        const response = await httpInstance.get(`accounts/${accountId}/subscriptions`);
        return response.data;
    }
}
