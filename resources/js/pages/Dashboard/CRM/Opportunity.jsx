import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Check, MoreVertical,
  Calendar, Loader, ChevronLeft, ChevronRight, User, DollarSign, Percent, Building2, Tag
} from 'lucide-react';

const API_URL = 'http://localhost:8000/api/crm/opportunities';
const CUSTOMERS_URL = 'http://localhost:8000/api/crm/customers';
const STAGES_URL = 'http://localhost:8000/api/crm/opportunity-stages';

const Opportunity = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMenu, setActionMenu] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [stages, setStages] = useState([]);
  const [formData, setFormData] = useState({
    customer_id: '',
    stage_id: '',
    value: '',
    probability: '',
    expected_close_date: ''
  });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total_items: 0
  });

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
  }, []);

  const handleApiError = useCallback((error, defaultMessage) => {
    if (error.response?.status === 422) {
      const validationErrors = error.response.data.errors || {};
      setErrors(validationErrors);
      const firstError = Object.values(validationErrors)[0]?.[0];
      showNotification(firstError || 'Validation error', 'error');
    } else if (error.response?.data?.message) {
      showNotification(error.response.data.message, 'error');
      setErrors({ _general: error.response.data.message });
    } else {
      showNotification(defaultMessage || 'Something went wrong', 'error');
    }
  }, [showNotification]);

  const fetchOpportunities = useCallback(async (page = 1, perPage = 10, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit: perPage };
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await axios.get(API_URL, { params });
      const res = response.data;

      const oppData = res.pagination?.data || [];
      const formatted = oppData.map(item => ({
        id: item.id,
        value: item.value || 0,
        probability: item.probability ?? item.stage?.probability ?? 0,
        expected_close_date: item.expected_close_date,
        customer: item.customer || { name: 'No Customer' },
        stage: item.stage || { name: 'No Stage', probability: 0 },
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      setOpportunities(formatted);
      setPagination({
        current_page: res.pagination.current_page || 1,
        last_page: res.pagination.total_pages || 1,
        per_page: res.pagination.per_page || 10,
        total_items: res.pagination.total_items || 0
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch opportunities');
      setOpportunities([]);
      setPagination({ current_page: 1, last_page: 1, per_page: 10, total_items: 0 });
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await axios.get(CUSTOMERS_URL);
      setCustomers(response.data.pagination?.data || []);
    } catch (error) {
      console.error('Failed to load customers', error);
    }
  }, []);

  const fetchStages = useCallback(async () => {
    try {
      const response = await axios.get(STAGES_URL);
      const stageData = response.data.pagination?.data || [];
      setStages(stageData);
    } catch (error) {
      console.error('Failed to load stages', error);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOpportunities(1, pagination.per_page, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchOpportunities]);

  useEffect(() => {
    fetchOpportunities(1, 10);
    fetchCustomers();
    fetchStages();
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page) return;
    fetchOpportunities(newPage, pagination.per_page, searchTerm);
  };

  const handleLimitChange = (newLimit) => {
    const limit = parseInt(newLimit);
    setPagination(prev => ({ ...prev, per_page: limit }));
    fetchOpportunities(1, limit, searchTerm);
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      stage_id: '',
      value: '',
      probability: '',
      expected_close_date: ''
    });
    setEditingOpportunity(null);
    setErrors({});
  };

  const openModal = (opportunity = null) => {
    if (opportunity) {
      setEditingOpportunity(opportunity);
      setFormData({
        customer_id: opportunity.customer?.id || '',
        stage_id: opportunity.stage?.id || '',
        value: opportunity.value || '',
        probability: opportunity.probability || '',
        expected_close_date: opportunity.expected_close_date || ''
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(resetForm, 300);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');
    setErrors({});

    try {
      const data = {
        customer_id: parseInt(formData.customer_id),
        stage_id: parseInt(formData.stage_id),
        value: formData.value ? parseFloat(formData.value) : null,
        probability: formData.probability ? parseInt(formData.probability) : null,
        expected_close_date: formData.expected_close_date || null
      };

      let response;
      if (editingOpportunity) {
        response = await axios.post(`${API_URL}/${editingOpportunity.id}`, data);
      } else {
        response = await axios.post(API_URL, data);
      }

      showNotification(response.data.message || `Opportunity ${editingOpportunity ? 'updated' : 'created'} successfully!`);
      fetchOpportunities(pagination.current_page, pagination.per_page, searchTerm);
      closeModal();
    } catch (error) {
      handleApiError(error, 'Failed to save opportunity');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this opportunity permanently?')) return;
    setOperationLoading(`delete-${id}`);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Opportunity deleted successfully');

      const remaining = pagination.total_items - 1;
      const maxPage = Math.ceil(remaining / pagination.per_page);
      const targetPage = pagination.current_page > maxPage ? maxPage : pagination.current_page;

      fetchOpportunities(targetPage || 1, pagination.per_page, searchTerm);
    } catch (error) {
      handleApiError(error, 'Delete failed');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  const totalValue = opportunities.reduce((sum, opp) => sum + (opp.value || 0), 0);
  const weightedValue = opportunities.reduce((sum, opp) => sum + (opp.value || 0) * (opp.probability / 100), 0);

  const stats = {
    total: pagination.total_items,
    totalValue: totalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
    weightedValue: weightedValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  };

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
  const formatCurrency = (value) => value ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value) : '$0';

  useEffect(() => {
    const handler = () => setActionMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  if (loading && opportunities.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex justify-between">
            <div className="h-10 bg-gray-800 rounded w-64 animate-pulse"></div>
            <div className="h-12 bg-gray-800 rounded-xl w-40 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-800/40 rounded-2xl p-6 animate-pulse">
                <div className="h-12 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-800/30 rounded-2xl p-6 animate-pulse space-y-4">
                <div className="h-8 bg-gray-700 rounded"></div>
                <div className="h-20 bg-gray-700/50 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 py-8">
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl ${notification.type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white font-medium`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
              Opportunities
            </h1>
            <p className="text-gray-400 mt-2">Track and manage your sales opportunities</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-6 py-3 rounded-xl font-bold flex items-center gap-3 shadow-lg"
          >
            <Plus size={22} /> Add New Opportunity
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Opportunities', value: stats.total, icon: Tag, color: 'blue' },
            { label: 'Pipeline Value', value: stats.totalValue, icon: DollarSign, color: 'green' },
            { label: 'Weighted Value', value: stats.weightedValue, icon: Percent, color: 'purple' },
          ].map((s, i) => (
            <div key={i} className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{s.label}</p>
                  <p className="text-3xl font-bold mt-1">{s.value}</p>
                </div>
                <div className={`p-3 bg-${s.color}-500/10 rounded-xl`}>
                  <s.icon size={28} className={`text-${s.color}-400`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/30">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by customer name or value..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none"
              />
            </div>
            <div className="flex items-center gap-2 bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3">
              <span className="text-sm text-gray-400">Show:</span>
              <select
                value={pagination.per_page}
                onChange={(e) => handleLimitChange(e.target.value)}
                className="bg-transparent border-0 text-white text-sm focus:ring-0 focus:outline-none"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { staggerChildren: 0.1 } }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8"
        >
          {opportunities.map(opportunity => (
            <motion.div
              key={opportunity.id}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 hover:border-blue-500/50 transition-all overflow-hidden relative"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <DollarSign size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{opportunity.customer.name}</h3>
                      <p className="text-sm text-gray-400">Opportunity #{opportunity.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === opportunity.id ? null : opportunity.id); }}
                    className="p-2 hover:bg-gray-700/50 rounded-lg"
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Deal Value</span>
                    <span className="text-xl font-bold text-green-400">{formatCurrency(opportunity.value)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Stage</span>
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-xs font-bold">
                      {opportunity.stage.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Win Probability</span>
                    <div className="flex items-center gap-2">
                      <Percent size={16} className="text-green-400" />
                      <span className="font-bold">{opportunity.probability}%</span>
                    </div>
                  </div>
                  {opportunity.expected_close_date !== 'N/A' && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar size={16} />
                      Expected Close: {formatDate(opportunity.expected_close_date)}
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex items-center gap-2"><User size={16} /> Customer: {opportunity.customer.name}</div>
                  <div className="flex items-center gap-2"><Calendar size={16} /> Created: {formatDate(opportunity.created_at)}</div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700/30">
                  <span className="text-xs text-gray-500">Updated: {formatDate(opportunity.updated_at)}</span>
                  <div className="flex gap-2">
                    <button onClick={() => openModal(opportunity)} className="p-2 bg-blue-500/20 hover:bg-blue-500/40 rounded-lg"><Edit size={14} /></button>
                    <button onClick={() => handleDelete(opportunity.id)} className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {actionMenu === opportunity.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-4 top-20 bg-gray-800 border border-gray-600 rounded-xl shadow-xl py-2 z-10 min-w-[160px]"
                  >
                    <button onClick={() => { openModal(opportunity); setActionMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-sm"><Edit size={16} /> Edit</button>
                    <button onClick={() => handleDelete(opportunity.id)} className="w-full text-left px-4 py-2 hover:bg-red-500/20 text-red-400 flex items-center gap-3 text-sm"><Trash2 size={16} /> Delete</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

        {pagination.last_page > 1 && (
          <div className="flex justify-between items-center py-6 border-t border-gray-700/30">
            <div className="text-sm text-gray-400">
              Showing {(pagination.current_page - 1) * pagination.per_page + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total_items)} of {pagination.total_items}
            </div>
            <div className="flex gap-2">
              <button onClick={() => handlePageChange(pagination.current_page - 1)} disabled={pagination.current_page === 1} className="px-4 py-2 rounded-xl border border-gray-600 disabled:opacity-50 flex items-center gap-2">
                <ChevronLeft size={16} /> Previous
              </button>
              {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pagination.last_page || Math.abs(p - pagination.current_page) <= 2)
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && p - arr[idx - 1] > 1 && <span className="px-3">...</span>}
                    <button onClick={() => handlePageChange(p)} className={`px-4 py-2 rounded-xl border ${pagination.current_page === p ? 'bg-blue-600 border-blue-500' : 'border-gray-600'}`}>
                      {p}
                    </button>
                  </React.Fragment>
                ))}
              <button onClick={() => handlePageChange(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page} className="px-4 py-2 rounded-xl border border-gray-600 disabled:opacity-50 flex items-center gap-2">
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {opportunities.length === 0 && !loading && (
          <div className="text-center py-20">
            <DollarSign size={64} className="mx-auto text-gray-600 mb-6" />
            <h3 className="text-2xl font-bold mb-3">{searchTerm ? 'No opportunities found' : 'No opportunities yet'}</h3>
            <p className="text-gray-400 mb-8">{searchTerm ? 'Try different keywords' : 'Create your first sales opportunity'}</p>
            {!searchTerm && (
              <button onClick={() => openModal()} className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-3 rounded-xl font-bold">
                <Plus className="inline mr-2" /> Create First Opportunity
              </button>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-3xl p-8 max-w-2xl w-full border border-gray-700" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                  {editingOpportunity ? 'Edit Opportunity' : 'Create New Opportunity'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-700 rounded-lg"><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Customer *</label>
                  <select
                    name="customer_id"
                    value={formData.customer_id}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.customer_id ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select a customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  {errors.customer_id && <p className="text-red-400 text-sm mt-1">{Array.isArray(errors.customer_id) ? errors.customer_id[0] : errors.customer_id}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Stage *</label>
                  <select
                    name="stage_id"
                    value={formData.stage_id}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.stage_id ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select a stage</option>
                    {stages.map(stage => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name} ({stage.probability}%)
                      </option>
                    ))}
                  </select>
                  {errors.stage_id && <p className="text-red-400 text-sm mt-1">{Array.isArray(errors.stage_id) ? errors.stage_id[0] : errors.stage_id}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Deal Value</label>
                    <input
                      type="number"
                      name="value"
                      value={formData.value}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className={`w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.value ? 'border-red-500' : ''}`}
                      placeholder="0.00"
                    />
                    {errors.value && <p className="text-red-400 text-sm mt-1">{Array.isArray(errors.value) ? errors.value[0] : errors.value}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Win Probability (%)</label>
                    <input
                      type="number"
                      name="probability"
                      value={formData.probability}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      className={`w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.probability ? 'border-red-500' : ''}`}
                      placeholder="50"
                    />
                    {errors.probability && <p className="text-red-400 text-sm mt-1">{Array.isArray(errors.probability) ? errors.probability[0] : errors.probability}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Expected Close Date</label>
                  <input
                    type="date"
                    name="expected_close_date"
                    value={formData.expected_close_date}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.expected_close_date ? 'border-red-500' : ''}`}
                  />
                  {errors.expected_close_date && <p className="text-red-400 text-sm mt-1">{Array.isArray(errors.expected_close_date) ? errors.expected_close_date[0] : errors.expected_close_date}</p>}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl">Cancel</button>
                  <button type="submit" disabled={operationLoading === 'saving'} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-bold flex items-center gap-2 disabled:opacity-70">
                    {operationLoading === 'saving' ? <Loader size={20} className="animate-spin" /> : <Check size={20} />}
                    {editingOpportunity ? 'Update' : 'Create'} Opportunity
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Opportunity;
