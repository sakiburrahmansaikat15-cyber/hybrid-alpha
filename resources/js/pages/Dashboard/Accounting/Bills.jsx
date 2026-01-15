import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { IconMapper } from '../../../components/UI/IconMapper';

const Bills = () => {
    const [bills, setBills] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // New Bill State
    const [vendorId, setVendorId] = useState('');
    const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState([
        { chart_of_account_id: '', description: '', quantity: 1, unit_price: 0, tax_amount: 0 }
    ]);

    useEffect(() => {
        fetchBills();
        fetchDependantData();
    }, []);

    const fetchBills = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/accounting/bills');
            setBills(response.data.data || []);
        } catch (error) {
            console.error('Error fetching bills', error);
        }
        setLoading(false);
    };

    const fetchDependantData = async () => {
        try {
            const [vRes, aRes] = await Promise.all([
                axios.get('/api/vendors'),
                axios.get('/api/accounting/accounts')
            ]);
            setVendors(vRes.data.data || []);
            setAccounts(aRes.data || []);
        } catch (error) {
            console.error('Error fetching vendors/accounts', error);
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { chart_of_account_id: '', description: '', quantity: 1, unit_price: 0, tax_amount: 0 }]);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/accounting/bills', {
                vendor_id: vendorId,
                bill_date: billDate,
                due_date: dueDate,
                reference_number: reference,
                notes,
                items
            });
            setShowModal(false);
            fetchBills();
            // Reset
            setVendorId('');
            setItems([{ chart_of_account_id: '', description: '', quantity: 1, unit_price: 0, tax_amount: 0 }]);
        } catch (error) {
            alert(error.response?.data?.message || 'Error creating bill');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-900 dark:text-slate-100">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Vendor Bills</h1>
                        <p className="text-slate-500 dark:text-slate-400">Track your payables and expenses</p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-rose-500/25 active:scale-95 font-semibold">
                        <IconMapper name="Plus" size={20} /> Add Bill
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
                        </div>
                    ) : (
                        bills.map(bill => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={bill.id}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-xl transition-all group"
                            >
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-rose-100 dark:bg-rose-900/30 p-3 rounded-xl text-rose-600 dark:text-rose-400">
                                            <IconMapper name="Receipt" size={28} />
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold text-slate-800 dark:text-white">{bill.bill_number}</div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400">{bill.vendor?.name} — {bill.bill_date}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="text-lg font-black text-slate-900 dark:text-white">${Number(bill.total_amount).toLocaleString()}</div>
                                            <div className="text-xs text-rose-500/80 font-mono">DUE: {bill.due_date}</div>
                                        </div>
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${bill.status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                            {bill.status}
                                        </span>
                                        <button className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                                            <IconMapper name="ChevronRight" size={24} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
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
                                <div className="bg-rose-600 p-2 rounded-lg text-white">
                                    <IconMapper name="Plus" size={20} />
                                </div>
                                Record New Bill
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500 tracking-widest pl-1">Vendor</label>
                                        <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/20" value={vendorId} onChange={e => setVendorId(e.target.value)} required>
                                            <option value="">Select Vendor</option>
                                            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500 tracking-widest pl-1">Bill Date</label>
                                        <input type="date" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/20" value={billDate} onChange={e => setBillDate(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500 tracking-widest pl-1">Due Date</label>
                                        <input type="date" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/20" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                                    <div className="flex text-[10px] uppercase text-slate-400 font-black tracking-widest mb-2 px-2">
                                        <div className="flex-1">Expense Account / Description</div>
                                        <div className="w-24 text-center">Qty</div>
                                        <div className="w-32 text-right">Unit Price</div>
                                        <div className="w-32 text-right ml-4">Tax</div>
                                        <div className="w-10"></div>
                                    </div>
                                    {items.map((item, i) => (
                                        <div key={i} className="flex gap-4 items-start">
                                            <div className="flex-1 space-y-2">
                                                <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-800 dark:text-white outline-none" value={item.chart_of_account_id} onChange={e => handleItemChange(i, 'chart_of_account_id', e.target.value)} required>
                                                    <option value="">Select Account</option>
                                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                                                </select>
                                                <input className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-500 outline-none" placeholder="Description..." value={item.description} onChange={e => handleItemChange(i, 'description', e.target.value)} />
                                            </div>
                                            <input type="number" className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-center text-sm font-bold" value={item.quantity} onChange={e => handleItemChange(i, 'quantity', e.target.value)} min="1" />
                                            <input type="number" className="w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-right text-sm font-bold" value={item.unit_price} onChange={e => handleItemChange(i, 'unit_price', e.target.value)} step="0.01" />
                                            <input type="number" className="w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-right text-sm font-bold" value={item.tax_amount} onChange={e => handleItemChange(i, 'tax_amount', e.target.value)} step="0.01" />
                                            <button type="button" onClick={() => removeItem(i)} className="p-3 text-slate-300 hover:text-rose-500 transition-colors">
                                                <IconMapper name="Trash2" size={20} />
                                            </button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={addItem} className="text-sm font-bold text-rose-500 hover:text-rose-400 py-2 px-4 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center gap-2 transition-all">
                                        <IconMapper name="PlusCircle" size={16} /> Add Line
                                    </button>
                                </div>

                                <div className="flex flex-col md:flex-row justify-between gap-8 pt-4">
                                    <div className="flex-1 space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-slate-500 tracking-widest pl-1">Reference Number</label>
                                            <input className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm outline-none" placeholder="e.g. VEND-2023-001" value={reference} onChange={e => setReference(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-slate-500 tracking-widest pl-1">Notes</label>
                                            <textarea className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-sm outline-none h-24" placeholder="Internal notes..." value={notes} onChange={e => setNotes(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="w-full md:w-80 bg-rose-50/50 dark:bg-rose-500/5 p-6 rounded-2xl border border-rose-100 dark:border-rose-500/10 space-y-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Subtotal</span>
                                            <span className="font-bold">${items.reduce((acc, it) => acc + (it.quantity * it.unit_price), 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Tax</span>
                                            <span className="font-bold">${items.reduce((acc, it) => acc + Number(it.tax_amount || 0), 0).toLocaleString()}</span>
                                        </div>
                                        <div className="pt-4 border-t border-rose-200 dark:border-rose-500/20 flex justify-between items-center text-rose-600 dark:text-rose-400 font-black">
                                            <span className="text-lg">Total Amount</span>
                                            <span className="text-2xl">${(items.reduce((acc, it) => acc + (it.quantity * it.unit_price), 0) + items.reduce((acc, it) => acc + Number(it.tax_amount || 0), 0)).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-4 pt-6">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-8 py-3 text-slate-500 font-bold hover:text-slate-800 dark:hover:text-white transition-colors">Cancel</button>
                                    <button type="submit" className="px-10 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-500 transition-all font-bold shadow-xl shadow-rose-500/30">Save Bill</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Bills;
