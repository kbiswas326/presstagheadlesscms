/// This is the main customization page for the admin panel. It allows admins to configure various aspects of the website's layout and appearance, including the navbar, homepage sections, sidebar widgets, footer content, and overall branding (logo, colors, etc.). The page is organized into tabs for each major section, and provides a live preview of changes as they are made. Settings are saved to the backend via API calls, and loaded on page load to ensure persistence.
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Trash2, X, Upload, Eye, EyeOff, Save, RotateCcw, Check, Layout, Menu, Globe, columns, Columns, Link as LinkIcon, Info, Mail, Edit2, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-hot-toast';

const navbarItems = ['Home', 'About', 'Blog', 'News', 'Events', 'Contact', 'Gallery', 'Services'];
const sidebarSections = ['Recent Posts', 'Popular Tags', 'Categories', 'Newsletter', 'Social Media', 'Ads', 'About Widget'];
const footerSections = ['Quick Links', 'Company Info', 'Social Media', 'Contact Info'];

export default function CustomizationPage() {
  const { isDark } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const [settings, setSettings] = useState({
    navbar: {
      items: [
        { label: 'Home', slug: '/' },
        { label: 'Cricket', slug: '/category/cricket' },
        { label: 'Football', slug: '/category/football' },
        { label: 'More', slug: '/category/more' }
      ],
      showSearch: true,
      showAuth: true,
    },
    homepage: {
      sections: [
        { id: 'latest', type: 'system', name: 'Latest Articles', enabled: true, order: 1 },
        { id: 'trending', type: 'system', name: 'Trending Now', enabled: true, order: 2 },
        { id: 'custom1', type: 'custom', name: 'Custom Section 1', sourceType: 'category', sourceValue: '', enabled: true, order: 3 },
      ]
    },
    sidebar: {
      widgets: [
         { type: 'trending', title: 'Trending Now', limit: 5 },
         { type: 'newsletter', title: 'Subscribe to our Newsletter' },
         { type: 'social_links', title: 'Follow Us' }
      ],
      sections: [] // Keeping for backward compatibility if needed, but 'widgets' is the new standard
    },
    footer: {
      sections: ['Quick Links', 'Company Info', 'Social Media', 'Contact Info'],
      companyDescription: '',
      contactAddress: '',
      contactEmail: '',
      contactPhone: '',
      quickLinks: [
        { text: "About Us", href: "/about-us" },
        { text: "Contact", href: "/contact" }
      ]
    },
    seo: {
  postUrlStructure: '/{category}/{slug}',   // for articles
  pageUrlStructure: '/{slug}',              // for pages

  categoryPrefix: 'category',
  tagPrefix: 'tag',

  metaTitleTemplate: '{title} | {site}',
  metaDescriptionTemplate: 'Read {title} on {site}',
},
    branding: {
      logo: '/images/logo.png',
      primaryColor: '#185EFD',
      siteTitle: 'SportzPoint',
      siteTagline: '',
      logoDisplayMode: 'both', // 'both', 'logo', 'text'
      logoFile: null,
    }
  });

  const [activeTab, setActiveTab] = useState('branding');

  useEffect(() => {
    // Load settings from backend
    const loadSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/layout-config`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          
          // Helper to ensure array
          const ensureArray = (val, defaultVal = []) => Array.isArray(val) ? val : defaultVal;

          setSettings(prev => ({
            ...prev,
            ...data,
            navbar: { 
                ...prev.navbar, 
                ...data.navbar,
                items: Array.isArray(data.navbar) ? data.navbar : (data.navbar?.items || prev.navbar.items)
            },
            homepage: {
                ...prev.homepage,
                sections: ensureArray(data.homepage?.sections, prev.homepage.sections)
            },
            sidebar: { 
                ...prev.sidebar, 
                ...data.sidebar,
                widgets: ensureArray(data.sidebar?.widgets, prev.sidebar.widgets)
            },
            footer: { 
                ...prev.footer, 
                ...data.footer,
                quickLinks: ensureArray(data.footer?.quickLinks, data.footer?.quickLinks || prev.footer.quickLinks)
            },
            branding: { ...prev.branding, ...data.branding }
          }));
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        toast.error('Failed to load settings');
      }
    };
    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/layout-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast.success('Settings saved successfully!');
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      toast.error('Failed to save settings');
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSettings(prev => ({
          ...prev,
          branding: {
            ...prev.branding,
            logo: event.target?.result,
            logoFile: file 
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- HOMEPAGE LOGIC ---
  const addHomepageSection = () => {
    setSettings(prev => ({
      ...prev,
      homepage: {
        ...prev.homepage,
        sections: [
          ...prev.homepage.sections,
          { 
            id: `custom_${Date.now()}`, 
            type: 'custom', 
            name: 'New Section', 
            sourceType: 'category', 
            sourceValue: '', 
            enabled: true, 
            order: prev.homepage.sections.length + 1 
          }
        ]
      }
    }));
  };

  const removeHomepageSection = (index) => {
    const newSections = settings.homepage.sections.filter((_, i) => i !== index);
    setSettings(prev => ({
      ...prev,
      homepage: { ...prev.homepage, sections: newSections }
    }));
  };

  const updateHomepageSection = (index, field, value) => {
    const newSections = [...settings.homepage.sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setSettings(prev => ({
      ...prev,
      homepage: { ...prev.homepage, sections: newSections }
    }));
  };

  const moveHomepageSection = (index, direction) => {
    const newSections = [...settings.homepage.sections];
    if (direction === 'up' && index > 0) {
      [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
    } else if (direction === 'down' && index < newSections.length - 1) {
      [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    }
    // Reassign order
    newSections.forEach((s, i) => s.order = i + 1);
    setSettings(prev => ({
        ...prev,
        homepage: { ...prev.homepage, sections: newSections }
    }));
  };

  // --- NAVBAR LOGIC ---
  const addNavbarItem = () => {
    setSettings(prev => ({
      ...prev,
      navbar: {
        ...prev.navbar,
        items: [...prev.navbar.items, { label: 'New Item', slug: '/' }]
      }
    }));
  };

  const removeNavbarItem = (index) => {
    const newItems = settings.navbar.items.filter((_, i) => i !== index);
    setSettings(prev => ({
      ...prev,
      navbar: { ...prev.navbar, items: newItems }
    }));
  };

  const updateNavbarItem = (index, field, value) => {
    const newItems = [...settings.navbar.items];
    if (typeof newItems[index] === 'string') {
        newItems[index] = { label: newItems[index], slug: `/${newItems[index].toLowerCase()}` };
    }
    newItems[index] = { ...newItems[index], [field]: value };
    setSettings(prev => ({
      ...prev,
      navbar: { ...prev.navbar, items: newItems }
    }));
  };

  const moveNavbarItem = (index, direction) => {
    const newItems = [...settings.navbar.items];
    if (direction === 'up' && index > 0) {
      [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
    } else if (direction === 'down' && index < newItems.length - 1) {
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    }
    setSettings(prev => ({
      ...prev,
      navbar: { ...prev.navbar, items: newItems }
    }));
  };

  // --- SIDEBAR LOGIC ---
  const addSidebarWidget = () => {
      setSettings(prev => ({
          ...prev,
          sidebar: {
              ...prev.sidebar,
              widgets: [...(prev.sidebar.widgets || []), { type: 'trending', title: 'New Widget', limit: 5 }]
          }
      }));
  };

  const updateSidebarWidget = (index, field, value) => {
      const newWidgets = [...(settings.sidebar.widgets || [])];
      newWidgets[index] = { ...newWidgets[index], [field]: value };
      setSettings(prev => ({
          ...prev,
          sidebar: { ...prev.sidebar, widgets: newWidgets }
      }));
  };

  const removeSidebarWidget = (index) => {
      const newWidgets = (settings.sidebar.widgets || []).filter((_, i) => i !== index);
      setSettings(prev => ({
          ...prev,
          sidebar: { ...prev.sidebar, widgets: newWidgets }
      }));
  };

  const moveSidebarWidget = (index, direction) => {
      const newWidgets = [...(settings.sidebar.widgets || [])];
      if (direction === 'up' && index > 0) {
          [newWidgets[index], newWidgets[index - 1]] = [newWidgets[index - 1], newWidgets[index]];
      } else if (direction === 'down' && index < newWidgets.length - 1) {
          [newWidgets[index], newWidgets[index + 1]] = [newWidgets[index + 1], newWidgets[index]];
      }
      setSettings(prev => ({
          ...prev,
          sidebar: { ...prev.sidebar, widgets: newWidgets }
      }));
  };

  // Social Links Logic inside Sidebar Widget
  const addSocialLink = (widgetIndex) => {
      const newWidgets = [...(settings.sidebar.widgets || [])];
      const currentLinks = newWidgets[widgetIndex].socialLinks || [];
      newWidgets[widgetIndex].socialLinks = [...currentLinks, { platform: 'facebook', url: 'https://' }];
      setSettings(prev => ({
          ...prev,
          sidebar: { ...prev.sidebar, widgets: newWidgets }
      }));
  };

  const removeSocialLink = (widgetIndex, linkIndex) => {
      const newWidgets = [...(settings.sidebar.widgets || [])];
      const currentLinks = newWidgets[widgetIndex].socialLinks || [];
      newWidgets[widgetIndex].socialLinks = currentLinks.filter((_, i) => i !== linkIndex);
      setSettings(prev => ({
          ...prev,
          sidebar: { ...prev.sidebar, widgets: newWidgets }
      }));
  };

  const updateSocialLink = (widgetIndex, linkIndex, field, value) => {
      const newWidgets = [...(settings.sidebar.widgets || [])];
      const currentLinks = [...(newWidgets[widgetIndex].socialLinks || [])];
      currentLinks[linkIndex] = { ...currentLinks[linkIndex], [field]: value };
      newWidgets[widgetIndex].socialLinks = currentLinks;
      setSettings(prev => ({
          ...prev,
          sidebar: { ...prev.sidebar, widgets: newWidgets }
      }));
  };

  const toggleFooterSection = (section) => {
    setSettings(prev => ({
      ...prev,
      footer: {
        ...prev.footer,
        sections: prev.footer.sections.includes(section)
          ? prev.footer.sections.filter(s => s !== section)
          : [...prev.footer.sections, section]
      }
    }));
  };

  // --- FOOTER QUICK LINKS LOGIC ---
  const addQuickLink = () => {
    setSettings(prev => ({
      ...prev,
      footer: {
        ...prev.footer,
        quickLinks: [
          ...(prev.footer.quickLinks || []),
          { text: 'New Link', href: '/' }
        ]
      }
    }));
  };

  const removeQuickLink = (index) => {
    const newLinks = (settings.footer.quickLinks || []).filter((_, i) => i !== index);
    setSettings(prev => ({
      ...prev,
      footer: { ...prev.footer, quickLinks: newLinks }
    }));
  };

  const updateQuickLink = (index, field, value) => {
    const newLinks = [...(settings.footer.quickLinks || [])];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setSettings(prev => ({
      ...prev,
      footer: { ...prev.footer, quickLinks: newLinks }
    }));
  };

  const panel = `backdrop-blur-sm rounded-2xl shadow-sm transition-all duration-200 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`;
  const sectionTitle = `text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`;
  const label = `text-sm font-medium mb-1 block ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const inputClass = `w-full px-4 py-2 rounded-lg border outline-none transition-all ${
    isDark 
      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
      : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
  }`;
  const selectClass = `w-full px-4 py-2 rounded-lg border outline-none transition-all appearance-none ${
    isDark 
      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
      : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
  }`;
  const checkboxClass = `w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer`;

  const tabs = [
  { id: 'branding', label: 'Branding', icon: <Layout size={18} /> },
  { id: 'navbar', label: 'Navigation', icon: <Menu size={18} /> },
  { id: 'homepage', label: 'Homepage', icon: <Globe size={18} /> },
  { id: 'sidebar', label: 'Sidebar', icon: <Columns size={18} /> },
  { id: 'footer', label: 'Footer', icon: <LinkIcon size={18} /> },
  { id: 'seo', label: 'SEO & URLs', icon: <Globe size={18} /> },
];

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDark ? "bg-gray-900" : "bg-gray-50"} p-6`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 p-6 ${panel}`}>
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Website Customization</h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Manage your website's layout, branding, and appearance</p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white transition-all shadow-lg hover:shadow-xl active:scale-95 ${
            isSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSaving ? (
            <RotateCcw className="animate-spin" size={20} />
          ) : (
            <Save size={20} />
          )}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-3">
          <div className={`${panel} p-4 sticky top-6`}>
            <nav className="flex flex-col gap-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : isDark 
                        ? 'text-gray-300 hover:bg-gray-700' 
                        : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.icon}
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* Branding Section */}
          {activeTab === 'branding' && (
            <div className={`${panel} p-6`}>
              <h2 className={sectionTitle}><Layout size={20} /> Branding & Identity</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={label}>Site Title</label>
                    <input 
                      type="text" 
                      value={settings.branding.siteTitle || ''} 
                      onChange={(e) => setSettings(prev => ({ ...prev, branding: { ...prev.branding, siteTitle: e.target.value } }))}
                      className={inputClass} 
                      placeholder="e.g. SportzPoint"
                    />
                  </div>
                  <div>
                    <label className={label}>Primary Color</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={settings.branding.primaryColor} 
                        onChange={(e) => setSettings(prev => ({ ...prev, branding: { ...prev.branding, primaryColor: e.target.value } }))}
                        className="h-10 w-20 rounded cursor-pointer border-0 p-0" 
                      />
                      <input 
                        type="text" 
                        value={settings.branding.primaryColor} 
                        onChange={(e) => setSettings(prev => ({ ...prev, branding: { ...prev.branding, primaryColor: e.target.value } }))}
                        className={inputClass} 
                      />
                    </div>
                  <div>
                    <label className={label}>Site Tagline (Optional)</label>
                    <input 
                      type="text" 
                      value={settings.branding.siteTagline || ''} 
                      onChange={(e) => setSettings(prev => ({ ...prev, branding: { ...prev.branding, siteTagline: e.target.value } }))}
                      className={inputClass} 
                      placeholder="e.g. Latest Sports News"
                    />
                  </div>
                </div>

                <div>
                  <label className={label}>Navbar Display Mode</label>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {[
                        { id: 'both', label: 'Logo & Text' },
                        { id: 'logo', label: 'Logo Only' },
                        { id: 'text', label: 'Text Only' }
                    ].map(mode => (
                        <label key={mode.id} className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="radio" 
                                name="logoDisplayMode"
                                checked={(settings.branding.logoDisplayMode || 'both') === mode.id}
                                onChange={() => setSettings(prev => ({ ...prev, branding: { ...prev.branding, logoDisplayMode: mode.id } }))}
                                className={checkboxClass}
                            />
                            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{mode.label}</span>
                        </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={label}>Logo</label>
                  <div className={`mt-2 p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-4 transition-colors ${
                    isDark ? 'border-gray-600 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'
                  }`}>
                    {settings.branding.logo ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative group p-2 border rounded bg-white/5">
                            <img src={settings.branding.logo} alt="Logo" className="h-24 object-contain" />
                        </div>
                        <div className="flex gap-2 items-center flex-col">
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Change Logo
                            </button>
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Recommended size: 200x80px (PNG)
                            </span>
                        </div>
                            <button 
                              onClick={() => setSettings(prev => ({ ...prev, branding: { ...prev.branding, logo: null, logoFile: null } }))}
                              className="px-4 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 text-sm rounded-lg hover:bg-red-500/20 transition-colors"
                            >
                              Remove
                            </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          <button onClick={() => fileInputRef.current?.click()} className="text-blue-500 font-medium hover:underline">Upload a file</button> or drag and drop
                        </p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleLogoUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      Recommended size: Height 40px-60px. Supports PNG (transparent), JPG, SVG.
                  </p>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Navbar Section */}
          {activeTab === 'navbar' && (
            <div className={`${panel} p-6`}>
              <div className="flex items-center justify-between mb-4">
                  <h2 className={sectionTitle}><Menu size={20} /> Navigation Bar</h2>
                  <button 
                    onClick={addNavbarItem}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                  >
                    <Plus size={16} /> Add Item
                  </button>
              </div>
              
              <div className="space-y-6">
                <div className="flex flex-wrap gap-6 mb-6">
                  <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                    <input 
                      type="checkbox" 
                      checked={settings.navbar.showSearch} 
                      onChange={() => setSettings(prev => ({ ...prev, navbar: { ...prev.navbar, showSearch: !prev.navbar.showSearch } }))}
                      className={checkboxClass} 
                    />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Show Search Bar</span>
                  </label>
                  <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                    <input 
                      type="checkbox" 
                      checked={settings.navbar.showAuth} 
                      onChange={() => setSettings(prev => ({ ...prev, navbar: { ...prev.navbar, showAuth: !prev.navbar.showAuth } }))}
                      className={checkboxClass} 
                    />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Show Login/Signup</span>
                  </label>
                </div>

                <div className="space-y-3">
                  <label className={label}>Menu Items</label>
                  {settings.navbar.items.map((item, index) => {
                      const itemLabel = typeof item === 'string' ? item : item.label;
                      const itemSlug = typeof item === 'string' ? `/${item.toLowerCase()}` : item.slug;

                      return (
                        <div key={index} className={`flex items-center gap-4 p-3 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                            <div className="flex flex-col gap-1">
                                <button onClick={() => moveNavbarItem(index, 'up')} disabled={index === 0} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ArrowUp size={14} /></button>
                                <button onClick={() => moveNavbarItem(index, 'down')} disabled={index === settings.navbar.items.length - 1} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ArrowDown size={14} /></button>
                            </div>
                            <div className="flex-1 grid grid-cols-2 gap-4">
                                <input 
                                    type="text" 
                                    value={itemLabel} 
                                    onChange={(e) => updateNavbarItem(index, 'label', e.target.value)}
                                    placeholder="Label"
                                    className={inputClass}
                                />
                                <input 
                                    type="text" 
                                    value={itemSlug} 
                                    onChange={(e) => updateNavbarItem(index, 'slug', e.target.value)}
                                    placeholder="URL Slug (e.g. /category/cricket)"
                                    className={inputClass}
                                />
                            </div>
                            <button 
                                onClick={() => removeNavbarItem(index)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                      );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Homepage Section */}
          {activeTab === 'homepage' && (
            <div className={`${panel} p-6`}>
              <div className="flex items-center justify-between mb-4">
                  <h2 className={sectionTitle}><Globe size={20} /> Homepage Layout</h2>
                  <button 
                    onClick={addHomepageSection}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                  >
                    <Plus size={16} /> Add Section
                  </button>
              </div>
              
              <div className="space-y-4">
                {settings.homepage.sections?.map((section, index) => (
                  <div 
                    key={section.id || index}
                    className={`p-4 rounded-xl border transition-all ${
                      section.enabled
                        ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                        : isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                            <button onClick={() => moveHomepageSection(index, 'up')} disabled={index === 0} className="p-1 hover:bg-blue-200 rounded disabled:opacity-30"><ArrowUp size={14} /></button>
                            <button onClick={() => moveHomepageSection(index, 'down')} disabled={index === settings.homepage.sections.length - 1} className="p-1 hover:bg-blue-200 rounded disabled:opacity-30"><ArrowDown size={14} /></button>
                        </div>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          section.enabled ? 'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300' : 'bg-gray-100 text-gray-400 dark:bg-gray-700'
                        }`}>
                          <span className="font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{section.type === 'system' ? section.name : 'Custom Section'}</h3>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {section.type === 'system' ? 'Automatic content' : 'Configurable content source'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer"
                              checked={section.enabled}
                              onChange={() => updateHomepageSection(index, 'enabled', !section.enabled)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                          <button 
                            onClick={() => removeHomepageSection(index)}
                            className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                            title="Remove Section"
                          >
                            <Trash2 size={18} />
                          </button>
                      </div>
                    </div>

                    {section.enabled && (
                      <div className="space-y-3 pl-12">
                        <div>
                           <label className={label}>Section Name</label>
                           <input 
                             type="text"
                             value={section.name}
                             onChange={(e) => updateHomepageSection(index, 'name', e.target.value)}
                             disabled={section.type === 'system' && (section.id === 'latest' || section.id === 'trending')} // System sections might have fixed names? Or allow rename.
                             className={inputClass}
                           />
                        </div>
                        
                        {section.type === 'custom' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className={label}>Content Source</label>
                              <select 
                                value={section.sourceType}
                                onChange={(e) => updateHomepageSection(index, 'sourceType', e.target.value)}
                                className={selectClass}
                              >
                                <option value="category">Category</option>
                                <option value="tag">Tag</option>
                                <option value="author">Writer/Author</option>
                                <option value="content_type">Content Type</option>
                              </select>
                            </div>
                            <div>
                              <label className={label}>
                                {section.sourceType === 'content_type' ? 'Content Type (e.g. web-story)' : 
                                 section.sourceType === 'author' ? 'Author ID or Name' :
                                 section.sourceType === 'tag' ? 'Tag Slug' : 'Category Slug'}
                              </label>
                              <input 
                                type="text"
                                value={section.sourceValue}
                                onChange={(e) => updateHomepageSection(index, 'sourceValue', e.target.value)}
                                placeholder={
                                  section.sourceType === 'content_type' ? 'e.g. article, web-story, video' :
                                  section.sourceType === 'author' ? 'e.g. john-doe' :
                                  section.sourceType === 'tag' ? 'e.g. ipl-2025' : 'e.g. cricket'
                                }
                                className={inputClass}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sidebar Section */}
          {activeTab === 'sidebar' && (
            <div className={`${panel} p-6`}>
              <div className="flex items-center justify-between mb-4">
                  <h2 className={sectionTitle}><Columns size={20} /> Sidebar Widgets</h2>
                  <button 
                    onClick={addSidebarWidget}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                  >
                    <Plus size={16} /> Add Widget
                  </button>
              </div>
              
              <div className="space-y-6">
                 {(settings.sidebar.widgets || []).map((widget, index) => (
                    <div key={index} className={`p-4 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                       <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                             <div className="flex flex-col gap-1">
                                <button onClick={() => moveSidebarWidget(index, 'up')} disabled={index === 0} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ArrowUp size={14} /></button>
                                <button onClick={() => moveSidebarWidget(index, 'down')} disabled={index === (settings.sidebar.widgets || []).length - 1} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ArrowDown size={14} /></button>
                             </div>
                             <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Widget {index + 1}</h3>
                          </div>
                          <button 
                             onClick={() => removeSidebarWidget(index)}
                             className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                             <Trash2 size={18} />
                          </button>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                             <label className={label}>Widget Type</label>
                             <select 
                                value={widget.type}
                                onChange={(e) => updateSidebarWidget(index, 'type', e.target.value)}
                                className={selectClass}
                             >
                                <option value="trending">Trending Posts</option>
                                <option value="newsletter">Newsletter</option>
                                <option value="social_links">Social Links</option>
                                <option value="ads">Advertisement</option>
                                <option value="about">About/Bio</option>
                             </select>
                          </div>
                          <div>
                             <label className={label}>Title</label>
                             <input 
                                type="text"
                                value={widget.title || ''}
                                onChange={(e) => updateSidebarWidget(index, 'title', e.target.value)}
                                className={inputClass}
                                placeholder="Widget Title"
                             />
                          </div>
                          
                          {widget.type === 'trending' && (
                             <div>
                                <label className={label}>Number of Posts</label>
                                <input 
                                   type="number"
                                   value={widget.limit || 5}
                                   onChange={(e) => updateSidebarWidget(index, 'limit', parseInt(e.target.value))}
                                   className={inputClass}
                                   min="1"
                                   max="10"
                                />
                             </div>
                          )}

                          {widget.type === 'social_links' && (
                              <div className="md:col-span-2 space-y-3">
                                  <label className={label}>Social Links</label>
                                  {(widget.socialLinks || []).map((link, linkIndex) => (
                                      <div key={linkIndex} className="flex items-center gap-2">
                                          <select 
                                              value={link.platform}
                                              onChange={(e) => updateSocialLink(index, linkIndex, 'platform', e.target.value)}
                                              className={`${selectClass} w-1/3`}
                                          >
                                              <option value="facebook">Facebook</option>
                                              <option value="twitter">Twitter</option>
                                              <option value="instagram">Instagram</option>
                                              <option value="youtube">YouTube</option>
                                              <option value="linkedin">LinkedIn</option>
                                              <option value="whatsapp">WhatsApp</option>
                                              <option value="telegram">Telegram</option>
                                          </select>
                                          <input 
                                              type="text"
                                              value={link.url}
                                              onChange={(e) => updateSocialLink(index, linkIndex, 'url', e.target.value)}
                                              className={`${inputClass} flex-1`}
                                              placeholder="URL"
                                          />
                                          <button onClick={() => removeSocialLink(index, linkIndex)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16} /></button>
                                      </div>
                                  ))}
                                  <button onClick={() => addSocialLink(index)} className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
                                      <Plus size={14} /> Add Social Link
                                  </button>
                              </div>
                          )}
                       </div>
                    </div>
                 ))}
              </div>
            </div>
          )}

          {/* Footer Section */}
          {activeTab === 'footer' && (
            <div className={`${panel} p-6`}>
              <h2 className={sectionTitle}><LinkIcon size={20} /> Footer Configuration</h2>
              <div className="space-y-6">
                 
                 {/* Enabled Sections */}
                 <div>
                    <h3 className={`text-md font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Visible Sections</h3>
                    <div className="flex flex-wrap gap-4">
                      {footerSections.map(section => (
                        <label key={section} className={`flex items-center gap-2 cursor-pointer p-3 rounded-lg border transition-all ${
                          settings.footer.sections.includes(section)
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700'
                            : isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                        }`}>
                          <input 
                            type="checkbox" 
                            checked={settings.footer.sections.includes(section)} 
                            onChange={() => toggleFooterSection(section)}
                            className={checkboxClass} 
                          />
                          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{section}</span>
                        </label>
                      ))}
                    </div>
                 </div>

                 {/* Quick Links Management */}
                 {settings.footer.sections.includes('Quick Links') && (
                   <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                          <h3 className={`text-md font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Quick Links</h3>
                          <button 
                            onClick={addQuickLink}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs font-medium"
                          >
                            <Plus size={14} /> Add Link
                          </button>
                      </div>
                      <div className="space-y-3">
                        {(settings.footer.quickLinks || []).map((link, index) => (
                          <div key={index} className={`flex items-center gap-3 p-3 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                              <div className="grid grid-cols-2 gap-3 flex-1">
                                <input 
                                    type="text" 
                                    value={link.text} 
                                    onChange={(e) => updateQuickLink(index, 'text', e.target.value)}
                                    placeholder="Link Text"
                                    className={inputClass}
                                />
                                <input 
                                    type="text" 
                                    value={link.href} 
                                    onChange={(e) => updateQuickLink(index, 'href', e.target.value)}
                                    placeholder="URL (e.g. /about)"
                                    className={inputClass}
                                />
                              </div>
                              <button 
                                  onClick={() => removeQuickLink(index)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                  <Trash2 size={16} />
                              </button>
                          </div>
                        ))}
                        {(!settings.footer.quickLinks || settings.footer.quickLinks.length === 0) && (
                          <p className={`text-sm italic ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No quick links added yet. Add one to get started.</p>
                        )}
                      </div>
                   </div>
                 )}

                 {/* Company Info Inputs */}
                 <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className={`text-md font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Company Information</h3>
                    <div className="space-y-4">
                        <div>
                            <label className={label}>About Text (Company Info)</label>
                            <textarea 
                                value={settings.footer.companyDescription || ''}
                                onChange={(e) => setSettings(prev => ({ ...prev, footer: { ...prev.footer, companyDescription: e.target.value } }))}
                                className={`${inputClass} min-h-[100px] resize-y`}
                                placeholder="Write a short description about your company..."
                            />
                        </div>
                    </div>
                 </div>

                 {/* Contact Info Inputs */}
                 <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className={`text-md font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Contact Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className={label}>Address</label>
                            <input 
                                type="text"
                                value={settings.footer.contactAddress || ''}
                                onChange={(e) => setSettings(prev => ({ ...prev, footer: { ...prev.footer, contactAddress: e.target.value } }))}
                                className={inputClass}
                                placeholder="e.g. 123 Sports Avenue, Stadium District, NY"
                            />
                        </div>
                        <div>
                            <label className={label}>Email</label>
                            <input 
                                type="text"
                                value={settings.footer.contactEmail || ''}
                                onChange={(e) => setSettings(prev => ({ ...prev, footer: { ...prev.footer, contactEmail: e.target.value } }))}
                                className={inputClass}
                                placeholder="e.g. contact@sportzpoint.com"
                            />
                        </div>
                        <div>
                            <label className={label}>Phone</label>
                            <input 
                                type="text"
                                value={settings.footer.contactPhone || ''}
                                onChange={(e) => setSettings(prev => ({ ...prev, footer: { ...prev.footer, contactPhone: e.target.value } }))}
                                className={inputClass}
                                placeholder="e.g. +1 (555) 123-4567"
                            />
                        </div>
                    </div>
                 </div>

              </div>
            </div>
          )}
          {/* ================= SEO & URL Configuration ================= */}
          {activeTab === 'seo' && (
  <div className={`${panel} p-6`}>
    <h2 className={sectionTitle}>
      <Globe size={20} /> SEO & URL Configuration
    </h2>

    <div className="space-y-8">

      {/* ================= POSTS ================= */}
      <div>
        <h3 className="text-md font-semibold mb-3">Post URL Structure</h3>

        <input
          type="text"
          placeholder="/{category}/{slug}"
          value={settings.seo.postUrlStructure}
          onChange={(e) =>
            setSettings(prev => ({
              ...prev,
              seo: { ...prev.seo, postUrlStructure: e.target.value }
            }))
          }
          className={inputClass}
        />

        <p className="text-xs mt-2 text-gray-400">
          Available: {'{slug}'}, {'{category}'}, {'{author}'}, {'{year}'}, {'{month}'}
        </p>

        {/* Preview */}
        <div className="mt-2 text-sm text-blue-500">
          Preview: {
            settings.seo.postUrlStructure
              .replace('{slug}', 'sample-article')
              .replace('{category}', 'cricket')
              .replace('{author}', 'john-doe')
              .replace('{year}', '2025')
              .replace('{month}', '03')
          }
        </div>
      </div>

      {/* ================= PAGES ================= */}
      <div>
        <h3 className="text-md font-semibold mb-3">Page URL Structure</h3>

        <input
          type="text"
          placeholder="/{slug}"
          value={settings.seo.pageUrlStructure}
          onChange={(e) =>
            setSettings(prev => ({
              ...prev,
              seo: { ...prev.seo, pageUrlStructure: e.target.value }
            }))
          }
          className={inputClass}
        />

        <p className="text-xs mt-2 text-gray-400">
          Available: {'{slug}'}
        </p>

        {/* Preview */}
        <div className="mt-2 text-sm text-green-500">
          Preview: {
            settings.seo.pageUrlStructure
              .replace('{slug}', 'contact')
          }
        </div>
      </div>

      {/* ================= META ================= */}
      <div>
        <h3 className="text-md font-semibold mb-3">Default Meta Tags</h3>
        <h4 className="text-md font-semibold mb-3">Default Meta Title</h4>

        <input
          type="text"
          placeholder="{title} | {site}"
          value={settings.seo.metaTitleTemplate}
          onChange={(e) =>
            setSettings(prev => ({
              ...prev,
              seo: { ...prev.seo, metaTitleTemplate: e.target.value }
            }))
          }
          className={inputClass}
        />
        <h4 className="text-md font-semibold mb-3">Default Meta Description</h4>
        <textarea
          placeholder="Read {title} on {site}"
          value={settings.seo.metaDescriptionTemplate}
          onChange={(e) =>
            setSettings(prev => ({
              ...prev,
              seo: { ...prev.seo, metaDescriptionTemplate: e.target.value }
            }))
          }
          className={`${inputClass} mt-3`}
        />
      </div>

    </div>
  </div>
)}
        </div>
      </div>
    </div>
  );
}
