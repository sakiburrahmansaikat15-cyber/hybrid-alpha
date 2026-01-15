import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, X, Check, Loader, ChevronLeft, ChevronRight,
  MoreVertical, FileText, Download, User, RefreshCw, Shield, FolderOpen
} from 'lucide-react';

const EMPLOYEE_DOCUMENTS_API = '/api/hrm/employee-documents';
const EMPLOYEES_API = '/api/hrm/employees';

const EmployeeDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMenu, setActionMenu] = useState(null);

  const [formData, setFormData] = useState({
    employee_id: '',
    document_type: '',
    document_file: null,
  });
  const [selectedFileName, setSelectedFileName] = useState('');

  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [pagination, setPagination] = useState({
    current_page: 1, last_page: 1, per_page: 10, total_items: 0
  });

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
  }, []);

  const handleApiError = useCallback((error, defaultMessage) => {
    if (error.response?.status === 422) {
      setErrors(error.response.data.errors || {});
      showNotification('Validation failed', 'error');
    } else {
      showNotification(error.response?.data?.message || defaultMessage, 'error');
    }
  }, [showNotification]);

  const fetchDocuments = useCallback(async (page = 1, limit = 10, keyword = '') => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await axios.get(EMPLOYEE_DOCUMENTS_API, { params });
      const data = response.data.pagination || response.data;
      const list = data.data || [];

      setDocuments(list.map(item => ({
        ...item,
        employee_name: item.employee ? `${item.employee.first_name} ${item.employee.last_name || ''}`.trim() : '—',
      })));

      setPagination({
        current_page: data.current_page || 1,
        last_page: data.total_pages || data.last_page || 1,
        per_page: data.per_page || limit,
        total_items: data.total_items || data.total || 0
      });
    } catch (error) {
      console.error(error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmployees = async () => {
    setDropdownLoading(true);
    try {
      const response = await axios.get(EMPLOYEES_API);
      const data = response.data.pagination?.data || response.data?.data || [];
      setEmployees(data.map(emp => ({
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name || ''}`.trim() || emp.employee_code,
      })));
    } catch (error) {
      console.error(error);
    } finally {
      setDropdownLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(1, 10);
    fetchEmployees();
  }, [fetchDocuments]);

  useEffect(() => {
    const timer = setTimeout(() => fetchDocuments(1, pagination.per_page, searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, pagination.per_page, fetchDocuments]);

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('.action-menu-btn')) setActionMenu(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handlePageChange = (p) => {
    if (p >= 1 && p <= pagination.last_page) fetchDocuments(p, pagination.per_page, searchTerm);
  };

  const openModal = (doc = null) => {
    setErrors({});
    if (doc) {
      setEditingDocument(doc);
      setFormData({
        employee_id: doc.employee_id?.toString() || '',
        document_type: doc.document_type || '',
        document_file: null,
      });
      setSelectedFileName(getFileNameFromPath(doc.document_file));
    } else {
      setEditingDocument(null);
      setFormData({ employee_id: '', document_type: '', document_file: null });
      setSelectedFileName('');
    }
    setShowModal(true);
    setActionMenu(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, document_file: file }));
      setSelectedFileName(file.name);
      if (errors.document_file) setErrors(prev => ({ ...prev, document_file: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOperationLoading('saving');

    const payload = new FormData();
    payload.append('employee_id', formData.employee_id);
    payload.append('document_type', formData.document_type);
    if (formData.document_file) payload.append('document_file', formData.document_file);

    const config = {
      headers: { 'Content-Type': 'multipart/form-data' }
    };

    try {
      if (editingDocument) {
        await axios.post(`${EMPLOYEE_DOCUMENTS_API}/${editingDocument.id}`, payload, config);
      } else {
        await axios.post(EMPLOYEE_DOCUMENTS_API, payload, config);
      }
      showNotification(editingDocument ? 'Updated successfully' : 'Uploaded successfully');
      fetchDocuments(pagination.current_page, pagination.per_page, searchTerm);
      setShowModal(false);
    } catch (error) {
      handleApiError(error, 'Save failed');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this document?')) return;
    setOperationLoading(`del-${id}`);
    try {
      await axios.delete(`${EMPLOYEE_DOCUMENTS_API}/${id}`);
      showNotification('Deleted successfully');
      fetchDocuments(pagination.current_page, pagination.per_page, searchTerm);
    } catch (e) { handleApiError(e, 'Delete failed'); }
    finally { setOperationLoading(null); setActionMenu(null); }
  };

  const getFileNameFromPath = (path) => path ? path.split('/').pop().split('_').slice(1).join('_') : 'No file selected';
  const getFileExtension = (path) => path ? path.split('.').pop().toUpperCase() : 'FILE';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      <AnimatePresence>
        {notification.show && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className={`fixed top-6 right-1/2 translate-x-1/2 z-[60] px-6 py-3 rounded-full shadow-2xl backdrop-blur-md border border-white/10 flex items-center gap-3 font-medium ${notification.type === 'error' ? 'bg-rose-500/20 text-rose-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
            {notification.type === 'error' ? <Shield size={18} /> : <Check size={18} />} {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-400">Documents</span>
            </h1>
            <p className="text-slate-400 text-lg">Employee files and records</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openModal()} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl font-bold text-white shadow-lg shadow-indigo-900/20 hover:shadow-indigo-900/40 flex items-center gap-2">
            <Plus size={20} /> Upload File
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Files</p>
              <h3 className="text-3xl font-bold text-white mt-1">{pagination.total_items}</h3>
            </div>
            <div className="p-4 rounded-xl bg-indigo-400/10"><FolderOpen size={24} className="text-indigo-400" /></div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md flex flex-col md:flex-row gap-4 items-center justify-between sticky top-4 z-40 shadow-2xl">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" size={20} />
            <input type="text" placeholder="Search by document type..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-500" />
          </div>
          <button onClick={() => fetchDocuments(pagination.current_page, pagination.per_page, searchTerm)} className="p-3 bg-slate-900/50 rounded-xl border border-white/10 hover:text-indigo-400 transition-colors">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {documents.map(doc => (
              <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key={doc.id} className="group bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all hover:shadow-xl relative flex flex-col">
                <div className="min-h-[120px] bg-slate-800/50 flex/ items-center justify-center relative p-6 border-b border-white/5">
                  <div className="absolute top-4 right-4 z-20">
                    <button onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === doc.id ? null : doc.id); }} className="action-menu-btn p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><MoreVertical size={18} /></button>
                    {actionMenu === doc.id && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50 py-1 flex flex-col">
                        <button onClick={() => openModal(doc)} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-indigo-300 flex items-center gap-2"><Edit size={14} /> Edit</button>
                        <div className="h-px bg-white/5 my-1" />
                        <button onClick={() => handleDelete(doc.id)} className="w-full text-left px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"><Trash2 size={14} /> Delete</button>
                      </motion.div>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <div className='w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg'>
                      <FileText size={32} />
                    </div>
                    <span className="text-xs font-bold font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{getFileExtension(doc.document_file)} FILE</span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="mb-4">
                    <h3 className="font-bold text-lg text-white mb-1">{doc.document_type}</h3>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <User size={14} />
                      <span className="truncate">{doc.employee_name}</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 space-y-4">
                    {doc.document_file && (
                      <a href={`/${doc.document_file}`} target="_blank" className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-colors text-indigo-300">
                        <Download size={16} /> Download File
                      </a>
                    )}
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>ID: {doc.id}</span>
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {!loading && pagination.last_page > 1 && (
          <div className="flex justify-center pt-8">
            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/10">
              <button onClick={() => handlePageChange(pagination.current_page - 1)} disabled={pagination.current_page === 1} className="p-3 hover:bg-white/10 rounded-lg disabled:opacity-30 text-white"><ChevronLeft size={20} /></button>
              <span className="px-4 py-3 font-mono text-sm text-slate-400">Page {pagination.current_page} of {pagination.last_page}</span>
              <button onClick={() => handlePageChange(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page} className="p-3 hover:bg-white/10 rounded-lg disabled:opacity-30 text-white"><ChevronRight size={20} /></button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500" />
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900 shrink-0">
                <h2 className="text-xl font-bold text-white">{editingDocument ? 'Edit Document' : 'Upload Document'}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"><X size={20} /></button>
              </div>

              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Employee *</label>
                    <select value={formData.employee_id} onChange={e => setFormData({ ...formData, employee_id: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none" required>
                      <option value="">Select Employee</option>
                      {employees.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Document Type *</label>
                    <input type="text" value={formData.document_type} onChange={e => setFormData({ ...formData, document_type: e.target.value })} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none" required placeholder="e.g. Contract, ID Proof" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">File Upload</label>
                    <div className="relative group">
                      <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className="w-full bg-slate-800 border border-dashed border-white/20 rounded-xl px-4 py-8 text-center group-hover:border-indigo-500/50 transition-colors">
                        <p className="text-slate-400 text-sm group-hover:text-indigo-400 transition-colors pointer-events-none">
                          {selectedFileName || 'Click to upload or drag and drop'}
                        </p>
                      </div>
                    </div>
                    {errors.document_file && <p className="text-rose-400 text-xs">{errors.document_file[0]}</p>}
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <button type="submit" disabled={operationLoading} className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2">
                      {operationLoading && <Loader size={20} className="animate-spin" />} {editingDocument ? 'Update File' : 'Upload File'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmployeeDocuments;