import axios from 'axios';
import ResupplyPlan from '../model/resupply-plan.entity.js';
import { isFrontendOnly } from '@/shared/config/frontend-only.js';
import { getBackendBaseUrl } from '@/shared/config/backend-url.js';

const API_URL = getBackendBaseUrl() || import.meta.env.VITE_API_URL;

export default {
  async getAll() {
    if (isFrontendOnly()) return [];
    const response = await axios.get(`${API_URL}/resupplyPlans`);
    return response.data.map(plan => new ResupplyPlan(plan));
  },
  async getExpiringSoon(days = 3) {
    if (isFrontendOnly()) return [];
    const response = await axios.get(`${API_URL}/resupplyPlans`);
    const data = Array.isArray(response.data) ? response.data : [];
    const now = new Date();
    const soon = new Date(now);
    soon.setDate(now.getDate() + days);
    return data
      .filter(plan => {
        const vencimiento = new Date(plan.fechaVencimiento);
        return vencimiento >= now && vencimiento <= soon;
      })
      .map(plan => new ResupplyPlan(plan));
  }
};