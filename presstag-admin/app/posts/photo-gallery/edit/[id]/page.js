///posts/photo-gallery/edit/[id]/page.js | Main page component for creating and editing photo galleries in the PressTag CMS admin panel. Handles form state, API interactions, image management, SEO analysis, and media selection.///
'use client';

import { useRouter, useParams } from 'next/navigation';
import { useTheme } from '../../../../context/ThemeContext';
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ChevronDown, Upload, CheckCircle2, XCircle, AlertCircle, X, Image as ImageIcon } from 'lucide-react';
import MediaImagesSelector from '../../../../media/MediaImagesSelector';
import { posts } from '../../../../../lib/api';
import { getUsers, getCategories, getTags } from '../../../../../lib/api';


export default function PhotoGalleryEditorPage() {
  const { isDark } = useTheme();
  const params = useParams();
  const postId = params?.id;
  // Author, Categories, Tags state and dropdowns (copied from article editor)
  const [author, setAuthor] = useState('');
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [availableAuthors, setAvailableAuthors] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [authorSearch, setAuthorSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);
  const authorDropdownRef = useRef(null);
  const categoriesDropdownRef = useRef(null);
  const tagsDropdownRef = useRef(null);
  const router = useRouter();
  
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  useEffect(() => {
  const fetchDropdownData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [usersRes, catRes, tagRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tags`, { headers }),
      ]);

      const usersData = await usersRes.json();
      const catData = await catRes.json();
      const tagData = await tagRes.json();

      setAvailableAuthors(Array.isArray(usersData.users) ? usersData.users : (Array.isArray(usersData.data) ? usersData.data : (Array.isArray(usersData) ? usersData : [])));
      setAvailableCategories(Array.isArray(catData.categories) ? catData.categories : (Array.isArray(catData.data) ? catData.data : (Array.isArray(catData) ? catData : [])));
      setAvailableTags(Array.isArray(tagData.tags) ? tagData.tags : (Array.isArray(tagData.data) ? tagData.data : (Array.isArray(tagData) ? tagData : [])));
    } catch (err) {
      console.error('Failed to load dropdown data', err);
    }
  };

  fetchDropdownData();
}, []);

  // Filtering helpers
  const filteredAuthors = Array.isArray(availableAuthors) ? availableAuthors.filter(a => a?.name?.toLowerCase().includes(authorSearch.toLowerCase())) : [];
  const filteredCategories = Array.isArray(availableCategories) ? availableCategories.filter(c => c?.name?.toLowerCase().includes(categorySearch.toLowerCase())) : [];
  const filteredTags = Array.isArray(availableTags) ? availableTags.filter(t => t?.name?.toLowerCase().includes(tagSearch.toLowerCase())) : [];
  // Dropdown toggle helpers
  const handleAuthorDropdownToggle = (value) => { setShowAuthorDropdown(value); if (!value) setAuthorSearch(''); };
  const handleCategoriesDropdownToggle = (value) => { setShowCategoriesDropdown(value); if (!value) setCategorySearch(''); };
  const handleTagsDropdownToggle = (value) => { setShowTagsDropdown(value); if (!value) setTagSearch(''); };
  // Multi-select helpers
  const toggleCategory = (id) => { setCategories(prev => prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]); };
  const toggleTag = (id) => { setTags(prev => prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]); };
  // Display helpers
const getSelectedCategoriesText = () =>
  categories.length === 0
    ? 'Select Categories'
    : categories
        .map(cid => availableCategories.find(c => c._id === cid)?.name)
        .filter(Boolean)
        .join(', ');
const getSelectedTagsText = () =>
  tags.length === 0
    ? 'Select Tags'
    : tags
        .map(tid => {
          const tag = availableTags.find(t => t._id === tid);
          return tag ? `#${tag.name}` : null;
        })
        .filter(Boolean)
        .join(', ');
  const [activeTab, setActiveTab] = useState('content');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [postStatus, setPostStatus] = useState('draft');
  const [summary, setSummary] = useState('');
  const [images, setImages] = useState([]); // [{url, description, file, altText}]
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [publishDate, setPublishDate] = useState('');
  const [publishTime, setPublishTime] = useState('');
  const [featuredImage, setFeaturedImage] = useState(null);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [showGalleryMediaSelector, setShowGalleryMediaSelector] = useState(false);

  // SEO fields
  const [keyword, setKeyword] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [seoScore, setSeoScore] = useState(0);
  const [seoChecks, setSeoChecks] = useState([]);

  // Helper: Strip HTML tags for content analysis
  const stripHtml = (html) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Helper: Count words
  const countWords = (text) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Helper: Calculate keyword density
  const calculateKeywordDensity = (text, keyword) => {
    if (!keyword) return 0;
    const words = countWords(text);
    const keywordRegex = new RegExp(keyword, 'gi');
    const matches = text.match(keywordRegex);
    return words > 0 ? ((matches?.length || 0) / words) * 100 : 0;
  };


  useEffect(() => {
    const checks = [];
    let score = 0;
    const maxScore = 100;
    const allDescriptions = images.map(img => img.description || '').join(' ');
    const allAltTexts = images.map(img => img.altText || '').join(' ');
    const plainContent = stripHtml(allDescriptions);
    const wordCount = countWords(plainContent);
    const keywordLower = (keyword || '').toLowerCase();

    // 1. Focus Keyword (5)
    if (!keyword) {
      checks.push({ status: 'error', text: 'Add a focus keyword' });
    } else {
      checks.push({ status: 'success', text: 'Focus keyword set' });
      score += 5;
    }

    // 2. Title Length (10)
    if (title.length === 0) {
      checks.push({ status: 'error', text: 'Add a gallery title' });
    } else if (title.length < 30) {
      checks.push({ status: 'warning', text: 'Title is too short (min 30 chars)' });
      score += 5;
    } else if (title.length > 60) {
      checks.push({ status: 'warning', text: `Title is too long (${title.length}/60 chars)` });
      score += 5;
    } else {
      checks.push({ status: 'success', text: `Title length is good (${title.length}/60 chars)` });
      score += 10;
    }

    // 3. Keyword in Title (10)
    if (keyword && title.toLowerCase().includes(keywordLower)) {
      checks.push({ status: 'success', text: 'Keyword appears in title' });
      score += 10;
    } else if (keyword) {
      checks.push({ status: 'error', text: 'Keyword not found in title' });
    }

    // 4. Meta Description Length (10)
    if (metaDescription.length === 0) {
      checks.push({ status: 'error', text: 'Add a meta description' });
    } else if (metaDescription.length < 120) {
      checks.push({ status: 'warning', text: 'Meta description is too short (min 120 chars)' });
      score += 5;
    } else if (metaDescription.length > 160) {
      checks.push({ status: 'warning', text: `Meta description too long (${metaDescription.length}/160 chars)` });
      score += 5;
    } else {
      checks.push({ status: 'success', text: `Meta description length is good (${metaDescription.length}/160 chars)` });
      score += 10;
    }

    // 5. Keyword in Meta Description (10)
    if (keyword && metaDescription.toLowerCase().includes(keywordLower)) {
      checks.push({ status: 'success', text: 'Keyword appears in meta description' });
      score += 10;
    } else if (keyword && metaDescription) {
      checks.push({ status: 'error', text: 'Keyword not in meta description' });
    }

    // 6. Gallery Description Length (10)
    if (wordCount === 0) {
      checks.push({ status: 'error', text: 'Add descriptions to your images' });
    } else if (wordCount < 50) {
      checks.push({ status: 'warning', text: `Descriptions are too short (${wordCount} words, min 50)` });
      score += 5;
    } else if (wordCount < 150) {
      checks.push({ status: 'warning', text: `Descriptions length is acceptable (${wordCount} words)` });
      score += 7;
    } else {
      checks.push({ status: 'success', text: `Good description length (${wordCount} words)` });
      score += 10;
    }

    // 7. Keyword in First Image Description (8)
    const firstDesc = (images[0]?.description || '').toLowerCase();
    if (keyword && firstDesc.includes(keywordLower)) {
      checks.push({ status: 'success', text: 'Keyword appears in first image description' });
      score += 8;
    } else if (keyword && firstDesc) {
      checks.push({ status: 'warning', text: 'Keyword not in first image description' });
      score += 3;
    }

    // 8. Keyword Density (7)
    if (keyword && plainContent) {
      const density = calculateKeywordDensity(plainContent, keyword);
      if (density < 0.5) {
        checks.push({ status: 'warning', text: `Keyword density too low (${density.toFixed(2)}%)` });
        score += 3;
      } else if (density > 2.5) {
        checks.push({ status: 'warning', text: `Keyword density too high (${density.toFixed(2)}%, may look spammy)` });
        score += 3;
      } else {
        checks.push({ status: 'success', text: `Keyword density is good (${density.toFixed(2)}%)` });
        score += 7;
      }
    }

    // 9. Alt Texts (8)
    if (images.length > 0) {
      const withAlt = images.filter(img => img.altText && img.altText.length > 0).length;
      if (withAlt === images.length) {
        checks.push({ status: 'success', text: 'All images have alt text' });
        score += 8;
      } else if (withAlt > 0) {
        checks.push({ status: 'warning', text: `Some images missing alt text (${withAlt}/${images.length})` });
        score += 4;
      } else {
        checks.push({ status: 'error', text: 'No images have alt text' });
      }
    }

    // 10. URL Slug (5)
    if (!slug) {
      checks.push({ status: 'error', text: 'Add a URL slug' });
    } else if (slug.length > 75) {
      checks.push({ status: 'warning', text: 'URL slug is too long' });
      score += 2;
    } else if (keyword && slug.includes(keyword.toLowerCase().replace(/\s+/g, '-'))) {
      checks.push({ status: 'success', text: 'Keyword appears in URL slug' });
      score += 5;
    } else if (slug) {
      checks.push({ status: 'warning', text: 'Keyword not in URL slug' });
      score += 3;
    }

    setSeoScore(Math.min(score, maxScore));
    setSeoChecks(checks);
  }, [keyword, title, metaDescription, slug, images]);

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
  const fileInputRef = useRef(null);

  useEffect(() => {
    const now = new Date();
    setPublishDate(now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }));
    setPublishTime(now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }));
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId || postId === 'new') return;
      try {
        const response = await posts.getById(postId);
        if (!response || response.error) return;
        setTitle(response.title || '');
        setSlug(response.slug || '');
        setPostStatus(response.status || 'draft');
        setSummary(response.summary || response.excerpt || '');
        setFeaturedImage(response.featuredImage || null);
        const galleryImages = Array.isArray(response.images) ? response.images : [];
        setImages(galleryImages.map(img => ({
          url: img.url,
          heading: img.heading || '',
          caption: img.caption || '',
          description: img.description || '',
          altText: img.altText || ''
        })));
        if (response.author) {
          const authId = typeof response.author === 'object' ? (response.author._id || response.author.id) : response.author;
          setAuthor(String(authId));
        }
        if (Array.isArray(response.categories)) {
          const catIds = response.categories.map(c => (typeof c === 'object' && c !== null ? (c._id || c.id) : c)).filter(Boolean);
          setCategories(catIds);
        }
        if (Array.isArray(response.tags)) {
          const tagIds = response.tags.map(t => (typeof t === 'object' && t !== null ? (t._id || t.id) : t)).filter(Boolean);
          setTags(tagIds);
        }
        if (response.publishedAt) {
          const d = new Date(response.publishedAt);
          setPublishDate(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }));
          setPublishTime(d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }));
        } else {
          if (response.publishDate) setPublishDate(response.publishDate);
          if (response.publishTime) setPublishTime(response.publishTime);
        }
        setMetaTitle(response.seo?.metaTitle || response.metaTitle || '');
        setMetaDescription(response.seo?.metaDescription || response.metaDescription || '');
        setKeyword(response.seo?.focusKeyword || '');
        setSeoScore(response.seoScore || 0);
      } catch (err) {
        console.error('Failed to load gallery post', err);
      }
    };
    fetchPost();
  }, [postId]);

  useEffect(() => {
    // Stop automation if published
    if (postStatus === 'published') return;
    
    if (title) {
      const autoSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(autoSlug);
    }
  }, [title, postStatus]);

  const buildGalleryPayload = (status) => {
  return {
    type: 'photo-gallery',

    title,
    slug,
    summary,

    images: images.map(img => ({
      url: img.url,
      heading: img.heading,
      caption: img.caption,
      description: img.description,
      altText: img.altText,
    })),

    featuredImage: featuredImage
      ? {
          url: featuredImage.url,
          altText: featuredImage.altText || '',
          caption: featuredImage.caption || '',
        }
      : null,

    author,
    categories,
    tags,

    seo: {
      metaTitle: metaTitle || title,
      metaDescription,
      focusKeyword: keyword,
    },

    seoScore,

    publishDate,
    publishTime,
    
    status, // 'draft' | 'pending' | 'published'
  };
};


  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      heading: '',
      caption: '',
      description: '',
      altText: ''
    }));
    setImages(prev => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateImage = (idx, patch) => {
    setImages(prev => prev.map((img, i) => i === idx ? { ...img, ...patch } : img));
  };

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragEnter = (e, index) => {
    setDraggedOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex === null || draggedOverIndex === null || draggedIndex === draggedOverIndex) {
      setDraggedIndex(null);
      setDraggedOverIndex(null);
      return;
    }
    setImages(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(draggedIndex, 1);
      arr.splice(draggedOverIndex, 0, moved);
      return arr;
    });
    setDraggedIndex(null);
    setDraggedOverIndex(null);
  };

  // Modern UI helpers
  const panel = `backdrop-blur-sm rounded-2xl shadow-md transition-colors duration-200 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white/80 ring-1 ring-gray-100'}`;

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDark ? "bg-gray-900" : "bg-gradient-to-b from-slate-50 to-white"} p-6`}>
      {/* Top bar */}
      <div className={`flex items-center justify-between mb-6 p-4 ${panel}`}>
        <div className="flex items-center gap-4">
          <button 
  onClick={() => router.back()}
  className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-colors ${isDark ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-black"}`}
