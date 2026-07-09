import httpInstance from '@/shared/services/http.instance.js';
import { useAuthenticationStore } from '@/authentication/services/authentication.store.js';
import { fetchStockAlerts, fetchExpirationAlerts, fetchAlertCounts } from '@/alerts-and-notifications/services/alert.service.js';
import { isFrontendOnly } from '@/shared/config/frontend-only.js';

function mapProductRow(raw) {
    const currentStock = Number(raw?.totalStockInStore ?? raw?.TotalStockInStore ?? 0);
    const minStock = Number(raw?.minimumStock ?? raw?.MinimumStock ?? 0);
    const unitPrice = Number(raw?.unitPrice ?? raw?.UnitPrice ?? 0);

    return {
        id: raw?.id ?? raw?.Id ?? raw?.productId ?? '',
        name: raw?.name ?? raw?.Name ?? 'Producto',
        type: raw?.type ?? raw?.Type ?? raw?.liquorType ?? '—',
        expiration: null,
        currentStock,
        minStock,
        price: unitPrice,
        riskLevel: currentStock <= 0 ? 'critico' : currentStock < minStock ? 'alto' : 'bajo',
        daysUntilExpiry: null,
    };
}

export async function loadDashboardData() {
    const accountId = useAuthenticationStore().currentAccountId;
    if (!accountId && !isFrontendOnly()) {
        return emptyDashboard();
    }

    try {
        const [productsRes, warehousesRes, alertCounts, stockAlerts, expirationAlerts] = await Promise.all([
            httpInstance.get(`accounts/${accountId}/products`).catch(() => ({ data: { products: [] } })),
            httpInstance.get(`accounts/${accountId}/warehouses`).catch(() => ({ data: { warehouses: [] } })),
            fetchAlertCounts(),
            fetchStockAlerts(),
            fetchExpirationAlerts(),
        ]);

        const products = productsRes.data?.products
            ?? (Array.isArray(productsRes.data) ? productsRes.data : []);
        const warehouses = warehousesRes.data?.warehouses
            ?? (Array.isArray(warehousesRes.data) ? warehousesRes.data : []);

        const productRows = products.map(mapProductRow);
        const lowStockFromProducts = productRows.filter((p) => p.currentStock < p.minStock).length;

        const chartLabels = productRows.slice(0, 3).map((p) => p.name);
        const chartValues = productRows.slice(0, 3).map((p) => Math.max(p.currentStock, 1));

        return {
            productCount: productsRes.data?.total ?? products.length,
            warehouseCount: warehousesRes.data?.total ?? warehouses.length,
            lowStockCount: Math.max(alertCounts.lowStock, lowStockFromProducts),
            expiringCount: alertCounts.expiring,
            stockAlerts,
            expirationAlerts,
            products: productRows.slice(0, 10),
            chartLabels: chartLabels.length ? chartLabels : ['Sin datos'],
            chartValues: chartValues.length ? chartValues : [0],
            loaded: true,
        };
    } catch (error) {
        console.error('Dashboard load error:', error);
        return emptyDashboard();
    }
}

function emptyDashboard() {
    return {
        productCount: 0,
        warehouseCount: 0,
        lowStockCount: 0,
        expiringCount: 0,
        stockAlerts: [],
        expirationAlerts: [],
        products: [],
        chartLabels: ['Sin datos'],
        chartValues: [0],
        loaded: true,
    };
}
