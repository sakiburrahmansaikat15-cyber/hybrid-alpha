import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Loader, ChevronLeft, ChevronRight,
  DollarSign, TrendingUp, Calendar, Percent, User, Tag, Zap,
  LayoutGrid, Columns, LayoutList, ArrowRight, Filter, Download,
  Target, Activity, RefreshCw, Layers
} from 'lucide-react';

const API_URL = '/api/crm/opportunities';
const CUSTOMERS_URL = '/api/crm/customers';
const STAGES_URL = '/api/crm/opportunity-stages';

const Opportunity = () => {
  const [viewMode, setViewMode] = useState('grid'); // grid, kanban
  const [opportunities, setOpportunities] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    customer_id: '', stage_id: '', name: '', value: '', probability: '', expected_close_date: ''
  });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 12, total_items: 0 });

  const notificationTimerRef = useRef(null);

  const showNotification = useCallback((message, type = 'success') => {
    if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    setNotification({ show: true, message, type });
    notificationTimerRef.current = setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3500);
  }, []);

  const fetchMeta = useCallback(async () => {
    try {
      const [custRes, stageRes] = await Promise.all([
        axios.get(CUSTOMERS_URL),
        axios.get(STAGES_URL)
      ]);
      setCustomers(custRes.data.pagination?.data || custRes.data.data || []);
      setStages(stageRes.data.pagination?.data || stageRes.data.data || []);
    } catch (e) { console.error('Failed to load meta data'); }
  }, []);

  const fetchOpportunities = useCallback(async (page = 1, keyword = searchTerm) => {
    setLoading(true);
    try {
      const params = { page, limit: viewMode === 'kanban' ? 50 : 12 };
      if (keyword.trim()) params.keyword = keyword.trim();
      const response = await axios.get(API_URL, { params });
      const res = response.data.pagination || response.data;
      setOpportunities(res.data || []);
      setPagination({
        current_page: res.current_page || 1,
        last_page: res.total_pages || res.last_page || 1,
        per_page: params.limit,
        total_items: res.total_items || res.total || 0,
      });
    } catch (error) {
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  }, [viewMode, searchTerm]);

  useEffect(() => {
    fetchMeta();
    const timer = setTimeout(() => fetchOpportunities(1), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, viewMode, fetchOpportunities, fetchMeta]);

  const handleUpdateStage = async (id, stageId) => {
    setOperationLoading(id);
    try {
      await axios.put(`${API_URL}/${id}`, { opportunity_stage_id: stageId });
      showNotification('Stage updated successfully');
      fetchOpportunities(pagination.current_page);
    } catch (e) {
      showNotification('Failed to update stage', 'error');
    } finally {
      setOperationLoading(null);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500">

      {/* Premium Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed top-24 right-8 z-[60]">
            <div className={`p-4 rounded-2xl shadow-2xl backdrop-blur-xl border border-white/20 flex items-center gap-4 ${notification.type === 'error' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
              }`}>
              <div className={`p-2 rounded-xl bg-white/10`}>
                <Zap size={18} />
              </div>
              <span className="font-bold uppercase tracking-widest text-[10px]">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-8">

        {/* Command Header */}
        <header className="mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8 py-6 border-b border-slate-200 dark:border-white/5 relative">
          <div className="absolute top-0 left-0 w-32 h-1 bg-gradient-to-r from-emerald-500 to-transparent"></div>
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <span className="h-1.5 w-6 bg-emerald-500 rounded-full"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Revenue Pipeline</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter dark:text-white uppercase leading-none">
              CRM <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">Opportunities</span>
            </h1>
            <p className="text-slate-500 mt-4 font-medium max-w-xl text-sm border-l-2 border-slate-200 dark:border-slate-800 pl-4">
              Advanced stage tracking and fiscal projection node for enterprise growth.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="p-1 glass-card bg-white/40 dark:bg-slate-900/40 rounded-2xl flex items-center border border-slate-200 dark:border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>
                <LayoutGrid size={20} />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2.5 rounded-xl transition-all ${viewMode === 'kanban' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>
                <Columns size={20} />
              </button>
            </div>

            <button className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-400 hover:text-emerald-500 transition-colors shadow-lg shadow-slate-200/50 dark:shadow-none">
              <Download size={20} />
            </button>

            <button onClick={() => setShowModal(true)} className="flex items-center space-x-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95 group">
              <Plus size={16} className="group-hover:rotate-90 transition-transform" />
              <span>Initialize Op</span>
            </button>
          </div>
        </header>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <InsightCard title="Active Pips" value={pagination.total_items} icon={Activity} color="emerald" />
          <InsightCard title="Global Weighted Value" value={formatCurrency(opportunities.reduce((acc, curr) => acc + (parseFloat(curr.value) || 0), 0))} icon={DollarSign} color="blue" />
          <InsightCard title="Mean Probability" value={`${Math.round(opportunities.reduce((acc, curr) => acc + (parseInt(curr.probability) || 0), 0) / (opportunities.length || 1))}%`} icon={Target} color="purple" />
          <InsightCard title="Sync Frequency" value="0.2ms" icon={RefreshCw} color="orange" />
        </div>

        {/* Tactical Search */}
        <div className="relative mb-10">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search neural patterns in pipeline..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-6 py-5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-slate-200 dark:border-white/5 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold uppercase tracking-tight text-lg shadow-2xl"
          />
        </div>

        {loading && opportunities.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => <div key={i} className="h-64 bg-white/40 dark:bg-slate-900/40 rounded-[2rem] animate-pulse border border-slate-200 dark:border-white/5" />)}
          </div>
        ) : viewMode === 'grid' ? (
          <GridView opportunities={opportunities} onEdit={setEditingOpportunity} onDelete={null} />
        ) : (
          <KanbanView stages={stages} opportunities={opportunities} onUpdateStage={handleUpdateStage} />
        )}

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="flex justify-center mt-12 mb-8">
            <div className="flex items-center gap-2 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-2 rounded-2xl border border-slate-200 dark:border-white/5">
              <button
                onClick={() => fetchOpportunities(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="p-3 hover:bg-white/20 rounded-xl disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="px-4 font-black text-slate-500">
                {pagination.current_page} / {pagination.last_page}
              </span>
              <button
                onClick={() => fetchOpportunities(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
                className="p-3 hover:bg-white/20 rounded-xl disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Legacy Modal (kept functional) */}
      <AnimatePresence>
        {showModal && (
          <OpportunityModal
            onClose={() => setShowModal(false)}
            stages={stages}
            customers={customers}
            fetchData={() => fetchOpportunities(1)}
            editing={editingOpportunity}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/* -----------------------------------------------------------------
   Sub-Components
----------------------------------------------------------------- */

const InsightCard = ({ title, value, icon: Icon, color }) => (
  <div className="glass-card p-6 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl shadow-xl flex items-center gap-6">
    <div className={`p-4 rounded-2xl bg-${color}-500/10 text-${color}-500 shadow-inner`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</p>
      <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">{value}</h3>
    </div>
  </div>
);

const GridView = ({ opportunities }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
    {opportunities.map((opp, idx) => (
      <motion.div
        key={opp.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: idx * 0.05 }}
        whileHover={{ y: -8 }}
        className="group relative overflow-hidden bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-2xl transition-all"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <TrendingUp size={100} />
        </div>

        <div className="flex justify-between items-start mb-6">
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-lg">
            {opp.stage?.name || 'Protocol Start'}
          </span>
          <span className="text-2xl font-black text-emerald-500 tracking-tighter">
            ${(parseFloat(opp.value) || 0).toLocaleString()}
          </span>
        </div>

        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2 truncate">
          {opp.name}
        </h3>

        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5 mt-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black">
              {opp.customer?.name?.[0] || 'U'}
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter truncate">{opp.customer?.name}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
              <Calendar size={12} />
              {new Date(opp.expected_close_date).toLocaleDateString()}
            </div>
            <div className="text-[10px] font-black text-emerald-500">{opp.probability}% MATCH</div>
          </div>

          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${opp.probability}%` }}
              className="h-full bg-gradient-to-r from-emerald-600 to-teal-400"
            />
          </div>
        </div>
      </motion.div>
    ))}
  </div>
);

const KanbanView = ({ stages, opportunities, onUpdateStage }) => {
  return (
    <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar min-h-[600px]">
      {stages.map((stage, sIdx) => {
        const stageOpp = opportunities.filter(o => o.stage_id === stage.id);
        const total = stageOpp.reduce((acc, curr) => acc + (parseFloat(curr.value) || 0), 0);

        return (
          <div key={stage.id} className="min-w-[320px] w-[320px] flex flex-col gap-6">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 dark:bg-white rounded-3xl shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                <span className="text-[10px] font-black text-white dark:text-slate-900 uppercase tracking-widest">{stage.name}</span>
              </div>
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">${(total / 1000).toFixed(1)}K</span>
            </div>

            <div className="flex-1 space-y-4 p-2">
              {stageOpp.map((opp, oIdx) => (
                <motion.div
                  key={opp.id}
                  layoutId={opp.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  className="p-6 bg-white dark:bg-slate-900/60 backdrop-blur-2xl border border-slate-200 dark:border-white/5 rounded-[2rem] shadow-lg cursor-grab active:cursor-grabbing group"
                >
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4 group-hover:text-emerald-500 transition-colors">
                    {opp.name}
                  </h4>
                  <div className="flex justify-between items-end">
                    <span className="text-lg font-black text-emerald-600 tracking-tight">${(parseFloat(opp.value) || 0).toLocaleString()}</span>
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Percent size={10} /> {opp.probability}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-black">JD</div>
                    </div>
                    <button className="p-1.5 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-500 rounded-lg transition-colors">
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const OpportunityModal = ({ onClose, stages, customers, fetchData, editing }) => {
  const [formData, setFormData] = useState({
    customer_id: editing?.customer_id || '',
    opportunity_stage_id: editing?.opportunity_stage_id || editing?.stage_id || '',
    name: editing?.name || '',
    amount: editing?.amount || editing?.value || '',
    probability: editing?.probability || '',
    expected_close_date: editing?.expected_close_date ? editing.expected_close_date.split('T')[0] : ''
  });

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await axios.put(`${API_URL}/${editing.id}`, formData);
      else await axios.post(API_URL, formData);
      fetchData();
      onClose();
    } catch (e) { alert("Error saving data"); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden border border-white/10">
        <div className="p-10">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-8">
            {editing ? 'Refine' : 'Initialize'} <span className="text-emerald-500">Opportunity</span>
          </h2>
          <form onSubmit={submit} className="space-y-6">
            <input className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold uppercase text-xs" placeholder="Operational Title" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
            <div className="grid grid-cols-2 gap-4">
              <input type="number" className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-xs" placeholder="Valuation ($)" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
              <input type="number" max="100" className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-xs" placeholder="Prob Theory (%)" value={formData.probability} onChange={e => setFormData({ ...formData, probability: e.target.value })} />
            </div>
            <select className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold uppercase text-xs" value={formData.customer_id} onChange={e => setFormData({ ...formData, customer_id: e.target.value })} required>
              <option value="">Select Targeted Customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold uppercase text-xs" value={formData.opportunity_stage_id} onChange={e => setFormData({ ...formData, opportunity_stage_id: e.target.value })} required>
              <option value="">Select Stage</option>
              {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input type="date" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-xs" value={formData.expected_close_date} onChange={e => setFormData({ ...formData, expected_close_date: e.target.value })} />

            <div className="flex gap-4 pt-6">
              <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase text-[10px] tracking-widest rounded-2xl">Abort</button>
              <button type="submit" className="flex-1 py-4 bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20">Commit Changes</button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Opportunity;
