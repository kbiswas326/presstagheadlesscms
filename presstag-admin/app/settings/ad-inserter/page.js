'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Code, Layout, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-hot-toast';

export default function AdInserterPage() {
  const { isDark } = useTheme();
  const [ads, setAds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    position: 'article_middle',
    isActive: true,
    priority: 10,
    displayConditions: {
        devices: ['desktop', 'tablet', 'mobile'],
        pageTypes: ['home', 'post', 'page', 'category', 'tag', 'author', 'search'],
        insertionParameter: 1
    }
  });

  const positions = [
    { value: 'header_top', label: 'Before Header' },
    { value: 'header_inside', label: 'Inside Header' },
    { value: 'header_bottom', label: 'After Header' },
    { value: 'footer_top', label: 'Before Footer' },
    { value: 'footer_bottom', label: 'After Footer' },
    { value: 'article_top', label: 'Before Article Content' },
    { value: 'article_middle', label: 'Middle of Article Content' },
    { value: 'article_bottom', label: 'After Article Content' },
    { value: 'article_paragraph', label: 'After Paragraph' },
    { value: 'article_image', label: 'After Image' },
    { value: 'sidebar_top', label: 'Sidebar Top' },
    { value: 'sidebar_bottom', label: 'Sidebar Bottom' },
    { value: 'custom_hook', label: 'Custom Hook' }
  ];

  const deviceOptions = [
      { id: 'desktop', label: 'Desktop' },
      { id: 'tablet', label: 'Tablet' },
      { id: 'mobile', label: 'Mobile' }
  ];

  const pageTypeOptions = [
      { id: 'home', label: 'Homepage' },
      { id: 'post', label: 'Posts' },
      { id: 'page', label: 'Static Pages' },
      { id: 'category', label: 'Categories' },
      { id: 'tag', label: 'Tags' },
      { id: 'author', label: 'Author Pages' },
      { id: 'search', label: 'Search Results' }
  ];

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/ad-blocks`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAds(data);
      } else {
          // toast.error('Failed to load ad blocks');
          console.error('Failed to load ad blocks');
      }
    } catch (error) {
      console.error(error);
      // toast.error('Error connecting to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const url = editingAd 
        ? `${apiUrl}/api/ad-blocks/${editingAd._id}`
        : `${apiUrl}/api/ad-blocks`;
      
      const method = editingAd ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success(`Ad block ${editingAd ? 'updated' : 'created'} successfully`);
        setIsModalOpen(false);
        setEditingAd(null);
        setFormData({
            name: '',
            code: '',
            position: 'article_middle',
            isActive: true,
            priority: 10,
            displayConditions: {
                devices: ['desktop', 'tablet', 'mobile'],
                pageTypes: ['home', 'post', 'page', 'category', 'tag', 'author', 'search'],
                insertionParameter: 1
            }
        });
        fetchAds();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Operation failed');
      }
    } catch (error) {
      toast.error('Error saving ad block');
    }
  };

  const handleEdit = (ad) => {
    setEditingAd(ad);
    setFormData({
      name: ad.name,
      code: ad.code,
      position: ad.position,
      isActive: ad.isActive,
      priority: ad.priority,
      displayConditions: {
          devices: ad.displayConditions?.devices || ['desktop', 'tablet', 'mobile'],
          pageTypes: ad.displayConditions?.pageTypes || ['home', 'post', 'page', 'category', 'tag', 'author', 'search'],
          insertionParameter: ad.displayConditions?.insertionParameter || 1
      }
    });
    setIsModalOpen(true);
  };

  const handleDeviceToggle = (deviceId) => {
    setFormData(prev => {
        const current = prev.displayConditions.devices;
        const updated = current.includes(deviceId) 
            ? current.filter(d => d !== deviceId)
            : [...current, deviceId];
        return {
            ...prev,
            displayConditions: {
                ...prev.displayConditions,
                devices: updated
            }
        };
    });
  };

  const handlePageTypeToggle = (typeId) => {
    setFormData(prev => {
        const current = prev.displayConditions.pageTypes;
        const updated = current.includes(typeId) 
            ? current.filter(t => t !== typeId)
            : [...current, typeId];
        return {
            ...prev,
            displayConditions: {
                ...prev.displayConditions,
                pageTypes: updated
            }
        };
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this ad block?')) return;
    try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/ad-blocks/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            toast.success('Ad block deleted');
            fetchAds();
        } else {
            toast.error('Failed to delete');
        }
    } catch (error) {
        toast.error('Error deleting ad block');
    }
  };

  const toggleStatus = async (ad) => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/ad-blocks/${ad._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ isActive: !ad.isActive })
        });
        if (res.ok) {
            fetchAds();
            toast.success('Status updated');
        }
      } catch (error) {
          toast.error('Failed to update status');
      }
  };

  // Styles
  const cardClass = `p-6 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`;
  const inputClass = `w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:ring-2 focus:ring-blue-500 outline-none transition-all`;
  const labelClass = `block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const btnClass = "px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2";

  return (
    <div className={`min-h-screen p-8 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ad Inserter</h1>
            <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage ad codes and injections across your website
            </p>
          </div>
          <button 
            onClick={() => {
                setEditingAd(null);
                setFormData({
                    name: '',
                    code: '',
                    position: 'article_middle',
                    isActive: true,
                    priority: 10,
                    displayConditions: {
                        devices: ['desktop', 'tablet', 'mobile'],
                        pageTypes: ['home', 'post', 'page', 'category', 'tag', 'author', 'search'],
                        insertionParameter: 1
                    }
                });
                setIsModalOpen(true);
            }}
            className={`${btnClass} bg-blue-600 text-white hover:bg-blue-700`}
          >
            <Plus size={20} />
            New Ad Block
          </button>
        </div>

        {isLoading ? (
            <div className="text-center py-10">Loading...</div>
        ) : (
            <div className="grid gap-4">
                {ads.map(ad => (
                    <div key={ad._id} className={cardClass + " flex items-center justify-between"}>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-semibold text-lg">{ad.name}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${ad.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                    {ad.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1"><Layout size={14} /> {positions.find(p => p.value === ad.position)?.label || ad.position}</span>
                                <span className="flex items-center gap-1"><Code size={14} /> Priority: {ad.priority}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => toggleStatus(ad)} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} title="Toggle Status">
                                {ad.isActive ? <Check className="text-green-500" size={20} /> : <X className="text-gray-400" size={20} />}
                            </button>
                            <button onClick={() => handleEdit(ad)} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} title="Edit">
                                <Edit2 size={20} className="text-blue-500" />
                            </button>
                            <button onClick={() => handleDelete(ad._id)} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} title="Delete">
                                <Trash2 size={20} className="text-red-500" />
                            </button>
                        </div>
                    </div>
                ))}
                {ads.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No ad blocks found. Create one to get started.
                    </div>
                )}
            </div>
        )}

        {/* Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className={`w-full max-w-2xl rounded-2xl shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} max-h-[90vh] overflow-y-auto`}>
                    <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'} flex justify-between items-center sticky top-0 ${isDark ? 'bg-gray-800' : 'bg-white'} z-10`}>
                        <h2 className="text-xl font-bold">{editingAd ? 'Edit Ad Block' : 'New Ad Block'}</h2>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className={labelClass}>Name</label>
                                    <input 
                                        type="text" 
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        className={inputClass}
                                        placeholder="e.g. Homepage Header"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className={labelClass}>Position</label>
                                    <select 
                                        value={formData.position}
                                        onChange={e => setFormData({...formData, position: e.target.value})}
                                        className={inputClass}
                                    >
                                        {positions.map(p => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className={labelClass}>Priority (Higher = Displayed First)</label>
                                    <input 
                                        type="number" 
                                        value={formData.priority}
                                        onChange={e => setFormData({...formData, priority: e.target.value})}
                                        className={inputClass}
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className={labelClass}>Ad Code (HTML/JS)</label>
                                    <textarea 
                                        value={formData.code}
                                        onChange={e => setFormData({...formData, code: e.target.value})}
                                        className={`${inputClass} font-mono text-sm`}
                                        rows={8}
                                        placeholder="<script>...</script>"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-700/30' : 'border-gray-100 bg-gray-50'}`}>
                            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-gray-500">Display Conditions</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold mb-2 block">Devices</label>
                                    <div className="flex flex-wrap gap-2">
                                        {deviceOptions.map(device => (
                                            <button
                                                key={device.id}
                                                type="button"
                                                onClick={() => handleDeviceToggle(device.id)}
                                                className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                                                    formData.displayConditions.devices.includes(device.id)
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : isDark ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-700'
                                                }`}
                                            >
                                                {device.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold mb-2 block">Page Types</label>
                                    <div className="flex flex-wrap gap-2">
                                        {pageTypeOptions.map(type => (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() => handlePageTypeToggle(type.id)}
                                                className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                                                    formData.displayConditions.pageTypes.includes(type.id)
                                                        ? 'bg-purple-600 text-white border-purple-600'
                                                        : isDark ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-700'
                                                }`}
                                            >
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {(formData.position === 'article_paragraph' || formData.position === 'article_image') && (
                                    <div>
                                        <label className={labelClass}>Insertion Parameter (Paragraph/Image Number)</label>
                                        <input 
                                            type="number" 
                                            value={formData.displayConditions.insertionParameter}
                                            onChange={e => setFormData({
                                                ...formData, 
                                                displayConditions: {
                                                    ...formData.displayConditions,
                                                    insertionParameter: e.target.value
                                                }
                                            })}
                                            className={inputClass}
                                            min="1"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Example: 1 = After 1st paragraph/image.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button 
                                type="button" 
                                onClick={() => setIsModalOpen(false)}
                                className={`px-5 py-2.5 rounded-lg font-medium ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="px-5 py-2.5 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
                            >
                                <Save size={18} />
                                Save Ad Block
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
