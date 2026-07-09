import http from '@/shared/services/http.instance.js';
import { useAuthenticationStore } from '@/authentication/services/authentication.store.js';
import { isSupplier } from '@/shared/utils/account-role.js';

function mapPurchaseOrder(raw) {
    const items = raw?.items ?? raw?.Items ?? [];
    return {
        id: raw?.id ?? raw?.Id ?? '',
        orderCode: raw?.orderCode ?? raw?.OrderCode ?? '',
        status: raw?.status ?? raw?.Status ?? '',
        orderDate: raw?.generationDate ?? raw?.GenerationDate ?? null,
        date: raw?.generationDate ?? raw?.GenerationDate ?? null,
        totalAmount: Number(raw?.total ?? raw?.Total ?? 0),
        totalItems: items.length,
        catalogIdBuyFrom: raw?.catalogIdBuyFrom ?? raw?.CatalogIdBuyFrom ?? '',
        items,
    };
}

function mapSalesOrder(raw) {
    return {
        id: raw?.id ?? raw?.Id ?? '',
        orderCode: raw?.orderCode ?? raw?.OrderCode ?? raw?.id ?? raw?.Id ?? '',
        status: raw?.status ?? raw?.Status ?? '',
        orderDate: raw?.orderDate ?? raw?.OrderDate ?? raw?.createdAt ?? raw?.CreatedAt ?? null,
        totalAmount: Number(raw?.total ?? raw?.Total ?? raw?.totalAmount ?? 0),
        totalItems: (raw?.items ?? raw?.Items ?? []).length,
        items: raw?.items ?? raw?.Items ?? [],
    };
}

export class PurchaseOrderService {
    async createPurchaseOrder({ catalogId, orderCode } = {}) {
        const accountId = useAuthenticationStore().currentAccountId;
        if (!accountId) throw new Error('Cuenta no encontrada');
        if (!catalogId) throw new Error('Catálogo requerido');

        const { data } = await http.post(`accounts/${accountId}/purchase-orders`, {
            orderCode: orderCode || `PO-${Date.now()}`,
            catalogIdBuyFrom: String(catalogId),
        });
        return mapPurchaseOrder(data);
    }

    async getAll(filters = {}) {
        const authStore = useAuthenticationStore();
        const accountId = filters.buyerAccountId
            || filters.supplierAccountId
            || authStore.currentAccountId;

        if (!accountId) return [];

        const role = authStore.account?.accountRole;

        if (filters.supplierAccountId || isSupplier(role)) {
            const { data } = await http.get(`orders/supplier/${accountId}`);
            return (Array.isArray(data) ? data : []).map(mapSalesOrder);
        }

        const { data } = await http.get(`accounts/${accountId}/purchase-orders`);
        return (Array.isArray(data) ? data : []).map(mapPurchaseOrder);
    }

    async updateStatus(orderId, action) {
        const actionMap = {
            0: 'receptions',
            1: 'confirmations',
            2: 'shipments',
            3: 'cancellations',
        };
        const path = actionMap[action] ?? 'confirmations';
        const { data } = await http.put(`purchase-orders/${orderId}/${path}`);
        return data;
    }
}
