import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
    Plus,
    Edit,
    Trash2,
    Search,
    Filter,
    X,
    Check,
    AlertCircle,
    Loader2,
    Image as ImageIcon,
    Upload,
    Eye,
    Grid,
    List,
    RefreshCw,
    Download,
    UploadCloud,
    Shield,
    ShieldOff,
    Star,
    MoreVertical,
    ChevronDown,
    CheckCircle,
    XCircle,
    ImagePlus,
    Tag,
    BarChart3,
    Target,
    Settings
} from "lucide-react";


// Custom hook for debounce
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

// Image Preview Component
const ImagePreview = ({ images, onRemove, isEditing = false }) => {
    if (!images.length) return null;

    return (
        <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Selected Images ({images.length})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {images.map((preview, index) => (
                    <div
                        key={index}
                        className="relative group bg-gray-700 rounded-lg p-3 border border-gray-600 hover:border-gray-500 transition-colors"
                    >
                        <img
                            src={preview.preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-20 object-cover rounded-md"
                        />
                        <div className="mt-2 space-y-1">
                            <div className="text-xs text-gray-300 truncate">
                                {preview.name}
                            </div>
                            <div className="text-xs text-gray-500 flex justify-between">
                                <span>{preview.size}</span>
                                {preview.type && (
                                    <span className="text-gray-400">{preview.type}</span>
                                )}
                            </div>
                        </div>
                        {isEditing && (
                            <button
                                type="button"
                                onClick={() => onRemove(index)}
                                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-700 shadow-lg"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// Brand Card Component
const BrandCard = ({
    brand,
    onEdit,
    onDelete,
    onToggleStatus,
    onPreviewImage,
    isSelected,
    onSelect,
    actionLoading
}) => {
    return (
        <div
            className={`bg-gray-750 rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 ${
                isSelected
                    ? "border-blue-500 ring-4 ring-blue-500/20"
                    : "border-gray-700 hover:border-gray-600"
            }`}
        >
            {/* Selection Checkbox */}
            <div className="absolute top-4 left-4 z-20">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelect(brand.id)}
                    className="w-5 h-5 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer transform hover:scale-110 transition-transform"
                />
            </div>

            {/* Brand Image */}
            <div className="relative h-56 w-full bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                {brand.image_urls?.[0] ? (
                    <>
                        <img
                            src={brand.image_urls[0]}
                            alt={brand.name}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                            loading="lazy"
                        />
                        <div
                            className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center cursor-pointer"
                            onClick={() => onPreviewImage(brand.image_urls[0])}
                        >
                            <div className="opacity-0 hover:opacity-100 transform hover:scale-110 transition-all duration-300">
                                <Eye className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 group">
                        <ImageIcon className="w-12 h-12 mb-3 group-hover:scale-110 transition-transform" />
                        <span className="text-sm">No Image</span>
                    </div>
                )}

                {/* Status Badge */}
                <div
                    className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xl backdrop-blur-sm ${
                        brand.status
                            ? "bg-green-500/20 text-green-300 border border-green-500/30"
                            : "bg-red-500/20 text-red-300 border border-red-500/30"
                    }`}
                >
                    {brand.status ? (
                        <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Active
                        </div>
                    ) : (
                        <div className="flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Inactive
                        </div>
                    )}
                </div>

                {/* Image Count Badge */}
                {brand.image_urls?.length > 0 && (
                    <div className="absolute bottom-4 left-4 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full text-xs text-white flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        {brand.image_urls.length}
                    </div>
                )}
            </div>

            {/* Brand Info */}
            <div className="p-5">
                <h3 className="font-bold text-white text-lg mb-2 line-clamp-2 leading-tight flex items-center gap-2">
                    <Tag className="w-4 h-4 text-blue-400" />
                    {brand.name}
                </h3>

                <div className="text-gray-400 text-sm mb-4 space-y-1">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        <span>Created:</span>
                        <span className="text-gray-300">
                            {new Date(brand.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ImageIcon className="w-3 h-3" />
                        <span>Images:</span>
                        <span className="text-gray-300">{brand.image_urls?.length || 0}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                    <div className="flex gap-1">
                        <button
                            onClick={() => onEdit(brand)}
                            className="p-2.5 text-blue-400 hover:bg-blue-900/30 rounded-xl transition-all duration-200 hover:scale-105 group"
                            title="Edit Brand"
                        >
                            <Edit className="w-4 h-4 group-hover:scale-110" />
                        </button>
                        <button
                            onClick={() => onDelete(brand.id)}
                            disabled={actionLoading}
                            className="p-2.5 text-red-400 hover:bg-red-900/30 rounded-xl transition-all duration-200 hover:scale-105 group disabled:opacity-50"
                            title="Delete Brand"
                        >
                            <Trash2 className="w-4 h-4 group-hover:scale-110" />
                        </button>
                    </div>

                    <button
                        onClick={() => onToggleStatus(brand)}
                        disabled={actionLoading}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50 ${
                            brand.status
                                ? "bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30"
                                : "bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30"
                        }`}
                    >
                        {actionLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : brand.status ? (
                            <div className="flex items-center gap-2">
                                <ShieldOff className="w-3 h-3" />
                                Deactivate
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Shield className="w-3 h-3" />
                                Activate
                            </div>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Calendar Icon Component (since it's not in Lucide)
const Calendar = ({ className = "w-4 h-4" }) => (
    <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
    </svg>
);

// Main Brands Component
const Brands = () => {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [viewMode, setViewMode] = useState("grid");
    const [sortBy, setSortBy] = useState("newest");
    const [formData, setFormData] = useState({
        name: "",
        status: true,
    });
    const [imageFiles, setImageFiles] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedBrands, setSelectedBrands] = useState(new Set());
    const [bulkAction, setBulkAction] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const API_URL = "http://localhost:8000/api/brands";

    // Enhanced fetch with error handling
    const fetchBrands = useCallback(async (retryCount = 0) => {
        setLoading(true);
        setErrorMessage("");
        try {
            const response = await axios.get(API_URL);

            if (response.data.success) {
                setBrands(response.data.data || []);
                setSelectedBrands(new Set());
            } else {
                throw new Error("Failed to fetch brands");
            }
        } catch (error) {
            console.error("Error fetching brands:", error);

            if (retryCount < 3) {
                setTimeout(() => fetchBrands(retryCount + 1), 1000 * (retryCount + 1));
                return;
            }

            const errorMsg = error.response?.data?.message || error.message;
            setErrorMessage(`Unable to load brands: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBrands();
    }, [fetchBrands]);

    // Enhanced filtering and sorting
    const filteredAndSortedBrands = brands
        .filter((brand) => {
            const matchesSearch = brand.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
            const matchesStatus = statusFilter === "all" ||
                (statusFilter === "active" && brand.status) ||
                (statusFilter === "inactive" && !brand.status);
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "name":
                    return a.name.localeCompare(b.name);
                case "newest":
                    return new Date(b.created_at) - new Date(a.created_at);
                case "oldest":
                    return new Date(a.created_at) - new Date(b.created_at);
                case "active":
                    return (b.status === a.status) ? 0 : b.status ? -1 : 1;
                case "images":
                    return (b.image_urls?.length || 0) - (a.image_urls?.length || 0);
                default:
                    return 0;
            }
        });

    // Form handling
    const resetForm = () => {
        setFormData({ name: "", status: true });
        setImageFiles([]);
        setPreviewImages([]);
        setErrors({});
        setEditingBrand(null);
        setDragOver(false);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    // Enhanced image handling with drag & drop
    const handleImageUpload = (files) => {
        const validFiles = Array.from(files).filter((file) => {
            const isValidType = ["image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp"].includes(file.type);
            const isValidSize = file.size <= 5 * 1024 * 1024;

            if (!isValidType) {
                showNotification("Only JPEG, PNG, JPG, GIF, and WebP images are allowed", "error");
                return false;
            }
            if (!isValidSize) {
                showNotification("Image size must be less than 5MB", "error");
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        const newPreviews = validFiles.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
            name: file.name,
            size: (file.size / (1024 * 1024)).toFixed(2) + "MB",
            type: file.type.split('/')[1]?.toUpperCase()
        }));

        setPreviewImages(prev => [...prev, ...newPreviews]);
        setImageFiles(prev => [...prev, ...validFiles]);

        if (errors.image) {
            setErrors(prev => ({ ...prev, image: "" }));
        }
    };

    const handleFileSelect = (e) => {
        handleImageUpload(e.target.files);
        e.target.value = ""; // Reset input
    };

    const removeImage = (index) => {
        setPreviewImages(prev => {
            const newPreviews = [...prev];
            URL.revokeObjectURL(newPreviews[index].preview);
            newPreviews.splice(index, 1);
            return newPreviews;
        });
        setImageFiles(prev => {
            const newFiles = [...prev];
            newFiles.splice(index, 1);
            return newFiles;
        });
    };

    // Drag and drop handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleImageUpload(e.dataTransfer.files);
    };

    // Notification system
    const showNotification = (message, type = "success") => {
        if (type === "success") {
            setSuccessMessage(message);
        } else {
            setErrorMessage(message);
        }
    };

    // Enhanced form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage("");

        try {
            const submitData = new FormData();
            submitData.append("name", formData.name.trim());
            submitData.append("status", formData.status ? "1" : "0");

            imageFiles.forEach((file) => {
                submitData.append("image[]", file);
            });

            let response;
            if (editingBrand) {
                response = await axios.put(`${API_URL}/${editingBrand.id}`, submitData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            } else {
                response = await axios.post(API_URL, submitData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }

            if (response.data.success) {
                showNotification(
                    editingBrand ? "Brand updated successfully!" : "Brand created successfully!"
                );
                await fetchBrands();
                setShowModal(false);
                resetForm();
            } else {
                throw new Error(response.data.message || "Operation failed");
            }
        } catch (error) {
            console.error("Submit error:", error);

            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
                showNotification("Please check the form for errors", "error");
            } else {
                const errorMsg = error.response?.data?.message || "Operation failed! Please try again.";
                showNotification(errorMsg, "error");
            }
        } finally {
            setLoading(false);
        }
    };

    // Brand actions
    const handleEdit = (brand) => {
        setEditingBrand(brand);
        setFormData({
            name: brand.name,
            status: brand.status,
        });
        setPreviewImages(
            brand.image_urls
                ? brand.image_urls.map((url) => ({
                    preview: url,
                    name: "Existing image",
                    size: "Stored on server",
                    type: "EXISTING"
                }))
                : []
        );
        setImageFiles([]);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this brand? This action cannot be undone.")) {
            return;
        }

        setActionLoading(true);
        try {
            const response = await axios.delete(`${API_URL}/${id}`);
            if (response.data.success) {
                showNotification("Brand deleted successfully!");
                await fetchBrands();
            } else {
                throw new Error(response.data.message || "Delete failed");
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to delete brand!";
            showNotification(errorMsg, "error");
        } finally {
            setActionLoading(false);
        }
    };

    const toggleStatus = async (brand) => {
        setActionLoading(true);
        try {
            const newStatus = !brand.status;
            const response = await axios.put(
                `${API_URL}/${brand.id}`,
                {
                    name: brand.name,
                    status: newStatus,
                },
                { headers: { "Content-Type": "application/json" } }
            );

            if (response.data.success) {
                showNotification(`Brand ${newStatus ? "activated" : "deactivated"}!`);
                await fetchBrands();
            } else {
                throw new Error(response.data.message || "Status update failed");
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to update status!";
            showNotification(errorMsg, "error");
        } finally {
            setActionLoading(false);
        }
    };

    // Bulk operations
    const handleBulkAction = async () => {
        if (selectedBrands.size === 0 || !bulkAction) {
            showNotification("Please select brands and choose an action", "error");
            return;
        }

        setActionLoading(true);
        try {
            const brandIds = Array.from(selectedBrands);

            if (bulkAction === "delete") {
                if (!window.confirm(`Are you sure you want to delete ${brandIds.length} brand(s)? This cannot be undone.`)) {
                    return;
                }
            }

            const promises = brandIds.map(id => {
                if (bulkAction === "activate") {
                    return axios.put(`${API_URL}/${id}`, { status: true });
                } else if (bulkAction === "deactivate") {
                    return axios.put(`${API_URL}/${id}`, { status: false });
                } else if (bulkAction === "delete") {
                    return axios.delete(`${API_URL}/${id}`);
                }
            });

            await Promise.all(promises);
            showNotification(`${brandIds.length} brand(s) ${bulkAction}d successfully!`);
            await fetchBrands();
            setBulkAction("");
        } catch (error) {
            showNotification("Failed to perform bulk action", "error");
        } finally {
            setActionLoading(false);
        }
    };

    // Selection handlers
    const toggleSelectAll = () => {
        if (selectedBrands.size === filteredAndSortedBrands.length) {
            setSelectedBrands(new Set());
        } else {
            setSelectedBrands(new Set(filteredAndSortedBrands.map(brand => brand.id)));
        }
    };

    const toggleBrandSelection = (brandId) => {
        const newSelected = new Set(selectedBrands);
        if (newSelected.has(brandId)) {
            newSelected.delete(brandId);
        } else {
            newSelected.add(brandId);
        }
        setSelectedBrands(newSelected);
    };

    // Stats calculation
    const stats = {
        total: brands.length,
        active: brands.filter(b => b.status).length,
        inactive: brands.filter(b => !b.status).length,
        totalImages: brands.reduce((total, brand) => total + (brand.image_urls?.length || 0), 0),
        selected: selectedBrands.size
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 p-4 md:p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <Tag className="w-8 h-8 text-blue-400" />
                            Brand Management
                            {loading && <Loader2 className="w-5 h-5 animate-spin text-blue-400" />}
                        </h1>
                        <p className="text-gray-400 flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Manage your product brands and logos • {stats.total} total brands
                        </p>
                    </div>
                    <button
                        onClick={fetchBrands}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-xl font-medium flex items-center space-x-2 transition-all hover:scale-105"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Notifications */}
            <div className="space-y-3 mb-6">
                {errorMessage && (
                    <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-between animate-fade-in">
                        <div className="flex items-center space-x-3">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                            <span className="text-red-300">{errorMessage}</span>
                        </div>
                        <button
                            onClick={() => setErrorMessage("")}
                            className="p-1 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {successMessage && (
                    <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center justify-between animate-fade-in">
                        <div className="flex items-center space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="text-green-300">{successMessage}</span>
                        </div>
                        <button
                            onClick={() => setSuccessMessage("")}
                            className="p-1 hover:bg-green-500/20 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
                    <div className="text-2xl font-bold text-white flex items-center gap-2">
                        <Tag className="w-5 h-5 text-blue-400" />
                        {stats.total}
                    </div>
                    <div className="text-gray-400 flex items-center gap-2 mt-1">
                        <span>Total Brands</span>
                    </div>
                </div>
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
                    <div className="text-2xl font-bold text-green-400 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        {stats.active}
                    </div>
                    <div className="text-gray-400">Active Brands</div>
                </div>
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
                    <div className="text-2xl font-bold text-red-400 flex items-center gap-2">
                        <XCircle className="w-5 h-5" />
                        {stats.inactive}
                    </div>
                    <div className="text-gray-400">Inactive Brands</div>
                </div>
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
                    <div className="text-2xl font-bold text-blue-400 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        {stats.totalImages}
                    </div>
                    <div className="text-gray-400">Total Images</div>
                </div>
            </div>

            {/* Controls Section */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-700">
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                        <div className="relative flex-1 sm:flex-none">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search brands by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-80 pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                            />
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active Only</option>
                                <option value="inactive">Inactive Only</option>
                            </select>

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="name">Name A-Z</option>
                                <option value="active">Active First</option>
                                <option value="images">Most Images</option>
                            </select>
                        </div>
                    </div>

                    {/* View Controls and Add Button */}
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {/* View Mode Toggle */}
                        <div className="flex bg-gray-700 rounded-lg p-1 border border-gray-600">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`p-2 rounded-md transition-all ${
                                    viewMode === "grid"
                                        ? "bg-blue-600 text-white shadow-lg"
                                        : "text-gray-400 hover:text-white hover:bg-gray-600"
                                }`}
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`p-2 rounded-md transition-all ${
                                    viewMode === "list"
                                        ? "bg-blue-600 text-white shadow-lg"
                                        : "text-gray-400 hover:text-white hover:bg-gray-600"
                                }`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                resetForm();
                                setShowModal(true);
                            }}
                            className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all hover:scale-105 shadow-lg hover:shadow-blue-500/25"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Add New Brand</span>
                        </button>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedBrands.size > 0 && (
                    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="text-blue-300 font-medium flex items-center gap-2">
                                <Target className="w-4 h-4" />
                                {selectedBrands.size} brand(s) selected
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <select
                                    value={bulkAction}
                                    onChange={(e) => setBulkAction(e.target.value)}
                                    className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                >
                                    <option value="">Choose action...</option>
                                    <option value="activate">Activate Selected</option>
                                    <option value="deactivate">Deactivate Selected</option>
                                    <option value="delete">Delete Selected</option>
                                </select>
                                <button
                                    onClick={handleBulkAction}
                                    disabled={!bulkAction || actionLoading}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-medium flex items-center space-x-2 transition-colors"
                                >
                                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    <span>Apply Action</span>
                                </button>
                                <button
                                    onClick={() => setSelectedBrands(new Set())}
                                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                                >
                                    Clear Selection
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Brands Display */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                {/* Header with counts and select all */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="text-gray-400 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Showing {filteredAndSortedBrands.length} of {brands.length} brands
                        {debouncedSearchTerm && (
                            <span className="text-blue-400 ml-2 flex items-center gap-1">
                                <Search className="w-3 h-3" />
                                Searching for "{debouncedSearchTerm}"
                            </span>
                        )}
                    </div>
                    {filteredAndSortedBrands.length > 0 && (
                        <button
                            onClick={toggleSelectAll}
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium flex items-center gap-1"
                        >
                            {selectedBrands.size === filteredAndSortedBrands.length
                                ? <X className="w-3 h-3" />
                                : <Check className="w-3 h-3" />
                            }
                            {selectedBrands.size === filteredAndSortedBrands.length
                                ? "Deselect all"
                                : "Select all"
                            }
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="text-center">
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                            <p className="text-gray-400">Loading brands...</p>
                        </div>
                    </div>
                ) : filteredAndSortedBrands.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg mb-2 font-medium">
                            {brands.length === 0 ? "No brands available" : "No matching brands found"}
                        </p>
                        <p className="text-sm mb-6 max-w-md mx-auto">
                            {searchTerm || statusFilter !== "all"
                                ? "Try adjusting your search criteria or filters to find what you're looking for."
                                : "Get started by creating your first brand to build your product catalog."
                            }
                        </p>
                        {brands.length === 0 && (
                            <button
                                onClick={() => setShowModal(true)}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all hover:scale-105 flex items-center gap-2 mx-auto"
                            >
                                <Plus className="w-4 h-4" />
                                Create Your First Brand
                            </button>
                        )}
                    </div>
                ) : viewMode === "grid" ? (
                    // Grid View
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredAndSortedBrands.map((brand) => (
                            <BrandCard
                                key={brand.id}
                                brand={brand}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onToggleStatus={toggleStatus}
                                onPreviewImage={setImagePreview}
                                isSelected={selectedBrands.has(brand.id)}
                                onSelect={toggleBrandSelection}
                                actionLoading={actionLoading}
                            />
                        ))}
                    </div>
                ) : (
                    // List View
                    <div className="space-y-3">
                        {filteredAndSortedBrands.map((brand) => (
                            <div
                                key={brand.id}
                                className={`bg-gray-750 rounded-xl p-4 hover:shadow-lg transition-all duration-300 border-2 ${
                                    selectedBrands.has(brand.id)
                                        ? "border-blue-500 ring-4 ring-blue-500/20"
                                        : "border-gray-700 hover:border-gray-600"
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedBrands.has(brand.id)}
                                        onChange={() => toggleBrandSelection(brand.id)}
                                        className="w-5 h-5 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />

                                    <div
                                        className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden cursor-pointer flex-shrink-0"
                                        onClick={() => setImagePreview(brand.image_urls?.[0])}
                                    >
                                        {brand.image_urls?.[0] ? (
                                            <img
                                                src={brand.image_urls[0]}
                                                alt={brand.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <ImageIcon className="w-6 h-6" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-bold text-white text-lg truncate flex items-center gap-2">
                                                <Tag className="w-4 h-4 text-blue-400" />
                                                {brand.name}
                                            </h3>
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    brand.status
                                                        ? "bg-green-500/20 text-green-300"
                                                        : "bg-red-500/20 text-red-300"
                                                }`}
                                            >
                                                {brand.status ? "Active" : "Inactive"}
                                            </span>
                                        </div>
                                        <div className="text-gray-400 text-sm space-y-1">
                                            <div className="flex items-center gap-4">
                                                <span className="flex items-center gap-1">
                                                    <ImageIcon className="w-3 h-3" />
                                                    {brand.image_urls?.length || 0} images
                                                </span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    Created {new Date(brand.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEdit(brand)}
                                            className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(brand.id)}
                                            className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => toggleStatus(brand)}
                                            disabled={actionLoading}
                                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                                brand.status
                                                    ? "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                                                    : "bg-green-500/20 text-green-300 hover:bg-green-500/30"
                                            }`}
                                        >
                                            {actionLoading ? "..." : brand.status ? "Deactivate" : "Activate"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Enhanced Brand Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
                        <div className="flex justify-between items-center p-6 border-b border-gray-700 sticky top-0 bg-gray-800 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                {editingBrand ? (
                                    <>
                                        <Edit className="w-5 h-5 text-blue-400" />
                                        Edit Brand
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5 text-green-400" />
                                        Add New Brand
                                    </>
                                )}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    resetForm();
                                }}
                                className="p-2 hover:bg-gray-700 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Brand Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                                    <Tag className="w-4 h-4" />
                                    Brand Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 bg-gray-700 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all ${
                                        errors.name
                                            ? "border-red-500 ring-2 ring-red-500/20"
                                            : "border-gray-600"
                                    }`}
                                    placeholder="Enter brand name (e.g., Nike, Apple, Samsung)"
                                />
                                {errors.name && (
                                    <p className="mt-2 text-sm text-red-400 flex items-center space-x-2">
                                        <AlertCircle className="w-4 h-4" />
                                        <span>{errors.name[0]}</span>
                                    </p>
                                )}
                            </div>

                            {/* Enhanced Image Upload with Drag & Drop */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" />
                                    Brand Images {!editingBrand && "(Optional)"}
                                </label>
                                <div
                                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                                        dragOver
                                            ? "border-blue-500 bg-blue-500/10"
                                            : "border-gray-600 hover:border-gray-500 bg-gray-700/50"
                                    }`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        id="image-upload"
                                    />
                                    <label
                                        htmlFor="image-upload"
                                        className="cursor-pointer flex flex-col items-center space-y-4"
                                    >
                                        <div className="p-4 bg-gray-600 rounded-full">
                                            <UploadCloud className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-gray-300 font-medium block">
                                                Click to upload or drag and drop
                                            </span>
                                            <span className="text-gray-500 text-sm block">
                                                PNG, JPG, JPEG, GIF, WebP • Max 5MB per image
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                        >
                                            <Upload className="w-4 h-4" />
                                            Choose Files
                                        </button>
                                    </label>
                                </div>
                                {errors.image && (
                                    <p className="mt-2 text-sm text-red-400 flex items-center space-x-2">
                                        <AlertCircle className="w-4 h-4" />
                                        <span>{errors.image[0]}</span>
                                    </p>
                                )}

                                {/* Image Previews */}
                                <ImagePreview
                                    images={previewImages}
                                    onRemove={removeImage}
                                    isEditing={!!editingBrand}
                                />
                            </div>

                            {/* Status Toggle */}
                            <div className="flex items-center justify-between p-4 bg-gray-750 rounded-xl border border-gray-600">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-3 h-3 rounded-full ${formData.status ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <div>
                                        <label htmlFor="status" className="text-sm font-medium text-gray-300 cursor-pointer">
                                            Brand Status
                                        </label>
                                        <p className="text-xs text-gray-500">
                                            {formData.status ? "Brand is visible to customers" : "Brand is hidden from customers"}
                                        </p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="status"
                                        id="status"
                                        checked={formData.status}
                                        onChange={handleInputChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex space-x-3 pt-6 border-t border-gray-700">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-800 disabled:to-blue-900 text-white rounded-xl font-semibold transition-all hover:scale-105 flex items-center justify-center space-x-2 shadow-lg"
                                >
                                    {loading && (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    )}
                                    <span>
                                        {loading
                                            ? editingBrand
                                                ? "Updating..."
                                                : "Creating..."
                                            : editingBrand
                                            ? "Update Brand"
                                            : "Create Brand"}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Enhanced Image Preview Modal */}
            {imagePreview && (
                <div
                    className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
                    onClick={() => setImagePreview(null)}
                >
                    <div className="relative max-w-4xl max-h-full">
                        <button
                            onClick={() => setImagePreview(null)}
                            className="absolute -top-12 right-0 p-3 text-white hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <img
                            src={imagePreview}
                            alt="Brand Preview"
                            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Brands;
