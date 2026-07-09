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
    const items = raw?.items ?? raw?.Items ?? [];
    const buyer = raw?.buyer ?? raw?.Buyer ?? '';
    return {
        id: raw?.id ?? raw?.Id ?? '',
        orderCode: raw?.orderCode ?? raw?.OrderCode ?? raw?.id ?? raw?.Id ?? '',
        status: raw?.status ?? raw?.Status ?? '',
        orderDate: raw?.receiptDate ?? raw?.ReceiptDate ?? raw?.orderDate ?? raw?.OrderDate ?? null,
        date: raw?.receiptDate ?? raw?.ReceiptDate ?? raw?.orderDate ?? raw?.OrderDate ?? null,
        buyer: { id: buyer, email: buyer },
        totalAmount: items.reduce((sum, item) =>
            sum + Number(item?.unitPrice ?? item?.UnitPrice ?? 0) * Number(item?.quantityToSell ?? item?.QuantityToSell ?? 0), 0),
        totalItems: items.length,
        items: items.map(item => ({
            id: item?.productId ?? item?.ProductId ?? '',
            name: item?.productName ?? item?.ProductName ?? 'Producto',
            unitPrice: Number(item?.unitPrice ?? item?.UnitPrice ?? 0),
            quantity: Number(item?.quantityToSell ?? item?.QuantityToSell ?? 0),
        })),
    };
}

export class PurchaseOrderService {
    async createPurchaseOrder({ catalogId, orderCode, items = [] } = {}) {
        const accountId = useAuthenticationStore().currentAccountId;
        if (!accountId) throw new Error('Cuenta no encontrada');
        if (!catalogId) throw new Error('Catálogo requerido');
        if (!items.length) throw new Error('Selecciona al menos un producto');

        const { data } = await http.post(`accounts/${accountId}/purchase-orders`, {
            orderCode: orderCode || `PO-${Date.now()}`,
            catalogIdBuyFrom: String(catalogId),
            items: items.map(item => ({
                productId: String(item.productId),
                quantity: Number(item.quantity),
            })),
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
            const orders = data?.orders ?? data?.Orders ?? (Array.isArray(data) ? data : []);
            return orders.map(mapSalesOrder);
        }

        const { data } = await http.get(`accounts/${accountId}/purchase-orders`);
        return (Array.isArray(data) ? data : []).map(mapPurchaseOrder);
    }

    async updateStatus(orderId, action) {
        const allowedActions = new Set(['confirm', 'ship', 'receive', 'cancel']);
        if (!allowedActions.has(action)) throw new Error('Acción de estado inválida');
        const { data } = await http.put(`orders/${orderId}/${action}`);
        return data;
    }

    async updatePurchaseStatus(orderId, action) {
        const paths = {
            confirm: 'confirmations',
            receive: 'receptions',
            cancel: 'cancellations',
        };
        const path = paths[action];
        if (!path) throw new Error('Acción de compra inválida');
        await http.put(`purchase-orders/${orderId}/${path}`);
    }
}
