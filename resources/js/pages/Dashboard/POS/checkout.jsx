import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Package,
  CreditCard,
  Loader,
  AlertCircle,
  CheckCircle,
  Pause,
  RotateCcw,
  RefreshCw,
  X,
  Calendar,
  Warehouse,
  User,
  Users,
  Tag,
} from 'lucide-react';

// Updated API endpoints
const STOCKS_API = 'http://localhost:8000/api/stocks';
const TERMINALS_API = 'http://localhost:8000/api/pos/terminals';
const WAREHOUSES_API = 'http://localhost:8000/api/warehouses';
const CUSTOMERS_API = 'http://localhost:8000/api/pos/customers';
const CUSTOMER_GROUPS_API = 'http://localhost:8000/api/pos/customer-groups';
const SALES_API = 'http://localhost:8000/api/pos/sales';
const SALE_ITEMS_API = 'http://localhost:8000/api/pos/sale-items'; // New endpoint
const HOLD_CART_API = 'http://localhost:8000/api/pos/hold-carts';

const Checkout = () => {
  const [stocks, setStocks] = useState([]);
  const [allStocks, setAllStocks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [terminals, setTerminals] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerGroups, setCustomerGroups] = useState([]);
  const [selectedTerminal, setSelectedTerminal] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Customer creation modal
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    customer_group_id: '',
  });
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // Tax display (from last added item)
  const [displayedTaxPercent, setDisplayedTaxPercent] = useState(0);
  const [discountType, setDiscountType] = useState('fixed');
  const [discountValue, setDiscountValue] = useState(0);
  const [shipping, setShipping] = useState(0);

  // Held carts
  const [heldCartsForTerminal, setHeldCartsForTerminal] = useState([]);
  const [showHeldCartsModal, setShowHeldCartsModal] = useState(false);
  const [resuming, setResuming] = useState(false);

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });

  const barcodeInputRef = useRef(null);
  const [barcodeBuffer, setBarcodeBuffer] = useState('');
  const barcodeTimeoutRef = useRef(null);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 5000);
  }, []);

  // Fetch warehouses
  const fetchWarehouses = useCallback(async () => {
    try {
      const response = await axios.get(WAREHOUSES_API);
      const data = response.data.pagination?.data || response.data.data || [];
      setWarehouses(data);
      const defaultWarehouse = data.find(w => w.is_default === true || w.is_default === 1);
      if (defaultWarehouse) {
        setSelectedWarehouse(defaultWarehouse.id.toString());
      }
    } catch (error) {
      showNotification('Failed to load warehouses', 'error');
    }
  }, [showNotification]);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      const response = await axios.get(CUSTOMERS_API);
      const data = response.data.pagination?.data || response.data.data || [];
      setCustomers(data);
    } catch (error) {
      showNotification('Failed to load customers', 'error');
    }
  }, [showNotification]);

  // Fetch customer groups
  const fetchCustomerGroups = useCallback(async () => {
    try {
      const response = await axios.get(CUSTOMER_GROUPS_API);
      const data = response.data.pagination?.data || response.data.data || [];
      setCustomerGroups(data);
    } catch (error) {
      showNotification('Failed to load customer groups', 'error');
    }
  }, [showNotification]);

  // Create new customer
  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
      showNotification('Name and phone are required', 'error');
      return;
    }
    setCreatingCustomer(true);
    try {
      const payload = {
        name: newCustomer.name.trim(),
        phone: newCustomer.phone.trim(),
        email: newCustomer.email.trim() || null,
        customer_group_id: newCustomer.customer_group_id || null,
      };
      const response = await axios.post(CUSTOMERS_API, payload);
      const createdCustomer = response.data.data;
      setCustomers(prev => [createdCustomer, ...prev]);
      setSelectedCustomer(createdCustomer.id.toString());
      setNewCustomer({ name: '', phone: '', email: '', customer_group_id: '' });
      setShowCreateCustomer(false);
      showNotification('Customer created successfully', 'success');
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to create customer', 'error');
    } finally {
      setCreatingCustomer(false);
    }
  };

  // Fetch stocks
  const fetchStocks = useCallback(async (page = 1, perPage = pagination.per_page, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit: perPage };
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await axios.get(STOCKS_API, { params });
      const res = response.data;

      const stockList = res.data || [];

      setAllStocks(stockList);
      setStocks(stockList);

      const cats = ['all', ...new Set(stockList.map(s => s.product?.category?.name).filter(Boolean))];
      const brds = ['all', ...new Set(stockList.map(s => s.product?.brand?.name).filter(Boolean))];
      setCategories(cats);
      setBrands(brds);

      setPagination({
        current_page: res.current_page || 1,
        last_page: res.total_pages || 1,
        per_page: res.per_page || perPage,
        total: res.total_items || 0,
      });
    } catch (error) {
      showNotification('Failed to load stocks', 'error');
      setStocks([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.per_page, showNotification]);

  // Filter stocks
  useEffect(() => {
    let filtered = allStocks;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.product?.category?.name === selectedCategory);
    }
    if (selectedBrand !== 'all') {
      filtered = filtered.filter(s => s.product?.brand?.name === selectedBrand);
    }
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.serialLists?.some(sl => sl.barcode?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setStocks(filtered);
  }, [selectedCategory, selectedBrand, searchTerm, allStocks]);

  // Fetch held carts
  const fetchHeldCartsForTerminal = async (terminalId) => {
    if (!terminalId) {
      setHeldCartsForTerminal([]);
      return;
    }
    try {
      const response = await axios.get(HOLD_CART_API, { params: { limit: 100 } });
      const allCarts = response.data.pagination?.data || [];
      const matching = allCarts
        .filter(c => c.terminal_id === parseInt(terminalId))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setHeldCartsForTerminal(matching);
    } catch (err) {
      console.error('Failed to fetch held carts:', err);
      setHeldCartsForTerminal([]);
    }
  };

  useEffect(() => {
    if (selectedTerminal) {
      fetchHeldCartsForTerminal(selectedTerminal);
    } else {
      setHeldCartsForTerminal([]);
    }
  }, [selectedTerminal]);

  // Initial data loading
  useEffect(() => {
    fetchWarehouses();
    fetchCustomers();
    fetchCustomerGroups();
  }, []);

  useEffect(() => {
    fetchStocks(1, pagination.per_page, '');
  }, []);

  useEffect(() => {
    const fetchTerminals = async () => {
      try {
        const res = await axios.get(TERMINALS_API);
        const list = res.data.pagination?.data || res.data.data || res.data || [];
        setTerminals(list);
      } catch (err) {
        showNotification('Failed to load terminals', 'error');
      }
    };
    fetchTerminals();
  }, [showNotification]);

  // Barcode scanning
  const searchByBarcode = async (barcode) => {
    if (!barcode.trim()) return;
    try {
      const response = await axios.get(STOCKS_API, { params: { keyword: barcode.trim(), limit: 50 } });
      const stockList = response.data.data || [];
      const matchedStock = stockList.find(stock =>
        stock.serialLists?.some(sl => sl.barcode && sl.barcode.trim() === barcode.trim())
      );
      if (matchedStock) {
        addToCart(matchedStock);
        showNotification(`Added: ${matchedStock.product.name}`, 'success');
        if (barcodeInputRef.current) barcodeInputRef.current.focus();
      } else {
        showNotification(`Barcode not found: ${barcode}`, 'error');
      }
    } catch (err) {
      showNotification('Scan failed', 'error');
    }
    setBarcodeBuffer('');
  };

  useEffect(() => {
    const handleBarcodeScan = (e) => {
      const activeElement = document.activeElement;
      if (activeElement && activeElement.tagName === 'INPUT' && activeElement.type === 'text' && activeElement !== barcodeInputRef.current) return;

      if (e.key === 'Enter') {
        if (barcodeBuffer.length > 3) searchByBarcode(barcodeBuffer);
        setBarcodeBuffer('');
        if (barcodeTimeoutRef.current) clearTimeout(barcodeTimeoutRef.current);
        return;
      }
      if (e.key.length === 1 && /[a-zA-Z0-9\-_]/.test(e.key)) {
        setBarcodeBuffer(prev => prev + e.key);
        if (barcodeTimeoutRef.current) clearTimeout(barcodeTimeoutRef.current);
        barcodeTimeoutRef.current = setTimeout(() => setBarcodeBuffer(''), 150);
      }
    };
    window.addEventListener('keydown', handleBarcodeScan);
    return () => {
      window.removeEventListener('keydown', handleBarcodeScan);
      if (barcodeTimeoutRef.current) clearTimeout(barcodeTimeoutRef.current);
    };
  }, [barcodeBuffer]);

  useEffect(() => {
    if (barcodeInputRef.current) barcodeInputRef.current.focus();
  }, []);

  // Add to cart
  const addToCart = (stockItem) => {
    const quantity = parseInt(stockItem.quantity || 0);
    if (quantity === 0) return showNotification(`${stockItem.product.name} out of stock`, 'error');

    const basePrice = parseFloat(stockItem.selling_price || 0);
    if (basePrice === 0) return showNotification(`No price set`, 'error');

    const taxPercent = parseFloat(stockItem.tax || 0);
    const priceWithTax = basePrice * (1 + taxPercent / 100);

    const serialImage = stockItem.serialLists?.[0]?.image
      ? stockItem.serialLists[0].image.startsWith('http')
        ? stockItem.serialLists[0].image
        : `http://localhost:8000/${stockItem.serialLists[0].image.replace(/^\/+/, '')}`
      : null;
    const productImage = stockItem.product?.image || null;
    const displayImage = serialImage || productImage;

    setDisplayedTaxPercent(taxPercent);

    setCart(prev => {
      const existing = prev.find(i => i.stock_id === stockItem.id);
      if (existing) {
        const newQty = existing.quantity + 1;
        if (newQty > quantity) {
          showNotification(`Only ${quantity} available`, 'error');
          return prev;
        }
        return prev.map(i => i.stock_id === stockItem.id ? { ...i, quantity: newQty } : i);
      }
      return [...prev, {
        stock_id: stockItem.id,
        product_id: stockItem.product_id,
        name: stockItem.product.name,
        price: priceWithTax,
        base_price: basePrice,
        tax_percent: taxPercent,
        quantity: 1,
        available_stock: quantity,
        image: displayImage,
      }];
    });
  };

  const updateQuantity = (stockId, qty) => {
    if (qty < 1) return;
    setCart(prev => {
      const item = prev.find(i => i.stock_id === stockId);
      if (qty > item.available_stock) {
        showNotification(`Max ${item.available_stock}`, 'error');
        return prev;
      }
      return prev.map(i => i.stock_id === stockId ? { ...i, quantity: qty } : i);
    });
  };

  const removeFromCart = (stockId) => {
    const newCart = cart.filter(i => i.stock_id !== stockId);
    setCart(newCart);
    if (newCart.length === 0) {
      setDisplayedTaxPercent(0);
    } else {
      setDisplayedTaxPercent(newCart[newCart.length - 1]?.tax_percent || 0);
    }
  };

  const subTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalTaxAmount = cart.reduce((sum, i) => {
    const base = i.base_price;
    return sum + (base * i.quantity * (i.tax_percent / 100));
  }, 0);
  const discountAmt = discountType === 'percentage' ? (subTotal * discountValue / 100) : discountValue;
  const total = subTotal - discountAmt + parseFloat(shipping || 0);
  const totalQty = cart.reduce((sum, i) => sum + i.quantity, 0);

  const generateInvoiceNo = () => {
    const date = new Date();
    const prefix = 'INV';
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${year}${month}${day}-${random}`;
  };

  // UPDATED CHECKOUT: Save Sale + Sale Items + Deduct Stock
  const handleCheckout = async () => {
    if (!selectedTerminal || cart.length === 0) {
      showNotification('Complete cart first', 'error');
      return;
    }
    if (!selectedWarehouse) {
      showNotification('Please select a warehouse', 'error');
      return;
    }

    setProcessing(true);
    try {
      // Step 1: Create the Sale record
      const salePayload = {
        terminal_id: parseInt(selectedTerminal),
        invoice_no: generateInvoiceNo(),
        total_amount: parseFloat(total.toFixed(2)),
        status: 'completed',
      };
      if (selectedCustomer) {
        salePayload.customer_id = parseInt(selectedCustomer);
      }

      const saleResponse = await axios.post(SALES_API, salePayload);
      const saleId = saleResponse.data.data.id;
      const invoiceNo = saleResponse.data.data.invoice_no;

      // Step 2: Create Sale Items
      const saleItemsPayload = cart.map(item => ({
        sale_id: saleId,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.base_price, // base price without tax
        tax: item.tax_percent > 0 ? (item.base_price * item.quantity * (item.tax_percent / 100)) : 0,
        discount: 0, // you can add global discount logic later
      }));

      // Send all sale items in one go (or loop if API doesn't support bulk)
      for (const itemPayload of saleItemsPayload) {
        await axios.post(SALE_ITEMS_API, itemPayload);
      }

      // Step 3: Deduct stock quantity
      for (const item of cart) {
        if (!item.stock_id) continue;
        try {
          await axios.post(`${STOCKS_API}/${item.stock_id}`, {
            quantity: item.available_stock - item.quantity,
          });
        } catch (stockErr) {
          console.error(`Failed to update stock ${item.stock_id}`, stockErr);
          // Optional: rollback sale if critical
        }
      }

      showNotification(`Sale completed! Invoice: ${invoiceNo}`, 'success');

      // Reset cart
      setCart([]);
      setDisplayedTaxPercent(0);
      setDiscountValue(0);
      setShipping(0);
      setSelectedCustomer('');

      // Refresh stocks
      fetchStocks(pagination.current_page, pagination.per_page, searchTerm);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.invoice_no?.[0] || 'Checkout failed';
      showNotification(msg, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleHold = async () => {
    if (!selectedTerminal || cart.length === 0) return showNotification('Add items first', 'error');
    setProcessing(true);
    try {
      const holdData = {
        terminal_id: parseInt(selectedTerminal),
        cart_data: JSON.stringify({
          items: cart.map(i => ({
            stock_id: i.stock_id,
            product_id: i.product_id,
            name: i.name,
            price: i.price,
            base_price: i.base_price,
            tax_percent: i.tax_percent,
            quantity: i.quantity,
            available_stock: i.available_stock,
            image: i.image,
          })),
          displayed_tax_percent: displayedTaxPercent,
          discount_type: discountType,
          discount_value: discountValue,
          shipping: shipping,
          subtotal: subTotal,
          total: total,
          total_qty: totalQty,
          timestamp: new Date().toISOString(),
        }),
      };
      if (selectedWarehouse) {
        holdData.warehouse_id = parseInt(selectedWarehouse);
      }
      await axios.post(HOLD_CART_API, holdData);
      showNotification('Cart held successfully!', 'success');
      setCart([]);
      setDisplayedTaxPercent(0);
      setDiscountValue(0);
      setShipping(0);
      setDiscountType('fixed');
      fetchHeldCartsForTerminal(selectedTerminal);
    } catch (error) {
      showNotification('Hold failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setCart([]);
    setDisplayedTaxPercent(0);
    setDiscountValue(0);
    setShipping(0);
    setSelectedCustomer('');
    showNotification('Cart cleared', 'success');
  };

  const resumeHeldCart = async (heldCart) => {
    setResuming(true);
    try {
      const cartDataStr = heldCart.cart_data;
      let parsed;
      try {
        const cleaned = cartDataStr.replace(/^"(.*)"$/, '$1').replace(/\\"/g, '"').replace(/\\n/g, '\n');
        parsed = JSON.parse(cleaned);
      } catch (e) {
        showNotification('Corrupted cart data', 'error');
        return;
      }
      if (!parsed.items || parsed.items.length === 0) {
        showNotification('This held cart is empty', 'error');
        return;
      }

      setCart(parsed.items);
      setDisplayedTaxPercent(parsed.displayed_tax_percent || 0);
      setDiscountType(parsed.discount_type || 'fixed');
      setDiscountValue(parsed.discount_value || 0);
      setShipping(parsed.shipping || 0);

      await axios.delete(`${HOLD_CART_API}/${heldCart.id}`);
      fetchHeldCartsForTerminal(selectedTerminal);
      setShowHeldCartsModal(false);
      showNotification(`Hold Cart #${heldCart.id} resumed!`, 'success');
    } catch (error) {
      showNotification('Failed to resume cart', 'error');
    } finally {
      setResuming(false);
    }
  };

  const formatDate = (date) => new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const parseHeldCart = (cartDataStr) => {
    try {
      const cleaned = cartDataStr.replace(/^"(.*)"$/, '$1').replace(/\\"/g, '"');
      const data = JSON.parse(cleaned);
      return {
        itemCount: data.items?.length || 0,
        total: data.total || 0,
        items: data.items || [],
      };
    } catch {
      return { itemCount: 0, total: 0, items: [] };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 py-8">
      <input ref={barcodeInputRef} type="text" className="fixed opacity-0 pointer-events-none" autoFocus />
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 ${
              notification.type === 'error' ? 'bg-red-600' : 'bg-green-600'
            } text-white font-medium`}
          >
            {notification.type === 'error' ? <AlertCircle size={24} /> : <CheckCircle size={24} />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              POS Checkout
            </h1>
            <p className="text-gray-400 mt-2">Scan • Add • Hold • Resume • Pay</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedTerminal}
              onChange={(e) => setSelectedTerminal(e.target.value)}
              className="px-6 py-3 bg-gray-800/50 rounded-xl border border-gray-700 focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              <option value="">Select Terminal</option>
              {terminals.map(t => (
                <option key={t.id} value={t.id}>{t.name} {t.location && `(${t.location})`}</option>
              ))}
            </select>
            {heldCartsForTerminal.length > 0 && (
              <button
                onClick={() => setShowHeldCartsModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition"
              >
                <RefreshCw size={20} />
                Resume Held ({heldCartsForTerminal.length})
              </button>
            )}
          </div>
        </div>
        {/* Selection Row */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-cyan-300 flex items-center gap-2">
              <Warehouse size={16} /> Warehouse
            </label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800/50 rounded-xl border border-gray-700 focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              <option value="">Select Warehouse</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.code && `(${w.code})`} {w.is_default && '★'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-cyan-300 flex items-center gap-2">
                <User size={16} /> Customer
              </label>
              <button
                onClick={() => setShowCreateCustomer(true)}
                className="text-xs px-3 py-1 bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-1"
              >
                <Plus size={12} /> New
              </button>
            </div>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800/50 rounded-xl border border-gray-700 focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              <option value="">Walk-in Customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone && `(${c.phone})`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-cyan-300">
              Customer Info
            </label>
            <div className="px-4 py-3 bg-gray-800/50 rounded-xl border border-gray-700">
              {selectedCustomer ? (
                (() => {
                  const customer = customers.find(c => c.id.toString() === selectedCustomer);
                  return customer ? (
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      {customer.phone && <p className="text-sm text-gray-400">{customer.phone}</p>}
                      {customer.email && <p className="text-sm text-gray-400">{customer.email}</p>}
                    </div>
                  ) : (
                    <p className="text-gray-500">Loading...</p>
                  );
                })()
              ) : (
                <p className="text-gray-500">No customer selected</p>
              )}
            </div>
          </div>
        </div>
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            <span className="text-sm font-semibold whitespace-nowrap">Categories:</span>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
                  selectedCategory === cat ? 'bg-cyan-600 text-white' : 'bg-gray-800/50 border border-gray-700 hover:bg-gray-700'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            <span className="text-sm font-semibold whitespace-nowrap">Brands:</span>
            {brands.map(brand => (
              <button
                key={brand}
                onClick={() => setSelectedBrand(brand)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
                  selectedBrand === brand ? 'bg-blue-600 text-white' : 'bg-gray-800/50 border border-gray-700 hover:bg-gray-700'
                }`}
              >
                {brand === 'all' ? 'All' : brand}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-gray-800/60 backdrop-blur rounded-2xl border border-gray-700 p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <ShoppingCart size={28} /> Cart ({cart.length})
              </h2>
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Cart empty</p>
                ) : (
                  cart.map(item => (
                    <div key={item.stock_id} className="bg-gray-700/50 rounded-lg p-4 flex gap-4">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center">
                          <Package size={28} />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{item.name}</h4>
                          <button onClick={() => removeFromCart(item.stock_id)} className="text-red-400 hover:text-red-300">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="text-xs text-yellow-400 mb-2 font-medium">
                          Tax Applied: {item.tax_percent}%
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateQuantity(item.stock_id, item.quantity - 1)}><Minus size={16} /></button>
                            <span className="w-12 text-center font-bold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.stock_id, item.quantity + 1)}><Plus size={16} /></button>
                          </div>
                          <div className="text-right">
                            <p>${item.price.toFixed(2)} (incl. tax)</p>
                            <p className="text-gray-400 text-xs">Subtotal: ${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="space-y-4 border-t border-gray-600 pt-4">
                <div className="flex justify-between items-center">
                  <span>Item Tax (%)</span>
                  <input
                    type="text"
                    value={displayedTaxPercent}
                    readOnly
                    className="w-32 px-3 py-2 bg-gray-700/50 rounded-lg text-right opacity-80 cursor-not-allowed"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span>Discount</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setDiscountType('fixed')} className={`px-3 py-1 rounded ${discountType === 'fixed' ? 'bg-cyan-600' : 'bg-gray-700'}`}>$</button>
                    <button onClick={() => setDiscountType('percentage')} className={`px-3 py-1 rounded ${discountType === 'percentage' ? 'bg-cyan-600' : 'bg-gray-700'}`}>%</button>
                    <input type="number" value={discountValue} onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)} className="w-24 px-3 py-2 bg-gray-700/50 rounded-lg text-right" />
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <input type="number" value={shipping} onChange={e => setShipping(parseFloat(e.target.value) || 0)} className="w-24 px-3 py-2 bg-gray-700/50 rounded-lg text-right" />
                </div>
                <div className="border-t border-gray-600 pt-4 space-y-2">
                  <div className="flex justify-between text-lg"><span>Items:</span><span className="font-bold">{totalQty}</span></div>
                  <div className="flex justify-between text-lg"><span>Subtotal (incl. tax):</span><span>${subTotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-lg"><span>Tax Collected:</span><span className="text-yellow-400">${totalTaxAmount.toFixed(2)}</span></div>
                  <div className="flex justify-between text-3xl font-bold">
                    <span>Total:</span>
                    <span className="text-cyan-400">${total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-6">
                  <button onClick={handleHold} disabled={processing || cart.length === 0} className="py-3 bg-pink-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60">
                    {processing ? <Loader className="animate-spin" /> : <Pause size={20} />}
                    Hold
                  </button>
                  <button onClick={handleReset} className="py-3 bg-red-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90">
                    <RotateCcw size={20} /> Reset
                  </button>
                  <button onClick={handleCheckout} disabled={processing || cart.length === 0} className="py-3 bg-gradient-to-r from-green-500 to-cyan-600 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                    {processing ? <Loader className="animate-spin" /> : <><CreditCard size={20} /> Pay</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/30">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search or scan barcode..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {stocks.map(stock => {
                const quantity = parseInt(stock.quantity || 0);
                const price = parseFloat(stock.selling_price || 0);
                const tax = parseFloat(stock.tax || 0);
                const out = quantity === 0;

                const serialImage = stock.serialLists?.[0]?.image
                  ? stock.serialLists[0].image.startsWith('http')
                    ? stock.serialLists[0].image
                    : `http://localhost:8000/${stock.serialLists[0].image.replace(/^\/+/, '')}`
                  : null;
                const productImage = stock.product?.image || null;
                const displayImage = serialImage || productImage;

                return (
                  <motion.div
                    key={stock.id}
                    whileHover={!out ? { scale: 1.05 } : {}}
                    onClick={() => !out && addToCart(stock)}
                    className={`bg-gray-800/50 rounded-2xl border overflow-hidden ${out ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer border-gray-700'}`}
                  >
                    {displayImage ? (
                      <img src={displayImage} alt={stock.product.name} className="w-full h-40 object-cover" />
                    ) : (
                      <div className="w-full h-40 bg-gray-700 flex items-center justify-center">
                        <Package size={48} className="text-gray-600" />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold truncate">{stock.product.name}</h3>
                      {tax > 0 && (
                        <p className="text-xs text-yellow-400 mt-1">Tax: {tax}%</p>
                      )}
                      <div className="mt-2 flex justify-between items-end">
                        <div>
                          <p className="text-3xl font-bold text-cyan-400">${price.toFixed(2)}</p>
                          <p className="text-sm text-green-400">{quantity} left</p>
                        </div>
                      </div>
                      <button
                        disabled={out}
                        className={`mt-4 w-full py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${out ? 'bg-gray-700 text-gray-500' : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90'}`}
                      >
                        {out ? 'Out of Stock' : <><Plus size={18} /> Add</>}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {/* Held Carts Modal */}
      <AnimatePresence>
        {showHeldCartsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowHeldCartsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-800 rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-gray-700"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-cyan-400">Resume a Held Cart</h2>
                <button onClick={() => setShowHeldCartsModal(false)} className="p-2 hover:bg-gray-700 rounded-lg">
                  <X size={24} />
                </button>
              </div>
              {heldCartsForTerminal.length === 0 ? (
                <p className="text-center text-gray-400 py-12">No held carts for this terminal</p>
              ) : (
                <div className="space-y-4">
                  {heldCartsForTerminal.map(held => {
                    const info = parseHeldCart(held.cart_data);
                    return (
                      <div
                        key={held.id}
                        onClick={() => resumeHeldCart(held)}
                        className="bg-gray-700/50 rounded-xl p-6 border border-gray-600 hover:border-cyan-500 cursor-pointer transition"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-xl font-bold">Hold Cart #{held.id}</h3>
                            <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                              <Calendar size={14} /> {formatDate(held.created_at)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-cyan-400">${info.total.toFixed(2)}</p>
                            <p className="text-sm text-gray-300">{info.itemCount} items</p>
                          </div>
                        </div>
                        {info.items.length > 0 && (
                          <div className="text-sm text-gray-400 space-y-1">
                            {info.items.slice(0, 4).map((it, i) => (
                              <div key={i}>• {it.quantity} × {it.name}</div>
                            ))}
                            {info.itemCount > 4 && <div className="text-cyan-400">+ {info.itemCount - 4} more items</div>}
                          </div>
                        )}
                        <button
                          disabled={resuming}
                          className="mt-5 w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl font-bold hover:opacity-90 disabled:opacity-60"
                        >
                          {resuming ? 'Resuming...' : 'Resume This Cart'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Create Customer Modal */}
      <AnimatePresence>
        {showCreateCustomer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateCustomer(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-800 rounded-3xl p-8 max-w-md w-full border border-gray-700"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
                  <Users size={24} /> New Customer
                </h2>
                <button onClick={() => setShowCreateCustomer(false)} className="p-2 hover:bg-gray-700 rounded-lg">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-700/50 rounded-xl border border-gray-600 focus:ring-2 focus:ring-cyan-500 outline-none"
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone *</label>
                  <input
                    type="text"
                    value={newCustomer.phone}
                    onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-700/50 rounded-xl border border-gray-600 focus:ring-2 focus:ring-cyan-500 outline-none"
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={e => setNewCustomer({...newCustomer, email: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-700/50 rounded-xl border border-gray-600 focus:ring-2 focus:ring-cyan-500 outline-none"
                    placeholder="Email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Tag size={16} /> Customer Group
                  </label>
                  <select
                    value={newCustomer.customer_group_id}
                    onChange={e => setNewCustomer({...newCustomer, customer_group_id: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-700/50 rounded-xl border border-gray-600 focus:ring-2 focus:ring-cyan-500 outline-none"
                  >
                    <option value="">Select Group (Optional)</option>
                    {customerGroups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateCustomer(false)}
                    className="flex-1 py-3 bg-gray-700 rounded-xl font-bold hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateCustomer}
                    disabled={creatingCustomer}
                    className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-bold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {creatingCustomer ? <Loader className="animate-spin" size={20} /> : <Plus size={20} />}
                    {creatingCustomer ? 'Creating...' : 'Create Customer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Checkout;
