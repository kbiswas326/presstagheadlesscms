/// This is a self-contained web-story editor page. It assumes the global CMS layout provides the sidebar and topbar, so it focuses solely on the editor UI and logic.
'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, CheckCircle2, AlertCircle, XCircle, ChevronDown, Upload, GripVertical } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useUser } from '../../../../context/UserContext';
import { useTheme } from '../../../../context/ThemeContext';
import MediaImagesSelector from '../../../../media/MediaImagesSelector';
import Image from 'next/image';
import { posts } from '../../../../../lib/api';


/**
 * WebStoryEditorPage
 *
 * Self-contained web-story editor component.
 * - Assumes global CMS layout provides sidebar/topbar.
 * - Uses client-side cropping to 9:16 (center-crop) via canvas.
 * - Keeps UI styling consistent with your article editor (Tailwind classes).
 */
export default function WebStoryEditorPage() {
const params = useParams();
const postId = params?.id; // enables edit mode later
const { user } = useUser();
  const { isDark } = useTheme();
const [showMediaSelector, setShowMediaSelector] = useState(false);
const [mediaTargetIndex, setMediaTargetIndex] = useState(null);
const [mediaSelectorMode, setMediaSelectorMode] = useState('slide'); // 'slide' | 'featured'


  const router = useRouter();
  // Tabs
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'properties'

  // Story-level fields
  const [storyTitle, setStoryTitle] = useState('');
  const [storySlug, setStorySlug] = useState('');
  const [postStatus, setPostStatus] = useState('draft');
  
  // Slides: each slide { id, image (dataURL), title, paragraph, ... }
  const [slides, setSlides] = useState([]);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState(null);

  // File input ref & modes
  const fileInputRef = useRef(null);
  const [uploadMode, setUploadMode] = useState('add'); // 'add' | 'replace'
  const [uploadTargetIndex, setUploadTargetIndex] = useState(null);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [galleryTargetIndex, setGalleryTargetIndex] = useState(null);

  // Properties
  const [durationPerSlide, setDurationPerSlide] = useState(5);
  const [theme, setTheme] = useState('dark');

  // SEO
  const [keyword, setKeyword] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [seoScore, setSeoScore] = useState(0);
  const [seoChecks, setSeoChecks] = useState([]);

  // Featured image
  const [featuredImage, setFeaturedImage] = useState(null);
  const [publishDate, setPublishDate] = useState('');
  const [publishTime, setPublishTime] = useState('');

  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);
  const [authorSearch, setAuthorSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const authorDropdownRef = useRef(null);
  const categoriesDropdownRef = useRef(null);
  const tagsDropdownRef = useRef(null);

/// Available authors, categories, tags (fetch from API)///
const [availableAuthors, setAvailableAuthors] = useState([]);
const [availableCategories, setAvailableCategories] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

useEffect(() => {
  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [usersRes, categoriesRes, tagsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tags`, { headers }),
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        // Handle { users: [...] }, { data: [...] }, or [...]
        const usersList = Array.isArray(data.users) ? data.users : (Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
        setAvailableAuthors(
          usersList.map(u => ({ id: u._id, name: u.name }))
        );
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        const categoriesList = Array.isArray(data.categories) ? data.categories : (Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
        setAvailableCategories(categoriesList);
      }

      if (tagsRes.ok) {
        const data = await tagsRes.json();
        const tagsList = Array.isArray(data.tags) ? data.tags : (Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
        setAvailableTags(tagsList);
      }
    } catch (err) {
      console.error('Failed to fetch dropdown data', err);
    }
  };

  fetchAllData();
}, []);
useEffect(() => {
  const now = new Date();
  setPublishDate(now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }));
  setPublishTime(now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }));
}, []);
useEffect(() => {
  const loadExisting = async () => {
    if (!postId) return;
    try {
      const response = await posts.getById(postId);
      if (!response || response.error) return;
      setStoryTitle(response.title || '');
      setStorySlug(response.slug || '');
      setPostStatus(response.status || 'draft');
      setFeaturedImage(response.featuredImage || null);
      const incomingSlides = Array.isArray(response.stories) ? response.stories : (Array.isArray(response.slides) ? response.slides : []);
      const mappedSlides = incomingSlides.map(s => ({
        id: s.id || Math.random().toString(36).slice(2, 9),
        title: s.title || '',
        paragraph: s.paragraph || '',
        image: s.image ? { url: s.image, preview: s.image } : { url: null, preview: null },
        altText: s.altText || '',
        imageSource: s.imageSource || '',
        titleBackground: s.titleBackground || '',
        ctaText: s.ctaText || '',
        ctaUrl: s.ctaUrl || '',
      }));
      setSlides(mappedSlides);
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
      setMetaDescription(response.seo?.metaDescription || '');
      setKeyword(response.seo?.focusKeyword || '');
      if (response.settings) {
        if (typeof response.settings.durationPerSlide === 'number') setDurationPerSlide(response.settings.durationPerSlide);
        if (response.settings.theme) setTheme(response.settings.theme);
      }
      setSeoScore(response.seoScore || 0);
      if (response.publishDate) {
        setPublishDate(response.publishDate);
      } else if (response.publishedAt) {
        const d = new Date(response.publishedAt);
        setPublishDate(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }));
        setPublishTime(d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }));
      }
      if (response.publishTime) {
        setPublishTime(response.publishTime);
      }
    } catch (err) {
      console.error('Failed to load web story', err);
    }
  };
  loadExisting();
}, [postId]);

/// Fetch available authors, categories, tags on mount///

  const [author, setAuthor] = useState('');
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  const filteredAuthors = Array.isArray(availableAuthors) ? availableAuthors.filter(a => a?.name?.toLowerCase().includes(authorSearch.toLowerCase())) : [];
  const filteredCategories = Array.isArray(availableCategories) ? availableCategories.filter(c => c?.name?.toLowerCase().includes(categorySearch.toLowerCase())) : [];
  const filteredTags = Array.isArray(availableTags) ? availableTags.filter(t => t?.name?.toLowerCase().includes(tagSearch.toLowerCase())) : [];

  const toggleCategory = (id) => {
    setCategories(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleTag = (id) => {
    setTags(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const getSelectedCategoriesText = () => {
  if (categories.length === 0) return 'Select categories';
  const names = categories
    .map(id => availableCategories.find(c => c._id === id)?.name)
    .filter(Boolean);
  return names.join(', ');
};

  const getSelectedTagsText = () => {
  if (tags.length === 0) return 'Select tags';
  const names = tags
    .map(id => availableTags.find(t => t._id === id)?.name)
    .filter(Boolean);
  return names.join(', ');
};


  const handleAuthorDropdownToggle = (value) => { setShowAuthorDropdown(value); if (!value) setAuthorSearch(''); };
  const handleCategoriesDropdownToggle = (value) => { setShowCategoriesDropdown(value); if (!value) setCategorySearch(''); };
  const handleTagsDropdownToggle = (value) => { setShowTagsDropdown(value); if (!value) setTagSearch(''); };

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

  // Player
  const [isPlaying, setIsPlaying] = useState(false);

  // Util: generate id
  const generateId = () => Math.random().toString(36).slice(2, 9);

  // Auto-generate slug (unless user edits)
  useEffect(() => {
    // Stop automation if published
    if (postStatus === 'published') return;
    
    if (storyTitle) {
      const s = storyTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setStorySlug(s);
    }
  }, [storyTitle, postStatus]);

  // SEO scoring (aligned with article)
  useEffect(() => {
    const checks = [];
    let score = 0;
    const maxScore = 100;

    const slideText = slides.map(s => `${s.title || ''} ${s.paragraph || ''}`).join(' ').trim();
    const firstSlideText = slides[0] ? `${slides[0].title || ''} ${slides[0].paragraph || ''}` : '';
    const wordCount = countWords(slideText);
    const keywordLower = (keyword || '').toLowerCase();

    // 1. Focus keyword (5)
    if (!keyword) {
      checks.push({ status: 'error', text: 'Add a focus keyword' });
    } else {
      checks.push({ status: 'success', text: 'Focus keyword set' });
      score += 5;
    }

    // 2. Title length (10)
    if (!storyTitle) {
      checks.push({ status: 'error', text: 'Add a story title' });
    } else if (storyTitle.length < 30) {
      checks.push({ status: 'warning', text: 'Story title is short (min 30 chars)' });
      score += 5;
    } else if (storyTitle.length > 60) {
      checks.push({ status: 'warning', text: `Story title too long (${storyTitle.length}/60 chars)` });
      score += 5;
    } else {
      checks.push({ status: 'success', text: `Story title length looks good (${storyTitle.length}/60 chars)` });
      score += 10;
    }

    // 3. Keyword in title (10)
    if (keyword && storyTitle && storyTitle.toLowerCase().includes(keywordLower)) {
      checks.push({ status: 'success', text: 'Keyword appears in story title' });
      score += 10;
    } else if (keyword && storyTitle) {
      checks.push({ status: 'error', text: 'Keyword missing from story title' });
    }

    // 4. Meta description length (10)
    if (!metaDescription) {
      checks.push({ status: 'error', text: 'Add a meta description' });
    } else if (metaDescription.length < 120) {
      checks.push({ status: 'warning', text: 'Meta description is short (min 120 chars)' });
      score += 5;
    } else if (metaDescription.length > 160) {
      checks.push({ status: 'warning', text: `Meta description too long (${metaDescription.length}/160 chars)` });
      score += 5;
    } else {
      checks.push({ status: 'success', text: `Meta description length is good (${metaDescription.length}/160 chars)` });
      score += 10;
    }

    // 5. Keyword in meta description (10)
    if (keyword && metaDescription) {
      if (metaDescription.toLowerCase().includes(keywordLower)) {
        checks.push({ status: 'success', text: 'Keyword appears in meta description' });
        score += 10;
      } else {
        checks.push({ status: 'warning', text: 'Keyword missing from meta description' });
      }
    }

    // 6. Content length (10)
    if (wordCount === 0) {
      checks.push({ status: 'error', text: 'Add slide titles or descriptions' });
    } else if (wordCount < 150) {
      checks.push({ status: 'warning', text: `Story copy is short (${wordCount} words, recommended 150+)` });
      score += 5;
    } else if (wordCount < 300) {
      checks.push({ status: 'warning', text: `Consider adding more detail (${wordCount} words)` });
      score += 7;
    } else {
      checks.push({ status: 'success', text: `Great amount of slide copy (${wordCount} words)` });
      score += 10;
    }

    // 7. Keyword early (8)
    if (keyword && firstSlideText) {
      if (firstSlideText.toLowerCase().includes(keywordLower)) {
        checks.push({ status: 'success', text: 'Keyword appears in first slide' });
        score += 8;
      } else {
        checks.push({ status: 'warning', text: 'Add keyword to first slide' });
        score += 3;
      }
    }

    // 8. Keyword density (7)
    if (keyword && slideText) {
      const density = calculateKeywordDensity(slideText, keyword);
      if (density < 0.5) {
        checks.push({ status: 'warning', text: `Keyword density low (${density.toFixed(2)}%)` });
        score += 3;
      } else if (density > 2.5) {
        checks.push({ status: 'warning', text: `Keyword density high (${density.toFixed(2)}%)` });
        score += 3;
      } else {
        checks.push({ status: 'success', text: `Keyword density is healthy (${density.toFixed(2)}%)` });
        score += 7;
      }
    }

    // 9. Readability (8)
    if (slideText) {
      const readability = calculateReadability(slideText);
      if (readability >= 60) {
        checks.push({ status: 'success', text: `Slides are easy to read (score ${readability.toFixed(0)})` });
        score += 8;
      } else if (readability >= 30) {
        checks.push({ status: 'warning', text: `Readability is average (score ${readability.toFixed(0)})` });
        score += 5;
      } else {
        checks.push({ status: 'warning', text: `Slides are hard to read (score ${readability.toFixed(0)})` });
        score += 2;
      }
    }

    // 10. Slide count (10)
    if (slides.length === 0) {
      checks.push({ status: 'error', text: 'Add at least one slide' });
    } else if (slides.length < 5) {
      checks.push({ status: 'warning', text: 'Add more slides (recommended 5+)' });
      score += 5;
    } else {
      checks.push({ status: 'success', text: `Slide count looks good (${slides.length})` });
      score += 10;
    }

    // 11. URL slug (5)
    if (!storySlug) {
      checks.push({ status: 'error', text: 'Add a URL slug' });
    } else if (storySlug.length > 75) {
      checks.push({ status: 'warning', text: 'Slug is quite long' });
      score += 2;
    } else if (keyword && storySlug.includes(keyword.toLowerCase().replace(/\s+/g, '-'))) {
      checks.push({ status: 'success', text: 'Keyword appears inside the slug' });
      score += 5;
    } else {
      checks.push({ status: 'warning', text: 'Keyword missing from slug' });
      score += 3;
    }

    // 12. Alt text coverage (7)
    if (slides.length) {
      const slidesWithAlt = slides.filter(s => (s.altText || '').trim().length > 0).length;
      if (slidesWithAlt === slides.length && slides.length > 0) {
        checks.push({ status: 'success', text: 'Alt text added for all slides' });
        score += 7;
      } else if (slidesWithAlt > 0) {
        checks.push({ status: 'warning', text: `Alt text added on ${slidesWithAlt}/${slides.length} slides` });
        score += 4;
      } else {
        checks.push({ status: 'error', text: 'Add alt text to describe each slide image' });
      }
    }

    // 13. Featured Image (5 points)
    if (featuredImage) {
      if (featuredImage.altText) {
        checks.push({ status: 'success', text: 'Featured image with alt text added' });
        score += 5;
      } else {
        checks.push({ status: 'warning', text: 'Featured image missing alt text' });
        score += 3;
      }
    } else {
      checks.push({ status: 'warning', text: 'No featured image added' });
    }

    setSeoScore(Math.min(score, maxScore));
    setSeoChecks(checks);
  }, [keyword, metaDescription, storyTitle, storySlug, slides, featuredImage]);

  // Play mode auto-advance
  useEffect(() => {
    if (!isPlaying) return;
    if (slides.length === 0) { setIsPlaying(false); return; }
    const timer = setInterval(() => {
      setSelectedSlideIndex(idx => (idx + 1) % slides.length);
    }, Math.max(500, durationPerSlide * 1000));
    return () => clearInterval(timer);
  }, [isPlaying, slides.length, durationPerSlide]);

  // File handling: read -> crop -> add slide
  const handleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    const dataUrl = await readFileAsDataURL(file);
    const preparedImage = await prepareSlideImage(dataUrl, true);
    if (!preparedImage) return;
    

    if (uploadMode === 'replace' && uploadTargetIndex !== null && slides[uploadTargetIndex]) {
  updateSlide(uploadTargetIndex, {
    image: {
      preview: preparedImage, // ✅ normalized
      url: null
    },
    altText: '',
    imageSource: ''
  });
  setSelectedSlideIndex(uploadTargetIndex);
} 
else {
  // ✅ DO NOT create a new slide here
  // Just update the currently selected blank slide

  updateSlide(selectedSlideIndex, {
    image: {
      preview: preparedImage,
      url: null,
    },
  });
}


    setUploadMode('add');
    setUploadTargetIndex(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // AFTER handleFiles()
const saveSlideToLibrary = async (index) => {
  const slide = slides[index];
  if (!slide?.image?.preview && !slide?.image?.url) return;

  try {
    const imageSrc = slide.image.preview || slide.image.url;
    const blob = await fetch(imageSrc).then(r => r.blob());

    const file = new File(
      [blob],
      `web-story-slide-${index + 1}.jpg`,
      { type: blob.type || 'image/jpeg' }
    );

    const formData = new FormData();
    formData.append('file', file);
    formData.append('altText', slide.altText || '');
    formData.append('title', storyTitle || `Web Story Slide ${index + 1}`);
    formData.append('caption', slide.paragraph || '');
    formData.append('credits', slide.imageSource || '');

    const token = localStorage.getItem('token');

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/media/upload`,
      {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      }
    );

    const saved = await res.json();

    updateSlide(index, {
      image: {
        url: saved.url,
        preview: slide.image.preview
      },
      savedToLibrary: true,
    });

    alert(`Slide ${index + 1} saved to Media Library`);
  } catch (e) {
    console.error(e);
    alert('Failed to save slide');
  }
};


  const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const blobToDataURL = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const convertImageUrlToDataURL = async (url) => {
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error('Failed to fetch image');
      const blob = await response.blob();
      return await blobToDataURL(blob);
    } catch (error) {
      console.error('Unable to convert remote image', error);
      return null;
    }
  };

  // Crop to 9:16 center-crop; output JPEG dataURL
  const cropTo916 = (dataUrl) => new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // target dimensions (portrait 9:16). Use reasonable px sizes
      const targetW = 900;
      const targetH = 1600; // 9:16 => 900x1600

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');

      const srcW = img.width;
      const srcH = img.height;
      const targetAspect = 9 / 16;
      let sx = 0, sy = 0, sw = srcW, sh = srcH;

      const srcAspect = srcW / srcH;
      if (srcAspect > targetAspect) {
        // source wider -> crop sides
        sh = srcH;
        sw = Math.round(sh * targetAspect);
        sx = Math.round((srcW - sw) / 2);
        sy = 0;
      } else {
        // source taller -> crop top/bottom
        sw = srcW;
        sh = Math.round(sw / targetAspect);
        sx = 0;
        sy = Math.round((srcH - sh) / 2);
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
      const out = canvas.toDataURL('image/jpeg', 0.85);
      resolve(out);
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });

  const prepareSlideImage = async (source, isDataUrl = false) => {
    try {
      const dataUrl = isDataUrl ? source : await convertImageUrlToDataURL(source);
      if (!dataUrl) return source;
      const cropped = await cropTo916(dataUrl);
      return cropped || dataUrl || source;
    } catch (error) {
      console.error('Failed to prepare slide image', error);
      return source;
    }
  };

  const countWords = (text) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const calculateReadability = (text) => {
    const words = countWords(text);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 1;
    const syllables = text.split(/\s+/).reduce((count, word) => (
      count + Math.max(1, word.toLowerCase().split(/[aeiouy]+/).length - 1)
    ), 0);
    if (words === 0) return 0;
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

  const getSEOColor = () => {
    if (seoScore < 40) return 'bg-red-400';
    if (seoScore < 70) return 'bg-yellow-400';
    return 'bg-emerald-500';
  };

  const getSEOTextColor = () => {
    if (seoScore < 40) return 'text-red-600';
    if (seoScore < 70) return 'text-yellow-600';
    return 'text-emerald-600';
  };

  const getSEORating = () => {
    if (seoScore < 40) return 'Poor';
    if (seoScore < 70) return 'Good';
    return 'Excellent';
  };

  // slide updates
  const updateSlide = (index, patch) => {
    setSlides(prev => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const removeSlide = (index) => {
    setSlides(prev => {
      const arr = prev.filter((_, i) => i !== index);
      // adjust selected index
      const nextIndex = Math.max(0, Math.min(arr.length - 1, selectedSlideIndex));
      setSelectedSlideIndex(nextIndex);
      return arr;
    });
  };

  // Drag and drop handlers for reordering slides
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    setDraggedOverIndex(index);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';

    if (draggedIndex !== null && draggedOverIndex !== null && draggedIndex !== draggedOverIndex) {
      setSlides(prev => {
        const updated = [...prev];
        const [reorderedSlide] = updated.splice(draggedIndex, 1);
        updated.splice(draggedOverIndex, 0, reorderedSlide);
        
        // Update selectedSlideIndex if needed
        if (selectedSlideIndex === draggedIndex) {
          setSelectedSlideIndex(draggedOverIndex);
        } else if (selectedSlideIndex === draggedOverIndex) {
          setSelectedSlideIndex(draggedIndex);
        } else if (draggedIndex < selectedSlideIndex && draggedOverIndex >= selectedSlideIndex) {
          setSelectedSlideIndex(selectedSlideIndex - 1);
        } else if (draggedIndex > selectedSlideIndex && draggedOverIndex <= selectedSlideIndex) {
          setSelectedSlideIndex(selectedSlideIndex + 1);
        }
        
        return updated;
      });
    }

    // Reset drag states
    setDraggedIndex(null);
    setDraggedOverIndex(null);
  };

  const addBlankSlide = () => {
  const newSlide = {
    id: generateId(),
    image: null,          // 👈 blank canvas
    title: '',
    paragraph: '',
    altText: '',
    imageSource: '',
    titleBackground: '',
    ctaText: '',
    ctaUrl: '',
    savedToLibrary: false,
  };

  setSlides(prev => {
    const updated = [...prev, newSlide];
    setSelectedSlideIndex(updated.length - 1);
    return updated;
  });
};

  const triggerUpload = (mode = 'add', targetIndex = null) => {
    setUploadMode(mode);
    setUploadTargetIndex(targetIndex);
    fileInputRef.current?.click();
  };

  const openMediaLibrary = (targetIndex = null) => {
  setMediaTargetIndex(targetIndex);
  setMediaSelectorMode('slide');
  setShowMediaSelector(true);
};

  const openFeaturedImageSelector = () => {
    setMediaSelectorMode('featured');
    setShowMediaSelector(true);
  };

  const handleGallerySelection = async (url, altFromGallery) => {
  const preview = await prepareSlideImage(url); // keeps crop

  const imageObj = {
    url,      // ✅ backend URL
    preview,  // ✅ UI only
  };

  // ✅ ONLY update existing slide
  if (galleryTargetIndex !== null && slides[galleryTargetIndex]) {
    updateSlide(galleryTargetIndex, {
      image: imageObj,
      altText: altFromGallery || '',
    });

    setSelectedSlideIndex(galleryTargetIndex);
  }

  setShowMediaSelector(false);
  setMediaTargetIndex(null);
};

  // Action handlers
const buildPayload = (status) => ({
  title: storyTitle,
  slug: storySlug,
  type: 'web-story',
  status,
  author: user?._id || null,
  slides: slides.map(s => ({
    id: s.id,
    title: s.title || '',
    paragraph: s.paragraph || '',
    image: s.image?.url || null, // ✅ store backend URL ONLY
    altText: s.altText || '',
    imageSource: s.imageSource || '',
    titleBackground: s.titleBackground || '',
    ctaText: s.ctaText || '',
    ctaUrl: s.ctaUrl || '',
    savedToLibrary: s.savedToLibrary || false,
  })),
  // Also send as 'stories' for backward compatibility if backend expects it
  stories: slides.map(s => ({
    id: s.id,
    title: s.title || '',
    paragraph: s.paragraph || '',
    image: s.image?.url || null,
    altText: s.altText || '',
    imageSource: s.imageSource || '',
    titleBackground: s.titleBackground || '',
    ctaText: s.ctaText || '',
    ctaUrl: s.ctaUrl || '',
    savedToLibrary: s.savedToLibrary || false,
  })),
  featuredImage: featuredImage ? {
    url: featuredImage.url,
    altText: featuredImage.altText,
    fileName: featuredImage.name || featuredImage.fileName,
  } : null,
  categories,
  tags,
  seoScore,
  seo: {
    metaDescription,
    focusKeyword: keyword,
  },
  settings: {
    durationPerSlide,
    theme,
  },
  publishDate,
  publishTime,
});

const handleSaveDraft = async () => {
  try {
    const payload = buildPayload('draft');
    if (postId) {
      await posts.update(postId, payload);
    } else {
      await posts.create(payload);
    }
    alert('Draft saved successfully');
  } catch (err) {
    console.error('Save draft failed:', err);
    alert('Failed to save draft');
  }
};

const handleSendForApproval = async () => {
  try {
    const payload = buildPayload('pending');
    if (postId) {
      await posts.update(postId, payload);
    } else {
      await posts.create(payload);
    }
    alert('Sent for approval successfully');
  } catch (err) {
    console.error('Send for approval failed:', err);
    alert('Failed to send for approval');
  }
};

const handlePublish = async () => {
  console.log('Publishing Web Story with:', {
  categories,
  tags,
});
  try {
    const now = new Date();
    setPublishDate(now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }));
    setPublishTime(now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }));
    const payload = {
      ...buildPayload('published'),
      publishedAt: now.toISOString(),
      publishDate: now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
      publishTime: now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }),
    };
    if (postId) {
      await posts.update(postId, payload);
    } else {
      await posts.create(payload);
    }
    alert('Web Story published successfully');
    router.push('/posts/published');
  } catch (err) {
    console.error('Publish failed:', err);
    alert('Failed to publish web story');
  }
};

