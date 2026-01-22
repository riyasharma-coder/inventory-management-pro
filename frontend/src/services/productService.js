const API_BASE_URL = "http://localhost:8080/api/products";

export const productService = {
    // UPDATED: Now accepts page and size parameters
    async getAllProducts(page = 0, size = 8) {
        // We append the page and size to the URL as Query Parameters
        const response = await fetch(`${API_BASE_URL}?page=${page}&size=${size}`);

        if (!response.ok) {
            throw new Error("Failed to fetch products");
        }

        // This will now return the Page object { content: [], totalPages: x, ... }
        return response.json();
    },

    async createProduct(product) {
        const response = await fetch(API_BASE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(product),
        });

        if (!response.ok) {
            throw new Error("Failed to create product");
        }

        return response.json();
    },

    async updateProduct(id, product) {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(product),
        });

        if (!response.ok) {
            throw new Error("Failed to update product");
        }

        return response.json();
    },

    async deleteProduct(id) {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            throw new Error("Failed to delete product");
        }
    },
};