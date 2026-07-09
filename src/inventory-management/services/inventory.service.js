import httpInstance from "../../shared/services/http.instance.js";
import {BaseService} from "@/shared/services/base.service.js";

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
        return response.data;
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

    async deleteProduct(productId, warehouseId, expirationDate) {
        try {
            const endpoint = `warehouses/${warehouseId}/products/${productId}/subtractions`;
            const response = await httpInstance.post(endpoint, {
                quantityToDecrease: 1,
                exitType: 'Expired',
                expirationDate: expirationDate || null,
            });
            return response.data;
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    }
}
