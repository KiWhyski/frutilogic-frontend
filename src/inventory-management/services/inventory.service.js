import httpInstance from "../../shared/services/http.instance.js";
import {BaseService} from "@/shared/services/base.service.js";
import {Product} from "@/inventory-management/model/product.entity.js";

function mapInventoryProductFromApi(item) {
    if (!item) return null;

    return new Product({
        inventoryId: item.inventoryId ?? item.InventoryId ?? '',
        productId: item.productId ?? item.ProductId ?? '',
        name: item.name ?? item.Name ?? '',
        brandName: item.brand ?? item.Brand ?? '',
        liquorType: item.type ?? item.Type ?? '',
        unitPriceAmount: Number(item.unitPrice ?? item.UnitPrice ?? 0),
        minimumStock: Number(item.minimumStock ?? item.MinimumStock ?? 0),
        imageUrl: item.imageUrl ?? item.ImageUrl ?? '',
        accountId: item.accountId ?? item.AccountId ?? '',
        warehouseId: item.warehouseId ?? item.WarehouseId ?? '',
        currentStock: Number(item.quantity ?? item.Quantity ?? 0),
        status: item.currentState ?? item.CurrentState ?? '',
        bestBeforeDate: item.expirationDate ?? item.ExpirationDate ?? null,
        moneyCode: item.moneyCode ?? item.MoneyCode ?? '',
    });
}

export function getInventoryErrorMessage(error, fallback = 'No se pudo completar la operación de inventario.') {
    const data = error?.response?.data;
    if (typeof data === 'string' && data.trim()) return data;
    return data?.detail
        || data?.message
        || data?.title
        || data?.error
        || error?.message
        || fallback;
}

/**
 * @class InventoryService
 * @description Service class for handling CRUD operations on categories using HTTP requests
 */
export class InventoryService extends BaseService {

    warehouseProductsEndpoint = '';

    constructor() {
        super();
        this.warehouseProductsEndpoint = import.meta.env.VITE_WAREHOUSE_PRODUCTS_ENDPOINT_PATH
            || 'warehouses/{warehouseId}/products';
    }

    async getAllProductsByWarehouseId(warehouseId) {
        const endpoint = this.warehouseProductsEndpoint.replace('{warehouseId}', warehouseId);
        const response = await httpInstance.get(endpoint);
        const resources = Array.isArray(response.data) ? response.data : [];
        return resources.map(mapInventoryProductFromApi).filter(Boolean);
    }

    async addStock(productId, warehouseId, addedQuantity, stockExpirationDate) {
        try {
            const endpoint = `warehouses/${warehouseId}/products/${productId}/additions`;
            const response = await httpInstance.post(endpoint, {
                quantityToAdd: addedQuantity,
                expirationDate: stockExpirationDate || null,
            });
            return response.data;
        } catch (error) {
            console.error('Error adding stock:', error);
            throw error;
        }
    }

    async subtractStock(productId, warehouseId, removedQuantity, expirationDate) {
        try {
            const endpoint = `warehouses/${warehouseId}/products/${productId}/subtractions`;
            const response = await httpInstance.post(endpoint, {
                quantityToDecrease: removedQuantity,
                exitType: 'Consumed',
                expirationDate: expirationDate || null,
            });
            return response.data;
        } catch (error) {
            console.error('Error subtracting stock:', error);
            throw error;
        }
    }

    async addProduct(productId, warehouseId, quantity, expirationDate) {
        const endpoint = `warehouses/${warehouseId}/products/${productId}/additions`;
        const response = await httpInstance.post(endpoint, {
            quantityToAdd: quantity,
            expirationDate: expirationDate || null,
        });
        return response.data;
    }

    async transferProduct(productId, originWarehouseId, destinationWarehouseId, quantity, expirationDate) {
        const endpoint = `warehouses/${originWarehouseId}/products/${productId}/transfers`;
        const response = await httpInstance.post(endpoint, {
            destinationWarehouseId,
            quantityToTransfer: quantity,
            expirationDate: expirationDate || null,
        });
        return mapInventoryProductFromApi(response.data);
    }

    async deleteInventory(inventoryId) {
        try {
            const response = await httpInstance.delete(`inventories/${inventoryId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting inventory:', error);
            throw error;
        }
    }
}
