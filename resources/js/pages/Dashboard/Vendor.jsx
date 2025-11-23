import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Check, AlertCircle,
  Store, Mail, Phone, MapPin, Upload, Shield
} from 'lucide-react';

const API_URL = '/api/vendors';
const APP_URL = import.meta.env.VITE_APP_URL?.replace(/\/$/, '') || 'http://localhost:8000';

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    shop_name: '',
    email: '',
    contact: '',
    address: '',
    status: true,
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);

  // Notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false }), 4000);
  };

  // Fetch vendors
  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      setVendors(res.data.data || []);
    } catch (err) {
      showNotification('Failed to load vendors', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // Search filter
  const filteredVendors = vendors.filter(v =>
    v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Image handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Please select a valid image', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showNotification('Image must be less than 2MB', 'error');
      return;
    }

    setFormData(prev => ({ ...prev, image: file }));
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  // Open modal
  const openModal = (vendor = null) => {
    if (vendor) {
      setEditingVendor(vendor);
      setFormData({
        name: vendor.name || '',
        shop_name: vendor.shop_name || '',
        email: vendor.email || '',
        contact: vendor.contact || '',
        address: vendor.address || '',
        status: vendor.status === true || vendor.status === 1,
        image: null
      });
      setImagePreview(vendor.image ? `${APP_URL}/storage/${vendor.image}` : null);
    } else {
      setFormData({ name: '', shop_name: '', email: '', contact: '', address: '', status: true, image: null });
      setImagePreview(null);
      setEditingVendor(null);
    }
    setError('');
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');

    const data = new FormData();
    data.append('name', formData.name);
    data.append('shop_name', formData.shop_name);
    data.append('email', formData.email);
    data.append('contact', formData.contact);
    data.append('address', formData.address);
    data.append('status', formData.status ? '1' : '0'); // Laravel boolean
    if (formData.image) data.append('image', formData.image);

    try {
      if (editingVendor) {
        data.append('_method', 'PUT');
        await axios.post(`${API_URL}/${editingVendor.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showNotification('Vendor updated successfully!', 'success');
      } else {
        await axios.post(API_URL, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showNotification('Vendor created successfully!', 'success');
      }
      fetchVendors();
      closeModal();
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong';
      setError(msg);
      showNotification(msg, 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Toggle status
  const toggleStatus = async (vendor) => {
    try {
      const data = new FormData();
      data.append('_method', 'PUT');
      data.append('status', vendor.status ? '0' : '1');

      await axios.post(`${API_URL}/${vendor.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showNotification(`Vendor ${vendor.status ? 'deactivated' : 'activated'}`, 'success');
      fetchVendors();
    } catch (err) {
      showNotification('Failed to update status', 'error');
    }
  };

  // Delete
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      showNotification('Vendor deleted successfully', 'success');
      fetchVendors();
    } catch (err) {
      showNotification('Failed to delete', 'error');
    }
    setDeleteConfirm(null);
  };

  // Stats
  const stats = {
    total: vendors.length,
    active: vendors.filter(v => v.status).length,
    inactive: vendors.filter(v => !v.status).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-2xl text-gray-400">Loading vendors...</div>
      </div>
    );
  }

  return (
    <>
      {/* Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl text-white font-medium flex items-center gap-3 ${
              notification.type === 'error' ? 'bg-red-600' : 'bg-green-600'
            }`}
          >
            {notification.type === 'error' ? <X size={22} /> : <Check size={22} />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-10 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">
                Vendor Management
              </h1>
              <p className="text-gray-400 mt-2">Manage all your vendors</p>
            </div>
            <button
              onClick={() => openModal()}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-3 shadow-lg"
            >
              <Plus size={22} /> Add Vendor
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700/40">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-400">Total</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <Store className="text-violet-400" size={40} />
              </div>
            </div>
            <div className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700/40">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-400">Active</p>
                  <p className="text-3xl font-bold text-green-400">{stats.active}</p>
                </div>
                <Check className="text-green-400" size={40} />
              </div>
            </div>
            <div className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700/40">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-400">Inactive</p>
                  <p className="text-3xl font-bold text-red-400">{stats.inactive}</p>
                </div>
                <X className="text-red-400" size={40} />
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-gray-800/30 rounded-2xl border border-gray-700/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr className="text-left text-sm font-medium text-gray-400">
                    <th className="px-6 py-4">Vendor</th>
                    <th className="px-6 py-4">Shop</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/20">
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-gray-700/10 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {vendor.image ? (
                            <img
                              src={`${APP_URL}/storage/${vendor.image}`}
                              alt={vendor.name}
                              className="w-12 h-12 rounded-lg object-cover border border-gray-600"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                              <Store size={20} className="text-gray-500" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold">{vendor.name}</div>
                            <div className="text-sm text-gray-400">ID: #{vendor.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>{vendor.shop_name}</div>
                        {vendor.address && <div className="text-sm text-gray-400 mt-1">{vendor.address}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>{vendor.email}</div>
                        {vendor.contact && <div className="text-gray-400">{vendor.contact}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleStatus(vendor)}
                          className={`px-4 py-2 rounded-full text-xs font-bold ${
                            vendor.status
                              ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                              : 'bg-red-500/20 text-red-400 border border-red-500/40'
                          }`}
                        >
                          {vendor.status ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openModal(vendor)} className="text-blue-400 hover:bg-blue-500/20 p-2 rounded">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => setDeleteConfirm(vendor.id)} className="text-red-400 hover:bg-red-500/20 p-2 rounded ml-2">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={closeModal}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gray-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 p-8"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
                  </h2>
                  <button onClick={closeModal}><X size={28} className="text-gray-400" /></button>
                </div>

                {error && <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-xl text-red-300">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Image */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Image</label>
                    <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-violet-500 cursor-pointer">
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="img" />
                      <label htmlFor="img">
                        <Upload className="mx-auto mb-3 text-gray-400" size={32} />
                        <span className="text-gray-400">Click to upload</span>
                      </label>
                    </div>
                    {imagePreview && (
                      <img src={imagePreview} alt="Preview" className="mt-4 w-32 h-32 object-cover rounded-lg mx-auto" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Name *" value={formData.name} onChange={e => setFormData(prev => ({...prev, name: e.target.value}))} required className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white" />
                    <input type="text" placeholder="Shop Name *" value={formData.shop_name} onChange={e => setFormData(prev => ({...prev, shop_name: e.target.value}))} required className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white" />
                    <input type="email" placeholder="Email *" value={formData.email} onChange={e => setFormData(prev => ({...prev, email: e.target.value}))} required className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white" />
                    <input type="text" placeholder="Contact" value={formData.contact} onChange={e => setFormData(prev => ({...prev, contact: e.target.value}))} className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white" />
                    <textarea placeholder="Address" value={formData.address} onChange={e => setFormData(prev => ({...prev, address: e.target.value}))} rows={3} className="col-span-2 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white"></textarea>
                  </div>

                  <div className="flex gap-6">
                    <label className={`flex-1 p-4 rounded-xl border-2 cursor-pointer text-center ${formData.status ? 'border-green-500 bg-green-500/10' : 'border-gray-600'}`}>
                      <input type="radio" name="status" checked={formData.status} onChange={() => setFormData(prev => ({...prev, status: true}))} className="sr-only" />
                      <span className="text-green-400 font-medium">Active</span>
                    </label>
                    <label className={`flex-1 p-4 rounded-xl border-2 cursor-pointer text-center ${!formData.status ? 'border-red-500 bg-red-500/10' : 'border-gray-600'}`}>
                      <input type="radio" name="status" checked={!formData.status} onChange={() => setFormData(prev => ({...prev, status: false}))} className="sr-only" />
                      <span className="text-red-400 font-medium">Inactive</span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-4">
                    <button type="button" onClick={closeModal} className="px-6 py-3 bg-gray-700 rounded-xl">Cancel</button>
                    <button type="submit" disabled={submitLoading} className="px-8 py-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl text-white font-bold">
                      {submitLoading ? 'Saving...' : editingVendor ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Confirm */}
        <AnimatePresence>
          {deleteConfirm && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setDeleteConfirm(null)}>
              <div className="bg-gray-800 rounded-2xl p-8 max-w-sm border border-gray-700">
                <h3 className="text-xl font-bold mb-4">Delete Vendor?</h3>
                <p className="text-gray-400 mb-6">This cannot be undone.</p>
                <div className="flex gap-4">
                  <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 bg-gray-700 rounded-xl">Cancel</button>
                  <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-3 bg-red-600 rounded-xl text-white font-bold">Delete</button>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default VendorManagement;