>
  <ArrowLeft size={18} />
  <span className="font-medium">Back</span>
</button>
          <div className="text-sm text-gray-500">Create / Edit Photo Gallery</div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(true)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${isDark ? "border-gray-600 text-white hover:bg-gray-700" : "hover:bg-gray-50 text-gray-700"}`}
          >
            Preview
          </button>
          <button
  onClick={async () => {
    try {
      const payload = buildGalleryPayload('draft');
      if (postId) {
        await posts.update(postId, payload);
      } else {
        await posts.create(payload);
      }
      alert('Draft saved');
      router.push('/posts');
    } catch (err) {
      alert('Failed to save draft');
      console.error(err);
    }
  }}
  className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full hover:bg-gray-200"
>
  Save Draft
</button>

          <button
  onClick={async () => {
    try {
      const payload = buildGalleryPayload('pending');
      if (postId) {
        await posts.update(postId, payload);
      } else {
        await posts.create(payload);
      }
      alert('Sent for approval');
      router.push('/posts');
    } catch (err) {
      alert('Failed to send for approval');
      console.error(err);
    }
  }}
  className="px-5 py-2 rounded-full shadow border transition-colors"
  style={isDark ? { backgroundColor: 'transparent', color: 'white', borderColor: 'rgb(75 85 99)' } : { backgroundColor: 'white', color: 'rgb(24 94 253)', borderColor: 'rgb(24 94 253)' }}
>
  Send for Approval
</button>

          <button
            onClick={async () => {
              try {
                if (!postId) {
                  alert('Open an existing gallery to update');
                  return;
                }

                const payload = buildGalleryPayload('published');

                await posts.update(postId, payload);
                alert('Gallery updated');
              } catch (err) {
                alert('Failed to update gallery');
                console.error(err);
              }
            }}
            className="px-5 py-2 rounded-full shadow border"
            style={{ backgroundColor: 'white', color: 'rgb(24 94 253)', borderColor: 'rgb(24 94 253)' }}
          >
            Update
          </button>
          <button
            onClick={async () => {
              try {
                // Update publish date to now
                const now = new Date();
                const currentDate = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
                const currentTime = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
                
                setPublishDate(currentDate);
                setPublishTime(currentTime);

                const payload = buildGalleryPayload('published');
                // Explicitly override date/time in payload
                payload.publishDate = currentDate;
                payload.publishTime = currentTime;
                payload.publishedAt = now.toISOString();

                if (postId) {
                  await posts.update(postId, payload);
                } else {
                  await posts.create(payload);
                }
                alert('Photo Gallery published');
                router.push('/posts/published');
              } catch (err) {
                alert('Failed to publish gallery');
                console.error(err);
              }
            }}
            className="px-5 py-2 rounded-full shadow"
            style={{ backgroundColor: 'rgb(24 94 253)', color: 'white' }}
          >
            Publish
          </button>

        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b pb-4 mb-6">
        <button onClick={() => setActiveTab('content')} className={`pb-2 ${activeTab === 'content' ? 'border-b-2 border-emerald-500 font-semibold ' + (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-300' : 'text-gray-400')}`}>Content</button>
        <button onClick={() => setActiveTab('properties')} className={`pb-2 ${activeTab === 'properties' ? 'border-b-2 border-emerald-500 font-semibold ' + (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-300' : 'text-gray-400')}`}>Properties</button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <div className={`${panel} p-6 space-y-6`}>
            {activeTab === 'content' && (
              <>
                {/* Featured Image Section */}
                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} block mb-2`}>Featured Image</label>
                  {!featuredImage ? (
                    <div className={`border-2 border-dashed p-8 rounded-xl text-center hover:border-emerald-300 transition ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                      <button
                        onClick={() => setShowMediaSelector(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-md shadow border transition-all"
                        style={{ backgroundColor: 'rgb(24 94 253)', color: 'white', borderColor: 'rgb(24 94 253)' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = 'rgb(24 94 253)'; e.currentTarget.style.borderColor = 'rgb(24 94 253)'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgb(24 94 253)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'rgb(24 94 253)'; }}
                      >
                        <Upload size={16} /> Upload / Choose from Library
                      </button>
                      {images.length > 0 && (
                        <div className="mt-4">
                          <div className="text-xs text-gray-500 mb-2">Or pick from uploaded gallery images:</div>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {images.map((img, idx) => (
                              <button key={idx} onClick={() => setFeaturedImage(img)} className="border rounded-lg overflow-hidden w-20 h-14 flex items-center justify-center bg-gray-50 hover:ring-2 ring-emerald-400">
                                <img src={img.url} alt={img.altText || 'gallery'} className="object-cover w-full h-full" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                    <div className="relative rounded-xl overflow-hidden border mb-4">
                      <img src={featuredImage.url} alt={featuredImage.altText || 'Featured'} className="w-full h-48 object-cover bg-gray-50" />
                      <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 hover:opacity-100 transition-opacity bg-black/30">
                        <button onClick={() => setShowMediaSelector(true)} className="bg-white text-gray-800 px-4 py-2 rounded-md">Change</button>
                        <button onClick={() => setFeaturedImage(null)} className="bg-red-600 text-white px-4 py-2 rounded-md">Remove</button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent text-white text-sm">
                        <div className="truncate">{featuredImage.name || featuredImage.fileName || 'Gallery Image'}</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className={`text-xs font-medium mb-1 block ${isDark ? "text-gray-400" : "text-gray-500"}`}>Image Caption</label>
                      <input 
                        type="text" 
                        className={`w-full p-2 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400"}`}
                        placeholder="Add a caption for this image..."
                        value={featuredImage.caption || ''}
                        onChange={(e) => setFeaturedImage({ ...featuredImage, caption: e.target.value })}
                      />
                    </div>
                    </>
                  )}
                </div>
                        {/* Media Selector Modal */}
                        {showMediaSelector && (
                          <MediaImagesSelector
                            onSelect={img => { setFeaturedImage(img); setShowMediaSelector(false); }}
                            onClose={() => setShowMediaSelector(false)}
                          />
                        )}
                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Gallery Title</label>
                  <input
                    className={`w-full mt-2 p-3 rounded-xl border shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "border-gray-200"}`}
                    placeholder="Write the gallery title..."
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <div>{title.length}/60 characters</div>
                    <div className="text-xs">Preview: <span className="font-medium">{slug || 'gallery-url-slug'}</span></div>
                  </div>
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>URL Slug</label>
                  <input
                    className={`w-full mt-2 p-3 rounded-lg border font-mono text-sm shadow-inner ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "border-gray-100"}`}
                    placeholder="gallery-url-slug"
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                  />
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Summary</label>
                  <textarea
                    className={`w-full mt-2 p-3 rounded-xl border h-28 resize-none shadow-sm ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "border-gray-100"}`}
                    placeholder="Short summary..."
                    value={summary}
                    onChange={e => setSummary(e.target.value)}
                  />
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} block mb-2`}>Gallery Images</label>
                  <button
                    onClick={() => setShowGalleryMediaSelector(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md shadow border transition-all bg-[rgb(24_94_253)] text-white border-[rgb(24_94_253)] hover:bg-white hover:text-[rgb(24_94_253)]"
                  >
                    <Upload size={16} /> Upload Images
                  </button>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={handleDragOver}
                        onDragEnter={(e) => handleDragEnter(e, idx)}
                        onDragEnd={handleDragEnd}
                        className={`relative rounded-xl overflow-hidden border shadow-sm p-2 flex flex-col transition-all ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} ${
                          draggedOverIndex === idx && draggedIndex !== idx ? 'ring-2 ring-emerald-500 bg-emerald-50' : 'ring-1 ring-gray-100'
                        } ${draggedIndex === idx ? 'opacity-60' : ''}`}
                      >
                        <img src={img.url} alt={img.altText || 'gallery'} className="w-full h-48 object-cover rounded-lg mb-2" />
                        <input
                          className={`w-full p-2 rounded border text-sm mb-2 font-bold ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "border-gray-200"}`}
                          placeholder="Heading (optional)"
                          value={img.heading || ''}
                          onChange={e => updateImage(idx, { heading: e.target.value })}
                        />
                        <input
                          className={`w-full p-2 rounded border text-sm mb-2 ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "border-gray-200"}`}
                          placeholder="Caption"
                          value={img.caption || ''}
                          onChange={e => updateImage(idx, { caption: e.target.value })}
                        />
                        <textarea
                          className={`w-full p-2 rounded border text-sm mb-2 ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "border-gray-200"}`}
                          placeholder="Describe this image..."
                          value={img.description}
                          onChange={e => updateImage(idx, { description: e.target.value })}
                        />
                        <input
                          className={`w-full p-2 rounded border text-sm mb-2 ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "border-gray-200"}`}
                          placeholder="Alt text (for SEO)"
                          value={img.altText}
                          onChange={e => updateImage(idx, { altText: e.target.value })}
                        />
                        <button onClick={() => removeImage(idx)} className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700"><X size={16} /></button>
                      </div>
                    ))}
                  </div>
                  {showGalleryMediaSelector && (
                    <MediaImagesSelector
                      onSelect={img => {
                        setImages(prev => [...prev, img]);
                        setShowGalleryMediaSelector(false);
                      }}
                      onClose={() => setShowGalleryMediaSelector(false)}
                    />
                  )}
                </div>
              </>
            )}
            {activeTab === 'properties' && (
              <div className="space-y-6">
                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Publish Date</label>
                  <input type="date" className={`w-full mt-2 p-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "border-gray-100"}`} value={publishDate} onChange={e => setPublishDate(e.target.value)} />
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Publish Time</label>
                  <input type="time" className={`w-full mt-2 p-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "border-gray-100"}`} value={publishTime} onChange={e => setPublishTime(e.target.value)} />
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Author</label>
                  <div className="relative mt-2" ref={authorDropdownRef}>
                    <button type="button" onClick={() => handleAuthorDropdownToggle(!showAuthorDropdown)} className={`w-full text-left p-2 rounded-lg border flex items-center justify-between ${isDark ? "bg-gray-700 border-gray-600 text-white" : "border-gray-100"}`}>
                      <span className={author ? 'text-gray-900' : 'text-gray-400'}>{author
  ? availableAuthors.find(a => a._id?.toString() === author)?.name
  : 'Select Author'}</span>
                      <ChevronDown size={16} />
                    </button>
                    {showAuthorDropdown && (
                      <div className={`absolute z-10 w-full mt-2 rounded-xl shadow-lg ring-1 ring-gray-100 overflow-hidden ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
                        <div className="p-3 border-b">
                          <input type="text" placeholder="Search authors..." value={authorSearch} onChange={e => setAuthorSearch(e.target.value)} className={`w-full p-2 rounded-md border ${isDark ? "bg-gray-700 border-gray-600 text-white" : ""}`} />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredAuthors.length > 0 ? filteredAuthors.map((authorOption) => (
                            <button
  key={authorOption._id}
  onClick={() => {
    setAuthor(authorOption._id.toString());
    handleAuthorDropdownToggle(false);
  }}
  className={`w-full text-left px-4 py-3 cursor-pointer ${isDark ? "hover:bg-gray-700" : "hover:bg-emerald-50"} ${
author === authorOption._id?.toString()
      ? 'bg-emerald-50 font-medium'
      : ''
  }`}
>
  {authorOption.name}
</button>

                          )) : <div className="p-4 text-sm text-gray-500">No authors found</div>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Categories</label>
                  <div className="relative mt-2" ref={categoriesDropdownRef}>
                    <button onClick={() => handleCategoriesDropdownToggle(!showCategoriesDropdown)} className={`w-full text-left p-2 rounded-lg border flex items-center justify-between ${isDark ? "bg-gray-700 border-gray-600 text-white" : "border-gray-100"}`}>
                      <span className={categories.length > 0 ? 'text-gray-900' : 'text-gray-400'}>{getSelectedCategoriesText()}</span>
                      <ChevronDown size={16} />
                    </button>
                    {showCategoriesDropdown && (
                      <div className={`absolute z-10 w-full mt-2 rounded-xl shadow-lg ring-1 ring-gray-100 overflow-hidden ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
                        <div className="p-3 border-b">
                          <input type="text" placeholder="Search categories..." value={categorySearch} onChange={e => setCategorySearch(e.target.value)} className={`w-full p-2 rounded-md border ${isDark ? "bg-gray-700 border-gray-600 text-white" : ""}`} />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredCategories.length > 0 ? filteredCategories.map((category) => (
                            <label key={category._id} className={`flex items-center gap-2 px-4 py-3 cursor-pointer ${isDark ? "hover:bg-gray-700 text-gray-300" : "hover:bg-emerald-50"}`}>
                              <input type="checkbox" checked={categories.includes(category._id)} onChange={() => toggleCategory(category._id)} className="w-4 h-4" />
                              <span>{category.name}</span>
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
                          <span key={catId} className="bg-emerald-50 text-emerald-700 text-xs px-3 py-1 rounded-full flex items-center gap-2">{cat.name}<button onClick={() => toggleCategory(catId)} className="text-emerald-600">×</button></span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Tags</label>
                  <div className="relative mt-2" ref={tagsDropdownRef}>
                    <button onClick={() => handleTagsDropdownToggle(!showTagsDropdown)} className={`w-full text-left p-2 rounded-lg border flex items-center justify-between ${isDark ? "bg-gray-700 border-gray-600 text-white" : "border-gray-100"}`}>
                      <span className={tags.length > 0 ? 'text-gray-900' : 'text-gray-400'}>{getSelectedTagsText()}</span>
                      <ChevronDown size={16} />
                    </button>
                    {showTagsDropdown && (
                      <div className={`absolute z-10 w-full mt-2 rounded-xl shadow-lg ring-1 ring-gray-100 overflow-hidden ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
                        <div className="p-3 border-b">
                          <input type="text" placeholder="Search tags..." value={tagSearch} onChange={(e) => setTagSearch(e.target.value)} className={`w-full p-2 rounded-md border ${isDark ? "bg-gray-700 border-gray-600 text-white" : ""}`} />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredTags.length > 0 ? filteredTags.map((tag) => (
                            <label key={tag._id} className={`flex items-center gap-2 px-4 py-3 cursor-pointer ${isDark ? "hover:bg-gray-700 text-gray-300" : "hover:bg-emerald-50"}`}>
                              <input type="checkbox" checked={tags.includes(tag._id)} onChange={() => toggleTag(tag._id)} className="w-4 h-4" />
                              <span>#{tag.name}</span>
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
                          <span key={tagId} className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">#{tag.name}<button onClick={() => toggleTag(tagId)} className="ml-2">×</button></span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Meta Title</label>
                  <input className={`w-full mt-2 p-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "border-gray-100"}`} value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder="Leave empty to use gallery title" />
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Meta Description</label>
                  <textarea className="w-full mt-2 p-3 rounded-lg border border-gray-100 h-24" value={metaDescription} onChange={e => setMetaDescription(e.target.value)} placeholder="SEO meta description..." />
                  <div className="text-xs text-gray-500 mt-1">{metaDescription.length}/160 characters</div>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Right: Placeholder for SEO/Settings if needed */}
        <div className="col-span-4">
          <div className={`${panel} p-6 sticky top-6`}>
            <h2 className={`font-semibold text-lg mb-4 ${isDark ? "text-white" : ""}`}>SEO Analysis</h2>
            <div className="mb-4">
              <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Focus Keyword</label>
              <input
  type="text"
  value={keyword}
  onChange={(e) => setKeyword(e.target.value)}
  placeholder="Enter focus keyword"
  className={`w-full mt-2 p-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 ${isDark ? "bg-gray-700 border-gray-600 text-white" : "border-gray-200"}`}
/>

            </div>
            <div className="mb-6 p-4 rounded-lg bg-white shadow-inner">
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
              <h3 className={`font-medium mb-3 ${isDark ? "text-white" : ""}`}>SEO Checklist</h3>
              <div className="space-y-3">
                {seoChecks.map((check, i) => (
                  <div key={i} className="flex items-start gap-3">
                    {check.status === 'success' && <CheckCircle2 size={18} className="text-green-600 mt-0.5" />}
                    {check.status === 'warning' && <AlertCircle size={18} className="text-yellow-500 mt-0.5" />}
                    {check.status === 'error' && <XCircle size={18} className="text-red-600 mt-0.5" />}
                    <div className={`text-sm ${check.status === 'success' ? 'text-gray-700' : check.status === 'warning' ? 'text-yellow-700' : 'text-red-700'}`}>{check.text}</div>
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
          <div className="relative z-10 w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Gallery Preview</h3>
              <button onClick={() => setShowPreview(false)} className="p-2 rounded hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <h1 className="text-2xl font-bold mb-2">{title || 'Untitled Gallery'}</h1>
              <div className="text-gray-500 text-sm mb-4">{summary}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {images.map((img, idx) => (
                  <div key={idx} className="rounded-xl overflow-hidden border bg-white shadow-sm">
                    <img src={img.url} alt={img.altText || 'gallery'} className="w-full h-64 object-cover" />
                    <div className="p-3">
                      <div className="text-sm text-gray-700 mb-1">{img.description}</div>
                      <div className="text-xs text-gray-400">{img.altText}</div>
                    </div>
                  </div>
                ))}
              </div>
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
