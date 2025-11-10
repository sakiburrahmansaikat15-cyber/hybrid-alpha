import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Image as ImageIcon,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
  X,
  Upload,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const PaymentType = () => {
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    account_number: '',
    notes: '',
    status: true,
    images: []
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [viewImages, setViewImages] = useState(null);
  const [errors, setErrors] = useState({});

  // Get CSRF token
  const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.content || '';
  };

  // Fetch payment types
  const fetchPaymentTypes = async () => {
    setLoading(true);
    try {
      let url = '/api/payment-types?';
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('q', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter === 'active');
      
      url += params.toString();
      
      console.log('Fetching from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('API Response:', result);

      if (result.success) {
        setPaymentTypes(result.data.data || []);
      } else {
        throw new Error(result.message || 'Failed to fetch payment types');
      }
    } catch (error) {
      console.error('Error fetching payment types:', error);
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Test API endpoint
  const testApiEndpoint = async () => {
    try {
      const response = await fetch('/api/payment-types');
      const result = await response.json();
      console.log('API Test Result:', result);
      showToast(`API Test: ${response.status} - ${result.success ? 'Success' : 'Failed'}`, 'info');
    } catch (error) {
      console.error('API Test Error:', error);
      showToast(`API Test Failed: ${error.message}`, 'error');
    }
  };

  useEffect(() => {
    fetchPaymentTypes();
  }, [searchTerm, statusFilter]);

  // Toast notification
  const showToast = (message, type = 'info') => {
    // Simple alert for now - you can replace with a proper toast library
    alert(`${type.toUpperCase()}: ${message}`);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + formData.images.length > 5) {
      showToast('Maximum 5 images allowed', 'error');
      return;
    }

    const newPreviews = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setImagePreviews(prev => [...prev, ...newPreviews]);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  // Remove image preview
  const removeImagePreview = (index) => {
    setImagePreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index].preview);
      return newPreviews;
    });
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      account_number: '',
      notes: '',
      status: true,
      images: []
    });
    setImagePreviews([]);
    setEditingPayment(null);
    setErrors({});
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setErrors({});

    try {
      const submitData = new FormData();
      
      // Append form data
      submitData.append('name', formData.name);
      submitData.append('type', formData.type);
      submitData.append('account_number', formData.account_number);
      submitData.append('notes', formData.notes);
      submitData.append('status', formData.status ? '1' : '0');
      
      // Append images
      formData.images.forEach(image => {
        submitData.append('images[]', image);
      });

      const url = editingPayment 
        ? `/api/payment-types/${editingPayment.id}`
        : '/api/payment-types';
      
      const method = editingPayment ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: submitData,
        headers: {
          'X-CSRF-TOKEN': getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      const result = await response.json();

      if (result.success) {
        setShowModal(false);
        resetForm();
        fetchPaymentTypes();
        showToast(
          editingPayment ? 'Payment type updated successfully' : 'Payment type created successfully',
          'success'
        );
      } else {
        if (result.errors) {
          setErrors(result.errors);
        } else {
          showToast(result.message || 'Error saving payment type', 'error');
        }
      }
    } catch (error) {
      console.error('Error saving payment type:', error);
      showToast('Error saving payment type', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Edit payment type
  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setFormData({
      name: payment.name,
      type: payment.type || '',
      account_number: payment.account_number || '',
      notes: payment.notes || '',
      status: payment.status,
      images: []
    });
    setImagePreviews([]);
    setErrors({});
    setShowModal(true);
  };

  // Delete payment type
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this payment type?')) return;

    try {
      const response = await fetch(`/api/payment-types/${id}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-TOKEN': getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        fetchPaymentTypes();
        showToast('Payment type deleted successfully', 'success');
      } else {
        showToast(result.message || 'Error deleting payment type', 'error');
      }
    } catch (error) {
      console.error('Error deleting payment type:', error);
      showToast('Error deleting payment type', 'error');
    }
  };

  // Toggle status
  const toggleStatus = async (payment) => {
    try {
      const response = await fetch(`/api/payment-types/${payment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          name: payment.name,
          type: payment.type,
          account_number: payment.account_number,
          notes: payment.notes,
          status: !payment.status
        })
      });

      const result = await response.json();

      if (result.success) {
        fetchPaymentTypes();
        showToast(
          `Payment type ${!payment.status ? 'activated' : 'deactivated'} successfully`,
          'success'
        );
      } else {
        showToast(result.message || 'Error updating status', 'error');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Error updating status', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Payment Types</h1>
            <p className="text-gray-400 text-sm sm:text-base">Manage your payment methods and types</p>
          </div>
          <button
            onClick={testApiEndpoint}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Test API
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Search payment types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>
            
            <div className="relative flex-1 sm:flex-none">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none w-full sm:w-40"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Add Button */}
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors w-full sm:w-auto justify-center font-medium"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Add Payment Type
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="ml-3 text-gray-400">Loading payment types...</span>
        </div>
      )}

      {/* Payment Types Grid */}
      {!loading && paymentTypes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {paymentTypes.map((payment) => (
            <div
              key={payment.id}
              className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {payment.name}
                  </h3>
                  {payment.type && (
                    <span className="text-sm text-gray-400 bg-gray-700 px-2 py-1 rounded">
                      {payment.type}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => toggleStatus(payment)}
                  className={`p-1 rounded-full ${
                    payment.status 
                      ? 'text-green-500 hover:text-green-400' 
                      : 'text-red-500 hover:text-red-400'
                  }`}
                >
                  {payment.status ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </button>
              </div>

              {/* Account Number */}
              {payment.account_number && (
                <div className="mb-3">
                  <p className="text-sm text-gray-400">Account Number</p>
                  <p className="text-white font-mono text-sm">{payment.account_number}</p>
                </div>
              )}

              {/* Notes */}
              {payment.notes && (
                <div className="mb-4">
                  <p className="text-sm text-gray-400">Notes</p>
                  <p className="text-gray-300 text-sm">{payment.notes}</p>
                </div>
              )}

              {/* Images */}
              {payment.image_urls && payment.image_urls.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2">Images</p>
                  <div className="flex gap-2">
                    {payment.image_urls.slice(0, 3).map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`${payment.name} ${index + 1}`}
                        className="w-12 h-12 rounded object-cover cursor-pointer"
                        onClick={() => setViewImages(payment)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(payment)}
                    className="p-2 text-blue-400 hover:bg-blue-400 hover:bg-opacity-10 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(payment.id)}
                    className="p-2 text-red-400 hover:bg-red-400 hover:bg-opacity-10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <span className={`px-2 py-1 rounded-full text-xs ${
                  payment.status 
                    ? 'bg-green-500 bg-opacity-20 text-green-400' 
                    : 'bg-red-500 bg-opacity-20 text-red-400'
                }`}>
                  {payment.status ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && paymentTypes.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
            <ImageIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Payment Types</h3>
            <p className="text-gray-400 mb-6">
              Get started by creating your first payment type.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Payment Type
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">
                  {editingPayment ? 'Edit Payment Type' : 'Add Payment Type'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter payment type name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type
                </label>
                <input
                  type="text"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Bank Transfer, E-Wallet"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  name="account_number"
                  value={formData.account_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter account number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Additional notes..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Images (Max 5)
                </label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer block"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-gray-400 text-sm">
                      Click to upload images
                    </span>
                  </label>
                </div>

                {imagePreviews.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview.preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeImagePreview(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="status"
                  id="status"
                  checked={formData.status}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="status" className="ml-2 text-sm text-gray-300">
                  Active
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingPayment ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentType;