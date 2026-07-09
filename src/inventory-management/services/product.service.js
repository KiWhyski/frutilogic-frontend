import httpInstance from "@/shared/services/http.instance.js";
import {useAuthenticationStore} from "@/authentication/services/authentication.store.js";

const productsEndpoint = import.meta.env.VITE_PRODUCTS_ENDPOINT_PATH || 'products';
const accountProducts = import.meta.env.VITE_ACCOUNT_PRODUCTS_ENDPOINT_PATH
    || 'accounts/{accountId}/products';

function mapProductFromApi(item) {
    if (!item) return null;
    return {
        productId: item.id ?? item.Id ?? item.productId ?? '',
        name: item.name ?? item.Name ?? '',
        brandName: item.brand ?? item.Brand ?? item.brandName ?? '',
        liquorType: item.type ?? item.Type ?? item.liquorType ?? '',
        unitPriceAmount: item.unitPrice ?? item.UnitPrice ?? item.unitPriceAmount ?? 0,
        minimumStock: item.minimumStock ?? item.MinimumStock ?? 0,
        content: item.content ?? item.Content ?? 1,
        imageUrl: item.imageUrl ?? item.ImageUrl ?? '',
        accountId: item.accountId ?? item.AccountId ?? '',
        totalStockInStore: item.totalStockInStore ?? item.TotalStockInStore ?? 0,
        isInWarehouse: item.isInWarehouse ?? item.IsInWarehouse ?? false,
    };
}

function extractApiErrorMessage(error) {
    const data = error?.response?.data;
    if (typeof data === 'string' && data.trim()) return data;
    if (data?.detail) return data.detail;
    if (data?.title) return data.title;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (Array.isArray(data?.errors)) {
        return data.errors.map((e) => e?.errorMessage || e).join(' ');
    }
    if (data?.errors && typeof data.errors === 'object') {
        return Object.values(data.errors).flat().join(' ');
    }
    return error?.message || 'No se pudo guardar el producto.';
}

export class ProductService {

    async getById(productId) {
        const response = await httpInstance.get(`${productsEndpoint}/${productId}`);
        return mapProductFromApi(response.data);
    }

    async createProduct(productData, imageFile) {
        const accountId = this.getAccountId();
        if (!accountId) {
            throw new Error('No hay una cuenta activa. Vuelve a iniciar sesión.');
        }
        const endpoint = accountProducts.replace('{accountId}', accountId);
        const formData = this.#createProductFormData(productData, imageFile);

        try {
            const response = await httpInstance.post(endpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return mapProductFromApi(response.data);
        } catch (error) {
            error.userMessage = extractApiErrorMessage(error);
            throw error;
        }
    }

    async updateProduct(productId, productData, imageFile) {
        try {
            const formData = this.#createUpdateFormData(productData, imageFile);
            const response = await httpInstance.put(`${productsEndpoint}/${productId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return mapProductFromApi(response.data);
        } catch (error) {
            error.userMessage = extractApiErrorMessage(error);
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
            ?? response.data?.Products
            ?? (Array.isArray(response.data) ? response.data : []);
        return { data: products.map(mapProductFromApi).filter(Boolean) };
    }

    #createProductFormData(productData, imageFile) {
        const formData = new FormData();
        formData.append('Name', String(productData.name || '').trim());
        formData.append('Type', productData.liquorType);
        formData.append('Brand', productData.brandName);
        formData.append('UnitPrice', String(productData.unitPriceAmount ?? 0));
        formData.append('Code', 'PEN');
        formData.append('MinimumStock', String(productData.minimumStock ?? 1));
        formData.append('Content', String(productData.content > 0 ? productData.content : 1));
        if (imageFile) {
            formData.append('Image', imageFile);
        }
        return formData;
    }

    #createUpdateFormData(productData, imageFile) {
        const formData = new FormData();
        formData.append('Name', String(productData.name || '').trim());
        formData.append('UnitPrice', String(productData.unitPriceAmount ?? 0));
        formData.append('Code', 'PEN');
        formData.append('MinimumStock', String(productData.minimumStock ?? 1));
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
            ?? response.data?.Total
            ?? (Array.isArray(response.data?.products) ? response.data.products.length : 0)
            ?? (Array.isArray(response.data?.Products) ? response.data.Products.length : 0);
        return { count };
    }
}
