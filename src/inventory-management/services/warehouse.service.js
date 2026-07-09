import {WarehouseAssembler} from "@/inventory-management/services/warehouse.assembler.js";
import {BaseService} from "@/shared/services/base.service.js";
import {useAuthenticationStore} from "@/authentication/services/authentication.store.js";
import httpInstance from "@/shared/services/http.instance.js";
import { isFrontendOnly } from "@/shared/config/frontend-only.js";
import {
    warehouseDevList,
    warehouseDevGetById,
    warehouseDevCreate,
    warehouseDevUpdate,
    warehouseDevDelete,
    warehouseDevCountPayload,
} from "@/inventory-management/services/warehouse.dev-store.js";

/**
 * @class WarehouseService
 * @description Service class for handling CRUD operations on categories using HTTP requests
 */
export class WarehouseService extends BaseService {

    accountEndpoint = '';
    accountWarehouseEndpoint = '';
    accountWarehousesCountEndpoint = '';

    constructor() {
        super();
        /** @type {string} The API endpoint for user's warehouses */
        this.resourceEndpoint = import.meta.env.VITE_WAREHOUSE_ENDPOINT_PATH;
        this.accountEndpoint = import.meta.env.VITE_ACCOUNT_ENDPOINT_PATH;
        this.accountWarehouseEndpoint = import.meta.env.VITE_ACCOUNT_WAREHOUSES_ENDPOINT_PATH;
        this.accountWarehousesCountEndpoint = import.meta.env.VITE_WAREHOUSES_COUNT_ENDPOINT_PATH;
    }

    /**
     * Get a warehouse by ID
     * @param id
     * @returns {Promise<Object>} The warehouse data
     */
    async getWarehouseById(id) {
        if (isFrontendOnly()) {
            const raw = warehouseDevGetById(id);
            if (!raw) {
                throw new Error('Warehouse not found');
            }
            return WarehouseAssembler.toEntityFromResource(raw);
        }
        const response = await this.getById(id);
        return WarehouseAssembler.toEntityFromResource(response.data);
    }

    /**
     * Get all warehouses for the current account
     * @returns {Promise<*>} - A promise that resolves to an array of Warehouse entities
     */
    async getWarehousesByAccountId() {
        if (isFrontendOnly()) {
            return warehouseDevList().map((r) => WarehouseAssembler.toEntityFromResource(r));
        }
        const accountId =  this.getAccountId();
        const endpoint = this.accountWarehouseEndpoint.replace('{accountId}', accountId);

        const response = await httpInstance.get(endpoint);
        const raw = response.data;
        const list = Array.isArray(raw)
            ? raw
            : (raw?.warehouses ?? raw?.items ?? raw?.data ?? []);
        if (!Array.isArray(list)) {
            console.warn('getWarehousesByAccountId: expected array', raw);
            return [];
        }
        return list.map((resource) => WarehouseAssembler.toEntityFromResource(resource));
    }

    /**
     * Update a warehouse
     * @returns {Promise<Object>} Created warehouse data
     * @param warehouseData
     * @param imageFile
     */
    async createWarehouse(warehouseData, imageFile) {
        if (isFrontendOnly()) {
            return warehouseDevCreate(warehouseData);
        }
        const accountId = this.getAccountId();
        const endpoint = this.accountWarehouseEndpoint.replace('{accountId}', accountId);

        const formData = this.#createWarehouseFormData(warehouseData, imageFile);

        const response = await httpInstance.post(endpoint, formData);
        return response.data;
    }

    /**
     * Delete a warehouse
     * @param {string} id - The ID of the warehouse to delete
     * @returns {Promise<Object>} The deleted warehouse data
     */
    async deleteWarehouse(id) {
        if (isFrontendOnly()) {
            warehouseDevDelete(id);
            return { success: true };
        }
        const response = await this.delete(id);
        return response.data;
    }

    /**
     * Update a warehouse
     * @param {string} warehouseId - The ID of the warehouse to update
     * @param {Object} warehouseData - The updated warehouse data
     * @param imageFile - The image file to upload
     * @returns {Promise<Object>} The updated warehouse data
     */
    async updateWarehouse(warehouseId, warehouseData, imageFile) {
        if (isFrontendOnly()) {
            const updated = warehouseDevUpdate(warehouseId, warehouseData);
            return updated ?? { success: true };
        }
        const endpoint = `${this.resourceEndpoint}/${warehouseId}`;
        const formData = this.#createWarehouseFormData(warehouseData, imageFile);

        const response = await httpInstance.put(endpoint, formData);

        return response.data;
    }

    async getWarehousesCount() {
        if (isFrontendOnly()) {
            return warehouseDevCountPayload();
        }
        const accountId = this.getAccountId();
        const endpoint = this.accountWarehouseEndpoint.replace('{accountId}', accountId);
        const response = await httpInstance.get(endpoint);
        const raw = response.data;
        const count = raw?.total ?? (Array.isArray(raw?.warehouses) ? raw.warehouses.length : 0);
        return { count };
    }


    #createWarehouseFormData(warehouseData, imageFile) {
        const formData = new FormData();
        formData.append('Name', warehouseData.name);
        formData.append('Street', warehouseData.street);
        formData.append('City', warehouseData.city);
        formData.append('District', warehouseData.district);
        formData.append('PostalCode', warehouseData.postalCode);
        formData.append('Country', warehouseData.country);
        formData.append('MaxTemperature', warehouseData.maxTemperature);
        formData.append('MinTemperature', warehouseData.minTemperature);
        formData.append('Capacity', warehouseData.capacity);

        if (imageFile) {
            formData.append('Image', imageFile);
        }

        return formData;
    }

    getAccountId() {
        const authenticationStore = useAuthenticationStore();
        return authenticationStore.currentAccountId;
    }
}