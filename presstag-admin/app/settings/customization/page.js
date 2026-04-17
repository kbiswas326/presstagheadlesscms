/// This is the main customization page for the admin panel. It allows admins to configure various aspects of the website's layout and appearance, including the navbar, homepage sections, sidebar widgets, footer content, and overall branding (logo, colors, etc.). The page is organized into tabs for each major section, and provides a live preview of changes as they are made. Settings are saved to the backend via API calls, and loaded on page load to ensure persistence.
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ChevronDown, Plus, Trash2, X, Upload, Eye, EyeOff, Save, RotateCcw, Check, Layout, Menu, Globe, columns, Columns, Link as LinkIcon, Info, Mail, Edit2, GripVertical, ArrowUp, ArrowDown, BarChart2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-hot-toast';
import { uploadImage, getImageUrl } from '../../../lib/imageHelper';
import MediaImagesSelector from '../../media/MediaImagesSelector';
import { getTenantId } from '../../../lib/api';

const navbarItems = ['Home', 'About', 'Blog', 'News', 'Events', 'Contact', 'Gallery', 'Services'];
const sidebarSections = ['Recent Posts', 'Popular Tags', 'Categories', 'Newsletter', 'Social Media', 'Ads', 'About Widget'];
const footerSections = ['Quick Links', 'Company Info', 'Social Media', 'Contact Info'];

