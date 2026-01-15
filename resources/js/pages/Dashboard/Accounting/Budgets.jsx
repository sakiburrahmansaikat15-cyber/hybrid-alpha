import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { IconMapper } from '../../../components/UI/IconMapper';

const Budgets = () => {
    const [budgets, setBudgets] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // New Budget State
    const [name, setName] = useState('');
    const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear().toString());
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [items, setItems] = useState([
        { chart_of_account_id: '', budgeted_amount: 0 }
    ]);

    useEffect(() => {
        fetchBudgets();
        fetchAccounts();
    }, []);

    const fetchBudgets = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/accounting/budgets');
            setBudgets(response.data.data || []);
        } catch (error) {
            console.error('Error fetching budgets', error);
        }
        setLoading(false);
    };

    const fetchAccounts = async () => {
        try {
            const response = await axios.get('/api/accounting/accounts');
            setAccounts(response.data || []);
        } catch (error) {
            console.error('Error fetching accounts', error);
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { chart_of_account_id: '', budgeted_amount: 0 }]);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/accounting/budgets', {
                name, fiscal_year: fiscalYear, start_date: startDate, end_date: endDate, items
            });
            setShowModal(false);
            fetchBudgets();
            // Reset
            setItems([{ chart_of_account_id: '', budgeted_amount: 0 }]);
        } catch (error) {
            alert(error.response?.data?.message || 'Error creating budget');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-900 dark:text-slate-100">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Budget Management</h1>
                        <p className="text-slate-500 dark:text-slate-400">Plan and track your fiscal goals</p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/25 active:scale-95 font-semibold">
                        <IconMapper name="Plus" size={20} /> Create Budget
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="flex justify-center py-20 col-span-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                        </div>
                    ) : (
                        budgets.map(budget => (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key={budget.id}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:shadow-2xl transition-all relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors" />

                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800 dark:text-white leading-tight">{budget.name}</h3>
                                        <p className="text-sm font-mono text-emerald-600 dark:text-emerald-400 font-bold">{budget.fiscal_year}</p>
                                    </div>
                                    <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200/50 dark:border-emerald-500/20">
                                        {budget.status}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                            <span>Utilization</span>
                                            <span>{((budget.total_actual_amount / budget.total_budgeted_amount) * 100 || 0).toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min((budget.total_actual_amount / budget.total_budgeted_amount) * 100 || 0, 100)}%` }}
                                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 h-full">
                                        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Budgeted</p>
                                            <p className="text-lg font-black text-slate-800 dark:text-white">${Number(budget.total_budgeted_amount).toLocaleString()}</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Actual</p>
                                            <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">${Number(budget.total_actual_amount).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-xs text-slate-400">{budget.start_date} — {budget.end_date}</span>
                                    <button className="text-emerald-500 hover:text-emerald-400 font-black text-xs uppercase tracking-widest flex items-center gap-1 transition-all group-hover:translate-x-1">
                                        Details <IconMapper name="ArrowRight" size={14} />
                                    </button>
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
                        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xl z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-10 shadow-2xl relative"
                        >
                            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-white transition-colors">
                                <IconMapper name="X" size={28} />
                            </button>

                            <h2 className="text-3xl font-black mb-10 text-slate-800 dark:text-white flex items-center gap-4">
                                <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
                                    <IconMapper name="Target" size={24} />
                                </div>
                                Setup Fiscal Budget
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1">Plan Name</label>
                                        <input className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all text-lg font-bold" placeholder="e.g. 2024 Annual Operations" value={name} onChange={e => setName(e.target.value)} required />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1">Fiscal Year</label>
                                        <input className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all text-lg font-bold" value={fiscalYear} onChange={e => setFiscalYear(e.target.value)} required />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1">Start Date</label>
                                        <input type="date" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1">End Date</label>
                                        <input type="date" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-center px-1">
                                        <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Allocation Details</h3>
                                        <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                                            Total: ${items.reduce((acc, it) => acc + Number(it.budgeted_amount || 0), 0).toLocaleString()}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {items.map((item, i) => (
                                            <div key={i} className="flex gap-4 items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-inner">
                                                <div className="flex-1">
                                                    <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-bold outline-none" value={item.chart_of_account_id} onChange={e => handleItemChange(i, 'chart_of_account_id', e.target.value)} required>
                                                        <option value="">Select Account</option>
                                                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="w-48 relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                                    <input type="number" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 pl-8 text-right text-sm font-black outline-none" value={item.budgeted_amount} onChange={e => handleItemChange(i, 'budgeted_amount', e.target.value)} min="0" step="0.01" />
                                                </div>
                                                <button type="button" onClick={() => removeItem(i)} className="p-3 text-slate-300 hover:text-rose-500 transition-colors">
                                                    <IconMapper name="Trash2" size={20} />
                                                </button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={addItem} className="w-full py-4 rounded-[1.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 hover:text-emerald-500 hover:border-emerald-500/50 transition-all font-bold text-sm flex items-center justify-center gap-2">
                                            <IconMapper name="PlusCircle" size={20} /> Add Account Allocation
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-6 pt-6">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-8 py-4 text-slate-400 font-black uppercase tracking-widest hover:text-white transition-colors text-sm">Cancel</button>
                                    <button type="submit" className="px-12 py-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-500 transition-all font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/40 text-sm">Initialize Budget</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Budgets;
