// Humne direct Render ka full URL daal diya hai taaki koi confusion na rahe
const API_BASE_URL = "https://inventory-management-pro-2hj4.onrender.com/api/products";

export const productService = {
    async getAllProducts(page = 0, size = 8) {
        // Full URL: https://inventory-management-pro-2hj4.onrender.com/api/products?page=0&size=8
        const response = await fetch(`${API_BASE_URL}?page=${page}&size=${size}`);
        if (!response.ok) throw new Error("Failed to fetch products");
        return response.json();
    },

    async createProduct(product) {
        const response = await fetch(API_BASE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(product),
        });
        if (!response.ok) throw new Error("Failed to create product");
        return response.json();
    },

    async updateProduct(id, product) {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(product),
        });
        if (!response.ok) throw new Error("Failed to update product");
        return response.json();
    },

    async deleteProduct(id) {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete product");
    },
};