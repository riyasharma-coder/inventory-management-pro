const API_BASE_URL = "http://localhost:8080/api/products";

export const productService = {
    async getAllProducts() {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) {
            throw new Error("Failed to fetch products");
        }
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
