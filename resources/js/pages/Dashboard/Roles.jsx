import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { IconMapper } from '../../components/UI/IconMapper';

const API_URL = '/api/roles';

// Predefined lists for permissions and accesses
const AVAILABLE_PERMISSIONS = [
  'read', 'write', 'delete', 'update', 'create', 'export', 'import',
  'manage_users', 'manage_roles', 'view_reports', 'manage_settings'
];

const AVAILABLE_ACCESSES = [
  'admin_panel', 'user_management', 'role_management', 'content_management',
  'reporting', 'system_settings', 'audit_logs', 'api_access', 'dashboard'
];

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    permissions: [],
    accesses: [],
    status: true
  });

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  });

  const fetchRoles = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.per_page,
        ...(search && { search })
      };

      const response = await axios.get(API_URL, { params });
      const data = response.data.data || response.data;

      setRoles(Array.isArray(data) ? data : (data.data || []));
      setPagination(prev => ({
        ...prev,
        current_page: data.current_page || page,
        last_page: data.last_page || 1,
        total: data.total || data.length || 0,
        per_page: data.per_page || prev.per_page
      }));
      setError('');
    } catch (err) {
      setError('Failed to fetch roles. Please try again.');
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles(1);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchRoles(1, searchTerm);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      fetchRoles(newPage, searchTerm);
    }
  };

  const handleCheckboxChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleSelectAll = (field, items) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].length === items.length ? [] : items
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      permissions: [],
      accesses: [],
      status: true
    });
    setEditingRole(null);
  };

  const openModal = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        permissions: role.permissions || [],
        accesses: role.accesses || [],
        status: role.status ?? true
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => resetForm(), 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRole) {
        // Use POST for update based on backend route definition
        await axios.post(`${API_URL}/${editingRole.id}`, formData);
      } else {
        await axios.post(API_URL, formData);
      }
      fetchRoles(pagination.current_page, searchTerm);
      closeModal();
    } catch (err) {
      setError(`Failed to ${editingRole ? 'update' : 'create'} role. Please check connection.`);
      console.error('Error submitting form:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchRoles(pagination.current_page, searchTerm);
    } catch (err) {
      setError('Failed to delete role.');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
              Role Management
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Define permissions and access levels</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-lg font-semibold shadow-lg shadow-violet-900/20 transition-all hover:scale-105"
          >
            <IconMapper name="Plus" size={20} />
            <span>New Role</span>
          </button>
        </motion.div>

        {/* Controls */}
        <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-4 z-40 shadow-xl dark:shadow-none">
          <div className="relative w-full md:w-96">
            <IconMapper name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search roles..."
              className="w-full bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 placeholder:text-slate-400 dark:placeholder:text-slate-600"
            />
          </div>

          <div className="flex items-center gap-3 bg-white/40 dark:bg-slate-950/30 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-mono text-slate-500">TOTAL ROLES</span>
            <span className="text-lg font-bold text-violet-400 font-mono">{pagination.total}</span>
          </div>
        </div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {roles.map((role) => (
              <motion.div
                key={role.id}
                variants={itemVariants}
                layout
                className="group relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:border-violet-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-900/10 shadow-sm dark:shadow-none"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-2">
                    <button onClick={() => openModal(role)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-violet-600 rounded-lg text-slate-500 hover:text-white transition-colors">
                      <IconMapper name="Edit2" size={16} />
                    </button>
                    <button onClick={() => handleDelete(role.id)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-rose-600 rounded-lg text-slate-500 hover:text-white transition-colors">
                      <IconMapper name="Trash2" size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${role.status ? 'bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-violet-400' : 'bg-slate-800 text-slate-500'}`}>
                    {role.name[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{role.name}</h3>
                    <div className={`text-xs px-2 py-0.5 rounded-full w-fit mt-1 flex items-center gap-1.5 ${role.status ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${role.status ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {role.status ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Permissions</div>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions?.slice(0, 3).map((p, i) => (
                        <span key={i} className="px-2 py-1 text-xs bg-violet-500/10 border border-violet-500/20 text-violet-300 rounded-md">
                          {p.replace('_', ' ')}
                        </span>
                      ))}
                      {(role.permissions?.length || 0) > 3 && (
                        <span className="px-2 py-1 text-xs bg-slate-800 text-slate-400 rounded-md">
                          +{role.permissions.length - 3} more
                        </span>
                      )}
                      {(!role.permissions?.length) && <span className="text-xs text-slate-600 italic">No permissions</span>}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Accesses</div>
                    <div className="flex flex-wrap gap-2">
                      {role.accesses?.slice(0, 3).map((a, i) => (
                        <span key={i} className="px-2 py-1 text-xs bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-300 rounded-md">
                          {a.replace('_', ' ')}
                        </span>
                      ))}
                      {(role.accesses?.length || 0) > 3 && (
                        <span className="px-2 py-1 text-xs bg-slate-800 text-slate-400 rounded-md">
                          +{role.accesses.length - 3} more
                        </span>
                      )}
                      {(!role.accesses?.length) && <span className="text-xs text-slate-600 italic">No accesses</span>}
                    </div>
                  </div>
                </div>

              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
              >
                <div className="p-6 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
                  <h2 className="text-xl font-bold text-white">{editingRole ? 'Edit Role' : 'Create Role'}</h2>
                  <button onClick={closeModal} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-colors"><IconMapper name="X" size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Role Name</label>
                    <input
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all placeholder:text-slate-600"
                      placeholder="e.g. Administrator"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-violet-400">Permissions</label>
                        <button type="button" onClick={() => handleSelectAll('permissions', AVAILABLE_PERMISSIONS)} className="text-xs text-slate-500 hover:text-white transition-colors">Select All</button>
                      </div>
                      <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800 h-64 overflow-y-auto space-y-2 custom-scrollbar">
                        {AVAILABLE_PERMISSIONS.map(p => (
                          <label key={p} className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors group">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${formData.permissions.includes(p) ? 'bg-violet-600 border-violet-600' : 'border-slate-600 group-hover:border-slate-500'}`}>
                              {formData.permissions.includes(p) && <IconMapper name="Check" size={12} className="text-white" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={formData.permissions.includes(p)} onChange={() => handleCheckboxChange('permissions', p)} />
                            <span className="text-sm text-slate-300 capitalize">{p.replace('_', ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-fuchsia-400">Accesses</label>
                        <button type="button" onClick={() => handleSelectAll('accesses', AVAILABLE_ACCESSES)} className="text-xs text-slate-500 hover:text-white transition-colors">Select All</button>
                      </div>
                      <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800 h-64 overflow-y-auto space-y-2 custom-scrollbar">
                        {AVAILABLE_ACCESSES.map(a => (
                          <label key={a} className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors group">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${formData.accesses.includes(a) ? 'bg-fuchsia-600 border-fuchsia-600' : 'border-slate-600 group-hover:border-slate-500'}`}>
                              {formData.accesses.includes(a) && <IconMapper name="Check" size={12} className="text-white" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={formData.accesses.includes(a)} onChange={() => handleCheckboxChange('accesses', a)} />
                            <span className="text-sm text-slate-300 capitalize">{a.replace('_', ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.status ? 'bg-emerald-600' : 'bg-slate-600'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${formData.status ? 'translate-x-6' : ''}`} />
                    </div>
                    <input type="checkbox" checked={formData.status} onChange={e => setFormData({ ...formData, status: e.target.checked })} className="hidden" />
                    <div>
                      <div className="font-semibold text-white">Active Status</div>
                      <div className="text-xs text-slate-400">Enable or disable this role system-wide</div>
                    </div>
                  </label>

                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={closeModal} className="px-6 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition-all font-medium">Cancel</button>
                    <button type="submit" className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-900/20 transition-all hover:scale-105 font-bold">
                      {editingRole ? 'Save Changes' : 'Create Role'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default Roles;
