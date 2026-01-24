import { useState, useEffect, useMemo } from "react";
import { Plus, Edit2, Trash2, Search, Package, X, IndianRupee, TrendingUp, AlertTriangle, Moon, Sun, ArrowUpDown, History, Download, BoxSelect } from "lucide-react";
import { productService } from "./services/productService";
import toast, { Toaster } from 'react-hot-toast';

const getCategoryStyle = (cat) => {
    const colors = {
        Electronics: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
        Furniture: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
        Office: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
        Stationery: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
        General: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
    };
    return colors[cat] || colors.General;
};

function App() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    // FEATURE 1: DEBOUNCED SEARCH STATE
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [categoryFilter, setCategoryFilter] = useState("All");
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 8;

    const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
    const [recentActivity, setRecentActivity] = useState(() => {
        const saved = localStorage.getItem("recentActivity");
        return saved ? JSON.parse(saved) : [];
    });

    const [formData, setFormData] = useState({
        name: "", quantity: 0, price: 0, category: "General", imageUrl: ""
    });

    // EFFECT: DEBOUNCE LOGIC (Prevents excessive re-renders during typing)
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => { loadProducts(); }, [currentPage]);

    useEffect(() => {
        const root = document.documentElement;
        if (darkMode) { root.classList.add("dark"); localStorage.setItem("theme", "dark"); }
        else { root.classList.remove("dark"); localStorage.setItem("theme", "light"); }
    }, [darkMode]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await productService.getAllProducts(currentPage, pageSize);
            setProducts(data.content || (Array.isArray(data) ? data : []));
            setTotalPages(data.totalPages || 0);
        } catch (err) { toast.error("Systems offline: Database sync failed"); }
        finally { setLoading(false); }
    };

    const trackActivity = (name, action) => {
        const newAct = {
            id: Date.now(),
            name,
            action,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setRecentActivity(prev => {
            const updated = [newAct, ...prev].slice(0, 5);
            localStorage.setItem("recentActivity", JSON.stringify(updated));
            return updated;
        });
    };

    const resetFilters = () => {
        setSearchTerm("");
        setCategoryFilter("All");
        setShowLowStockOnly(false);
    };

    const exportToCSV = () => {
        if (products.length === 0) return toast.error("No data available for export");
        const headers = ["ID,Name,Category,Quantity,Price\n"];
        const rows = products.map(p => `${p.id},${p.name},${p.category},${p.quantity},${p.price}\n`);
        const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', `inventory_report_${new Date().toLocaleDateString()}.csv`);
        a.click();
        toast.success("Inventory manifest exported");
    };

    const stats = useMemo(() => {
        const totalItems = products.reduce((acc, p) => acc + p.quantity, 0);
        const totalValue = products.reduce((acc, p) => acc + (p.price * p.quantity), 0);
        const lowStockCount = products.filter(p => p.quantity < 5).length;
        return { totalItems, totalValue, lowStockCount };
    }, [products]);

    // UPDATED: FILTER LOGIC (Uses debounced search)
    const filteredProducts = useMemo(() => {
        if (!Array.isArray(products)) return [];
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(debouncedSearch.toLowerCase());
            const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
            const matchesLowStock = showLowStockOnly ? p.quantity < 5 : true;
            return matchesSearch && matchesCategory && matchesLowStock;
        });
    }, [products, debouncedSearch, categoryFilter, showLowStockOnly]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading('Committing changes to registry...');
        try {
            if (editingProduct) {
                await productService.updateProduct(editingProduct.id, formData);
                trackActivity(formData.name, 'Updated');
                toast.success('Asset record synchronized', { id: toastId });
            } else {
                await productService.createProduct(formData);
                trackActivity(formData.name, 'Added');
                toast.success('New asset indexed successfully', { id: toastId });
                setCurrentPage(0);
            }
            await loadProducts();
            closeModal();
        } catch { toast.error("Database write-error occurred", { id: toastId }); }
    };

    const openDeleteConfirm = (product) => { setProductToDelete(product); setShowDeleteModal(true); };
    const confirmDelete = async () => {
        const tid = toast.loading('Erasing record...');
        try {
            await productService.deleteProduct(productToDelete.id);
            trackActivity(productToDelete.name, 'Deleted');
            await loadProducts();
            toast.success('Registry entry removed', { id: tid });
            setShowDeleteModal(false);
        } catch { toast.error('De-indexing failed', { id: tid }); }
    };

    const openCreateModal = () => {
        setEditingProduct(null);
        setFormData({ name: "", quantity: 0, price: 0, category: "General", imageUrl: "" });
        setIsModalOpen(true);
    };

    const openEditModal = (p) => {
        setEditingProduct(p);
        setFormData({ name: p.name, quantity: p.quantity, price: p.price, category: p.category || "General", imageUrl: p.imageUrl || "" });
        setIsModalOpen(true);
    };

    const closeModal = () => { setIsModalOpen(false); setEditingProduct(null); };

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex flex-col items-center py-10 px-4 font-sans selection:bg-indigo-100 transition-colors duration-300">
            <Toaster position="bottom-center" />

            <div className="w-full max-w-5xl">
                {/* 1. HEADER */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-200/60 dark:border-slate-800 mb-6">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-xl shadow-indigo-100 dark:shadow-none transition-transform hover:scale-105"><Package size={28} /></div>
                                    {stats.lowStockCount > 0 && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span></span>}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Inventory Pro</h1>
                                        <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800 uppercase">v1.1</span>
                                    </div>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1.5 leading-none">Stock Intelligence Portal</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={exportToCSV} className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:scale-105 transition-all border border-emerald-100 dark:border-emerald-800" title="Export Manifest"><Download size={20} /></button>
                                <button onClick={() => setDarkMode(!darkMode)} className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-yellow-400 hover:scale-105 transition-all">{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
                                <button onClick={openCreateModal} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95 text-sm"><Plus size={18} /> Register Asset</button>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="relative flex-grow">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input placeholder="Filter assets by signature..." className="pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-2xl w-full text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                            <select className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-2xl text-sm font-bold outline-none cursor-pointer" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                                <option value="All">All Sectors</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Furniture">Furniture</option>
                                <option value="Office">Office</option>
                                <option value="Stationery">Stationery</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 2. ACTIVITY LOG */}
                {recentActivity.length > 0 && (
                    <div className="w-full mb-6 flex items-center gap-4 bg-white/50 dark:bg-slate-900/50 p-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-2 px-3 border-r border-slate-200 dark:border-slate-700 text-slate-400 uppercase text-[10px] font-black tracking-widest"><History size={14} /> Log</div>
                        {recentActivity.map(act => (
                            <div key={act.id} className="flex items-center gap-2 whitespace-nowrap px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-xs font-bold border border-slate-100 dark:border-slate-700">
                                <span className={`w-1.5 h-1.5 rounded-full ${act.action === 'Added' ? 'bg-emerald-500' : act.action === 'Updated' ? 'bg-indigo-500' : 'bg-rose-500'}`} />
                                <span className="text-slate-700 dark:text-slate-300">{act.name}</span>
                                <span className="text-[9px] text-slate-400 uppercase">{act.action}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* 3. STATS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[1.5rem] border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                        <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Global Stock</p><h3 className="text-2xl font-black dark:text-white">{stats.totalItems.toLocaleString()}</h3></div>
                        <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-xl text-indigo-600 dark:text-indigo-400"><TrendingUp size={20} /></div>
                    </div>
                    <div onClick={() => setShowLowStockOnly(!showLowStockOnly)} className={`p-6 rounded-[1.5rem] shadow-sm border cursor-pointer transition-all flex items-center justify-between group ${showLowStockOnly ? "bg-rose-500 border-rose-600 text-white" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"}`}>
                        <div><p className={`text-[10px] font-black uppercase mb-1 ${showLowStockOnly ? "text-rose-100" : "text-slate-400"}`}>Critical Assets</p><h3 className={`text-2xl font-black ${showLowStockOnly ? "text-white" : "text-slate-800 dark:text-white"}`}>{stats.lowStockCount} Units</h3></div>
                        <div className={`p-3 rounded-xl ${showLowStockOnly ? "bg-white/20" : "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400"}`}><AlertTriangle size={20} className={stats.lowStockCount > 0 ? "animate-bounce" : ""} /></div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[1.5rem] border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                        <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Portfolio Valuation</p><h3 className="text-2xl font-black dark:text-white">₹{stats.totalValue.toLocaleString("en-IN")}</h3></div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-xl text-emerald-600 dark:text-emerald-400"><IndianRupee size={20} /></div>
                    </div>
                </div>

                {/* 4. DATA TABLE (Mobile Responsive Wrap) */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200/60 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        {filteredProducts.length > 0 ? (
                            <table className="w-full text-left min-w-[700px]">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <tr>{["Asset", "Sector", "Status", "Price", "Actions"].map(h => (<th key={h} className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>))}</tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {filteredProducts.map(p => (
                                    <tr key={p.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all">
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                                    {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : <Package size={16} className="text-slate-400" />}
                                                </div>
                                                <div><p className="font-bold text-slate-700 dark:text-slate-200">{p.name}</p><p className="text-[9px] font-mono text-slate-400">#{p.id.slice(-6)}</p></div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4"><span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${getCategoryStyle(p.category)}`}>{p.category}</span></td>

                                        {/* FEATURE 2: SMART BADGE LOGIC (3 TIERS) */}
                                        <td className="px-8 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                                                    p.quantity <= 5 ? "bg-rose-100 text-rose-600 animate-pulse" :
                                                        p.quantity <= 10 ? "bg-amber-100 text-amber-600" :
                                                            "bg-emerald-100 text-emerald-600"
                                                }`}>
                                                    {p.quantity} UNITS
                                                </span>
                                        </td>

                                        <td className="px-8 py-4 font-bold text-sm dark:text-slate-100">₹{p.price.toLocaleString("en-IN")}</td>

                                        {/* FEATURE 3: PERSISTENT ACTIONS (OPACITY-25) */}
                                        <td className="px-8 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-25 group-hover:opacity-100 transition-all duration-300">
                                                <button onClick={() => openEditModal(p)} className="p-2 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-all"><Edit2 size={14} /></button>
                                                <button onClick={() => openDeleteConfirm(p)} className="p-2 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        ) : (
                            /* FEATURE 4: EMPTY STATE RECOVERY */
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <BoxSelect size={50} className="text-slate-200 dark:text-slate-700 mb-4" />
                                <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs">No matching indices found</h3>
                                <button onClick={resetFilters} className="mt-4 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-tighter hover:underline transition-all">Reset Active Filters</button>
                            </div>
                        )}
                    </div>

                    {/* PAGINATION */}
                    <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/30">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {currentPage + 1} of {totalPages || 1}</span>
                        <div className="flex gap-2">
                            <button disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)} className="p-2 rounded-xl border dark:border-slate-700 disabled:opacity-20 hover:bg-white dark:hover:bg-slate-800"><ArrowUpDown className="rotate-90" size={16} /></button>
                            <button disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(p => p + 1)} className="p-2 rounded-xl border dark:border-slate-700 disabled:opacity-20 hover:bg-white dark:hover:bg-slate-800"><ArrowUpDown className="-rotate-90" size={16} /></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALS REMAIN THE SAME BUT WITH UPDATED BUTTON TEXTS FOR SEMANTIC POLISH */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex justify-center items-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl dark:border dark:border-slate-800 animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black dark:text-white tracking-tight">{editingProduct ? "Modify Asset" : "Register New Asset"}</h2>
                            <button onClick={closeModal} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full hover:text-rose-500"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Nomenclature</label>
                                <input required className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operational Sector</label>
                                <select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl text-sm font-semibold" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                                    {["General", "Electronics", "Furniture", "Office", "Stationery"].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Visual Data (URL)</label>
                                <input placeholder="https://..." className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" placeholder="Units" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl text-sm font-semibold" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: +e.target.value })} />
                                <input type="number" placeholder="Valuation" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl text-sm font-semibold" value={formData.price} onChange={(e) => setFormData({ ...formData, price: +e.target.value })} />
                            </div>
                            <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all active:scale-95 mt-2">
                                {editingProduct ? "Synchronize Changes" : "Commit to Registry"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[60] p-4">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] w-full max-w-[320px] shadow-2xl text-center dark:border dark:border-slate-800 animate-in zoom-in duration-150">
                        <div className="bg-rose-100 p-4 rounded-2xl inline-block mb-4 text-rose-600"><AlertTriangle size={28} /></div>
                        <h2 className="text-lg font-black dark:text-white mb-2 tracking-tight">Erase Asset?</h2>
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 text-sm font-bold text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">Abey Nahi</button>
                            <button onClick={confirmDelete} className="flex-1 bg-rose-500 text-white py-3 rounded-xl font-bold">Haan, Delete Kar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;