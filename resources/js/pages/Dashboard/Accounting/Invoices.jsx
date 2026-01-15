import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { IconMapper } from '../../../components/UI/IconMapper';

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // New Invoice State
    const [customerId, setCustomerId] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState([
        { product_id: '', description: '', quantity: 1, unit_price: 0, tax_rate: 0, discount_amount: 0 }
    ]);

    useEffect(() => {
        fetchInvoices();
        fetchDependantData();
    }, []);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/accounting/invoices');
            setInvoices(response.data.data || []);
        } catch (error) {
            console.error('Error fetching invoices', error);
        }
        setLoading(false);
    };

    const fetchDependantData = async () => {
        try {
            const [cRes, pRes] = await Promise.all([
                axios.get('/api/pos/customers'),
                axios.get('/api/products')
            ]);
            setCustomers(cRes.data.pagination?.data || []);
            setProducts(pRes.data.data || []);
        } catch (error) {
            console.error('Error fetching customers/products', error);
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;

        // Auto-fill description/price if product is selected
        if (field === 'product_id') {
            const product = products.find(p => p.id === parseInt(value));
            if (product) {
                newItems[index].description = product.name;
                newItems[index].unit_price = product.price || 0; // Assuming price exists
            }
        }

        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { product_id: '', description: '', quantity: 1, unit_price: 0, tax_rate: 0, discount_amount: 0 }]);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/accounting/invoices', {
                customer_id: customerId,
                invoice_date: invoiceDate,
                due_date: dueDate,
                notes,
                items
            });
            setShowModal(false);
            fetchInvoices();
            // Reset
            setCustomerId('');
            setItems([{ product_id: '', description: '', quantity: 1, unit_price: 0, tax_rate: 0, discount_amount: 0 }]);
        } catch (error) {
            alert(error.response?.data?.message || 'Error creating invoice');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'sent': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'partial': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'overdue': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-900 dark:text-slate-100">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Invoices</h1>
                        <p className="text-slate-500 dark:text-slate-400">Manage your sales billing and receivables</p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/25 active:scale-95 font-semibold">
                        <IconMapper name="Plus" size={20} /> Create Invoice
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                        </div>
                    ) : (
                        invoices.map(invoice => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={invoice.id}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-xl transition-all group"
                            >
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-xl text-indigo-600 dark:text-indigo-400">
                                            <IconMapper name="FileText" size={28} />
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold text-slate-800 dark:text-white">{invoice.invoice_number}</div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400">{invoice.customer?.name} — {invoice.invoice_date}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="text-lg font-black text-slate-900 dark:text-white">${Number(invoice.total_amount).toLocaleString()}</div>
                                            <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">DUE: {invoice.due_date}</div>
                                        </div>
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(invoice.status)}`}>
                                            {invoice.status}
                                        </span>
                                        <button className="p-2 text-slate-400 hover:text-indigo-500 transition-colors">
                                            <IconMapper name="ChevronRight" size={24} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                    {!loading && invoices.length === 0 && (
                        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                            <IconMapper name="Inbox" size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                            <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400">No invoices found</h3>
                            <p className="text-sm text-slate-400">Get started by creating your first invoice</p>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 shadow-2xl relative"
                        >
                            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                                <IconMapper name="X" size={24} />
                            </button>

                            <h2 className="text-2xl font-black mb-8 text-slate-800 dark:text-white flex items-center gap-3">
                                <div className="bg-indigo-600 p-2 rounded-lg text-white">
                                    <IconMapper name="Plus" size={20} />
                                </div>
                                Create New Invoice
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500 tracking-widest pl-1">Customer</label>
                                        <select
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                                            value={customerId}
                                            onChange={e => setCustomerId(e.target.value)}
                                            required
                                        >
                                            <option value="">Select Customer</option>
                                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500 tracking-widest pl-1">Invoice Date</label>
                                        <input type="date" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500 tracking-widest pl-1">Due Date</label>
                                        <input type="date" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                                    <div className="flex text-[10px] uppercase text-slate-400 font-black tracking-widest mb-2 px-2">
                                        <div className="flex-1">Product / Description</div>
                                        <div className="w-24 text-center">Qty</div>
                                        <div className="w-32 text-right">Price</div>
                                        <div className="w-32 text-right ml-4">Discount</div>
                                        <div className="w-10"></div>
                                    </div>
                                    {items.map((item, i) => (
                                        <div key={i} className="flex gap-4 items-start">
                                            <div className="flex-1 space-y-2">
                                                <select
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-800 dark:text-white outline-none"
                                                    value={item.product_id}
                                                    onChange={e => handleItemChange(i, 'product_id', e.target.value)}
                                                >
                                                    <option value="">Select Product</option>
                                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                                <input
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-500 dark:text-slate-400 outline-none"
                                                    placeholder="Extra description..."
                                                    value={item.description}
                                                    onChange={e => handleItemChange(i, 'description', e.target.value)}
                                                />
                                            </div>
                                            <input type="number" className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-center text-sm font-bold" value={item.quantity} onChange={e => handleItemChange(i, 'quantity', e.target.value)} min="1" />
                                            <input type="number" className="w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-right text-sm font-bold" value={item.unit_price} onChange={e => handleItemChange(i, 'unit_price', e.target.value)} step="0.01" />
                                            <input type="number" className="w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-right text-sm font-bold text-rose-500" value={item.discount_amount} onChange={e => handleItemChange(i, 'discount_amount', e.target.value)} step="0.01" />
                                            <button type="button" onClick={() => removeItem(i)} className="p-3 text-slate-300 hover:text-rose-500 transition-colors">
                                                <IconMapper name="Trash2" size={20} />
                                            </button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={addItem} className="text-sm font-bold text-indigo-500 hover:text-indigo-400 py-2 px-4 rounded-lg bg-indigo-50/50 dark:bg-indigo-500/10 flex items-center gap-2 transition-all">
                                        <IconMapper name="PlusCircle" size={16} /> Add Another Item
                                    </button>
                                </div>

                                <div className="flex flex-col md:flex-row justify-between gap-8 pt-4">
                                    <div className="flex-1 space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500 tracking-widest pl-1">Notes / Terms</label>
                                        <textarea className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-sm outline-none h-32" placeholder="Add any notes or special payment terms..." value={notes} onChange={e => setNotes(e.target.value)} />
                                    </div>
                                    <div className="w-full md:w-80 bg-indigo-50/50 dark:bg-indigo-500/5 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-500/10 space-y-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Subtotal</span>
                                            <span className="font-bold">${items.reduce((acc, it) => acc + (it.quantity * it.unit_price), 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-rose-500">
                                            <span>Discount</span>
                                            <span className="font-bold">-${items.reduce((acc, it) => acc + Number(it.discount_amount || 0), 0).toLocaleString()}</span>
                                        </div>
                                        <div className="pt-4 border-t border-indigo-200 dark:border-indigo-500/20 flex justify-between items-center">
                                            <span className="text-lg font-black text-slate-800 dark:text-white">Total</span>
                                            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                                                ${(items.reduce((acc, it) => acc + (it.quantity * it.unit_price), 0) - items.reduce((acc, it) => acc + Number(it.discount_amount || 0), 0)).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-4 pt-6">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-8 py-3 text-slate-500 font-bold hover:text-slate-800 dark:hover:text-white transition-colors">Cancel</button>
                                    <button type="submit" className="px-10 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all font-bold shadow-xl shadow-indigo-500/30">Save & Finalize Invoice</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Invoices;
