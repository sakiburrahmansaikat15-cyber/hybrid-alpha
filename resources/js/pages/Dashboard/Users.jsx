import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { IconMapper } from '../../components/UI/IconMapper';

const USERS_API = '/api/users';
const ROLES_API = '/api/roles';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_id: '',
    status: true,
    avatar: ''
  });

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 9,
    total: 0
  });

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.per_page,
        keyword: searchTerm,
        role_id: roleFilter
      };

      const response = await axios.get(USERS_API, { params });
      const data = response.data; // Helper might return pagination directly or wrapped
      const list = data.data || [];

      setUsers(list);
      setPagination(prev => ({
        ...prev,
        current_page: data.current_page || 1,
        last_page: data.last_page || 1,
        total: data.total || 0
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get(ROLES_API, { params: { limit: 100 } });
      setRoles(response.data.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchUsers(1);
    fetchRoles();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(1), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, roleFilter]);

  const handlePageChange = (p) => {
    if (p >= 1 && p <= pagination.last_page) fetchUsers(p);
  };

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '', // Don't show hash
        role_id: user.role_id || '',
        status: user.status === 1 || user.status === true,
        avatar: user.avatar || ''
      });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role_id: '', status: true, avatar: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await axios.post(`${USERS_API}/${editingUser.id}`, formData);
      } else {
        await axios.post(USERS_API, formData);
      }
      fetchUsers(pagination.current_page);
      setShowModal(false);
    } catch (error) {
      alert('Operation failed: ' + (error.response?.data?.message || 'Unknown Error'));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure? This action is irreversible.')) return;
    try {
      await axios.delete(`${USERS_API}/${id}`);
      fetchUsers(pagination.current_page);
    } catch (error) {
      alert('Delete failed');
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
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              User Management
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage system access and profiles</p>
          </div>
          <button onClick={() => openModal()} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-semibold shadow-lg shadow-cyan-900/20 transition-all hover:scale-105">
            <IconMapper name="UserPlus" size={20} />
            <span>New User</span>
          </button>
        </motion.div>

        {/* Controls */}
        <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row gap-4 justify-between items-center sticky top-4 z-40 shadow-xl dark:shadow-none">
          <div className="flex flex-wrap gap-4 w-full lg:w-auto flex-1">
            <div className="relative flex-1 min-w-[240px]">
              <IconMapper name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-600 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none min-w-[150px]"
            >
              <option value="">All Roles</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/30 p-1 rounded-xl border border-slate-800">
            <button onClick={() => setViewMode('card')} className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
              <IconMapper name="Grid" size={18} />
            </button>
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
              <IconMapper name="List" size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            {users.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <IconMapper name="UserX" size={48} className="mx-auto mb-4 opacity-50" />
                <p>No users found matching your criteria.</p>
              </div>
            ) : viewMode === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {users.map(user => (
                    <motion.div key={user.id} variants={itemVariants} layout className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 transition-all hover:shadow-xl hover:shadow-cyan-900/10 group relative">
                      <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button onClick={() => openModal(user)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-cyan-600 text-slate-500 hover:text-white rounded-lg transition-colors"><IconMapper name="Edit2" size={14} /></button>
                        <button onClick={() => handleDelete(user.id)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-rose-600 text-slate-500 hover:text-white rounded-lg transition-colors"><IconMapper name="Trash2" size={14} /></button>
                      </div>

                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                          {user.name[0]}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{user.name}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{user.email}</p>
                          <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${user.status ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.status ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {user.status ? 'Active' : 'Inactive'}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-800 flex justify-between items-center bg-slate-950/30 -mx-6 -mb-6 px-6 py-3 mt-4 rounded-b-2xl">
                        <div className="flex items-center gap-2">
                          <IconMapper name="Shield" size={14} className="text-cyan-600 dark:text-cyan-500" />
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{user.role?.name || 'No Role Assigned'}</span>
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-600 font-mono">ID: {user.id}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-950/50 text-slate-400 uppercase text-xs font-semibold">
                      <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {users.map(user => (
                        <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400 flex items-center justify-center font-bold">
                                {user.name[0]}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-200">{user.name}</div>
                                <div className="text-xs text-slate-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-sm border border-slate-700">
                              <IconMapper name="Shield" size={12} className="text-cyan-500" />
                              {user.role?.name || 'No Role'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${user.status ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                              {user.status ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openModal(user)} className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"><IconMapper name="Edit2" size={16} /></button>
                              <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"><IconMapper name="Trash2" size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              disabled={pagination.current_page === 1}
              onClick={() => handlePageChange(pagination.current_page - 1)}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <IconMapper name="ChevronLeft" size={20} />
            </button>
            <span className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 font-mono text-sm">
              Page {pagination.current_page} of {pagination.last_page}
            </span>
            <button
              disabled={pagination.current_page === pagination.last_page}
              onClick={() => handlePageChange(pagination.current_page + 1)}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <IconMapper name="ChevronRight" size={20} />
            </button>
          </div>
        )}
      </div>

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
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                <h2 className="text-xl font-bold text-white">{editingUser ? 'Edit User' : 'New User'}</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors"><IconMapper name="X" size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Full Name</label>
                    <input
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-600"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Email Address</label>
                    <input
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-600"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">
                      {editingUser ? 'New Password (Optional)' : 'Password'}
                    </label>
                    <input
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-600"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      required={!editingUser}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Assign Role</label>
                    <select
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all appearance-none"
                      value={formData.role_id}
                      onChange={e => setFormData({ ...formData, role_id: e.target.value })}
                    >
                      <option value="">Select a Role</option>
                      {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>

                  <label className="flex items-center gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors mt-2">
                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.status ? 'bg-emerald-600' : 'bg-slate-600'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${formData.status ? 'translate-x-6' : ''}`} />
                    </div>
                    <input type="checkbox" checked={formData.status} onChange={e => setFormData({ ...formData, status: e.target.checked })} className="hidden" />
                    <div>
                      <div className="font-semibold text-white">Active Account</div>
                      <div className="text-xs text-slate-400">User can log in to the system</div>
                    </div>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors font-medium">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-900/20 transition-all hover:scale-105">Save User</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Users;