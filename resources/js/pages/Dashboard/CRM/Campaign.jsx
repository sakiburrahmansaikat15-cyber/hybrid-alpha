import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Check, MoreVertical,
  Calendar, Loader, ChevronLeft, ChevronRight, Shield, Mail, MessageSquare, Globe, DollarSign
} from 'lucide-react';

const API_URL = 'http://localhost:8000/api/crm/campaigns';

const Campaign = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [actionMenu, setActionMenu] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'email',
    start_date: '',
    end_date: '',
    budget: ''
  });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total_items: 0
  });

  const campaignTypes = [
    { value: 'email', label: 'Email Campaign', icon: Mail, color: 'blue' },
    { value: 'sms', label: 'SMS Campaign', icon: MessageSquare, color: 'green' },
    { value: 'social', label: 'Social Media', icon: Globe, color: 'purple' }
  ];

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

  const fetchCampaigns = useCallback(async (page = 1, perPage = 10, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit: perPage };
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await axios.get(API_URL, { params });
      const res = response.data;

      const campaignData = res.pagination?.data || [];
      const formatted = campaignData.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        start_date: item.start_date,
        end_date: item.end_date,
        budget: item.budget || 0,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      setCampaigns(formatted);
      setPagination({
        current_page: res.pagination.current_page || 1,
        last_page: res.pagination.total_pages || 1,
        per_page: res.pagination.per_page || 10,
        total_items: res.pagination.total_items || 0
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch campaigns');
      setCampaigns([]);
      setPagination({ current_page: 1, last_page: 1, per_page: 10, total_items: 0 });
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCampaigns(1, pagination.per_page, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchCampaigns]);

  useEffect(() => {
    fetchCampaigns(1, 10);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_page) return;
    fetchCampaigns(newPage, pagination.per_page, searchTerm);
  };

  const handleLimitChange = (newLimit) => {
    const limit = parseInt(newLimit);
    setPagination(prev => ({ ...prev, per_page: limit }));
    fetchCampaigns(1, limit, searchTerm);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'email',
      start_date: '',
      end_date: '',
      budget: ''
    });
    setEditingCampaign(null);
    setErrors({});
  };

  const openModal = (campaign = null) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setFormData({
        name: campaign.name || '',
        type: campaign.type || 'email',
        start_date: campaign.start_date || '',
        end_date: campaign.end_date || '',
        budget: campaign.budget || ''
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
        name: formData.name.trim(),
        type: formData.type,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        budget: formData.budget ? parseFloat(formData.budget) : null
      };

      let response;
      if (editingCampaign) {
        response = await axios.post(`${API_URL}/${editingCampaign.id}`, data);
      } else {
        response = await axios.post(API_URL, data);
      }

      showNotification(response.data.message || `Campaign ${editingCampaign ? 'updated' : 'created'} successfully!`);
      fetchCampaigns(pagination.current_page, pagination.per_page, searchTerm);
      closeModal();
    } catch (error) {
      handleApiError(error, 'Failed to save campaign');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this campaign permanently?')) return;
    setOperationLoading(`delete-${id}`);
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Campaign deleted successfully');

      const remaining = pagination.total_items - 1;
      const maxPage = Math.ceil(remaining / pagination.per_page);
      const targetPage = pagination.current_page > maxPage ? maxPage : pagination.current_page;

      fetchCampaigns(targetPage || 1, pagination.per_page, searchTerm);
    } catch (error) {
      handleApiError(error, 'Delete failed');
    } finally {
      setOperationLoading(null);
      setActionMenu(null);
    }
  };

  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);

  const stats = {
    total: pagination.total_items,
    totalBudget: totalBudget.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
    email: campaigns.filter(c => c.type === 'email').length,
    sms: campaigns.filter(c => c.type === 'sms').length,
    social: campaigns.filter(c => c.type === 'social').length
  };

  const getTypeConfig = (type) => campaignTypes.find(t => t.value === type) || campaignTypes[0];

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
  const formatCurrency = (value) => value ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value) : '$0';

  useEffect(() => {
    const handler = () => setActionMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  if (loading && campaigns.length === 0) {
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
              Campaigns Management
            </h1>
            <p className="text-gray-400 mt-2">Plan and manage your marketing campaigns</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-6 py-3 rounded-xl font-bold flex items-center gap-3 shadow-lg"
          >
            <Plus size={22} /> Add New Campaign
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Campaigns', value: stats.total, icon: Globe, color: 'blue' },
            { label: 'Total Budget', value: stats.totalBudget, icon: DollarSign, color: 'green' },
            { label: 'Email Campaigns', value: stats.email, icon: Mail, color: 'cyan' },
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
                placeholder="Search by name or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
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
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm min-w-[140px]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { staggerChildren: 0.1 } }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8"
        >
          {campaigns
            .sort((a, b) => {
              if (sortBy === 'name') return a.name.localeCompare(b.name);
              if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
              if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
              return 0;
            })
            .map(campaign => {
              const typeConfig = getTypeConfig(campaign.type);
              return (
                <motion.div
                  key={campaign.id}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 hover:border-blue-500/50 transition-all overflow-hidden relative"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 bg-${typeConfig.color}-500/10 rounded-lg`}>
                          <typeConfig.icon size={20} className={`text-${typeConfig.color}-400`} />
                        </div>
                        <h3 className="text-xl font-bold">{campaign.name}</h3>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === campaign.id ? null : campaign.id); }}
                        className="p-2 hover:bg-gray-700/50 rounded-lg"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </div>

                    <div className="space-y-2 mb-4 text-sm text-gray-300">
                      <div className="flex items-center gap-2 capitalize">
                        <span className="font-medium">Type:</span> {typeConfig.label}
                      </div>
                      {campaign.start_date && (
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          Start: {formatDate(campaign.start_date)}
                        </div>
                      )}
                      {campaign.end_date && (
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          End: {formatDate(campaign.end_date)}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <DollarSign size={16} />
                        Budget: {formatCurrency(campaign.budget)}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-400">
                      <div className="flex items-center gap-2"><Shield size={16} /> ID: #{campaign.id}</div>
                      <div className="flex items-center gap-2"><Calendar size={16} /> Created: {formatDate(campaign.created_at)}</div>
                    </div>

                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700/30">
                      <span className="text-xs text-gray-500">Updated: {formatDate(campaign.updated_at)}</span>
                      <div className="flex gap-2">
                        <button onClick={() => openModal(campaign)} className="p-2 bg-blue-500/20 hover:bg-blue-500/40 rounded-lg"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(campaign.id)} className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {actionMenu === campaign.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute right-4 top-20 bg-gray-800 border border-gray-600 rounded-xl shadow-xl py-2 z-10 min-w-[160px]"
                      >
                        <button onClick={() => { openModal(campaign); setActionMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-sm"><Edit size={16} /> Edit</button>
                        <button onClick={() => handleDelete(campaign.id)} className="w-full text-left px-4 py-2 hover:bg-red-500/20 text-red-400 flex items-center gap-3 text-sm"><Trash2 size={16} /> Delete</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
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

        {campaigns.length === 0 && !loading && (
          <div className="text-center py-20">
            <Globe size={64} className="mx-auto text-gray-600 mb-6" />
            <h3 className="text-2xl font-bold mb-3">{searchTerm ? 'No campaigns found' : 'No campaigns yet'}</h3>
            <p className="text-gray-400 mb-8">{searchTerm ? 'Try different keywords' : 'Create your first marketing campaign'}</p>
            {!searchTerm && (
              <button onClick={() => openModal()} className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-3 rounded-xl font-bold">
                <Plus className="inline mr-2" /> Create First Campaign
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
                  {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-700 rounded-lg"><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Campaign Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="e.g., Summer Sale 2025"
                  />
                  {errors.name && <p className="text-red-400 text-sm mt-1">{Array.isArray(errors.name) ? errors.name[0] : errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3">Campaign Type *</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {campaignTypes.map(t => (
                      <label
                        key={t.value}
                        onClick={() => setFormData(prev => ({ ...prev, type: t.value }))}
                        className={`p-4 border-2 rounded-xl text-center cursor-pointer transition ${formData.type === t.value ? `border-${t.color}-500 bg-${t.color}-500/10` : 'border-gray-600'}`}
                      >
                        <t.icon size={24} className={`mx-auto mb-2 text-${t.color}-400`} />
                        <span className="font-medium">{t.label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.type && <p className="text-red-400 text-sm mt-2">{Array.isArray(errors.type) ? errors.type[0] : errors.type}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Start Date</label>
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.start_date ? 'border-red-500' : ''}`}
                    />
                    {errors.start_date && <p className="text-red-400 text-sm mt-1">{Array.isArray(errors.start_date) ? errors.start_date[0] : errors.start_date}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">End Date</label>
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.end_date ? 'border-red-500' : ''}`}
                    />
                    {errors.end_date && <p className="text-red-400 text-sm mt-1">{Array.isArray(errors.end_date) ? errors.end_date[0] : errors.end_date}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Budget</label>
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-3 bg-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.budget ? 'border-red-500' : ''}`}
                    placeholder="0.00"
                  />
                  {errors.budget && <p className="text-red-400 text-sm mt-1">{Array.isArray(errors.budget) ? errors.budget[0] : errors.budget}</p>}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl">Cancel</button>
                  <button type="submit" disabled={operationLoading === 'saving'} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-bold flex items-center gap-2 disabled:opacity-70">
                    {operationLoading === 'saving' ? <Loader size={20} className="animate-spin" /> : <Check size={20} />}
                    {editingCampaign ? 'Update' : 'Create'} Campaign
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

export default Campaign;
