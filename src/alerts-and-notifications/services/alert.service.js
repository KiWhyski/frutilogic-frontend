import httpInstance from '@/shared/services/http.instance.js';
import { StockAlert, ExpirationAlert } from '@/alerts-and-notifications/model/alert.entity.js';
import { useAuthenticationStore } from '@/authentication/services/authentication.store.js';
import { isFrontendOnly } from '@/shared/config/frontend-only.js';

const MOCK_STOCK_ALERTS = [
    new StockAlert({ id: 'demo-p-1', name: 'Manzana Fuji', stock: 4, minStock: 10 }),
    new StockAlert({ id: 'demo-p-2', name: 'Mango Ataulfo', stock: 2, minStock: 5 }),
];

const MOCK_EXPIRATION_ALERTS = [
    new ExpirationAlert({ id: 'demo-p-1', name: 'Manzana Fuji', expiresIn: 5 }),
    new ExpirationAlert({ id: 'demo-p-3', name: 'Uva Red Globe', expiresIn: 12 }),
];

async function fetchRawAlerts() {
    if (isFrontendOnly()) {
        return [
            { id: '1', title: 'Manzana Fuji', type: 'ProductLowStock',
                details: { productName: 'Manzana Fuji', currentStock: 4, minimumStock: 10 } },
            { id: '2', title: 'Uva Red Globe', type: 'ProductExpired',
                details: { productName: 'Uva Red Globe', daysUntilExpiration: 8 } },
        ];
    }

    const accountId = useAuthenticationStore().currentAccountId;
    if (!accountId) return [];

    try {
        const { data } = await httpInstance.get(`accounts/${accountId}/alerts`);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching alerts:', error);
        throw error;
    }
}

function alertType(alert) {
    return String(alert?.type ?? alert?.Type ?? '').toLowerCase();
}

function alertTitle(alert) {
    return alert?.title ?? alert?.Title ?? 'Alerta';
}

function toStockAlert(alert) {
    const details = alert?.details ?? alert?.Details ?? {};
    const type = alertType(alert);
    const stock = Number(details.currentStock ?? details.CurrentStock ?? 0);
    const minStock = Number(details.minimumStock ?? details.MinimumStock ?? 0);

    return new StockAlert({
        id: alert?.id ?? alert?.Id ?? alertTitle(alert),
        name: details.productName ?? details.ProductName ?? alertTitle(alert),
        stock,
        minStock,
        state: type.includes('outofstock') ? 'out-of-stock' : 'low-stock',
        productId: details.productId ?? details.ProductId ?? null,
        warehouseName: details.warehouseName ?? details.WarehouseName ?? '',
    });
}

function toExpirationAlert(alert) {
    const details = alert?.details ?? alert?.Details ?? {};

    return new ExpirationAlert({
        id: alert?.id ?? alert?.Id ?? alertTitle(alert),
        name: details.productName ?? details.ProductName ?? alertTitle(alert),
        expiresIn: Number(details.daysUntilExpiration ?? details.DaysUntilExpiration ?? 0),
        expirationDate: details.expirationDate ?? details.ExpirationDate ?? null,
        warehouseName: details.warehouseName ?? details.WarehouseName ?? '',
        productId: details.productId ?? details.ProductId ?? null,
    });
}

function partitionAlerts(alerts) {
    const stock = [];
    const expiration = [];

    for (const alert of alerts) {
        const type = alertType(alert);
        if (type.includes('stock')) {
            stock.push(toStockAlert(alert));
        } else if (type.includes('expir')) {
            expiration.push(toExpirationAlert(alert));
        }
    }

    return { stock, expiration };
}

export async function fetchStockAlerts() {
    const { stock } = partitionAlerts(await fetchRawAlerts());
    if (isFrontendOnly() && stock.length === 0) return MOCK_STOCK_ALERTS.slice(0, 3);
    return stock.slice(0, 3);
}

export async function fetchAllStockAlerts() {
    const { stock } = partitionAlerts(await fetchRawAlerts());
    if (isFrontendOnly() && stock.length === 0) return [...MOCK_STOCK_ALERTS];
    return stock;
}

export async function fetchExpirationAlerts() {
    const { expiration } = partitionAlerts(await fetchRawAlerts());
    if (isFrontendOnly() && expiration.length === 0) return MOCK_EXPIRATION_ALERTS.slice(0, 3);
    return expiration.slice(0, 3);
}

export async function fetchAllExpirationAlerts() {
    const { expiration } = partitionAlerts(await fetchRawAlerts());
    if (isFrontendOnly() && expiration.length === 0) return [...MOCK_EXPIRATION_ALERTS];
    return expiration;
}

export async function fetchAlertCounts() {
    const { stock, expiration } = partitionAlerts(await fetchRawAlerts());
    return {
        lowStock: stock.length,
        expiring: expiration.length,
    };
}
