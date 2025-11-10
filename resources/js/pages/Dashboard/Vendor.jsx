import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  X, 
  Save,
  Upload,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const Vendor = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    shop_name: '',
    email: '',
    contact: '',
    address: '',
    status: 1,
    image: null
  });
  const [errors, setErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [imagePreview, setImagePreview] = useState(null);
  const [apiError, setApiError] = useState('');

  // Fetch vendors
  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/vendors');
      setVendors(response.data.data);
      setApiError('');
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setApiError('Failed to fetch vendors. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Search vendors
  const searchVendors = async (query) => {
    if (!query.trim()) {
      fetchVendors();
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/api/vendors/search?search=${encodeURIComponent(query)}`);
      setVendors(response.data.data);
      setApiError('');
    } catch (error) {
      console.error('Error searching vendors:', error);
      setApiError('Error searching vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        searchVendors(searchTerm);
      } else {
        fetchVendors();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      const file = files[0];
      
      // Validate file type
      if (file && !file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          image: 'Please select a valid image file'
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file && file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          image: 'Image size should be less than 5MB'
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        image: file
      }));

      // Create image preview
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
        setErrors(prev => ({ ...prev, image: '' }));
      } else {
        setImagePreview(null);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (value === '1' ? 0 : 1) : value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear API error when user makes changes
    if (apiError) {
      setApiError('');
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.shop_name.trim()) newErrors.shop_name = 'Shop name is required';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (formData.contact && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formData.contact)) {
      newErrors.contact = 'Contact number is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setApiError('');

    try {
      const submitData = new FormData();
      
      // Append all form data
      submitData.append('name', formData.name);
      submitData.append('shop_name', formData.shop_name);
      submitData.append('email', formData.email);
      submitData.append('contact', formData.contact || '');
      submitData.append('address', formData.address || '');
      submitData.append('status', formData.status);
      submitData.append('user_id', 1); // You might want to get this from auth context
      
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      let response;
      
      if (selectedVendor) {
        // For update, use PUT method
        response = await axios.post(`/api/vendors/${selectedVendor.id}`, submitData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            'X-HTTP-Method-Override': 'PUT'
          }
        });
      } else {
        // For create
        response = await axios.post('/api/vendors', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (response.data.status) {
        setShowModal(false);
        resetForm();
        fetchVendors();
        alert(`Vendor ${selectedVendor ? 'updated' : 'created'} successfully!`);
      } else {
        throw new Error(response.data.message || 'Operation failed');
      }
      
    } catch (error) {
      console.error('Error saving vendor:', error);
      
      // Handle different error types
      if (error.response?.data?.errors) {
        // Laravel validation errors
        const serverErrors = error.response.data.errors;
        const formattedErrors = {};
        
        Object.keys(serverErrors).forEach(key => {
          formattedErrors[key] = serverErrors[key][0];
        });
        
        setErrors(formattedErrors);
        setApiError('Please fix the validation errors above.');
        
      } else if (error.response?.data?.message) {
        // Custom server error message
        setApiError(error.response.data.message);
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        setApiError('Network error. Please check your connection.');
      } else {
        setApiError(`Error ${selectedVendor ? 'updating' : 'creating'} vendor. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete vendor
  const handleDelete = async () => {
    if (!selectedVendor) return;

    setLoading(true);
    setApiError('');
    
    try {
      const response = await axios.delete(`/api/vendors/${selectedVendor.id}`);
      
      if (response.data.status || response.data === 'Vendor Deleted Successfully') {
        setShowDeleteModal(false);
        setSelectedVendor(null);
        fetchVendors();
        alert('Vendor deleted successfully!');
      } else {
        throw new Error('Delete operation failed');
      }
      
    } catch (error) {
      console.error('Error deleting vendor:', error);
      
      if (error.response?.data?.message) {
        setApiError(error.response.data.message);
      } else {
        setApiError('Error deleting vendor. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Edit vendor
  const handleEdit = (vendor) => {
    setSelectedVendor(vendor);
    setFormData({
      name: vendor.name,
      shop_name: vendor.shop_name,
      email: vendor.email,
      contact: vendor.contact || '',
      address: vendor.address || '',
      status: vendor.status,
      image: null
    });
    setImagePreview(vendor.image ? `/vendore/${vendor.image}` : null);
    setErrors({});
    setApiError('');
    setShowModal(true);
  };

  // View vendor details
  const handleView = (vendor) => {
    setSelectedVendor(vendor);
    // You can implement a view modal here if needed
    alert(`Vendor Details:\nName: ${vendor.name}\nShop: ${vendor.shop_name}\nEmail: ${vendor.email}\nContact: ${vendor.contact}\nAddress: ${vendor.address}\nStatus: ${vendor.status ? 'Active' : 'Inactive'}`);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      shop_name: '',
      email: '',
      contact: '',
      address: '',
      status: 1,
      image: null
    });
    setSelectedVendor(null);
    setImagePreview(null);
    setErrors({});
    setApiError('');
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVendors = vendors.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(vendors.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Vendor Management</h1>
        <p className="text-gray-400 text-sm sm:text-base">Manage your vendors and their details</p>
      </div>

      {/* Error Alert */}
      {apiError && (
        <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-200 text-sm">{apiError}</p>
          </div>
          <button
            onClick={() => setApiError('')}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder="Search vendors by name, shop, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 text-sm sm:text-base"
          />
        </div>
        
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Add Vendor</span>
        </button>
      </div>

      {/* Vendors Table */}
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {loading && !vendors.length ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Shop
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {currentVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-gray-750 transition-colors duration-150">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          {vendor.image ? (
                            <img
                              src={`/vendore/${vendor.image}`}
                              alt={vendor.name}
                              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-700 flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-white">{vendor.name}</div>
                            <div className="text-xs text-gray-400 truncate max-w-[120px] sm:max-w-none">{vendor.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-white">{vendor.shop_name}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{vendor.contact || 'N/A'}</div>
                        <div className="text-xs text-gray-400 truncate max-w-[120px]">{vendor.address || 'No address'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          vendor.status 
                            ? 'bg-green-900 text-green-200' 
                            : 'bg-red-900 text-red-200'
                        }`}>
                          {vendor.status ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={() => handleView(vendor)}
                            className="text-blue-400 hover:text-blue-300 transition-colors duration-200 p-1"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(vendor)}
                            className="text-green-400 hover:text-green-300 transition-colors duration-200 p-1"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedVendor(vendor);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-400 hover:text-red-300 transition-colors duration-200 p-1"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {vendors.length === 0 && !loading && (
              <div className="text-center py-12">
                <Building className="mx-auto h-12 w-12 text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-300">No vendors found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating a new vendor'}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {vendors.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
          <div className="text-sm text-gray-400">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, vendors.length)} of {vendors.length} results
          </div>
          <div className="flex gap-1 sm:gap-2 flex-wrap justify-center">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => paginate(page)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Vendor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-700">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                {selectedVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-300 transition-colors duration-200"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Vendor Image
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover border-2 border-gray-600"
                      />
                    ) : (
                      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gray-700 border-2 border-dashed border-gray-600 flex items-center justify-center">
                        <User className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition-colors duration-200 text-sm">
                      <Upload className="w-4 h-4" />
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleInputChange}
                        className="hidden"
                      />
                    </label>
                    {errors.image && (
                      <p className="mt-1 text-xs text-red-400">{errors.image}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <User className="inline w-4 h-4 mr-1" />
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 text-sm ${
                    errors.name ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="Enter vendor name"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-400">{errors.name}</p>
                )}
              </div>

              {/* Shop Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Building className="inline w-4 h-4 mr-1" />
                  Shop Name *
                </label>
                <input
                  type="text"
                  name="shop_name"
                  value={formData.shop_name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 text-sm ${
                    errors.shop_name ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="Enter shop name"
                />
                {errors.shop_name && (
                  <p className="mt-1 text-xs text-red-400">{errors.shop_name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Mail className="inline w-4 h-4 mr-1" />
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 text-sm ${
                    errors.email ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Contact */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Phone className="inline w-4 h-4 mr-1" />
                  Contact
                </label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 text-sm ${
                    errors.contact ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="Enter contact number"
                />
                {errors.contact && (
                  <p className="mt-1 text-xs text-red-400">{errors.contact}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 text-sm"
                  placeholder="Enter address"
                />
              </div>

              {/* Status */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="status"
                    checked={formData.status === 1}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-300">Active Vendor</span>
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {selectedVendor ? 'Update' : 'Create'} Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-sm w-full p-4 sm:p-6">
            <div className="text-center">
              <Trash2 className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-red-500" />
              <h3 className="mt-3 text-lg font-medium text-white">Delete Vendor</h3>
              <p className="mt-2 text-sm text-gray-400">
                Are you sure you want to delete {selectedVendor?.name}? This action cannot be undone.
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendor;