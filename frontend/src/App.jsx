import { useState, useEffect, useMemo } from "react";
import { Plus, Edit2, Trash2, Search, Package, X, IndianRupee, TrendingUp, AlertTriangle, Moon, Sun, ArrowUpDown } from "lucide-react";
import { productService } from "./services/productService";
import toast, { Toaster } from 'react-hot-toast';

function App() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);

    // --- DARK MODE STATE ---
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem("theme") === "dark";
    });

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 8;
    const [formData, setFormData] = useState({ name: "", quantity: 0, price: 0 });

    useEffect(() => {
        loadProducts();
    }, [currentPage]);

    // Apply dark mode to root element
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [darkMode]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await productService.getAllProducts(currentPage, pageSize);
            setProducts(data.content || (Array.isArray(data) ? data : []));
            setTotalPages(data.totalPages || 0);
        } catch (err) {
            toast.error("Failed to load inventory");
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const totalItems = products.reduce((acc, p) => acc + p.quantity, 0);
        const totalValue = products.reduce((acc, p) => acc + (p.price * p.quantity), 0);
        const lowStockCount = products.filter(p => p.quantity < 5).length;
        return { totalItems, totalValue, lowStockCount };
    }, [products]);

    const filteredProducts = useMemo(() => {
        if (!Array.isArray(products)) return [];
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesLowStock = showLowStockOnly ? p.quantity < 5 : true;
            return matchesSearch && matchesLowStock;
        });
    }, [products, searchTerm, showLowStockOnly]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading('Processing...');
        try {
            if (editingProduct) {
                await productService.updateProduct(editingProduct.id, formData);
                toast.success('Product updated!', { id: toastId });
            } else {
                await productService.createProduct(formData);
                toast.success('Product added!', { id: toastId });
                setCurrentPage(0);
            }
            await loadProducts();
            closeModal();
        } catch {
            toast.error("Operation failed", { id: toastId });
        }
    };

    const openDeleteConfirm = (product) => { setProductToDelete(product); setShowDeleteModal(true); };
    const confirmDelete = async () => {
        const tid = toast.loading('Deleting...');
        try {
            await productService.deleteProduct(productToDelete.id);
            await loadProducts();
            toast.success('Deleted', { id: tid });
            setShowDeleteModal(false);
        } catch { toast.error('Failed', { id: tid }); }
    };

    const openCreateModal = () => { setEditingProduct(null); setFormData({ name: "", quantity: 0, price: 0 }); setIsModalOpen(true); };
    const openEditModal = (p) => { setEditingProduct(p); setFormData({ name: p.name, quantity: p.quantity, price: p.price }); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setEditingProduct(null); };

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex flex-col items-center py-10 px-4 font-sans selection:bg-indigo-100 transition-colors duration-300">
            <Toaster position="bottom-center" toastOptions={{
                className: 'dark:bg-slate-800 dark:text-white dark:border-slate-700',
            }} />

            <div className="w-full max-w-5xl">
                {/* 1. HEADER CARD */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-200/60 dark:border-slate-800 mb-6 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-indigo-600 p-4 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none text-white"><Package size={28} /></div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Inventory Pro</h1>
                                <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">Manage stock efficiently</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-yellow-400 hover:scale-105 transition-all"
                                title="Toggle Dark Mode"
                            >
                                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                            </button>

                            <div className="relative flex-grow md:w-64">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input placeholder="Search..." className="pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-2xl w-full text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>

                            <button onClick={openCreateModal} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95"><Plus size={20} /> <span className="hidden sm:inline">Add Item</span></button>
                        </div>
                    </div>
                </div>

                {/* 2. STATS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[1.5rem] shadow-sm border border-slate-200/60 dark:border-slate-800 flex items-center justify-between group">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Units</p>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white">{stats.totalItems.toLocaleString()}</h3>
                        </div>
                        <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-xl text-indigo-600 dark:text-indigo-400"><TrendingUp size={20} /></div>
                    </div>

                    <div
                        onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                        className={`p-6 rounded-[1.5rem] shadow-sm border cursor-pointer transition-all flex items-center justify-between group ${
                            showLowStockOnly
                                ? "bg-rose-500 border-rose-600 text-white"
                                : stats.lowStockCount > 0
                                    ? "bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/50"
                                    : "bg-white dark:bg-slate-900 dark:border-slate-800"
                        }`}
                    >
                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${showLowStockOnly ? "text-rose-100" : "text-slate-400"}`}>Low Stock</p>
                            <h3 className={`text-2xl font-black ${showLowStockOnly ? "text-white" : stats.lowStockCount > 0 ? "text-rose-600 dark:text-rose-400" : "dark:text-white"}`}>{stats.lowStockCount} Items</h3>
                        </div>
                        <div className={`p-3 rounded-xl transition-all ${showLowStockOnly ? "bg-white/20 text-white" : "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400"}`}>
                            <AlertTriangle size={20} className={stats.lowStockCount > 0 ? "animate-bounce" : ""} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[1.5rem] shadow-sm border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valuation</p>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white">₹{stats.totalValue.toLocaleString("en-IN")}</h3>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-xl text-emerald-600 dark:text-emerald-400"><IndianRupee size={20} /></div>
                    </div>
                </div>

                {/* 3. TABLE WITH PAGINATION FOOTER */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200/60 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            {["id", "name", "quantity", "price"].map(f => <th key={f} className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{f}</th>)}
                            <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {filteredProducts.length > 0 ? filteredProducts.map(p => (
                            <tr key={p.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all">
                                <td className="px-8 py-4 text-xs font-mono text-slate-400 tracking-tighter">#{p.id}</td>
                                <td className="px-8 py-4 font-bold text-slate-700 dark:text-slate-200">{p.name}</td>
                                <td className="px-8 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${
                                        p.quantity < 5 ? "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 animate-pulse" : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                                    }`}>
                                        {p.quantity < 5 && "LOW: "}{p.quantity} UNITS
                                    </span>
                                </td>
                                <td className="px-8 py-4 font-bold text-slate-800 dark:text-slate-100 text-sm">₹{p.price.toLocaleString("en-IN")}</td>
                                <td className="px-8 py-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => openEditModal(p)} className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white rounded-lg transition-colors"><Edit2 size={14} /></button>
                                        <button onClick={() => openDeleteConfirm(p)} className="p-2 text-rose-500 dark:text-rose-400 hover:bg-rose-500 dark:hover:bg-rose-600 hover:text-white rounded-lg transition-colors"><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="px-8 py-16 text-center text-slate-400 dark:text-slate-600 font-medium italic">
                                    No products matching your criteria.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>

                    {/* --- PAGINATION FOOTER --- */}
                    <div className="px-8 py-5 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            Page {currentPage + 1} of {totalPages || 1}
                        </span>

                        <div className="flex items-center gap-2">
                            <button
                                disabled={currentPage === 0}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ArrowUpDown className="rotate-90" size={16} />
                            </button>

                            <div className="flex gap-1">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i)}
                                        className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${
                                            currentPage === i
                                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none"
                                                : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                disabled={currentPage >= totalPages - 1}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ArrowUpDown className="-rotate-90" size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- COMPACT NEW/EDIT MODAL --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex justify-center items-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[1.5rem] w-full max-sm shadow-2xl dark:border dark:border-slate-800 animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{editingProduct ? "Update Item" : "Add New Item"}</h2>
                            <button onClick={closeModal} className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full hover:text-slate-600 transition-colors"><X size={16} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Product Name</label>
                                <input required className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Quantity</label>
                                    <input type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl text-sm font-semibold" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: +e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Price (₹)</label>
                                    <input type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl text-sm font-semibold" value={formData.price} onChange={(e) => setFormData({ ...formData, price: +e.target.value })} />
                                </div>
                            </div>
                            <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all">
                                {editingProduct ? "Save Changes" : "Create Item"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- COMPACT DELETE MODAL --- */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[60] p-4">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[1.5rem] w-full max-w-[320px] shadow-2xl text-center dark:border dark:border-slate-800 animate-in zoom-in duration-200">
                        <div className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl inline-block mb-3"><AlertTriangle size={24} /></div>
                        <h2 className="text-md font-black text-slate-900 dark:text-white mb-1">Confirm Delete</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mb-6">Remove <span className="font-bold text-slate-800 dark:text-slate-200">"{productToDelete?.name}"</span>?</p>
                        <div className="flex gap-2">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all">Cancel</button>
                            <button onClick={confirmDelete} className="flex-1 bg-rose-500 text-white py-2 text-xs font-bold rounded-lg shadow-md hover:bg-rose-600 transition-all">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;