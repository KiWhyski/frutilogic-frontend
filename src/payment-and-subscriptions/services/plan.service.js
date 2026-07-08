import {BaseService} from "@/shared/services/base.service.js";
import httpInstance from "@/shared/services/http.instance.js";

const plansEndpoint = import.meta.env.VITE_PLAN_ENDPOINT_PATH
const accountCurrentPlanEndpoint = import.meta.env.VITE_ACCOUNT_CURRENT_PLAN_ENDPOINT_PATH;

export class PlanService extends BaseService {

    async getAllPlans() {
        try {
            const response = await httpInstance.get(plansEndpoint);
            return response.data
        } catch (error) {
            console.error('Error loading the plans:', error)
            throw error
        }
    }

    async getCurrentPlan(accountId) {
        const response = await httpInstance.get(`accounts/${accountId}/subscriptions`);
        console.log("📦 Current plan:", response.data);
        return response.data?.planType ?? response.data;
    }
}