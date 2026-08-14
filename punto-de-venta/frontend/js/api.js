const API_URL = '/api';

const api = {
    // Products
    getProducts: async (search = '') => {
        const res = await fetch(`${API_URL}/products?search=${encodeURIComponent(search)}`);
        if (!res.ok) throw new Error('Error fetching products');
        return await res.json();
    },

    getProductByBarcode: async (barcode) => {
        const res = await fetch(`${API_URL}/products/barcode/${barcode}`);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error('Error fetching product');
        return await res.json();
    },

    saveProduct: async (product) => {
        const url = product.id ? `${API_URL}/products/${product.id}` : `${API_URL}/products`;
        const method = product.id ? 'PUT' : 'POST';
        
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Error saving product');
        }
        return await res.json();
    },

    deleteProduct: async (id) => {
        const res = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Error deleting product');
        }
        return await res.json();
    },

    // Sales
    saveSale: async (items, total) => {
        const res = await fetch(`${API_URL}/sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items, total })
        });
        
        if (!res.ok) throw new Error('Error saving sale');
        return await res.json();
    },

    getTodaySales: async () => {
        const res = await fetch(`${API_URL}/sales/today`);
        if (!res.ok) throw new Error('Error fetching sales');
        return await res.json();
    },

    getReport: async (start, end) => {
        const res = await fetch(`${API_URL}/sales/report?start=${start}&end=${end}`);
        if (!res.ok) throw new Error('Error fetching report');
        return await res.json();
    },

    getSaleDetails: async (id) => {
        const res = await fetch(`${API_URL}/sales/${id}`);
        if (!res.ok) throw new Error('Error fetching sale details');
        return await res.json();
    },

    // Kits
    getKits: async () => {
        const res = await fetch(`${API_URL}/kits`);
        if (!res.ok) throw new Error('Error fetching kits');
        return await res.json();
    },

    saveKit: async (kit) => {
        const res = await fetch(`${API_URL}/kits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(kit)
        });
        
        if (!res.ok) throw new Error('Error saving kit');
        return await res.json();
    }
};
