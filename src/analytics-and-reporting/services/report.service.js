import axios from 'axios';
import { isFrontendOnly } from '@/shared/config/frontend-only.js';
import { getBackendBaseUrl } from '@/shared/config/backend-url.js';

const API_URL = getBackendBaseUrl() || import.meta.env.VITE_API_URL;

export const ReportService = {
    async getAllReports() {
        try {
            if (isFrontendOnly()) return [];
            const response = await axios.get(`${API_URL}/reports`);
            return response.data;
        } catch (error) {
            console.error('Error fetching reports:', error);
            throw error;
        }
    },

    async getReportById(id) {
        try {
            if (isFrontendOnly()) return { id, title: 'Demo report' };
            const response = await axios.get(`${API_URL}/reports/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching report ${id}:`, error);
            throw error;
        }
    },

    async createReport(report) {
        try {
            if (isFrontendOnly()) return { id: 'mock' };
            const response = await axios.post(`${API_URL}/reports`, report);
            return response.data;
        } catch (error) {
            console.error('Error creating report:', error);
            throw error;
        }
    },

    async updateReport(id, report) {
        try {
            if (isFrontendOnly()) return { id, ...report };
            const response = await axios.put(`${API_URL}/reports/${id}`, report);
            return response.data;
        } catch (error) {
            console.error(`Error updating report ${id}:`, error);
            throw error;
        }
    },

    async deleteReport(id) {
        try {
            if (isFrontendOnly()) return true;
            await axios.delete(`${API_URL}/reports/${id}`);
            return true;
        } catch (error) {
            console.error(`Error deleting report ${id}:`, error);
            throw error;
        }
    }
};