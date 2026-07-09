import httpInstance from "@/shared/services/http.instance.js";
import {useAuthenticationStore} from "@/authentication/services/authentication.store.js";

const productsEndpoint = import.meta.env.VITE_PRODUCTS_ENDPOINT_PATH || 'products';
const accountProducts = import.meta.env.VITE_ACCOUNT_PRODUCTS_ENDPOINT_PATH
    || 'accounts/{accountId}/products';

export class ProductService {

    async getById(productId) {
        const response = await httpInstance.get(`${productsEndpoint}/${productId}`);
        return response.data;
    }

    async createProduct(productData, imageFile) {
        const accountId = this.getAccountId();
        const endpoint = accountProducts.replace('{accountId}', accountId);
        const formData = this.#createProductFormData(productData, imageFile);

        const response = await httpInstance.post(endpoint, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }

    async updateProduct(productId, productData, imageFile) {
        try {
            const formData = this.#createProductFormData(productData, imageFile);
            const response = await httpInstance.put(`${productsEndpoint}/${productId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    }

    async delete(productId) {
        const response = await httpInstance.delete(`${productsEndpoint}/${productId}`);
        return response.data;
    }

    async getAllByAccountId() {
        const accountId = this.getAccountId();
        const endpoint = accountProducts.replace('{accountId}', accountId);
        const response = await httpInstance.get(endpoint);
        const products = response.data?.products
            ?? (Array.isArray(response.data) ? response.data : []);
        return { data: products };
    }

    #createProductFormData(productData, imageFile) {
        const formData = new FormData();
        formData.append('Name', productData.name);
        formData.append('LiquorType', productData.liquorType);
        formData.append('BrandName', productData.brandName);
        formData.append('UnitPriceAmount', productData.unitPriceAmount);
        formData.append('MinimumStock', productData.minimumStock);
        if (imageFile) {
            formData.append('Image', imageFile);
        }
        return formData;
    }

    getAccountId() {
        const authenticationStore = useAuthenticationStore();
        return authenticationStore.currentAccountId;
    }

    async getProductsCount() {
        const accountId = this.getAccountId();
        const endpoint = accountProducts.replace('{accountId}', accountId);
        const response = await httpInstance.get(endpoint);
        const count = response.data?.total
            ?? (Array.isArray(response.data?.products) ? response.data.products.length : 0);
        return { count };
    }
}