export default function CustomizationPage() {
  const { isDark } = useTheme();
  const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/api$/, '');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [showFallbackImagePicker, setShowFallbackImagePicker] = useState(false);
  const [showFaviconPicker, setShowFaviconPicker] = useState(false);
  const [gaOAuthStatus, setGaOAuthStatus] = useState({ configured: false, connected: false });
  const [gaOAuthLoading, setGaOAuthLoading] = useState(false);

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

  homeMetaTitle: '',
  homeMetaDescription: '',
  categoryMetaTitleTemplate: 'Category: {category} | {site}',
  categoryMetaDescriptionTemplate: 'Read the latest {category} news on {site}',
  tagMetaTitleTemplate: 'Tag: {tag} | {site}',
  tagMetaDescriptionTemplate: 'Read posts tagged {tag} on {site}',
  authorMetaTitleTemplate: '{author} | {site}',
  authorMetaDescriptionTemplate: 'Read articles by {author} on {site}',
  defaultOgImage: '',

  metaTitleTemplate: '{title} | {site}',
  metaDescriptionTemplate: 'Read {title} on {site}',
},
    branding: {
  logo: '/images/logo.png',
  favicon: '',
  primaryColor: '#185EFD',
  siteTitle: 'SportzPoint',
  siteTagline: '',
  siteUrl: '',
  templateId: 'classic',
  logoDisplayMode: 'both',
  showTaglineInHeader: false,
  logoFile: null,
  fallbackImage: ''
}

    ,
    analytics: {
      gaMeasurementId: '',
      gaPropertyId: '',
      googleSiteVerification: '',
      facebookAppId: ''
    }

  });

  const [activeTab, setActiveTab] = useState('branding');

  useEffect(() => {
    // Load settings from backend
    const loadSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE}/api/layout-config`, {
          headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': getTenantId() }
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
            seo: { ...prev.seo, ...data.seo },
            branding: { ...prev.branding, ...data.branding },
            analytics: { ...prev.analytics, ...data.analytics }
          }));
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        toast.error('Failed to load settings');
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    refreshGaOAuthStatus();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE}/api/layout-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': getTenantId()
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

  const refreshGaOAuthStatus = async () => {
    try {
      setGaOAuthLoading(true);
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${BASE}/api/analytics/ga4/oauth/status`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': getTenantId() },
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = await res.json();
      setGaOAuthStatus({
        configured: Boolean(data?.configured),
        connected: Boolean(data?.connected),
      });
    } finally {
      setGaOAuthLoading(false);
    }
  };

  const handleConnectGA = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${BASE}/api/analytics/ga4/oauth/url?returnTo=${encodeURIComponent('/settings/customization?tab=integrations')}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': getTenantId() },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || 'Failed to start Google Analytics connection');
        return;
      }
      if (data?.authUrl) window.location.href = data.authUrl;
    } catch (err) {
      toast.error('Failed to start Google Analytics connection');
    }
  };

  const handleDisconnectGA = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${BASE}/api/analytics/ga4/oauth/disconnect`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': getTenantId() },
      });
      if (!res.ok) {
        toast.error('Failed to disconnect Google Analytics');
        return;
      }
      toast.success('Google Analytics disconnected');
      await refreshGaOAuthStatus();
    } catch {
      toast.error('Failed to disconnect Google Analytics');
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
  const [sidebarScope, setSidebarScope] = useState('homepage');

  const getSidebarWidgets = () => {
    if (sidebarScope === 'homepage') return settings.sidebar?.homepageWidgets || [];
    return settings.sidebar?.postWidgets || settings.sidebar?.widgets || [];
  };

  const setSidebarWidgets = (nextWidgets) => {
    setSettings((prev) => {
      const prevSidebar = prev.sidebar || {};
      if (sidebarScope === 'homepage') {
        return { ...prev, sidebar: { ...prevSidebar, homepageWidgets: nextWidgets } };
      }
      return { ...prev, sidebar: { ...prevSidebar, postWidgets: nextWidgets } };
    });
  };

  const addSidebarWidget = () => {
      const widgets = getSidebarWidgets();
      setSidebarWidgets([...widgets, { type: 'trending', title: 'New Widget', limit: 5 }]);
  };

  const updateSidebarWidget = (index, field, value) => {
      const newWidgets = [...getSidebarWidgets()];
      newWidgets[index] = { ...newWidgets[index], [field]: value };
      setSidebarWidgets(newWidgets);
  };

  const removeSidebarWidget = (index) => {
      const newWidgets = getSidebarWidgets().filter((_, i) => i !== index);
      setSidebarWidgets(newWidgets);
  };

  const moveSidebarWidget = (index, direction) => {
      const newWidgets = [...getSidebarWidgets()];
      if (direction === 'up' && index > 0) {
          [newWidgets[index], newWidgets[index - 1]] = [newWidgets[index - 1], newWidgets[index]];
      } else if (direction === 'down' && index < newWidgets.length - 1) {
          [newWidgets[index], newWidgets[index + 1]] = [newWidgets[index + 1], newWidgets[index]];
      }
      setSidebarWidgets(newWidgets);
  };

  // Social Links Logic inside Sidebar Widget
  const addSocialLink = (widgetIndex) => {
      const newWidgets = [...getSidebarWidgets()];
      const currentLinks = newWidgets[widgetIndex].socialLinks || [];
      newWidgets[widgetIndex].socialLinks = [...currentLinks, { platform: 'facebook', url: 'https://' }];
      setSidebarWidgets(newWidgets);
  };

  const removeSocialLink = (widgetIndex, linkIndex) => {
      const newWidgets = [...getSidebarWidgets()];
      const currentLinks = newWidgets[widgetIndex].socialLinks || [];
      newWidgets[widgetIndex].socialLinks = currentLinks.filter((_, i) => i !== linkIndex);
      setSidebarWidgets(newWidgets);
  };

  const updateSocialLink = (widgetIndex, linkIndex, field, value) => {
      const newWidgets = [...getSidebarWidgets()];
      const currentLinks = [...(newWidgets[widgetIndex].socialLinks || [])];
      currentLinks[linkIndex] = { ...currentLinks[linkIndex], [field]: value };
      newWidgets[widgetIndex].socialLinks = currentLinks;
      setSidebarWidgets(newWidgets);
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

  const templateOptions = [
    { id: 'classic', name: 'Classic', thumb: '/templates/classic.svg' },
    { id: 'modern', name: 'Modern', thumb: '/templates/modern.svg' },
    { id: 'magazine', name: 'Magazine', thumb: '/templates/magazine.svg' },
    { id: 'minimal', name: 'Minimal', thumb: '/templates/minimal.svg' },
    { id: 'bold', name: 'Bold', thumb: '/templates/bold.svg' },
  ];

  const getPreviewOrigin = () => {
    const normalize = (raw) => String(raw || '').trim().replace(/\/+$/, '');
    const fromConfig = normalize(settings?.branding?.siteUrl || settings?.seo?.siteUrl);
    const fromEnv = normalize(process.env.NEXT_PUBLIC_PUBLIC_ORIGIN);
    const inferFromHost = () => {
      if (typeof window === 'undefined') return '';
      const host = window.location.hostname.toLowerCase();
      if (host.includes('localhost') || host.includes('127.0.0.1')) return 'http://localhost:3001';
      if (host.includes('-admin-')) return `https://${host.replace('-admin-', '-frontend-')}`;
      if (host.includes('sportzpoint-admin')) return `https://${host.replace('sportzpoint-admin', 'sportzpoint-frontend')}`;
      if (host.startsWith('admin.')) return `https://${host.slice(6)}`;
      if (host.startsWith('cms.')) return `https://${host.slice(4)}`;
      return '';
    };
    return fromConfig || fromEnv || inferFromHost() || 'http://localhost:3001';
  };

  const openTemplatePreview = (templateId) => {
    const origin = getPreviewOrigin();
    const url = `${origin}/?template=${encodeURIComponent(String(templateId || 'classic'))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const tabs = [
  { id: 'branding', label: 'Branding', icon: <Layout size={18} /> },
  { id: 'navbar', label: 'Navigation', icon: <Menu size={18} /> },
  { id: 'homepage', label: 'Homepage', icon: <Globe size={18} /> },
  { id: 'sidebar', label: 'Sidebar', icon: <Columns size={18} /> },
  { id: 'social', label: 'Social Links', icon: <LinkIcon size={18} /> },
  { id: 'footer', label: 'Footer', icon: <LinkIcon size={18} /> },
  { id: 'seo', label: 'SEO & URLs', icon: <Globe size={18} /> },
  { id: 'integrations', label: 'Integrations', icon: <BarChart2 size={18} /> },
];

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDark ? "bg-gray-900" : "bg-gray-50"} p-6`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 p-6 ${panel}`}>
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Website Customization</h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Manage your website&apos;s layout, branding, and appearance</p>
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
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <label className={label}>Site Template</label>
                      <button
                        type="button"
                        onClick={() => openTemplatePreview(settings?.branding?.templateId || 'classic')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${isDark ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                      >
                        <Eye size={16} />
                        Preview
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {templateOptions.map((tpl) => {
                        const active = String(settings?.branding?.templateId || 'classic') === tpl.id;
                        return (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => setSettings(prev => ({ ...prev, branding: { ...prev.branding, templateId: tpl.id } }))}
                            className={`text-left rounded-xl border overflow-hidden transition-all ${active ? 'border-blue-500 ring-2 ring-blue-200' : (isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300')}`}
                          >
                            <div className={`${isDark ? 'bg-gray-900' : 'bg-white'} p-3`}>
                              <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden">
                                <Image src={tpl.thumb} alt={tpl.name} fill sizes="(max-width: 1024px) 50vw, 33vw" className="object-cover" />
                              </div>
                              <div className="mt-3 flex items-center justify-between gap-3">
                                <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{tpl.name}</div>
                                {active ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                    <Check size={14} />
                                    Selected
                                  </span>
                                ) : (
                                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                    Select
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs mt-3`}>
                      Template preview uses a URL override and does not save until you click Save Changes.
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className={label}>Favicon</label>
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setShowFaviconPicker(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Select from Media
                        </button>
                        <input
                          type="text"
                          value={settings.branding.favicon || ''}
                          onChange={(e) => setSettings(prev => ({ ...prev, branding: { ...prev.branding, favicon: e.target.value } }))}
                          className={inputClass}
                          placeholder="https://example.com/favicon.ico or /uploads/..."
                        />
                      </div>
                      {settings.branding.favicon ? (
                        <div className="flex items-center gap-3">
                          <img src={settings.branding.favicon} alt="Favicon" className="h-10 w-10 rounded border bg-white object-contain" />
                          <button
                            type="button"
                            onClick={() => setSettings(prev => ({ ...prev, branding: { ...prev.branding, favicon: '' } }))}
                            className="px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 text-sm rounded-lg hover:bg-red-500/20 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ) : null}
                    </div>
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
                  <label className="flex items-center gap-2 mt-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.branding.showTaglineInHeader === true}
                      onChange={(e) => setSettings(prev => ({ ...prev, branding: { ...prev.branding, showTaglineInHeader: e.target.checked } }))}
                      className={checkboxClass}
                    />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Show tagline in header</span>
                  </label>
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
                      Recommended: Height 40px–60px. Supports SVG, PNG (transparent), JPG.
                  </p>
                </div>
                {/* ================= FALLBACK IMAGE ================= */}
<div>
  <label className={label}>Fallback Image (used when post has no image)</label>
  
  <button
    type="button"
    onClick={() => setShowFallbackImagePicker(true)}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
      isDark 
        ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
    }`}
  >
    <Upload size={16} />
    Choose Image
  </button>

  {/* Preview */}
  {settings?.branding?.fallbackImage && (
    <div className="mt-4 relative inline-block">
      <img
        src={settings.branding.fallbackImage}
        alt="Fallback"
        className="rounded-lg max-h-40 border"
      />
      <button
        onClick={() => setSettings(prev => ({
          ...prev,
          branding: { ...prev.branding, fallbackImage: '' }
        }))}
        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
      >
        <X size={14} />
      </button>
    </div>
  )}

  {/* Media Picker Modal */}
  {showFallbackImagePicker && (
    <MediaImagesSelector
      onSelect={(img) => {
        const imageUrl = img.url || img.src || img.fullUrl;
        setSettings(prev => ({
          ...prev,
          branding: {
            ...prev.branding,
            fallbackImage: imageUrl
          }
        }));
        setShowFallbackImagePicker(false);
        toast.success('Fallback image selected');
      }}
      onClose={() => setShowFallbackImagePicker(false)}
    />
  )}

  {showFaviconPicker && (
    <MediaImagesSelector
      onSelect={(img) => {
        let imageUrl = img.url || img.src || img.fullUrl;
        if (typeof imageUrl === 'string') {
          const uploadsIndex = imageUrl.indexOf('/uploads/');
          if (uploadsIndex >= 0) imageUrl = imageUrl.slice(uploadsIndex);
        }
        setSettings(prev => ({
          ...prev,
          branding: {
            ...prev.branding,
            favicon: imageUrl || ''
          }
        }));
        setShowFaviconPicker(false);
        toast.success('Favicon selected');
      }}
      onClose={() => setShowFaviconPicker(false)}
    />
  )}
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
                  <div className="flex items-center gap-3">
                    <select
                      value={sidebarScope}
                      onChange={(e) => setSidebarScope(e.target.value)}
                      className={selectClass}
                    >
                      <option value="homepage">Homepage Sidebar</option>
                      <option value="post">Post Sidebar</option>
                    </select>
                    <button
                      onClick={addSidebarWidget}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                    >
                      <Plus size={16} /> Add Widget
                    </button>
                  </div>
              </div>
              
              <div className="space-y-6">
                 {getSidebarWidgets().map((widget, index) => (
                    <div key={index} className={`p-4 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                       <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                             <div className="flex flex-col gap-1">
                                <button onClick={() => moveSidebarWidget(index, 'up')} disabled={index === 0} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ArrowUp size={14} /></button>
                                <button onClick={() => moveSidebarWidget(index, 'down')} disabled={index === getSidebarWidgets().length - 1} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ArrowDown size={14} /></button>
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
                                <option value="recent_posts">Latest Posts</option>
                                <option value="related_posts">Related Posts</option>
                                <option value="author_posts">More from the Author</option>
                                <option value="newsletter">Newsletter</option>
                                <option value="social_links">Social Links</option>
                                <option value="ads">Advertisement</option>
                                <option value="categories">Categories</option>
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
                          
                          {(widget.type === 'trending' || widget.type === 'recent_posts' || widget.type === 'related_posts' || widget.type === 'author_posts') && (
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

                          {widget.type === 'about' && (
                            <div className="md:col-span-2">
                              <label className={label}>Content</label>
                              <textarea
                                value={widget.content || ''}
                                onChange={(e) => updateSidebarWidget(index, 'content', e.target.value)}
                                className={inputClass}
                                rows={4}
                                placeholder="Write a short about/bio for the sidebar..."
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

          {activeTab === 'social' && (
            <div className={`${panel} p-6`}>
              <h2 className={sectionTitle}><LinkIcon size={20} /> Social Links</h2>
              <div className="space-y-6">
                <div className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm`}>
                  Add your social profile URLs. These links appear in the sidebar “Follow Us” widget (and footer social section if enabled).
                </div>

                {(() => {
                  const platforms = [
                    { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
                    { key: 'twitter', label: 'X (Twitter)', placeholder: 'https://x.com/yourhandle' },
                    { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle' },
                    { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourchannel' },
                    { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourcompany' },
                    { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@yourhandle' },
                    { key: 'pinterest', label: 'Pinterest', placeholder: 'https://pinterest.com/yourprofile' },
                    { key: 'reddit', label: 'Reddit', placeholder: 'https://reddit.com/user/youruser' },
                    { key: 'whatsapp', label: 'WhatsApp', placeholder: 'https://wa.me/1234567890' },
                    { key: 'telegram', label: 'Telegram', placeholder: 'https://t.me/yourchannel' },
                  ];

                  const widgets = Array.isArray(settings.sidebar?.widgets) ? settings.sidebar.widgets : [];
                  const socialWidget = widgets.find((w) => w?.type === 'social_links' || w?.type === 'social') || null;
                  const list = Array.isArray(socialWidget?.socialLinks) ? socialWidget.socialLinks : [];
                  const getUrl = (platform) => list.find((l) => (l?.platform || '').toLowerCase() === platform)?.url || '';
                  const setUrl = (platform, url) => {
                    const nextUrl = String(url || '').trim();
                    setSettings((prev) => {
                      const prevWidgets = Array.isArray(prev.sidebar?.widgets) ? prev.sidebar.widgets : [];
                      const socialIdx = prevWidgets.findIndex((w) => w?.type === 'social_links' || w?.type === 'social');
                      const nextWidgets = [...prevWidgets];
                      const baseWidget = socialIdx >= 0 ? nextWidgets[socialIdx] : { type: 'social_links', title: 'Follow Us' };
                      const prevLinks = Array.isArray(baseWidget?.socialLinks) ? baseWidget.socialLinks : [];
                      const nextLinks = prevLinks.filter((l) => (l?.platform || '').toLowerCase() !== platform);
                      if (nextUrl) nextLinks.push({ platform, url: nextUrl });
                      const updatedWidget = { ...baseWidget, socialLinks: nextLinks };
                      if (socialIdx >= 0) nextWidgets[socialIdx] = updatedWidget;
                      else nextWidgets.push(updatedWidget);
                      return {
                        ...prev,
                        sidebar: {
                          ...(prev.sidebar || {}),
                          widgets: nextWidgets,
                        },
                      };
                    });
                  };

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {platforms.map((p) => (
                        <div key={p.key}>
                          <label className={label}>{p.label}</label>
                          <input
                            type="url"
                            value={getUrl(p.key)}
                            onChange={(e) => setUrl(p.key, e.target.value)}
                            className={inputClass}
                            placeholder={p.placeholder}
                          />
                        </div>
                      ))}
                    </div>
                  );
                })()}
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

      <div>
        <h3 className="text-md font-semibold mb-3">Archive URL Prefixes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={label}>Category Prefix</label>
            <input
              type="text"
              value={settings.seo.categoryPrefix || 'category'}
              onChange={(e) =>
                setSettings(prev => ({
                  ...prev,
                  seo: { ...prev.seo, categoryPrefix: e.target.value }
                }))
              }
              className={inputClass}
              placeholder="category"
            />
          </div>
          <div>
            <label className={label}>Tag Prefix</label>
            <select
              value={settings.seo.tagPrefix || 'tag'}
              onChange={(e) =>
                setSettings(prev => ({
                  ...prev,
                  seo: { ...prev.seo, tagPrefix: e.target.value }
                }))
              }
              className={selectClass}
            >
              <option value="tag">tag</option>
              <option value="tags">tags</option>
            </select>
          </div>
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

      <div>
        <h3 className="text-md font-semibold mb-3">Homepage SEO</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={label}>Homepage Meta Title</label>
            <input
              type="text"
              value={settings.seo.homeMetaTitle || ''}
              onChange={(e) =>
                setSettings(prev => ({
                  ...prev,
                  seo: { ...prev.seo, homeMetaTitle: e.target.value }
                }))
              }
              className={inputClass}
              placeholder="Leave empty to use Site Title / Tagline"
            />
          </div>
          <div>
            <label className={label}>Homepage Meta Description</label>
            <input
              type="text"
              value={settings.seo.homeMetaDescription || ''}
              onChange={(e) =>
                setSettings(prev => ({
                  ...prev,
                  seo: { ...prev.seo, homeMetaDescription: e.target.value }
                }))
              }
              className={inputClass}
              placeholder="Shown on Google and social previews"
            />
          </div>
          <div className="md:col-span-2">
            <label className={label}>Default Social Share Image (OG)</label>
            <input
              type="text"
              value={settings.seo.defaultOgImage || ''}
              onChange={(e) =>
                setSettings(prev => ({
                  ...prev,
                  seo: { ...prev.seo, defaultOgImage: e.target.value }
                }))
              }
              className={inputClass}
              placeholder="https://... or /uploads/..."
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-md font-semibold mb-3">Archive SEO Templates</h3>
        <p className="text-xs mt-1 text-gray-400">
          If a Category, Tag, or Author SEO field is empty, the site uses these templates automatically. To override, edit that Category, Tag, or Author and set its SEO fields.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={label}>Category Meta Title</label>
            <input
              type="text"
              value={settings.seo.categoryMetaTitleTemplate || ''}
              onChange={(e) =>
                setSettings(prev => ({
                  ...prev,
                  seo: { ...prev.seo, categoryMetaTitleTemplate: e.target.value }
                }))
              }
              className={inputClass}
              placeholder="Category: {category} | {site}"
            />
          </div>
          <div>
            <label className={label}>Category Meta Description</label>
            <input
              type="text"
              value={settings.seo.categoryMetaDescriptionTemplate || ''}
              onChange={(e) =>
                setSettings(prev => ({
                  ...prev,
                  seo: { ...prev.seo, categoryMetaDescriptionTemplate: e.target.value }
                }))
              }
              className={inputClass}
              placeholder="Read the latest {category} news on {site}"
            />
          </div>
          <div>
            <label className={label}>Tag Meta Title</label>
            <input
              type="text"
              value={settings.seo.tagMetaTitleTemplate || ''}
              onChange={(e) =>
                setSettings(prev => ({
                  ...prev,
                  seo: { ...prev.seo, tagMetaTitleTemplate: e.target.value }
                }))
              }
              className={inputClass}
              placeholder="Tag: {tag} | {site}"
            />
          </div>
          <div>
            <label className={label}>Tag Meta Description</label>
            <input
              type="text"
              value={settings.seo.tagMetaDescriptionTemplate || ''}
              onChange={(e) =>
                setSettings(prev => ({
                  ...prev,
                  seo: { ...prev.seo, tagMetaDescriptionTemplate: e.target.value }
                }))
              }
              className={inputClass}
              placeholder="Read posts tagged {tag} on {site}"
            />
          </div>
          <div>
            <label className={label}>Author Meta Title</label>
            <input
              type="text"
              value={settings.seo.authorMetaTitleTemplate || ''}
              onChange={(e) =>
                setSettings(prev => ({
                  ...prev,
                  seo: { ...prev.seo, authorMetaTitleTemplate: e.target.value }
                }))
              }
              className={inputClass}
              placeholder="{author} | {site}"
            />
          </div>
          <div>
            <label className={label}>Author Meta Description</label>
            <input
              type="text"
              value={settings.seo.authorMetaDescriptionTemplate || ''}
              onChange={(e) =>
                setSettings(prev => ({
                  ...prev,
                  seo: { ...prev.seo, authorMetaDescriptionTemplate: e.target.value }
                }))
              }
              className={inputClass}
              placeholder="Read articles by {author} on {site}"
            />
          </div>
        </div>
        <p className="text-xs mt-2 text-gray-400">
          Available: {'{site}'}, {'{category}'}, {'{tag}'}, {'{author}'}
        </p>
      </div>

    </div>
  </div>
)}

          {/* ================= Integrations ================= */}
          {activeTab === 'integrations' && (
            <div className={`${panel} p-6`}>
              <h2 className={sectionTitle}>
                <BarChart2 size={20} /> Integrations
              </h2>

              <div className="space-y-8">
                <div>
                  <h3 className="text-md font-semibold mb-3">Site URL</h3>
                  <p className="text-xs mt-1 text-gray-400">
                    Used for internal link detection in SEO analysis and for resolving social share URLs.
                  </p>
                  <input
                    type="text"
                    value={settings.branding.siteUrl || ''}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        branding: { ...prev.branding, siteUrl: e.target.value }
                      }))
                    }
                    className={inputClass}
                    placeholder="https://www.sportzpoint.com"
                  />
                </div>

                <div>
                  <h3 className="text-md font-semibold mb-3">Google Analytics (GA4)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={label}>Measurement ID</label>
                      <input
                        type="text"
                        value={settings.analytics?.gaMeasurementId || ''}
                        onChange={(e) =>
                          setSettings(prev => ({
                            ...prev,
                            analytics: { ...prev.analytics, gaMeasurementId: e.target.value }
                          }))
                        }
                        className={inputClass}
                        placeholder="G-XXXXXXXXXX"
                      />
                    </div>
                    <div>
                      <label className={label}>GA4 Property ID (for dashboard reports)</label>
                      <input
                        type="text"
                        value={settings.analytics?.gaPropertyId || ''}
                        onChange={(e) =>
                          setSettings(prev => ({
                            ...prev,
                            analytics: { ...prev.analytics, gaPropertyId: e.target.value }
                          }))
                        }
                        className={inputClass}
                        placeholder="123456789"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleConnectGA}
                      disabled={!gaOAuthStatus.configured || gaOAuthLoading}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        !gaOAuthStatus.configured || gaOAuthLoading
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {gaOAuthStatus.connected ? 'Reconnect Google Analytics' : 'Connect Google Analytics'}
                    </button>
                    {gaOAuthStatus.connected && (
                      <button
                        type="button"
                        onClick={handleDisconnectGA}
                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                      >
                        Disconnect
                      </button>
                    )}
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      gaOAuthStatus.connected
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {gaOAuthLoading ? 'Checking…' : (gaOAuthStatus.connected ? 'Connected' : 'Not connected')}
                    </span>
                  </div>
                  {!gaOAuthStatus.configured && (
                    <p className="text-xs mt-2 text-gray-400">
                      To enable one-click connect (WordPress-style), set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI, ANALYTICS_OAUTH_STATE_SECRET, ANALYTICS_TOKEN_ENC_KEY, and ADMIN_URL on the backend.
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="text-md font-semibold mb-3">Verification</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={label}>Google Site Verification</label>
                      <input
                        type="text"
                        value={settings.analytics?.googleSiteVerification || ''}
                        onChange={(e) =>
                          setSettings(prev => ({
                            ...prev,
                            analytics: { ...prev.analytics, googleSiteVerification: e.target.value }
                          }))
                        }
                        className={inputClass}
                        placeholder="verification token"
                      />
                    </div>
                    <div>
                      <label className={label}>Facebook App ID</label>
                      <input
                        type="text"
                        value={settings.analytics?.facebookAppId || ''}
                        onChange={(e) =>
                          setSettings(prev => ({
                            ...prev,
                            analytics: { ...prev.analytics, facebookAppId: e.target.value }
                          }))
                        }
                        className={inputClass}
                        placeholder="1234567890"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