const handleUpdate = async () => {
  try {
    if (!postId) {
      alert('Open an existing Web Story to update');
      return;
    }
    const payload = buildPayload('published');
    await posts.update(postId, payload);
    alert('Web Story updated');
  } catch (err) {
    console.error('Update failed:', err);
    alert('Failed to update web story');
  }
};

  // Simple Slide canvas UI
  const SlideCanvas = ({ slide, onUpload, onLibrary }) => {
    if (!slide || !slide.image) {
      return (
        <div className="relative w-[320px] h-[568px] bg-gray-100 rounded-2xl flex items-center justify-center text-center px-6">
          <div>
            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Start your slide by adding a portrait image.</p>
            <div className="mt-4 flex flex-col gap-2">

<button
  onClick={() => openMediaLibrary(selectedSlideIndex)}
   className="px-4 py-2 rounded-full bg-[rgb(24_94_253)] text-white text-sm hover:opacity-90"
>
  Upload Image
</button>

            </div>
          </div>
        </div>
      );
    }

    const titleBgStyle = slide.titleBackground
      ? {
          backgroundColor: slide.titleBackground,
          padding: '6px 12px',
          borderRadius: '12px',
          display: 'inline-block',
          boxShadow: '0 6px 16px rgba(0,0,0,0.35)'
        }
      : {};      


    return (
      <div className="relative w-[320px] h-[568px] rounded-2xl overflow-hidden shadow-lg bg-black">
        {/* image */}
        <img
        src={slide.image?.preview || slide.image?.url || ''}
        alt={slide.altText || 'slide'}
        className="object-cover w-full h-full"
        />
        {slide.imageSource && (
          <div className="absolute top-3 right-3 bg-black/70 text-white text-[10px] font-medium px-2 py-1 rounded-full">
            Image: {slide.imageSource}
          </div>
        )}

        {/* bottom-to-top black gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.65) 40%, rgba(0,0,0,0.2) 80%)'
          }}
        />

        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">

<button
  onClick={() => openMediaLibrary(selectedSlideIndex)}
  className="px-3 py-2 rounded-full bg-white/90 text-black text-xs font-medium hover:bg-white"
>
  Change Image
</button>


        </div>

        {/* title + paragraph */}
        <div className="absolute left-5 right-5 bottom-6 text-white">
          <h3
            className="text-xl font-bold leading-tight line-clamp-2"
            style={titleBgStyle}
          >
            {slide.title || 'Slide title'}
          </h3>
          <p className="text-sm mt-3 max-h-24 overflow-hidden">{slide.paragraph || 'A short supporting paragraph that appears over the image.'}</p>
          {slide.ctaText && slide.ctaUrl && (
            <a
              href={slide.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-white/90 text-black text-xs font-semibold hover:bg-white"
            >
              {slide.ctaText}
            </a>
          )}
        </div>
      </div>
    );
  };

  // Button styles (Mac/apple curved rectangle feel)
  const btnBase = 'px-4 py-2 rounded-full transition-all duration-150 inline-flex items-center justify-center text-sm';
  const publishNormal = 'bg-[rgb(24_94_253)] text-white';
  const publishHover = 'hover:bg-white hover:text-[rgb(24_94_253)] hover:border hover:border-[rgb(24_94_253)]';
  const sendNormal = 'bg-white text-[rgb(24_94_253)] border border-[rgb(24_94_253)]';
  const sendHover = 'hover:bg-[rgb(24_94_253)] hover:text-white';

  const currentSlide = slides[selectedSlideIndex];

  return (
    <div className={`min-h-screen p-6 transition-colors duration-200 ${isDark ? "bg-gray-900" : "bg-gradient-to-b from-slate-50 to-white"}`}>
       {/* ✅ MEDIA LIBRARY MODAL — ADD THIS ONCE */}
      {showMediaSelector && (
  <MediaImagesSelector
    onSelect={(image) => {
      if (mediaSelectorMode === 'featured') {
        // Handle featured image selection
        setFeaturedImage({
          url: image.url,
          altText: image.altText || '',
          name: image.name || image.fileName || '',
          fileName: image.fileName || image.name || '',
        });
      } else {
        // Handle slide image selection
        const preview = image.src || image.url;

        // If mediaTargetIndex is set, update that specific slide
        // Otherwise, update the currently selected slide
        const targetIndex = mediaTargetIndex !== null ? mediaTargetIndex : selectedSlideIndex;

        if (targetIndex !== null && slides[targetIndex]) {
          updateSlide(targetIndex, {
            image: {
              url: image.url,
              preview,
            },
            altText: image.altText || '',
            imageSource: image.credits || '',
          });
          setSelectedSlideIndex(targetIndex);
        } else {
          // Only create a new slide if there are no slides at all
          setSlides(prev => {
            const arr = [
              ...prev,
              {
                id: generateId(),
                image: {
                  url: image.url,
                  preview,
                },
                title: '',
                paragraph: '',
                altText: image.altText || '',
                imageSource: image.credits || '',
                titleBackground: '',
                ctaText: '',
                ctaUrl: '',
              },
            ];
            setSelectedSlideIndex(arr.length - 1);
            return arr;
          });
        }
      }

      setShowMediaSelector(false);
      setMediaTargetIndex(null);
      setMediaSelectorMode('slide');
    }}
    onClose={() => {
      setShowMediaSelector(false);
      setMediaTargetIndex(null);
      setMediaSelectorMode('slide');
    }}
  />
)}
      <div className="w-full max-w-full mx-auto">
        {/* Top bar - matches article/video edit page, always shows title/slug */}
        <div className={`flex items-center justify-between mb-4 p-4 backdrop-blur-sm rounded-2xl shadow-md transition-all duration-200 ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white/80 ring-1 ring-gray-100"}`}>
          <div className="flex items-center gap-4">
            <button 
  onClick={() => router.back()}
  className={`flex items-center gap-2 ${isDark ? "text-gray-300 hover:text-white hover:bg-gray-700" : "text-gray-700 hover:text-black hover:bg-gray-100"} px-2 py-1 rounded-lg transition-colors`}
>
  <ArrowLeft size={18} />
  <span className="font-medium">Back</span>
</button>
            <div className="text-sm text-gray-500">Create / Edit Web Story</div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => handleFiles(e.target.files)}
            />
            <button
              onClick={() => setIsPlaying(p => !p)}
              className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
            >
              {isPlaying ? 'Stop Preview' : 'Preview'}
            </button>
            <button
              onClick={handleSaveDraft}
              className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full hover:bg-gray-200"
            >
              Save Draft
            </button>
            <button
              onClick={handleSendForApproval}
              className="px-5 py-2 rounded-full shadow border"
              style={{
                backgroundColor: "white",
                color: "rgb(24 94 253)",
                borderColor: "rgb(24 94 253)"
              }}
            >
              Send for Approval
            </button>
            <button
              onClick={handleUpdate}
              className="px-5 py-2 rounded-full shadow border"
              style={{
                backgroundColor: "white",
                color: "rgb(24 94 253)",
                borderColor: "rgb(24 94 253)"
              }}
            >
              Update
            </button>
            <button
              onClick={handlePublish}
              className="px-5 py-2 rounded-full shadow"
              style={{
                backgroundColor: "rgb(24 94 253)",
                color: "white"
              }}
            >
              Publish
            </button>
          </div>
        </div>

        {/* Title and Slug only visible in Edit tab */}
        {activeTab === 'edit' && (
          <div className="mb-4 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-md">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Story Title</label>
                <input
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  className={`w-full mt-2 p-3 rounded-xl border shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(24_94_253)]/30 transition-colors duration-200 ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"}`}
                  placeholder="Enter the story title"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Story URL Slug</label>
                <input
                  value={storySlug}
                  onChange={(e) => setStorySlug(e.target.value)}
                  className={`w-full mt-2 p-3 rounded-xl border font-mono shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(24_94_253)]/30 ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"}`}
                  placeholder="story-url-slug"
                />
                <p className="text-xs text-gray-500 mt-1">Only lowercase letters, numbers, and hyphens.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs bar */}
        <div className={`mb-6 flex items-center gap-6 backdrop-blur-sm rounded-2xl p-2 shadow-md ${isDark ? "bg-gray-800" : "bg-white/80"}`}>
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-4 py-2 rounded-full text-sm transition-all ${activeTab === 'edit' ? 'bg-[rgb(24_94_253)] text-white font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Edit
          </button>
          <button
            onClick={() => setActiveTab('properties')}
            className={`px-4 py-2 rounded-full text-sm transition-all ${activeTab === 'properties' ? 'bg-[rgb(24_94_253)] text-white font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Properties
          </button>
        </div>



        <div className="grid grid-cols-12 gap-6">
          {/* Canvas & editor (left) */}
          <div className="col-span-8">
            <div className={`backdrop-blur-sm rounded-2xl p-6 shadow-md ${isDark ? "bg-gray-800" : "bg-white/80"}`}>
              {activeTab === 'edit' && (
                <div className="flex gap-6">
                  {/* Canvas preview */}
                  <div className="flex-shrink-0">
                    <SlideCanvas
                      slide={slides[selectedSlideIndex]}
                      onUpload={() => triggerUpload('add', null)}
                      onLibrary={() => openImageGallery(null)}
                    />

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedSlideIndex(i => Math.max(0, i - 1))}
                        className="px-3 py-1 rounded bg-gray-100"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setSelectedSlideIndex(i => Math.min(slides.length - 1, i + 1))}
                        className="px-3 py-1 rounded bg-gray-100"
                      >
                        Next
                      </button>
                      <div className="text-sm text-gray-500">{slides.length} slides</div>
                    </div>
                  </div>

                  {/* Editor details */}
                  <div className="flex-1">
                    <div className="mb-4">
                      <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Slide Title</label>
                      <input
                        value={slides[selectedSlideIndex]?.title || ''}
                        onChange={(e) => updateSlide(selectedSlideIndex, { title: e.target.value })}
                        className={`w-full mt-2 p-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"}`}
                        placeholder="Slide title"
                        disabled={slides.length === 0}
                      />
                    </div>

                    <div className="mb-4">
                      <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Slide Paragraph</label>
                      <textarea
                        value={slides[selectedSlideIndex]?.paragraph || ''}
                        onChange={(e) => updateSlide(selectedSlideIndex, { paragraph: e.target.value })}
                        className={`w-full mt-2 p-2 rounded-lg border h-28 ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"}`}
                        placeholder="Short paragraph to show over the image"
                        disabled={slides.length === 0}
                      />
                    </div>

                    <div className="mb-4">
                      <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Title Background</label>
                      <div className="mt-2 flex items-center gap-3">
                        <input
                          type="color"
                          value={currentSlide?.titleBackground || '#000000'}
                          onChange={(e) => updateSlide(selectedSlideIndex, { titleBackground: e.target.value })}
                          className={`w-12 h-10 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"}`}
                          disabled={slides.length === 0}
                        />
                        <button
                          onClick={() => updateSlide(selectedSlideIndex, { titleBackground: '' })}
                          className={`px-3 py-2 text-sm rounded-full border ${isDark ? "text-gray-300 border-gray-600 hover:bg-gray-700" : "text-gray-700 border-gray-200 hover:bg-gray-50"}`}
                          disabled={slides.length === 0 || !currentSlide?.titleBackground}
                        >
                          Remove Background
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Pick a color to make the title stand out. Clear it to keep text on the image.</p>
                    </div>

                    <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>CTA Text</label>
                        <input
                          value={currentSlide?.ctaText || ''}
                          onChange={(e) => updateSlide(selectedSlideIndex, { ctaText: e.target.value })}
                          className={`w-full mt-2 p-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"}`}
                          placeholder="e.g. Read more"
                          disabled={slides.length === 0}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>CTA Link URL</label>
                        <input
                          type="url"
                          value={currentSlide?.ctaUrl || ''}
                          onChange={(e) => updateSlide(selectedSlideIndex, { ctaUrl: e.target.value })}
                          className={`w-full mt-2 p-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"}`}
                          placeholder="https://example.com"
                          disabled={slides.length === 0}
                        />
                      </div>
                    </div>

                    <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Image Alt Text</label>
                        <input
                          value={slides[selectedSlideIndex]?.altText || ''}
                          onChange={(e) => updateSlide(selectedSlideIndex, { altText: e.target.value })}
                          className={`w-full mt-2 p-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"}`}
                          placeholder="Describe the image"
                          disabled={slides.length === 0}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Image Source / Credits</label>
                        <input
                          value={slides[selectedSlideIndex]?.imageSource || ''}
                          onChange={(e) => updateSlide(selectedSlideIndex, { imageSource: e.target.value })}
                          className={`w-full mt-2 p-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"}`}
                          placeholder="e.g. Photographer / Agency"
                          disabled={slides.length === 0}
                        />
                      </div>
                    </div>
  {/* Save slide */}                 
  <div className="mb-6 flex items-center gap-3">
  <button
    onClick={() => saveSlideToLibrary(selectedSlideIndex)}
    disabled={
      !slides[selectedSlideIndex]?.image ||
      slides[selectedSlideIndex]?.savedToLibrary
    }
    className="px-4 py-2 rounded-full bg-[rgb(24_94_253)] text-white text-sm hover:opacity-95 disabled:opacity-50"
  >
    Save Slide {selectedSlideIndex + 1}
  </button>

  {/* Add next slide */}
  <button
    onClick={addBlankSlide}
    className="px-4 py-2 rounded-full border border-[rgb(24_94_253)] text-[rgb(24_94_253)] text-sm hover:bg-[rgb(24_94_253)] hover:text-white"
  >
    Add Next Slide
  </button>
</div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => removeSlide(selectedSlideIndex)}
                        className={`px-3 py-2 rounded-full border text-red-600 inline-flex items-center gap-2 ${isDark ? "border-gray-600 hover:bg-gray-700" : "border-gray-200 hover:bg-red-50"}`}
                        disabled={slides.length === 0}
                      >
                        <Trash2 size={14} /> Remove Slide
                      </button>
                    </div>

                    {/* thumbnails */}
                    <div className="mt-6">
                      <div className={`text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Slides (drag to reorder)</div>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {slides.map((s, i) => (
                          <div
                            key={s.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, i)}
                            onDragOver={handleDragOver}
                            onDragEnter={(e) => handleDragEnter(e, i)}
                            onDragEnd={handleDragEnd}
                            onClick={() => setSelectedSlideIndex(i)}
                            className={`relative rounded-lg overflow-hidden cursor-move transition-all ${
                              i === selectedSlideIndex ? 'ring-2 ring-[rgb(24_94_253)]' : 'ring-1 ring-gray-100'
                            } ${
                              draggedOverIndex === i && draggedIndex !== i ? 'ring-2 ring-emerald-500 bg-emerald-50' : ''
                            } ${draggedIndex === i ? 'opacity-50' : ''}`}
                          >
                            {s.image?.preview || s.image?.url ? (
                              <img
                                src={s.image.preview || s.image.url}
                                alt={`thumb-${i}`}
                                className="w-24 h-44 object-cover block pointer-events-none"
                                draggable={false}
                              />
                            ) : (
                              <div className={`w-24 h-44 flex items-center justify-center pointer-events-none ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
                                <span className="text-xs text-gray-400">Blank</span>
                              </div>
                            )}
                            <div className="absolute top-1 left-1 bg-black/60 text-white p-0.5 rounded pointer-events-none">
                              <GripVertical size={12} />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/40 text-white text-xs text-left truncate pointer-events-none">{s.title || `Slide ${i + 1}`}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'properties' && (
                <div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Duration per slide (sec)</label>
                      <input
                        type="number"
                        min={1}
                        value={durationPerSlide}
                        onChange={(e) => setDurationPerSlide(Number(e.target.value))}
                        className={`w-full mt-2 p-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"}`}
                      />
                    </div>

                    <div>
                      <label className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Theme</label>
                      <select value={theme} onChange={(e) => setTheme(e.target.value)} className={`w-full mt-2 p-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"}`}>
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Meta Description</label>
                    <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className={`w-full mt-2 p-2 rounded-lg border h-28 ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"}`} />
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div>
                      <label className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Publish Date</label>
                      <input type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} className={`w-full mt-2 p-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"}`} />
                    </div>
                    <div>
                      <label className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Publish Time</label>
                      <input type="time" value={publishTime} onChange={(e) => setPublishTime(e.target.value)} className={`w-full mt-2 p-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"}`} />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className={`text-sm font-medium block mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Featured Image</label>
                    {!featuredImage ? (
                      <div className={`border-2 border-dashed p-8 rounded-xl text-center hover:border-emerald-300 transition ${isDark ? "border-gray-600 bg-gray-800" : "border-gray-200 bg-white"}`}>
                        <button
                          onClick={openFeaturedImageSelector}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-md shadow border transition-all"
                          style={{
                            backgroundColor: "rgb(24 94 253)",
                            color: "white",
                            borderColor: "rgb(24 94 253)"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "white";
                            e.currentTarget.style.color = "rgb(24 94 253)";
                            e.currentTarget.style.borderColor = "rgb(24 94 253)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "rgb(24 94 253)";
                            e.currentTarget.style.color = "white";
                            e.currentTarget.style.borderColor = "rgb(24 94 253)";
                          }}
                        >
                          <Upload size={16} /> Upload / Choose from Library
                        </button>
                        <p className="text-xs text-gray-500 mt-2">Recommended: 1200x1600 (3:4 ratio) - minimum 640x853px for SEO & social sharing</p>
                      </div>
                    ) : (
                      <div className="relative rounded-xl overflow-hidden border">
                        <div className="w-full bg-gray-50" style={{ aspectRatio: '3/4' }}>
                          <Image
                            src={featuredImage.url}
                            alt={featuredImage.altText || 'Featured'}
                            width={1200}
                            height={1600}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 hover:opacity-100 transition-opacity bg-black/30">
                          <button onClick={openFeaturedImageSelector} className="bg-white text-gray-800 px-4 py-2 rounded-md">Change</button>
                          <button onClick={() => setFeaturedImage(null)} className="bg-red-600 text-white px-4 py-2 rounded-md">Remove</button>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent text-white text-sm">
                          <div className="truncate">{featuredImage.name || featuredImage.fileName || 'Featured Image'}</div>
                          {featuredImage.altText && <div className="text-xs opacity-80 mt-1">Alt: {featuredImage.altText}</div>}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Author</label>
                    <div className="relative mt-2" ref={authorDropdownRef}>
                      <button type="button" onClick={() => handleAuthorDropdownToggle(!showAuthorDropdown)} className={`w-full text-left p-2 rounded-lg border flex items-center justify-between ${isDark ? "border-gray-600 bg-gray-700 text-white" : "border-gray-100 bg-white text-gray-900"}`}>
                        <span className={author ? 'text-gray-900' : 'text-gray-400'}>{author ? availableAuthors.find(a => String(a.id) === String(author))?.name || 'Select Author' : 'Select Author'}</span>
                        <ChevronDown size={16} />
                      </button>
                      {showAuthorDropdown && (
                        <div className={`absolute z-10 w-full mt-2 rounded-xl shadow-lg ring-1 overflow-hidden ${isDark ? "bg-gray-800 ring-gray-700" : "bg-white ring-gray-100"}`}>
                          <div className="p-3 border-b">
                            <input type="text" placeholder="Search authors..." value={authorSearch} onChange={(e) => setAuthorSearch(e.target.value)} className={`w-full p-2 rounded-md border ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-200 text-gray-900"}`} />
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {filteredAuthors.length > 0 ? filteredAuthors.map((authorOption) => (
                              <button key={authorOption.id} onClick={() => { setAuthor(authorOption.id.toString()); handleAuthorDropdownToggle(false); }} className={`w-full text-left px-4 py-3 hover:bg-emerald-50 ${author === authorOption.id.toString() ? 'bg-emerald-50 font-medium' : ''}`}>{authorOption.name}</button>
                            )) : <div className="p-4 text-sm text-gray-500">No authors found</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Categories</label>
                    <div className="relative mt-2" ref={categoriesDropdownRef}>
                      <button onClick={() => handleCategoriesDropdownToggle(!showCategoriesDropdown)} className={`w-full text-left p-2 rounded-lg border flex items-center justify-between ${isDark ? "border-gray-600 bg-gray-700 text-white" : "border-gray-100 bg-white text-gray-900"}`}>
                        <span className={categories.length > 0 ? 'text-gray-900' : 'text-gray-400'}>{getSelectedCategoriesText()}</span>
                        <ChevronDown size={16} />
                      </button>
                      {showCategoriesDropdown && (
                        <div className={`absolute z-10 w-full mt-2 rounded-xl shadow-lg ring-1 overflow-hidden ${isDark ? "bg-gray-800 ring-gray-700" : "bg-white ring-gray-100"}`}>
                          <div className="p-3 border-b">
                            <input type="text" placeholder="Search categories..." value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} className={`w-full p-2 rounded-md border ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-200 text-gray-900"}`} />
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {filteredCategories.length > 0 ? filteredCategories.map((category) => (
                              <label key={category._id} className={`flex items-center gap-2 px-4 py-3 cursor-pointer ${isDark ? "hover:bg-gray-700 text-gray-200" : "hover:bg-emerald-50 text-gray-900"}`}>
                                <input type="checkbox" checked={categories.includes(category._id)} onChange={() => toggleCategory(category._id)} className="w-4 h-4" />
                                <span>{category.name}</span>
                              </label>
                            )) : <div className="p-4 text-sm text-gray-500">No categories found</div>}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {categories.map(catId => {
                        const cat = availableCategories.find(c => c.id === catId);
                        return cat ? (
                          <span key={catId} className="bg-emerald-50 text-emerald-700 text-xs px-3 py-1 rounded-full flex items-center gap-2">{cat.name}<button onClick={() => toggleCategory(catId)} className="text-emerald-600">×</button></span>
                        ) : null;
                      })}
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Tags</label>
                    <div className="relative mt-2" ref={tagsDropdownRef}>
                      <button onClick={() => handleTagsDropdownToggle(!showTagsDropdown)} className={`w-full text-left p-2 rounded-lg border flex items-center justify-between ${isDark ? "border-gray-600 bg-gray-700 text-white" : "border-gray-100 bg-white text-gray-900"}`}>
                        <span className={tags.length > 0 ? 'text-gray-900' : 'text-gray-400'}>{getSelectedTagsText()}</span>
                        <ChevronDown size={16} />
                      </button>
                      {showTagsDropdown && (
                        <div className={`absolute z-10 w-full mt-2 rounded-xl shadow-lg ring-1 overflow-hidden ${isDark ? "bg-gray-800 ring-gray-700" : "bg-white ring-gray-100"}`}>
                          <div className="p-3 border-b">
                            <input type="text" placeholder="Search tags..." value={tagSearch} onChange={(e) => setTagSearch(e.target.value)} className={`w-full p-2 rounded-md border ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-200 text-gray-900"}`} />
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {filteredTags.length > 0 ? filteredTags.map((tag) => (
                              <label key={tag._id} className={`flex items-center gap-2 px-4 py-3 cursor-pointer ${isDark ? "hover:bg-gray-700 text-gray-200" : "hover:bg-emerald-50 text-gray-900"}`}>
                                <input type="checkbox" checked={tags.includes(tag._id)} onChange={() => toggleTag(tag._id)} className="w-4 h-4" />
                                <span>#{tag.name}</span>
                              </label>
                            )) : <div className="p-4 text-sm text-gray-500">No tags found</div>}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tags.map(tagId => {
                        const tag = availableTags.find(t => t.id === tagId);
                        return tag ? (
                          <span key={tagId} className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">#{tag.name}<button onClick={() => toggleTag(tagId)} className="ml-2">×</button></span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right: SEO + settings */}
          <div className="col-span-4">
            <div className={`backdrop-blur-sm rounded-2xl p-6 shadow-md sticky top-6 ${isDark ? "bg-gray-800" : "bg-white/80"}`}>
              <h3 className="font-semibold mb-4">SEO Analysis</h3>

              <div className="mb-4">
                <label className={`text-sm font-medium mb-1 block ${isDark ? "text-gray-300" : "text-gray-700"}`}>Focus Keyword</label>
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className={`w-full p-3 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"}`}
                  placeholder="Enter keyword…"
                />
              </div>

              <div className={`mb-6 p-4 rounded-2xl shadow-inner ${isDark ? "bg-gray-800" : "bg-white"}`}>
                <h4 className={`font-medium text-sm mb-3 ${isDark ? "text-gray-400" : "text-gray-500"}`}>SEO Score</h4>
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
                <h4 className="font-medium mb-3">SEO Checklist</h4>
                <div className="space-y-3">
                  {seoChecks.length === 0 && <div className="text-sm text-gray-500">No checks yet</div>}
                  {seoChecks.map((c, i) => (
                    <div key={`${c.text}-${i}`} className="flex items-start gap-3">
                      {c.status === 'success' && <CheckCircle2 size={18} className="text-emerald-500 mt-0.5" />}
                      {c.status === 'warning' && <AlertCircle size={18} className="text-yellow-500 mt-0.5" />}
                      {c.status === 'error' && <XCircle size={18} className="text-red-500 mt-0.5" />}
                      <div className={`text-sm ${
                        c.status === 'success' ? 'text-gray-700' :
                        c.status === 'warning' ? 'text-yellow-800' : 'text-red-700'
                      }`}>
                        {c.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-2">Slide Settings</h4>
                <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Click a slide to edit its text, alt text, and image source. Images are auto-cropped to 9:16 portrait.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
