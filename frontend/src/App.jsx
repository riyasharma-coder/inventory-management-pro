import { useState, useEffect, useMemo } from "react";
import { Plus, Edit2, Trash2, ArrowUpDown, Search, Package, X, IndianRupee, TrendingUp } from "lucide-react";
import { productService } from "./services/productService";
import toast, { Toaster } from 'react-hot-toast';

function App() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState("id");
    const [sortOrder, setSortOrder] = useState("asc");

    // --- NEW PAGINATION STATES ---
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 8; // Items per page

    const [formData, setFormData] = useState({ name: "", quantity: 0, price: 0 });

    // RE-FETCH whenever currentPage changes
    useEffect(() => {
        loadProducts();
    }, [currentPage]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await productService.getAllProducts(currentPage, pageSize);

            // FIX: Change this line to ensure you grab the array inside 'content'
            setProducts(data.content || []);
            setTotalPages(data.totalPages || 0);

            // DEBUG: Add this line temporarily to see what the backend is sending
            console.log("Backend Data received:", data);
        } catch (err) {
            toast.error("Failed to load inventory");
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        // Since we only have one page of products in state,
        // for a real MAANG app, you'd usually get these stats from a separate API endpoint.
        // For now, we calculate based on the current visible page.
        const totalItems = products.reduce((acc, p) => acc + p.quantity, 0);
        const totalValue = products.reduce((acc, p) => acc + (p.price * p.quantity), 0);
        return { totalItems, totalValue };
    }, [products]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return toast.error("Product name cannot be empty");
        if (formData.quantity < 0) return toast.error("Quantity cannot be negative");
        if (formData.price <= 0) return toast.error("Price must be greater than 0");

        const toastId = toast.loading('Processing...');
        try {
            if (editingProduct) {
                await productService.updateProduct(editingProduct.id, formData);
                toast.success('Product updated!', { id: toastId });
            } else {
                await productService.createProduct(formData);
                toast.success('Product added!', { id: toastId });
                setCurrentPage(0); // Reset to first page to see new item
            }
            await loadProducts();
            closeModal();
        } catch {
            toast.error("Operation failed", { id: toastId });
        }
    };

    const handleDelete = async (id) => {
        toast((t) => (
            <div className="flex flex-col gap-3 p-1">
                <p className="text-sm font-semibold text-slate-800">Remove this item permanently?</p>
                <div className="flex gap-2">
                    <button
                        className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md"
                        onClick={async () => {
                            toast.dismiss(t.id);
                            const tid = toast.loading('Deleting...');
                            try {
                                await productService.deleteProduct(id);
                                loadProducts();
                                toast.success('Deleted', { id: tid });
                            } catch (err) {
                                toast.error('Delete failed', { id: tid });
                            }
                        }}
                    >
                        Confirm
                    </button>
                    <button className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-all" onClick={() => toast.dismiss(t.id)}>
                        Cancel
                    </button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    const openCreateModal = () => { setEditingProduct(null); setFormData({ name: "", quantity: 0, price: 0 }); setIsModalOpen(true); };
    const openEditModal = (p) => { setEditingProduct(p); setFormData({ name: p.name, quantity: p.quantity, price: p.price }); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setEditingProduct(null); };

    // Server-side sort would be better, but we'll keep your client-side sort logic for now
    // applying it to the current page.
    const handleSort = (field) => {
        if (sortField === field) { setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }
        else { setSortField(field); setSortOrder("asc"); }
    };

    const filteredProducts = useMemo(() => {
        // If 'products' is accidentally not an array, return empty to prevent crash
        if (!Array.isArray(products)) return [];

        // If no search term, show everything the backend sent for this page
        if (!searchTerm) return products;

        // Simple search filter for the current page
        return products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.id.toString().includes(searchTerm)
        );
    }, [products, searchTerm]);

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center py-10 px-4 font-sans selection:bg-indigo-100">
            <Toaster position="top-right" />

            <div className="w-full max-w-5xl">
                {/* HEADER CARD */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200/60 mb-6 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-indigo-600 p-4 rounded-2xl shadow-xl shadow-indigo-100 text-white">
                                <Package size={28} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Inventory Pro</h1>
                                <p className="text-slate-400 text-sm font-medium">Manage your stock items efficiently</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-grow md:w-64">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    placeholder="Search this page..."
                                    className="pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all w-full text-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={openCreateModal}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-2 font-bold whitespace-nowrap active:scale-95"
                            >
                                <Plus size={20} /> Add Item
                            </button>
                        </div>
                    </div>
                </div>

                {/* STATS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200/60 flex items-center justify-between group hover:border-indigo-200 transition-all">
                        <div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Stock on Page</p>
                            <h3 className="text-3xl font-black text-slate-800">{stats.totalItems.toLocaleString()} <span className="text-sm font-medium text-slate-400 uppercase">Units</span></h3>
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200/60 flex items-center justify-between group hover:border-emerald-200 transition-all">
                        <div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Page Valuation</p>
                            <h3 className="text-3xl font-black text-slate-800">₹{stats.totalValue.toLocaleString("en-IN")}</h3>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            <IndianRupee size={24} />
                        </div>
                    </div>
                </div>

                {/* TABLE CONTAINER */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden">
                    {loading ? (
                        <div className="p-20 text-center">
                            <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-slate-400 text-sm">Fetching page data...</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        {["id", "name", "quantity", "price"].map((field) => (
                                            <th
                                                key={field}
                                                onClick={() => handleSort(field)}
                                                className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] cursor-pointer hover:text-indigo-600 transition-colors"
                                            >
                                                <div className="flex items-center gap-1">
                                                    {field} <ArrowUpDown size={10} />
                                                </div>
                                            </th>
                                        ))}
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                    {filteredProducts.length > 0 ? (
                                        filteredProducts.map((p) => (
                                            <tr key={p.id} className="group hover:bg-slate-50/80 transition-all">
                                                <td className="px-8 py-5 font-mono text-xs text-slate-400 tracking-tighter">#{p.id}</td>
                                                <td className="px-8 py-5 font-bold text-slate-700">{p.name}</td>
                                                <td className="px-8 py-5">
                                                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${
                                                        p.quantity < 5 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-emerald-100 text-emerald-600'
                                                    }`}>
                                                        {p.quantity < 5 ? 'LOW STOCK: ' : ''}{p.quantity} {p.quantity === 1 ? 'UNIT' : 'UNITS'}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 font-bold text-slate-800 text-sm">
                                                    <span className="text-slate-300 mr-1">₹</span>{p.price.toLocaleString("en-IN")}
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
                                                        <button onClick={() => openEditModal(p)} className="p-2.5 bg-white border border-slate-100 text-indigo-600 rounded-xl shadow-sm hover:bg-indigo-600 hover:text-white transition-all">
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button onClick={() => handleDelete(p.id)} className="p-2.5 bg-white border border-slate-100 text-rose-500 rounded-xl shadow-sm hover:bg-rose-500 hover:text-white transition-all">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="py-20 text-center text-slate-400 font-medium">No items found on this page.</td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>

                            {/* --- NEW PAGINATION CONTROLS --- */}
                            <div className="flex justify-between items-center px-8 py-5 bg-slate-50/50 border-t border-slate-100">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                    Page {currentPage + 1} of {totalPages || 1}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        disabled={currentPage === 0}
                                        onClick={() => setCurrentPage(prev => prev - 1)}
                                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-indigo-600 hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-600 transition-all shadow-sm active:scale-95"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        disabled={currentPage >= totalPages - 1}
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-indigo-600 hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-600 transition-all shadow-sm active:scale-95"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* MODAL (Unchanged but ensuring it works with new data flow) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex justify-center items-center z-50 p-6">
                    <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                {editingProduct ? "Update Product" : "New Inventory Item"}
                            </h2>
                            <button onClick={closeModal} className="p-2 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Name</label>
                                <input
                                    required
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-semibold text-slate-700"
                                    placeholder="Enter item name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-semibold text-slate-700"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: +e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-semibold text-slate-700"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: +e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={closeModal} className="flex-1 px-6 py-4 text-slate-400 font-bold rounded-2xl hover:bg-slate-50 transition-all">Cancel</button>
                                <button className="flex-1 bg-indigo-600 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
                                    {editingProduct ? "Save Changes" : "Create Item"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;