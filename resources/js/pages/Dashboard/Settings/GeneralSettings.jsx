import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Building, Globe, Settings, Save, Upload,
    MapPin, Phone, Mail, DollarSign, Clock, Shield
} from 'lucide-react';

const GeneralSettings = () => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('company');

    // Mock Data
    const [formData, setFormData] = useState({
        company_name: 'Hybrid Alpha Corp',
        app_name: 'Hybrid Alpha CRP',
        contact_person: 'Admin User',
        address: '123 Tech Boulevard, Silicon Valley, CA',
        phone: '+1 (555) 123-4567',
        email: 'admin@hybridalpha.com',
        currency: 'USD',
        currency_symbol: '$',
        timezone: 'UTC',
        date_format: 'Y-m-d',
        logo: null
    });

    const tabs = [
        { id: 'company', label: 'Company Info', icon: Building },
        { id: 'localization', label: 'Localization', icon: Globe },
        { id: 'system', label: 'System Defaults', icon: Settings },
    ];

    const handleSave = (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            // Show checkmark or toast
        }, 1500);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-20">

            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
                            <Settings size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">General Settings</h1>
                            <p className="text-xs text-slate-500 font-medium">Manage global system configurations</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all disabled:opacity-70 active:scale-95"
                    >
                        {loading ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Save size={18} />}
                        <span>Save Changes</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="max-w-5xl mx-auto px-6 flex gap-8">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === tab.id
                                    ? 'text-indigo-600 border-indigo-600'
                                    : 'text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'company' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Logo Section */}
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
                                <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 border-2 border-dashed border-slate-300 dark:border-slate-700 relative group cursor-pointer overflow-hidden">
                                    {formData.logo ? <img src={formData.logo} className="w-full h-full object-cover" /> : <Upload className="text-slate-400 group-hover:text-indigo-500 transition-colors" size={32} />}
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium text-xs">Change Logo</div>
                                </div>
                                <h3 className="font-bold text-lg mb-1">Company Logo</h3>
                                <p className="text-xs text-slate-500 max-w-[200px]">Recommended 500x500px. PNG or JPG. Max 2MB.</p>
                            </div>

                            {/* Basic Info */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-500 ml-1">Company Name</label>
                                    <div className="relative">
                                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-500 ml-1">Contact Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-500 ml-1">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" />
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold uppercase text-slate-500 ml-1">Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-4 text-slate-400" size={18} />
                                    <textarea name="address" value={formData.address} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium h-24 resize-none" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'localization' && (
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-slate-500 ml-1">Currency Code</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input type="text" name="currency" value={formData.currency} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-slate-500 ml-1">Currency Symbol</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">S</span>
                                    <input type="text" name="currency_symbol" value={formData.currency_symbol} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-slate-500 ml-1">Timezone</label>
                                <div className="relative">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <select name="timezone" value={formData.timezone} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium appearance-none">
                                        <option value="UTC">UTC</option>
                                        <option value="Asia/Dhaka">Asia/Dhaka</option>
                                        <option value="America/New_York">America/New_York</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-slate-500 ml-1">Date Format</label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <select name="date_format" value={formData.date_format} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium appearance-none">
                                        <option value="Y-m-d">YYYY-MM-DD</option>
                                        <option value="d-m-Y">DD-MM-YYYY</option>
                                        <option value="m/d/Y">MM/DD/YYYY</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg"><Shield size={24} /></div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white">Debug Mode</h4>
                                        <p className="text-xs text-slate-500">Enable detailed error logging</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg"><Settings size={24} /></div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white">Maintenance Mode</h4>
                                        <p className="text-xs text-slate-500">Put system in maintenance for all users</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                                </label>
                            </div>
                        </div>
                    )}

                </motion.div>
            </div>

        </div>
    );
};

export default GeneralSettings;
