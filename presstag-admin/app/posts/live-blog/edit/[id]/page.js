///posts/live-blog/edit/[id]/page.js | Main page component for creating and editing live blogs in the PressTag CMS admin panel. Handles form state, API interactions, live update management, SEO analysis, and media management.///
'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import {
  ArrowLeft,
  ChevronDown,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Play,
  Square,
  RotateCcw,
  Plus,
  Trash2,
  Edit2
} from 'lucide-react';
import MediaImagesSelector from '../../../../media/MediaImagesSelector';
import { posts } from '../../../../../lib/api';
import { useParams } from "next/navigation";
import { getUsers, getCategories, getTags } from '../../../../../lib/api';
import { useTheme } from '../../../../context/ThemeContext';


// Load TinyMCE dynamically
const Editor = dynamic(() => import('@tinymce/tinymce-react').then(mod => mod.Editor), {
  ssr: false,
});

export default function LiveBlogEditorPage() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('content');
  const [isContentExpanded, setIsContentExpanded] = useState(true);
  const router = useRouter();

  // Loading and Alert states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // content fields
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [slug, setSlug] = useState('');
  const params = useParams();
  const postId = params?.id;
  const isEditMode = Boolean(postId) && postId !== 'new';


  // live status
  const [liveStatus, setLiveStatus] = useState('stopped'); // 'live' | 'stopped' | 'paused'

  const [hasEverBeenPublished, setHasEverBeenPublished] = useState(false);


  // updates
  const [updates, setUpdates] = useState([]);
  const [showAddUpdate, setShowAddUpdate] = useState(false);
  const [editingUpdateId, setEditingUpdateId] = useState(null);
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateContent, setUpdateContent] = useState('');

  // featured image
  const [featuredImage, setFeaturedImage] = useState(null);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // properties
  const [publishDate, setPublishDate] = useState('');
  const [publishTime, setPublishTime] = useState('');
  const [author, setAuthor] = useState('');
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  // multi-select dropdowns
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);

  // searches
  const [authorSearch, setAuthorSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');

  const authorDropdownRef = useRef(null);
  const categoriesDropdownRef = useRef(null);
  const tagsDropdownRef = useRef(null);
  const liveUpdatesRef = useRef(null);
  const editorCallbackRef = useRef(null);

  // selected values//
  const [availableAuthors, setAvailableAuthors] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

  // fetch users, categories, tags for dropdowns//

  useEffect(() => {
  async function loadMetaData() {
    try {
      const [users, categories, tags] = await Promise.all([
        getUsers(),
        getCategories({ withCounts: false }),
        getTags({ withCounts: false }),
      ]);

      setAvailableAuthors(
        Array.isArray(users) ? users : users?.users || users?.data || []
      );
      setAvailableCategories(
        Array.isArray(categories) ? categories : categories?.categories || categories?.data || []
      );
      setAvailableTags(
        Array.isArray(tags) ? tags : tags?.tags || tags?.data || []
      );
    } catch (err) {
      console.error("Failed to load metadata", err);
    }
  }

  loadMetaData();
}, []);

// load existing live blog data in edit mode
useEffect(() => {
  if (!isEditMode) return;

  async function loadPost() {
    try {
      const post = await posts.getById(postId);

      setTitle(post.title || "");
      setSlug(post.slug || "");
      setSummary(post.summary || "");
      setContent(post.content || "");

      setAuthor(post.author?._id || post.author || "");
      setCategories((post.categories || []).map(c => c._id || c));
      setTags((post.tags || []).map(t => t._id || t));

      setFeaturedImage(post.featuredImage || null);

      setLiveStatus(post.isLive ? "live" : "stopped");
      setUpdates(post.liveUpdates || []);

      setMetaTitle(post.seo?.metaTitle || "");
      setMetaDescription(post.seo?.metaDescription || "");
      setKeyword(post.seo?.focusKeyword || "");
      setSchema(post.seo?.schema || "");
      setSeoScore(post.seoScore || 0);

      if (post.publishedAt) {
        const d = new Date(post.publishedAt);
        setPublishDate(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }));
        setPublishTime(d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }));
      } else {
        if (post.publishDate) setPublishDate(post.publishDate);
        if (post.publishTime) setPublishTime(post.publishTime);
      }

      // âœ… CRITICAL: unlock live features if published before
      if (post.publishedAt) {
        setHasEverBeenPublished(true);
      }
    } catch (err) {
      console.error("Failed to load live blog", err);
    }
  }

  loadPost();
}, [isEditMode, postId]);
  // SEO fields//


  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [schema, setSchema] = useState('');

  // SEO
  const [keyword, setKeyword] = useState('');
  const [seoScore, setSeoScore] = useState(0);
  const [seoChecks, setSeoChecks] = useState([]);

  // auto set publish date/time
  useEffect(() => {
    const now = new Date();
    setPublishDate(now.toISOString().split('T')[0]);
    setPublishTime(now.toTimeString().slice(0, 5));
  }, []);

  // click outside handlers to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (authorDropdownRef.current && !authorDropdownRef.current.contains(event.target)) {
        setShowAuthorDropdown(false);
        setAuthorSearch('');
      }
      if (categoriesDropdownRef.current && !categoriesDropdownRef.current.contains(event.target)) {
        setShowCategoriesDropdown(false);
        setCategorySearch('');
      }
      if (tagsDropdownRef.current && !tagsDropdownRef.current.contains(event.target)) {
        setShowTagsDropdown(false);
        setTagSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // auto slug from title (allow manual override)
  useEffect(() => {
    // Stop automation if already published
    if (hasEverBeenPublished) return;
    
    if (title) {
      const autoSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      setSlug(autoSlug);
    }
  }, [title, hasEverBeenPublished]);

  // Helper to auto-save updates
  const saveUpdatesToBackend = async (currentUpdates) => {
    // Only auto-save if already published and in edit mode
    if (!hasEverBeenPublished || !isEditMode || !postId) return;

    try {
      const payload = buildPayload('published');
      
      // Override updates with the provided latest list
      payload.liveUpdates = currentUpdates.map(u => ({
        title: u.title,
        content: u.content,
        timestamp: u.timestamp,
        pinned: u.pinned || false,
      }));
      
      // Preserve original published date
      delete payload.publishedAt;
      
      await posts.update(postId, payload);
      console.log('Auto-saved live updates');
    } catch (err) {
      console.error('Failed to auto-save live updates', err);
    }
  };

  // update CRUD
  const handleAddUpdate = () => {
    if (!updateTitle.trim() && !updateContent.trim()) {
      alert('Please provide at least a title or content');
      return;
    }
    const newUpdate = {
      _id: Date.now().toString(), // frontend-only
      title: updateTitle.trim(),
      content: updateContent.trim(),
      timestamp: new Date().toISOString(),
      pinned: false,
    };

    const newUpdatesList = [newUpdate, ...updates];
    setUpdates(newUpdatesList);
    setUpdateTitle('');
    setUpdateContent('');
    setShowAddUpdate(false);
    console.log('New update added:', newUpdate);

    // Auto-save
    saveUpdatesToBackend(newUpdatesList);
  };

  const handleEditUpdate = (id) => {
    const u = updates.find(up => up._id === id);
    if (!u) return;
    setUpdateTitle(u.title);
    setUpdateContent(u.content);
    setEditingUpdateId(id);
    setShowAddUpdate(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateEdit = () => {
    if (!updateTitle.trim() && !updateContent.trim()) {
      alert('Please provide at least a title or content');
      return;
    }
    
    const newUpdatesList = updates.map(update => 
      update._id === editingUpdateId 
        ? { 
            ...update, 
            title: updateTitle.trim(), 
            content: updateContent.trim(),
            timestamp: new Date().toISOString()
          } 
        : update
    );
    
    setUpdates(newUpdatesList);
    setEditingUpdateId(null);
    setUpdateTitle('');
    setUpdateContent('');
    setShowAddUpdate(false);
    console.log('Update saved:', { id: editingUpdateId, title: updateTitle });

    // Auto-save
    saveUpdatesToBackend(newUpdatesList);
  };

  const handleDeleteUpdate = (id) => {
    if (confirm('Are you sure you want to delete this update?')) {
      const newUpdatesList = updates.filter(u => u._id !== id);
      setUpdates(newUpdatesList);

      // Auto-save
      saveUpdatesToBackend(newUpdatesList);
    }
  };

  const handleCancelUpdate = () => {
    setEditingUpdateId(null);
    setUpdateTitle('');
    setUpdateContent('');
    setShowAddUpdate(false);
  };

  const togglePinUpdate = (id) => {
    const newUpdatesList = updates.map(u => 
      u._id === id ? { ...u, pinned: !u.pinned } : u
    );
    setUpdates(newUpdatesList);

    // Auto-save
    saveUpdatesToBackend(newUpdatesList);
  };


// build payload for save/publish//
const buildPayload = (status) => ({
  title,
  slug,
  summary,
  content,

  type: "live-blog",

  featuredImage,

  isLive: liveStatus === "live",

  liveUpdates: updates.map(u => ({
    title: u.title,
    content: u.content,
    timestamp: u.timestamp,
    pinned: u.pinned || false,
  })),

  seo: {
    metaTitle: metaTitle || title,
    metaDescription,
    focusKeyword: keyword,
    schema,
  },

  seoScore,

  author,
  categories,
  tags,

  status,
  publishDate,
  publishTime,
});



  // SEO helpers (same logic as article editor)
  const stripHtml = (html) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const countWords = (text) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  };

  const calculateReadability = (text) => {
    const words = countWords(text);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const syllables = text.split(/\s+/).reduce((count, word) => count + Math.max(1, word.toLowerCase().split(/[aeiouy]+/).length - 1), 0);
    if (words === 0 || sentences === 0) return 0;
    const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
    return Math.max(0, Math.min(100, score));
  };

  const calculateKeywordDensity = (text, keyword) => {
    if (!keyword) return 0;
    const words = countWords(text);
    const keywordRegex = new RegExp(keyword, 'gi');
    const matches = text.match(keywordRegex);
    return words > 0 ? ((matches?.length || 0) / words) * 100 : 0;
  };

  const checkHeadingStructure = (html) => {
    return {
      h1: (html.match(/<h1/gi) || []).length,
      h2: (html.match(/<h2/gi) || []).length,
      h3: (html.match(/<h3/gi) || []).length,
    };
  };

  const countLinks = (html) => {
    const internal = (html.match(/<a[^>]*href=["'](?!http)/gi) || []).length;
    const external = (html.match(/<a[^>]*href=["']http/gi) || []).length;
    return { internal, external };
  };

  // SEO analysis effect (kept consistent with ArticleEditorPage)
  useEffect(() => {
    const checks = [];
    let score = 0;
    const maxScore = 100;
    const plainContent = stripHtml(content);
    const wordCount = countWords(plainContent);
    const keywordLower = (keyword || '').toLowerCase();

    // Focus keyword
    if (!keyword) {
      checks.push({ status: 'error', text: 'Add a focus keyword' });
    } else { checks.push({ status: 'success', text: 'Focus keyword set' }); score += 5; }

    // Title length
    if (title.length === 0) { checks.push({ status: 'error', text: 'Add a title' }); }
    else if (title.length < 30) { checks.push({ status: 'warning', text: 'Title is too short (min 30 chars)' }); score += 5; }
    else if (title.length > 60) { checks.push({ status: 'warning', text: `Title is too long (${title.length}/60 chars)` }); score += 5; }
    else { checks.push({ status: 'success', text: `Title length is good (${title.length}/60 chars)` }); score += 10; }

    // Keyword in title
    if (keyword && title.toLowerCase().includes(keywordLower)) { checks.push({ status: 'success', text: 'Keyword appears in title' }); score += 10; }
    else if (keyword) { checks.push({ status: 'error', text: 'Keyword not found in title' }); }

    // Meta description
    if (metaDescription.length === 0) { checks.push({ status: 'error', text: 'Add a meta description' }); }
    else if (metaDescription.length < 120) { checks.push({ status: 'warning', text: 'Meta description is too short (min 120 chars)' }); score += 5; }
    else if (metaDescription.length > 160) { checks.push({ status: 'warning', text: `Meta description too long (${metaDescription.length}/160 chars)` }); score += 5; }
    else { checks.push({ status: 'success', text: `Meta description length is good (${metaDescription.length}/160 chars)` }); score += 10; }

    // Keyword in meta description
    if (keyword && metaDescription.toLowerCase().includes(keywordLower)) { checks.push({ status: 'success', text: 'Keyword appears in meta description' }); score += 10; }
    else if (keyword && metaDescription) { checks.push({ status: 'error', text: 'Keyword not in meta description' }); }

    // Content length
    if (wordCount === 0) { checks.push({ status: 'error', text: 'Add content to your live blog' }); }
    else if (wordCount < 300) { checks.push({ status: 'warning', text: `Content is too short (${wordCount} words, min 300)` }); score += 5; }
    else if (wordCount < 600) { checks.push({ status: 'warning', text: `Content length is acceptable (${wordCount} words)` }); score += 7; }
    else { checks.push({ status: 'success', text: `Good content length (${wordCount} words)` }); score += 10; }

    // Keyword in first paragraph
    const firstParagraph = plainContent.substring(0, 200);
    if (keyword && firstParagraph.toLowerCase().includes(keywordLower)) { checks.push({ status: 'success', text: 'Keyword appears in first paragraph' }); score += 8; }
    else if (keyword && plainContent) { checks.push({ status: 'warning', text: 'Keyword not in first paragraph' }); score += 3; }

    // Keyword density
    if (keyword && plainContent) {
      const density = calculateKeywordDensity(plainContent, keyword);
      if (density < 0.5) { checks.push({ status: 'warning', text: `Keyword density too low (${density.toFixed(2)}%)` }); score += 3; }
      else if (density > 2.5) { checks.push({ status: 'warning', text: `Keyword density too high (${density.toFixed(2)}%, may look spammy)` }); score += 3; }
      else { checks.push({ status: 'success', text: `Keyword density is good (${density.toFixed(2)}%)` }); score += 7; }
    }

    // Readability
    if (plainContent) {
      const readability = calculateReadability(plainContent);
      if (readability >= 60) { checks.push({ status: 'success', text: `Content is easy to read (score: ${readability.toFixed(0)})` }); score += 8; }
      else if (readability >= 30) { checks.push({ status: 'warning', text: `Content readability is average (score: ${readability.toFixed(0)})` }); score += 5; }
      else { checks.push({ status: 'warning', text: `Content is difficult to read (score: ${readability.toFixed(0)})` }); score += 2; }
    }

    // Headings
    const headings = checkHeadingStructure(content);
    if (headings.h1 > 1) { checks.push({ status: 'warning', text: `Multiple H1 tags found (${headings.h1}), use only one` }); score += 2; }
    else if (headings.h1 === 1) { checks.push({ status: 'success', text: 'Proper H1 structure' }); score += 3; }
    if (headings.h2 >= 2) { checks.push({ status: 'success', text: `Good use of H2 headings (${headings.h2})` }); score += 4; }
    else if (headings.h2 > 0) { checks.push({ status: 'warning', text: 'Add more H2 headings for better structure' }); score += 2; }
    else if (plainContent.length > 300) { checks.push({ status: 'error', text: 'No H2 headings found' }); }

    // Links
    const links = countLinks(content);
    if (links.internal > 0 && links.external > 0) { checks.push({ status: 'success', text: `Good link structure (${links.internal} internal, ${links.external} external)` }); score += 5; }
    else if (links.internal > 0 || links.external > 0) { checks.push({ status: 'warning', text: 'Add both internal and external links' }); score += 3; }
    else if (plainContent.length > 300) { checks.push({ status: 'warning', text: 'No links found in content' }); }

    // Slug
    if (!slug) { checks.push({ status: 'error', text: 'Add a URL slug' }); }
    else if (slug.length > 75) { checks.push({ status: 'warning', text: 'URL slug is too long' }); score += 2; }
    else if (keyword && slug.includes(keyword.toLowerCase().replace(/\s+/g, '-'))) { checks.push({ status: 'success', text: 'Keyword appears in URL slug' }); score += 5; }
    else if (slug) { checks.push({ status: 'warning', text: 'Keyword not in URL slug' }); score += 3; }

    // Featured image check
    if (featuredImage) {
      if (featuredImage.altText) { checks.push({ status: 'success', text: 'Featured image with alt text added' }); score += 5; }
      else { checks.push({ status: 'warning', text: 'Featured image missing alt text' }); score += 3; }
    } else { checks.push({ status: 'warning', text: 'No featured image added' }); }

    // Live updates
    if (updates.length > 0) { checks.push({ status: 'success', text: `${updates.length} live update${updates.length > 1 ? 's' : ''} added` }); score += 5; }
    else { checks.push({ status: 'warning', text: 'No live updates added yet' }); }

    setSeoScore(Math.min(score, maxScore));
    setSeoChecks(checks);
  }, [keyword, title, summary, content, metaDescription, slug, featuredImage, updates]);

  const getSEOColor = () => {
    if (seoScore < 40) return 'bg-red-400';
    if (seoScore < 70) return 'bg-yellow-400';
    return 'bg-emerald-400';
  };

  const getSEOTextColor = () => {
    if (seoScore < 40) return 'text-red-600';
    if (seoScore < 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getSEORating = () => {
    if (seoScore < 40) return 'Poor';
    if (seoScore < 70) return 'Good';
    return 'Excellent';
  };

  // save/publish handlers//

  const handleSaveDraft = async () => {
  isEditMode
    ? await posts.update(postId, buildPayload("draft"))
    : await posts.create(buildPayload("draft"));
};

const handleSendForApproval = async () => {
  isEditMode
    ? await posts.update(postId, buildPayload("pending"))
    : await posts.create(buildPayload("pending"));
};

const handlePublish = async () => {
  try {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    // Update publish date to now (Sync with Article/Video logic)
    const now = new Date();
    const currentDate = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const currentTime = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });

    setPublishDate(currentDate);
    setPublishTime(currentTime);

    const payload = buildPayload("published");
    payload.publishDate = currentDate;
    payload.publishTime = currentTime;
    payload.publishedAt = now.toISOString();

    if (isEditMode) {
      await posts.update(postId, payload);
    } else {
      await posts.create(payload);
    }

    setHasEverBeenPublished(true);
    router.push("/posts/live-blog");
  } catch (err) {
    console.error("Failed to publish live blog", err);
    setError("Failed to publish live blog: " + err.message);
  } finally {
    setIsLoading(false);
  }
};

const handleUpdate = async () => {
  try {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    if (!isEditMode) {
      alert('Open an existing live blog to update');
      return;
    }
    
    // Do NOT reset publish date/time on update (Preserve original publish time)
    const payload = buildPayload('published');
    
    await posts.update(postId, payload);
    setSuccess('Live blog updated successfully');
  } catch (err) {
    console.error('Failed to update live blog', err);
    setError('Failed to update live blog: ' + err.message);
  } finally {
    setIsLoading(false);
  }
};


// multi-select handlers//
  const toggleCategory = (categoryId) => {
    setCategories(prev => prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]);
  };

  const toggleTag = (tagId) => {
    setTags(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]);
  };

  const getSelectedCategoriesText = () => {
  if (!categories.length) return "Select categories";

  return categories
    .map(id => availableCategories.find(c => c._id === id))
    .filter(Boolean)
    .map(c => c.name)
    .join(", ");
};


  const getSelectedTagsText = () => {
  if (!tags.length) return "Select tags";

  return tags
    .map(id => availableTags.find(t => t._id === id))
    .filter(Boolean)
    .map(t => `#${t.name}`)
    .join(", ");
};


  const filteredAuthors = Array.isArray(availableAuthors) ? availableAuthors.filter(a => a?.name?.toLowerCase().includes(authorSearch.toLowerCase())) : [];
  const filteredCategories = Array.isArray(availableCategories) ? availableCategories.filter(c => c?.name?.toLowerCase().includes(categorySearch.toLowerCase())) : [];
  const filteredTags = Array.isArray(availableTags) ? availableTags.filter(t => t?.name?.toLowerCase().includes(tagSearch.toLowerCase())) : [];

  const handleAuthorDropdownToggle = (value) => {
    setShowAuthorDropdown(value);
    if (!value) setAuthorSearch('');
  };

  const handleCategoriesDropdownToggle = (value) => {
    setShowCategoriesDropdown(value);
    if (!value) setCategorySearch('');
  };

  const handleTagsDropdownToggle = (value) => {
    setShowTagsDropdown(value);
    if (!value) setTagSearch('');
  };

  const panel = 'bg-white/80 backdrop-blur-sm rounded-2xl shadow-md ring-1 ring-gray-100';

  const getStatusColor = () => {
    if (liveStatus === 'live') return 'bg-green-500';
    if (liveStatus === 'paused') return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getStatusText = () => {
    if (liveStatus === 'live') return 'LIVE';
    if (liveStatus === 'paused') return 'PAUSED';
    return 'STOPPED';
  };

// ðŸ” Always show pinned update on top
const sortedUpdates = [...updates].sort(
  (a, b) => (b.pinned === true) - (a.pinned === true)
);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      {showMediaSelector && (
        <MediaImagesSelector
          onSelect={(image) => {
            if (editorCallbackRef.current && editorCallbackRef.current.editor) {
            const imgContent = `<img src="${image.url}" alt="${image.altText || ''}" title="${image.title || ''}" />`;
            editorCallbackRef.current.editor.insertContent(imgContent);
            editorCallbackRef.current = null;
          } else if (typeof editorCallbackRef.current === 'function') {
            editorCallbackRef.current(image.url, { alt: image.altText, title: image.title });
            editorCallbackRef.current = null;
          } else {
            setFeaturedImage(image);
          }
            setShowMediaSelector(false);
          }}
          onClose={() => {
            setShowMediaSelector(false);
            editorCallbackRef.current = null;
          }}
        />
      )}

      {/* Top bar */}
      <div className={`flex items-center justify-between mb-6 p-4 ${panel}`}>
        <div className="flex items-center gap-4">
          <button 
  onClick={() => router.back()}
  className="flex items-center gap-2 text-gray-700 hover:text-black px-2 py-1 rounded-lg transition-colors"
>
  <ArrowLeft size={18} />
  <span className="font-medium">Back</span>
</button>
          <div className="text-sm text-gray-500">Create / Edit Live Blog</div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live controls styled like article topbar */}
<div
  className={`flex items-center gap-2 rounded-full border px-3 py-1 ${
    !hasEverBeenPublished ? "opacity-60 cursor-not-allowed" : ""
  }`}
>
  <span className="text-sm font-medium text-gray-700">Status:</span>

  <span
    className={`${getStatusColor()} text-white text-xs px-3 py-1 rounded-full font-bold`}
  >
    {getStatusText()}
  </span>

  {/* Start Live */}
  <button
    onClick={() => hasEverBeenPublished && setLiveStatus("live")}
    disabled={!hasEverBeenPublished || liveStatus === "live"}
    title={
      !hasEverBeenPublished
        ? "Publish the live blog first to start live updates"
        : "Start Live"
    }
    className="p-2 rounded-full hover:bg-green-50 disabled:opacity-50"
  >
    <Play size={16} className="text-green-600" />
  </button>

  {/* Stop Live */}
  <button
    onClick={() => hasEverBeenPublished && setLiveStatus("stopped")}
    disabled={!hasEverBeenPublished || liveStatus === "stopped"}
    title={
      !hasEverBeenPublished
        ? "Publish the live blog first to control live status"
        : "Stop Live"
    }
    className="p-2 rounded-full hover:bg-gray-50 disabled:opacity-50"
  >
    <Square size={16} className="text-gray-600" />
  </button>

  {/* Restart */}
  <button
    onClick={() => hasEverBeenPublished && setLiveStatus("live")}
    disabled={!hasEverBeenPublished}
    title={
      !hasEverBeenPublished
        ? "Publish the live blog first to restart live updates"
        : "Restart Live"
    }
    className="p-2 rounded-full hover:bg-blue-50 disabled:opacity-50"
  >
    <RotateCcw size={16} className="text-blue-600" />
  </button>
</div>

{/* Helper hint */}
{!hasEverBeenPublished && (
  <p className="text-xs text-gray-500 mt-1">
    Publish this live blog once to enable live status controls
  </p>
)}


          <button onClick={() => setShowPreview(true)} className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50">Preview</button>

          <button onClick={handleSaveDraft} className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full hover:bg-gray-200">Save Draft</button>

          <button onClick={handleSendForApproval} className="px-5 py-2 rounded-full shadow border" style={{ backgroundColor: 'white', color: 'rgb(24 94 253)', borderColor: 'rgb(24 94 253)' }}>Send for Approval</button>

          <button onClick={handleUpdate} className="px-5 py-2 rounded-full shadow border" style={{ backgroundColor: 'white', color: 'rgb(24 94 253)', borderColor: 'rgb(24 94 253)' }}>Update</button>
          <button onClick={handlePublish} className="px-5 py-2 rounded-full shadow" style={{ backgroundColor: 'rgb(24 94 253)', color: 'white' }}>Publish</button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <div className={`${panel} p-6 space-y-6`}>
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-6">
                <button onClick={() => setActiveTab('content')} className={`pb-2 ${activeTab === 'content' ? 'border-b-2 border-emerald-500 font-semibold' : 'text-gray-400'}`}>Content</button>
                <button onClick={() => setActiveTab('properties')} className={`pb-2 ${activeTab === 'properties' ? 'border-b-2 border-emerald-500 font-semibold' : 'text-gray-400'}`}>Properties</button>
              </div>
              <button 
                onClick={() => setIsContentExpanded(!isContentExpanded)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                aria-label={isContentExpanded ? 'Collapse section' : 'Expand section'}
              >
                {isContentExpanded ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 15l-6-6-6 6"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                )}
              </button>
            </div>

            {activeTab === 'content' && (
              <div className={`space-y-6 transition-all duration-300 ease-in-out ${isContentExpanded ? 'opacity-100 max-h-[5000px] overflow-visible' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Add title"
                    className={`w-full mt-2 px-4 py-3 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"}`}
                  />
                  <div className={`flex justify-between items-center mt-2 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    <div>{title.length}/60 characters</div>
                    <div>Preview: <span className="font-medium">{slug || 'live-blog-url-slug'}</span></div>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>URL Slug</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="live-blog-url-slug"
                    className={`w-full mt-2 p-3 rounded-lg border font-mono text-sm shadow-inner ${isDark ? "bg-gray-700 border-gray-600 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-600"}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Summary</label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Short summary..."
                    className={`w-full mt-2 p-3 rounded-xl border h-28 resize-none shadow-sm ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"}`}
                  />
                </div>

                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} block mb-2`}>Featured Image</label>

                  {!featuredImage ? (
                    <div className={`border-2 border-dashed ${isDark ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"} p-8 rounded-xl text-center hover:border-emerald-500/50 transition-colors group`}>
                      <div className="flex flex-col items-center gap-3">
                        <div className={`p-3 rounded-full ${isDark ? "bg-gray-700 text-gray-400" : "bg-white text-gray-400"} shadow-sm group-hover:scale-110 transition-transform`}>
                          <Upload size={24} />
                        </div>
                        <div className="space-y-1">
                          <p className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                            Upload or select image
                          </p>
                          <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                            Recommended size: 1200x675px (16:9)
                          </p>
                        </div>
                        <button
                          onClick={() => setShowMediaSelector(true)}
                          className="mt-2 text-sm text-emerald-500 font-medium hover:text-emerald-600"
                        >
                          Browse Library
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className={`relative aspect-video rounded-xl overflow-hidden border ${isDark ? "border-gray-700" : "border-gray-200"} group`}>
                        <Image
                          src={featuredImage.url}
                          alt={featuredImage.altText || 'Featured image'}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => setShowMediaSelector(true)}
                            className="p-2 bg-white/90 rounded-lg hover:bg-white text-gray-900 transition-colors shadow-lg"
                            title="Change image"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => setFeaturedImage(null)}
                            className="p-2 bg-red-500/90 rounded-lg hover:bg-red-500 text-white transition-colors shadow-lg"
                            title="Remove image"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2">
                        <input
                          type="text"
                          placeholder="Alt text (SEO)"
                          value={featuredImage.altText || ''}
                          onChange={(e) => setFeaturedImage({ ...featuredImage, altText: e.target.value })}
                          className={`text-xs w-full p-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-600"}`}
                        />
                        <input
                          type="text"
                          placeholder="Image caption"
                          value={featuredImage.caption || ''}
                          onChange={(e) => setFeaturedImage({ ...featuredImage, caption: e.target.value })}
                          className={`text-xs w-full p-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-600"}`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="border rounded-xl overflow-hidden">
                  <button 
                    type="button"
                    onClick={() => setIsContentExpanded(!isContentExpanded)}
                    className={`w-full flex justify-between items-center p-4 transition-colors ${isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-200" : "bg-gray-50 hover:bg-gray-100 text-gray-700"}`}
                  >
                    <span className="text-sm font-medium text-gray-700">Main Content</span>
                    <svg 
                      className={`w-5 h-5 text-gray-500 transform transition-transform ${isContentExpanded ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className={`${isContentExpanded ? 'block' : 'hidden'}`}>
                    <div className="p-4 border-t">
                      <Editor
                        apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                        value={content}
                        onEditorChange={(newValue) => setContent(newValue)}
                        init={{
                          height: 420,
                          menubar: true,
                          skin: isDark ? "oxide-dark" : "oxide",
                          content_css: isDark ? "dark" : "default",
                          plugins: 'link image media table lists code wordcount',
                          toolbar: 'blocks fontsize | bold italic | image media table link | alignleft aligncenter alignright | bullist numlist',
                          block_formats: 'Paragraph=p;Heading 1=h1;Heading 2=h2;Heading 3=h3;Heading 4=h4;Heading 5=h5',
                          image_caption: true,
                          image_title: true,
                          file_picker_callback: function (callback, value, meta) {
                          if (meta.filetype === 'image') {
                            if (window.tinymce && window.tinymce.activeEditor) {
                               window.tinymce.activeEditor.windowManager.close();
                               editorCallbackRef.current = { editor: window.tinymce.activeEditor };
                            } else {
                               editorCallbackRef.current = callback;
                            }
                            setShowMediaSelector(true);
                          }
                        },
                          content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; } h1 { font-size: 2em; }',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'properties' && (
              <div className="space-y-6">
                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Publish Date</label>
                  <input type="date" className={`w-full mt-2 p-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-100 text-gray-900"}`} value={publishDate} onChange={(e) => setPublishDate(e.target.value)} />
                </div>

                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Publish Time</label>
                  <input type="time" className={`w-full mt-2 p-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-100 text-gray-900"}`} value={publishTime} onChange={(e) => setPublishTime(e.target.value)} />
                </div>

                {/* AUTHOR */}
<div>
  <label className="text-sm font-medium text-gray-700">Author</label>

  <div className="relative mt-2" ref={authorDropdownRef}>
    {/* Trigger button */}
    <button
      type="button"
      onClick={() => handleAuthorDropdownToggle(!showAuthorDropdown)}
      className="w-full text-left p-2 rounded-lg border border-gray-100 flex items-center justify-between"
    >
      <span className={author ? 'text-gray-900' : 'text-gray-400'}>
  {author
    ? availableAuthors.find(a => a._id === author)?.name
    : 'Select Author'}
</span>
      <ChevronDown size={16} />
    </button>

    {/* Dropdown */}
    {showAuthorDropdown && (
      <div className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-lg ring-1 ring-gray-100 overflow-hidden">
        {/* Search */}
        <div className="p-3 border-b">
          <input
            type="text"
            placeholder="Search authors..."
            value={authorSearch}
            onChange={(e) => setAuthorSearch(e.target.value)}
            className="w-full p-2 rounded-md border"
          />
        </div>

        {/* List */}
        <div className="max-h-48 overflow-y-auto">
          {filteredAuthors.length > 0 ? (
            filteredAuthors.map((a) => (
              <button
                key={a._id}
                type="button"
                onClick={() => {
                  setAuthor(a._id);
                  handleAuthorDropdownToggle(false);
                }}
                className={`w-full text-left px-4 py-3 hover:bg-emerald-50 ${
                  author === a._id ? "bg-emerald-50 font-medium" : ""
                }`}
              >
                {a.name}
              </button>
            ))
          ) : (
            <div className="p-4 text-sm text-gray-500">
              No authors found
            </div>
          )}
        </div>
      </div>
    )}
  </div>
</div>

                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Categories</label>
                  <div className="relative mt-2" ref={categoriesDropdownRef}>
                    <button onClick={() => handleCategoriesDropdownToggle(!showCategoriesDropdown)} className={`w-full text-left p-2 rounded-lg border flex items-center justify-between ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-100 text-gray-900"}`}>
                      <span className={categories.length > 0 ? (isDark ? "text-white" : "text-gray-900") : "text-gray-400"}>{getSelectedCategoriesText()}</span>
                      <ChevronDown size={16} />
                    </button>

                    {showCategoriesDropdown && (
                      <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg ring-1 ring-gray-100 overflow-hidden">
                        <div className="p-3 border-b">
                          <input type="text" placeholder="Search categories..." value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} className="w-full p-2 rounded-md border" />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredCategories.length > 0 ? filteredCategories.map((c) => (
                            <label key={c._id} className="flex items-center gap-2 px-4 py-3 hover:bg-emerald-50 cursor-pointer">
                              <input type="checkbox" checked={categories.includes(c._id)} onChange={() => toggleCategory(c._id)} className="w-4 h-4" />
                              <span>{c.name}</span>
                            </label>
                          )) : <div className="p-4 text-sm text-gray-500">No categories found</div>}
                        </div>
                      </div>
                    )}
                  </div>

                  {categories.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {categories.map(catId => {
                        const cat = availableCategories.find(c => c._id === catId);
                        return cat ? (
                          <span key={catId} className="bg-emerald-50 text-emerald-700 text-xs px-3 py-1 rounded-full flex items-center gap-2">{cat.name}<button onClick={() => toggleCategory(catId)} className="text-emerald-600"><X size={12} /></button></span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Tags</label>
                  <div className="relative mt-2" ref={tagsDropdownRef}>
                    <button onClick={() => handleTagsDropdownToggle(!showTagsDropdown)} className={`w-full text-left p-2 rounded-lg border flex items-center justify-between ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-100 text-gray-900"}`}>
                      <span className={tags.length > 0 ? (isDark ? "text-white" : "text-gray-900") : "text-gray-400"}>{getSelectedTagsText()}</span>
                      <ChevronDown size={16} />
                    </button>

                    {showTagsDropdown && (
                      <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg ring-1 ring-gray-100 overflow-hidden">
                        <div className="p-3 border-b">
                          <input type="text" placeholder="Search tags..." value={tagSearch} onChange={(e) => setTagSearch(e.target.value)} className="w-full p-2 rounded-md border" />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredTags.length > 0 ? filteredTags.map((t) => (
                            <label key={t._id} className="flex items-center gap-2 px-4 py-3 hover:bg-emerald-50 cursor-pointer">
                              <input type="checkbox" checked={tags.includes(t._id)} onChange={() => toggleTag(t._id)} className="w-4 h-4" />
                              <span>#{t.name}</span>
                            </label>
                          )) : <div className="p-4 text-sm text-gray-500">No tags found</div>}
                        </div>
                      </div>
                    )}
                  </div>

                  {tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tags.map(tagId => {
                        const tag = availableTags.find(t => t._id === tagId);
                        return tag ? (
                          <span key={tagId} className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">#{tag.name}<button onClick={() => toggleTag(tagId)} className="ml-2"><X size={12} /></button></span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Meta Title</label>
                  <input className={`w-full mt-2 p-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-100 text-gray-900"}`} value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Leave empty to use live blog title" />
                </div>

                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Meta Description</label>
                  <textarea className={`w-full mt-2 p-3 rounded-lg border h-24 ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-100 text-gray-900"}`} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} placeholder="SEO meta description..." />
                  <div className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{metaDescription.length}/160 characters</div>
                </div>

                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Schema (JSON-LD)</label>
                  <textarea className={`w-full mt-2 p-3 rounded-lg border h-32 font-mono ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-100 text-gray-900"}`} value={schema} onChange={(e) => setSchema(e.target.value)} placeholder='{"@context":"https://schema.org", "@type":"LiveBlogPosting"...}' />
                </div>
              </div>
            )}
          </div>

          {/* Live Updates Panel styled like Article Editor */}
          <div className={`${panel} p-6 mt-6`} ref={liveUpdatesRef}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Live Updates ({updates.length})</h2>
              <button
  type="button"
  disabled={!hasEverBeenPublished}
  onClick={() => {
    setActiveTab("content");
    setShowAddUpdate(true);
    setTimeout(() => {
      liveUpdatesRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }}
  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
    hasEverBeenPublished
      ? "bg-blue-600 text-white hover:bg-blue-700"
      : "bg-gray-300 text-gray-500 cursor-not-allowed"
  }`}
>
  <Plus size={18} /> Add Update
</button>

            </div>

            {showAddUpdate && (
              <div className="mb-6 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                <h3 className="font-semibold mb-3">{editingUpdateId ? 'Edit Update' : 'New Update'}</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  editingUpdateId ? handleUpdateEdit() : handleAddUpdate();
                }} className="space-y-3">
                  <div>
                    <label className="font-medium text-sm">Update Title</label>
                    <input 
                      className="w-full border p-2 rounded mt-1" 
                      placeholder="Breaking: Latest development..." 
                      value={updateTitle} 
                      onChange={(e) => setUpdateTitle(e.target.value)} 
                      required
                    />
                  </div>
                  <div>
                    <label className="font-medium text-sm">Update Content</label>
                    <div className="mt-1">
                      <Editor
                        apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                        value={updateContent}
                        onEditorChange={(newValue) => setUpdateContent(newValue)}
                        init={{
                          height: 200,
                          menubar: false,
                          skin: isDark ? "oxide-dark" : "oxide",
                          content_css: isDark ? "dark" : "default",
                          plugins: 'link image media table lists code wordcount',
                          toolbar: 'blocks fontsize | bold italic | image media table link | alignleft aligncenter alignright | bullist numlist',
                          block_formats: 'Paragraph=p;Heading 1=h1;Heading 2=h2;Heading 3=h3;Heading 4=h4;Heading 5=h5',
                          image_caption: true,
                          image_title: true,
                          file_picker_callback: function (callback, value, meta) {
                          if (meta.filetype === 'image') {
                            if (window.tinymce && window.tinymce.activeEditor) {
                               window.tinymce.activeEditor.windowManager.close();
                               editorCallbackRef.current = { editor: window.tinymce.activeEditor };
                            } else {
                               editorCallbackRef.current = callback;
                            }
                            setShowMediaSelector(true);
                          }
                        },
                          content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; } h1 { font-size: 2em; }',
                        }}
                      />
                    </div>
                  </div>

{/* Update area buttons */}
                  <div className="flex gap-2">
                    <button 
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      {editingUpdateId ? 'Update' : 'Add Update'}
                    </button>
                    <button 
                      type="button"
                      onClick={handleCancelUpdate} 
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

           {updates.length === 0 ? (
  <div className="text-center py-12 text-gray-500">
    <p className="mb-2">No updates yet</p>

    {!hasEverBeenPublished ? (
      <p className="text-sm text-gray-400">
        Publish the live blog once to enable live updates
      </p>
    ) : (
      <p className="text-sm">
        Click "Add Update" to create your first live update
      </p>
    )}
  </div>
) : (

  <>
    {/* Display sorted updates with pinned ones on top */}
    <div className="space-y-3">
      {sortedUpdates.map((u) => (
        <div
          key={u._id}
          className={`border rounded-xl p-4 relative ${
            u.pinned ? 'ring-2 ring-emerald-500 bg-emerald-50/40' : ''
          }`}
        >
          {/* Pin Button */}
          <button
            onClick={() => togglePinUpdate(u._id)}
            className="absolute top-2 right-2 text-xs px-3 py-1 rounded-full border bg-white hover:bg-gray-100 shadow-sm"
          >
            {u.pinned ? 'Unpin' : 'Pin'}
          </button>

          <h3 className="font-semibold text-lg">{u.title}</h3>

          <div
            className="text-sm text-gray-600 mt-1"
            dangerouslySetInnerHTML={{ __html: u.content }}
          />

          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => handleEditUpdate(u._id)}
              className="text-blue-600 text-sm flex items-center gap-1"
            >
              <Edit2 size={14} /> Edit
            </button>

            <button
              onClick={() => handleDeleteUpdate(u._id)}
              className="text-red-600 text-sm flex items-center gap-1"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  </>
)}
        </div>
      </div>


        {/* SEO panel */}
        <div className="col-span-4">
          <div className={`${panel} p-6 sticky top-6`}>
            <h2 className="font-semibold text-lg mb-4">SEO Analysis</h2>

            <div className="mb-4">
              <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Focus Keyword</label>
              <input className={`w-full mt-2 p-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-100 text-gray-900"}`} placeholder="Enter keyword..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>

            <div className={`mb-6 p-4 rounded-lg shadow-inner ${isDark ? "bg-gray-800" : "bg-white"}`}>
              <h3 className="font-medium text-sm text-gray-500 mb-3">SEO Score</h3>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getSEOColor()}`}>
                    <div className="text-sm font-bold text-white">{seoScore}</div>
                  </div>
                </div>
                <div>
                  <div className={`text-sm font-semibold ${getSEOTextColor()}`}>{getSEORating()}</div>
                  <div className="text-xs text-gray-500">out of 100</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${getSEOColor()}`} style={{ width: `${seoScore}%` }} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">SEO Checklist</h3>
              <div className="space-y-3">
                {seoChecks.map((check, i) => (
                  <div key={i} className="flex items-start gap-3">
                    {check.status === 'success' && <CheckCircle2 size={18} className="text-green-600 mt-0.5" />}
                    {check.status === 'warning' && <AlertCircle size={18} className="text-yellow-500 mt-0.5" />}
                    {check.status === 'error' && <XCircle size={18} className="text-red-600 mt-0.5" />}
                    <div className={`text-sm ${check.status === 'success' ? (isDark ? "text-gray-300" : "text-gray-700") : check.status === 'warning' ? "text-yellow-700" : "text-red-700"}`}>{check.text}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPreview(false)} />
          <div className="relative z-10 w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Live Blog Preview</h3>
              <button onClick={() => setShowPreview(false)} className="p-2 rounded hover:bg-gray-100"><X size={18} /></button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {featuredImage && (
                <div className="mb-6 rounded-lg overflow-hidden">
                  <Image src={featuredImage.url} alt={featuredImage.altText || 'Featured'} width={1280} height={720} className="w-full h-auto" />
                </div>
              )}

              <div className="mb-4">
                {categories.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    {categories.map(catId => {
  const cat = availableCategories.find(c => c._id === catId);
  return cat ? (
    <span key={catId} className="bg-emerald-50 text-emerald-700 text-xs px-2 py-1 rounded">
      {cat.name}
    </span>
  ) : null;
})}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 mb-4">
                <span className={`${getStatusColor()} text-white text-xs px-3 py-1 rounded-full font-bold animate-pulse`}>{getStatusText()}</span>
                <h1 className="text-3xl font-bold">{title || 'Untitled Live Blog'}</h1>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
  {author && (
    <span>
      By {availableAuthors.find(a => a._id === author)?.name || "Unknown author"}
    </span>
  )}
  <span>â€¢</span>
  <span>
    {new Date(publishDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}
  </span>
</div>


              {summary && <p className="text-lg text-gray-600 italic mb-6 border-l-4 border-emerald-500 pl-4">{summary}</p>}

              <div className="prose max-w-none mb-8" dangerouslySetInnerHTML={{ __html: content || '<p>No content yet...</p>' }} />

              {sortedUpdates.length > 0 && (
  <div className="border-t pt-6">
    <h2 className="text-2xl font-bold mb-4">Live Updates</h2>

    <div className="space-y-4">
      {sortedUpdates.map(u => (
        <div
          key={u._id}
          className={`border-l-4 pl-4 py-3 ${
            u.pinned
              ? 'border-emerald-500 bg-emerald-50/40'
              : 'border-blue-500'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {u.pinned && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                PINNED
              </span>
            )}
            <span className="text-xs text-gray-500">
              {new Date(u.timestamp).toLocaleString()}
            </span>
          </div>

          <h3 className="font-bold text-lg mb-2">{u.title}</h3>

          <div
            className="prose"
            dangerouslySetInnerHTML={{ __html: u.content }}
          />
        </div>
      ))}
    </div>
  </div>
)}


              {tags.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <p className="text-sm font-semibold text-gray-600 mb-2">Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tagId => {
  const tag = availableTags.find(t => t._id === tagId);
  if (!tag) return null;

  return (
    <span
      key={tagId}
      className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full"
    >
      #{tag.name}
      <button onClick={() => toggleTag(tagId)} className="ml-2"><X size={12} /></button>
    </span>
  );
})}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <button onClick={() => setShowPreview(false)} className="px-4 py-2 rounded-md bg-white border">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}




