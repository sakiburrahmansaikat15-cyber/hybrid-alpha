import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Minus, Trash2, ShoppingCart, Package, CreditCard, Loader,
  RotateCcw, X, Warehouse, User, ChevronRight, Activity,
  Filter, Pause, Tag, ScanBarcode, History, Maximize2, Minimize2,
  LayoutGrid, List, Smartphone, Monitor, ChevronLeft, LogOut, UserPlus, Save
} from 'lucide-react';
import { Link } from 'react-router-dom';

// --- API Endpoints ---
const STOCKS_API = '/api/stocks';
const TERMINALS_API = '/api/pos/terminals';
const WAREHOUSES_API = '/api/warehouses';
const CUSTOMERS_API = '/api/pos/customers';
const SALES_API = '/api/pos/sales';
const HOLD_CART_API = '/api/pos/hold-carts';

const Checkout = () => {
  // --- State ---
  const [stocks, setStocks] = useState([]);
  const [allStocks, setAllStocks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTerminal, setSelectedTerminal] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [showHeldCartsModal, setShowHeldCartsModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [heldCartsForTerminal, setHeldCartsForTerminal] = useState([]);

  // New Customer Form State
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // Fiscal
  const [displayedTaxPercent, setDisplayedTaxPercent] = useState(0);
  const [discountValue, setDiscountValue] = useState(0);

  // Pagination
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 });

  // Refs
  const notificationTimerRef = useRef(null);
  const barcodeInputRef = useRef(null);
  const barcodeBufferRef = useRef('');
  const barcodeTimeoutRef = useRef(null);

  // --- Utilities ---
  const showNotification = useCallback((message, type = 'success') => {
    if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    setNotification({ show: true, message, type });
    notificationTimerRef.current = setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 4000);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleApiError = useCallback((error, defaultMsg) => {
    const msg = error.response?.data?.message || defaultMsg || 'Operation failed';
    showNotification(msg, 'error');
  }, [showNotification]);

  // --- Data Fetching ---
  const fetchInitialData = useCallback(async () => {
    try {
      const [wRes, cRes, tRes] = await Promise.all([
        axios.get(WAREHOUSES_API),
        axios.get(CUSTOMERS_API, { params: { limit: 100 } }),
        axios.get(TERMINALS_API)
      ]);

      const wData = wRes.data.pagination?.data || wRes.data.data || [];
      setWarehouses(wData);
      const defWarehouse = wData.find(w => w.is_default);
      if (defWarehouse) setSelectedWarehouse(defWarehouse.id.toString()); // Note: Missing state for warehouse? No, defined line 28

      setCustomers(cRes.data.pagination?.data || cRes.data.data || []);

      const tData = tRes.data.pagination?.data || tRes.data.data || [];
      setTerminals(tData);
      if (tData.length > 0) setSelectedTerminal(tData[0].id.toString());
    } catch (e) {
      console.error('Initial sync failed', e);
      showNotification('Failed to load initial data', 'error');
    }
  }, [showNotification]);

  const fetchStocks = useCallback(async (page = 1, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.per_page, keyword };
      const resp = await axios.get(STOCKS_API, { params });
      const list = resp.data.data || [];

      setAllStocks(list);
      setStocks(list);

      if (page === 1) {
        setCategories(['all', ...new Set(list.map(s => s.product?.category?.name).filter(Boolean))]);
      }

      setPagination(p => ({
        ...p,
        current_page: resp.data.current_page || page,
        last_page: resp.data.total_pages || 1,
        total: resp.data.total_items || 0
      }));
    } catch (e) {
      handleApiError(e, 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [pagination.per_page, handleApiError]);

  const fetchHeldCarts = async (tid) => {
    if (!tid) {
      setHeldCartsForTerminal([]);
      return;
    }
    try {
      const resp = await axios.get(HOLD_CART_API, { params: { limit: 100 } });
      const carts = resp.data.pagination?.data || [];
      setHeldCartsForTerminal(carts.filter(c => c.terminal_id === parseInt(tid)));
    } catch (e) { console.error(e); }
  };

  // --- Customer Creation ---
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) return showNotification("Name and Phone required", "error");

    setCreatingCustomer(true);
    try {
      const resp = await axios.post(CUSTOMERS_API, newCustomer);
      const created = resp.data.data;

      setCustomers(prev => [created, ...prev]);
      setSelectedCustomer(created.id);
      setShowCustomerModal(false);
      setNewCustomer({ name: '', phone: '', email: '' });
      showNotification(`Customer ${created.name} created!`, "success");
    } catch (err) {
      handleApiError(err, "Failed to create customer");
    } finally {
      setCreatingCustomer(false);
    }
  };

  // --- Effects ---
  useEffect(() => {
    fetchInitialData();
    fetchStocks(1);
  }, []);

  useEffect(() => {
    if (selectedTerminal) fetchHeldCarts(selectedTerminal);
  }, [selectedTerminal]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) fetchStocks(1, searchTerm);
      else if (stocks.length === 0) fetchStocks(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchStocks]);

  useEffect(() => {
    if (selectedCategory !== 'all') {
      const filtered = allStocks.filter(s => s.product?.category?.name === selectedCategory);
      setStocks(filtered);
    } else {
      setStocks(allStocks);
    }
  }, [selectedCategory, allStocks]);

  // Barcode
  useEffect(() => {
    const handleKey = (e) => {
      if (document.activeElement.tagName === 'INPUT' && document.activeElement !== barcodeInputRef.current && !showCustomerModal) return;
      if (showCustomerModal) return; // Disable barcode when modal open

      if (e.key === 'Enter') {
        const code = barcodeBufferRef.current;
        if (code.length > 2) searchByBarcode(code);
        barcodeBufferRef.current = '';
        return;
      }
      if (e.key.length === 1 && /[a-zA-Z0-9\-_]/.test(e.key)) {
        barcodeBufferRef.current += e.key;
        if (barcodeTimeoutRef.current) clearTimeout(barcodeTimeoutRef.current);
        barcodeTimeoutRef.current = setTimeout(() => { barcodeBufferRef.current = ''; }, 100);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showCustomerModal]);

  const searchByBarcode = async (code) => {
    if (!code.trim()) return;
    try {
      const resp = await axios.get(STOCKS_API, { params: { keyword: code.trim(), limit: 1 } });
      const list = resp.data.data || [];
      const match = list.find(s => s.serialLists?.some(sl => sl.barcode === code.trim()) || s.product?.code === code.trim());

      if (match) {
        addToCart(match);
        showNotification(`Added: ${match.product.name}`, 'success');
      } else {
        showNotification(`Product not found: ${code}`, 'error');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- Cart Logic ---
  const addToCart = (stock) => {
    const avail = parseInt(stock.quantity || 0);
    if (avail <= 0) return showNotification('Out of stock', 'error');

    const price = parseFloat(stock.selling_price || 0);
    const tax = parseFloat(stock.tax || 0);

    setCart(prev => {
      const existing = prev.find(i => i.stock_id === stock.id);
      if (existing) {
        if (existing.quantity + 1 > avail) {
          showNotification(`Max quantity reached (${avail})`, 'error');
          return prev;
        }
        return prev.map(i => i.stock_id === stock.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      setDisplayedTaxPercent(tax);
      return [...prev, {
        stock_id: stock.id,
        product_id: stock.product_id,
        name: stock.product.name,
        price: price,
        tax_amount: price * (tax / 100),
        tax_percent: tax,
        quantity: 1,
        available_stock: avail,
        image: stock.product?.image || stock.serialLists?.[0]?.image
      }];
    });
  };

  const updateQty = (sid, q) => {
    if (q < 1) return;
    setCart(prev => {
      const item = prev.find(i => i.stock_id === sid);
      if (!item) return prev;
      if (q > item.available_stock) {
        showNotification(`Max Stock: ${item.available_stock}`, 'error');
        return prev;
      }
      return prev.map(i => i.stock_id === sid ? { ...i, quantity: q } : i);
    });
  };

  const removeFromCart = (sid) => setCart(prev => prev.filter(i => i.stock_id !== sid));

  // --- Totals ---
  const subTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const taxSum = cart.reduce((acc, item) => acc + (item.tax_amount * item.quantity), 0);
  const totalBeforeDisc = subTotal + taxSum;
  const netPayable = Math.max(0, totalBeforeDisc - parseFloat(discountValue || 0));

  // --- Checkout ---
  const handleCheckout = async () => {
    if (!selectedTerminal) return showNotification('Select a terminal', 'error');
    if (cart.length === 0) return showNotification('Cart is empty', 'error');

    setProcessing(true);
    try {
      const payload = {
        terminal_id: parseInt(selectedTerminal),
        customer_id: selectedCustomer ? parseInt(selectedCustomer) : null,
        subtotal: parseFloat(subTotal.toFixed(2)),
        tax_amount: parseFloat(taxSum.toFixed(2)),
        discount_amount: parseFloat(discountValue),
        total_amount: parseFloat(netPayable.toFixed(2)),
        payable_amount: parseFloat(netPayable.toFixed(2)), // Added for validation
        paid_amount: parseFloat(netPayable.toFixed(2)),
        payment_status: 'paid',
        status: 'completed',
        items: cart.map(item => ({
          stock_id: item.stock_id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: parseFloat((item.price * item.quantity).toFixed(2)),
          tax_amount: parseFloat((item.tax_amount * item.quantity).toFixed(2)),
          total: parseFloat(((item.price + item.tax_amount) * item.quantity).toFixed(2))
        })),
        payments: [{ payment_method_id: 1, amount: parseFloat(netPayable.toFixed(2)) }]
      };

      await axios.post(SALES_API, payload);

      showNotification('Sale completed successfully!', 'success');
      setCart([]);
      setDiscountValue(0);
      setSelectedCustomer('');
      fetchStocks(pagination.current_page);
    } catch (e) {
      handleApiError(e, 'Checkout failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleHold = async () => {
    if (!selectedTerminal || cart.length === 0) return showNotification('Cannot hold empty cart', 'error');
    try {
      const payload = {
        terminal_id: parseInt(selectedTerminal),
        cart_data: JSON.stringify({ items: cart, tax_p: displayedTaxPercent, total: netPayable })
      };
      await axios.post(HOLD_CART_API, payload);
      showNotification('Cart Held', 'success');
      setCart([]);
      fetchHeldCarts(selectedTerminal);
    } catch (e) { handleApiError(e, 'Hold Failed'); }
  };

  const resumeHold = async (holdItem) => {
    try {
      const raw = holdItem.cart_data.startsWith('"') ? JSON.parse(holdItem.cart_data) : holdItem.cart_data;
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      setCart(data.items || []);
      setDisplayedTaxPercent(data.tax_p || 0);
      await axios.delete(`${HOLD_CART_API}/${holdItem.id}`);
      fetchHeldCarts(selectedTerminal);
      setShowHeldCartsModal(false);
      showNotification('Cart Resumed', 'success');
    } catch (e) { console.error(e); }
  };

  return (
    <div className={`flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans ${isFullscreen ? 'fixed inset-0 z-[100]' : ''}`}>
      <input ref={barcodeInputRef} type="text" className="fixed opacity-0 pointer-events-none" autoFocus />

      {/* --- Notification --- */}
      <AnimatePresence>
        {notification.show && (
          <motion.div initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-6 left-1/2 z-[200] px-6 py-3 rounded-xl shadow-lg border backdrop-blur-md flex items-center gap-3 ${notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'}`}>
            {notification.type === 'error' ? <X size={18} /> : <Activity size={18} />} <span className="font-semibold text-sm">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex overflow-hidden">
        {/* === LEFT: Product Grid === */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 dark:border-slate-800">

          {/* Header */}
          <header className="px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0 shadow-sm z-10 h-16">
            <div className="flex items-center gap-4">
              <Link to="/" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"><ChevronLeft size={20} /></Link>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-lg text-white shadow-lg shadow-cyan-500/30"><ScanBarcode size={20} /></div>
                <div><h1 className="font-bold text-lg leading-tight tracking-tight">POS Terminal</h1><p className="text-[10px] text-slate-400 font-medium">v2.4.0 • Connected</p></div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-1 justify-end max-w-2xl">
              <div className="relative w-full max-w-md group hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors" size={18} />
                <input type="text" placeholder="Search item (Ctrl+K) or scan barcode..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all placeholder:text-slate-400" />
              </div>
              <button onClick={toggleFullscreen} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-slate-700 transition-all border border-transparent hover:border-cyan-100" title="Fullscreen">
                {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
            </div>
          </header>

          {/* Filters */}
          <div className="px-6 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 h-14">
            <button onClick={() => setSelectedCategory('all')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedCategory === 'all' ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-500/20' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}>All Items</button>
            {categories.filter(c => c !== 'all').map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${selectedCategory === cat ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-500/20' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}>{cat}</button>
            ))}
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-6 scroll-smooth bg-slate-50 dark:bg-slate-950">
            {loading ? <div className="h-full flex items-center justify-center"><Loader className="animate-spin text-cyan-500" size={40} /></div> :
              stocks.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-slate-400"><Package size={48} className="mb-2 opacity-50" />No products found</div> :
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-20">
                  {stocks.map(stock => {
                    const isOut = (stock.quantity || 0) <= 0;
                    return (
                      <motion.div key={stock.id} whileHover={!isOut ? { y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' } : {}} onClick={() => !isOut && addToCart(stock)}
                        className={`group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-col gap-3 shadow-sm transition-all cursor-pointer ${isOut ? 'opacity-60 grayscale' : ''}`}>
                        <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                          {stock.product?.image ? <img src={stock.product.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Package size={28} /></div>}
                          <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide text-white shadow-sm ${isOut ? 'bg-rose-500' : 'bg-emerald-500'}`}>{isOut ? 'No Stock' : stock.quantity + ' left'}</div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm line-clamp-2 text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 transition-colors">{stock.product?.name}</h3>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="font-bold text-lg text-slate-900 dark:text-white">${parseFloat(stock.selling_price).toLocaleString()}</span>
                            {!isOut && <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-blue-600 group-hover:bg-cyan-500 group-hover:text-white transition-colors"><Plus size={16} /></div>}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
            }
          </div>

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center text-xs h-12">
              <span className="text-slate-500 font-medium">Pg {pagination.current_page} of {pagination.last_page}</span>
              <div className="flex gap-2">
                <button onClick={() => fetchStocks(pagination.current_page - 1)} disabled={pagination.current_page === 1} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-50"><ChevronLeft size={16} /></button>
                <button onClick={() => fetchStocks(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-50"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>

        {/* === RIGHT: Cart === */}
        <div className="w-[380px] xl:w-[450px] bg-white dark:bg-slate-900 flex flex-col border-l border-slate-200 dark:border-slate-800 shrink-0 z-20 shadow-2xl shadow-blue-900/10">

          {/* Controls */}
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3">
            {/* Customer & Terminal Select */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-cyan-500 transition-all appearance-none">
                  <option value="">Walk-in Customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <button onClick={() => setShowCustomerModal(true)} className="p-2.5 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 rounded-xl hover:bg-cyan-100 transition-colors border border-cyan-200 dark:border-cyan-800" title="Add Customer">
                <UserPlus size={20} />
              </button>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Monitor className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select value={selectedTerminal} onChange={e => setSelectedTerminal(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-cyan-500 transition-all appearance-none">
                  <option value="">Select Terminal</option>
                  {terminals.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <button onClick={() => setShowHeldCartsModal(true)} className="p-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl hover:bg-amber-100 transition-colors border border-amber-200 dark:border-amber-800 relative" title="Held Carts">
                <History size={20} />
                {heldCartsForTerminal.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>}
              </button>
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/30 scroll-smooth">
            {cart.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50"><ShoppingCart size={48} className="mb-4 text-slate-300" strokeWidth={1.5} /><p className="font-medium">Cart is empty</p><p className="text-xs mt-1">Select items to start sale</p></div> :
              <AnimatePresence initial={false}>
                {cart.map(item => (
                  <motion.div key={item.stock_id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex gap-3 group hover:border-cyan-500/30 transition-colors">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0"><img src={item.image} className="w-full h-full object-cover" /></div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div className="flex justify-between items-start gap-2"><h4 className="font-bold text-sm truncate text-slate-700 dark:text-slate-200">{item.name}</h4><button onClick={() => removeFromCart(item.stock_id)} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={16} /></button></div>
                      <div className="flex justify-between items-center mt-1">
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                          <button onClick={() => updateQty(item.stock_id, item.quantity - 1)} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded shadow-sm text-slate-500 transition-all"><Minus size={14} /></button>
                          <span className="text-sm font-bold w-6 text-center tabular-nums">{item.quantity}</span>
                          <button onClick={() => updateQty(item.stock_id, item.quantity + 1)} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded shadow-sm text-cyan-600 transition-all"><Plus size={14} /></button>
                        </div>
                        <span className="font-bold font-mono text-slate-900 dark:text-white tabular-nums">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            }
          </div>

          {/* Checkout Footer */}
          <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm text-slate-500"><span>Subtotal</span><span className="font-mono">${subTotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm text-slate-500"><span>Tax</span><span className="font-mono">${taxSum.toFixed(2)}</span></div>
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total</span>
                <span className="text-3xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">${netPayable.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <button onClick={() => { setCart([]); setDiscountValue(0); }} className="col-span-1 py-4 bg-slate-100 text-slate-500 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center border border-transparent hover:border-rose-200" title="Clear Cart"><Trash2 size={24} strokeWidth={1.5} /></button>
              <button onClick={handleHold} className="col-span-1 py-4 bg-slate-100 text-slate-500 rounded-xl hover:bg-amber-50 hover:text-amber-600 transition-all flex items-center justify-center border border-transparent hover:border-amber-200" title="Hold Cart"><Pause size={24} strokeWidth={1.5} /></button>
              <button onClick={handleCheckout} disabled={processing || cart.length === 0} className="col-span-2 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
                {processing ? <Loader className="animate-spin" /> : <div className="flex items-center gap-2">CHECKOUT <CreditCard size={20} /></div>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      <AnimatePresence>
        {/* Held Carts Modal */}
        {showHeldCartsModal && (
          <div className="fixed inset-0 z-[250] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl p-6 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold flex items-center gap-2"><History className="text-amber-500" />Held Carts</h2><button onClick={() => setShowHeldCartsModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X /></button></div>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {heldCartsForTerminal.map(c => {
                  const d = JSON.parse(c.cart_data.startsWith('"') ? JSON.parse(c.cart_data) : c.cart_data);
                  return (
                    <div key={c.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div><p className="font-bold text-lg font-mono">${parseFloat(d.total).toFixed(2)}</p><p className="text-xs text-slate-400 font-medium">{d.items?.length} items • {new Date(c.created_at).toLocaleTimeString()}</p></div>
                      <button onClick={() => resumeHold(c)} className="px-5 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl text-sm font-bold hover:shadow-lg transition-all">Resume</button>
                    </div>
                  )
                })}
                {heldCartsForTerminal.length === 0 && <div className="text-center text-slate-400 py-8 italic">No held carts found for this terminal.</div>}
              </div>
            </motion.div>
          </div>
        )}

        {/* Create Customer Modal */}
        {showCustomerModal && (
          <div className="fixed inset-0 z-[260] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-8 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-8">
                <div><h2 className="text-2xl font-bold text-slate-900 dark:text-white">New Customer</h2><p className="text-sm text-slate-500">Add a new customer to the database</p></div>
                <button onClick={() => setShowCustomerModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X /></button>
              </div>
              <form onSubmit={handleCreateCustomer} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Full Name *</label>
                  <input type="text" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-medium" placeholder="Ex: John Doe" autoFocus />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Phone Number *</label>
                  <input type="text" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-medium" placeholder="Ex: +1 234 567 890" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
                  <input type="email" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-medium" placeholder="optional@example.com" />
                </div>
                <button disabled={creatingCustomer} type="submit" className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-70">
                  {creatingCustomer ? <Loader className="animate-spin" /> : <><Save size={20} /> Create Customer</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Checkout;
