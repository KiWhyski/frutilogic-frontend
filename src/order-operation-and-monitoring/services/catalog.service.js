import http from '@/shared/services/http.instance.js';

function mapCatalog(raw) {
    const items = raw?.catalogItems ?? raw?.CatalogItems ?? [];
    return {
        catalogId: raw?.id ?? raw?.Id ?? '',
        id: raw?.id ?? raw?.Id ?? '',
        name: raw?.name ?? raw?.Name ?? '',
        description: raw?.description ?? raw?.Description ?? '',
        accountId: raw?.ownerAccount ?? raw?.OwnerAccount ?? '',
        ownerAccount: raw?.ownerAccount ?? raw?.OwnerAccount ?? '',
        contactEmail: raw?.contactEmail ?? raw?.ContactEmail ?? '',
        isPublished: Boolean(raw?.isPublished ?? raw?.IsPublished),
        catalogItems: items,
    };
}

function mapCatalogItem(item) {
    return {
        id: item?.productId ?? item?.ProductId ?? '',
        productId: item?.productId ?? item?.ProductId ?? '',
        name: item?.productName ?? item?.ProductName ?? 'Producto',
        brand: item?.brand ?? '',
        unitPrice: Number(item?.amount ?? item?.Amount ?? 0),
        availableStock: item?.availableStock ?? item?.AvailableStock ?? 0,
    };
}

export class CatalogService {
    async getCatalogsByAccount(accountId, onlyPublished = false) {
        const { data } = await http.get(`accounts/${accountId}/catalogs`);
        const catalogs = (Array.isArray(data) ? data : []).map(mapCatalog);
        return onlyPublished ? catalogs.filter((c) => c.isPublished) : catalogs;
    }

    async getPublishedCatalogs() {
        const { data } = await http.get('catalogs/published');
        return (Array.isArray(data) ? data : []).map(mapCatalog);
    }

    async publishCatalog(catalogId) {
        await http.put(`catalogs/${catalogId}/publications`);
        return { success: true };
    }

    async getPublishedCatalogsByAccount(accountId) {
        return this.getCatalogsByAccount(accountId, true);
    }

    async getPublishedCatalogsByEmail(email) {
        const { data } = await http.get('catalogs/published', {
            params: { providerEmail: email },
        });
        return (Array.isArray(data) ? data : []).map(mapCatalog);
    }

    async getCatalogById(catalogId) {
        const { data } = await http.get(`catalogs/${catalogId}`);
        return mapCatalog(data);
    }

    async createCatalog(catalog, accountId) {
        const { data } = await http.post(`accounts/${accountId}/catalogs`, {
            name: catalog.name,
            description: catalog.description || catalog.name,
            contactEmail: catalog.contactEmail || 'contacto@frutilogic.com',
        });
        return mapCatalog(data);
    }

    async updateCatalog(catalogId, catalog) {
        await http.put(`catalogs/${catalogId}`, {
            name: catalog.name,
            description: catalog.description || '',
            contactEmail: catalog.contactEmail || '',
        });
        return this.getCatalogById(catalogId);
    }

    async getCatalogItems(catalogId) {
        const catalog = await this.getCatalogById(catalogId);
        return (catalog.catalogItems ?? []).map(mapCatalogItem);
    }

    async addCatalogItem({ catalogId, productId, warehouseId, stock }) {
        const { data } = await http.post(`catalogs/${catalogId}/items`, {
            productId,
            warehouseId,
            stock: Number(stock) || 1,
        });
        return mapCatalog(data);
    }

    async deleteCatalogItem(catalogId, productId) {
        await http.delete(`catalogs/${catalogId}/items/${productId}`);
    }
}
