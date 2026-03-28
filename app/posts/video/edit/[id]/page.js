'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import MediaImagesSelector from '../../../../media/MediaImagesSelector';
import { ArrowLeft, ChevronDown, CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';
import { posts } from '../../../../../lib/api';
import { useUser } from 'context/UserContext';
import { useTheme } from 'context/ThemeContext';

// Load TinyMCE dynamically
const Editor = dynamic(() => import('@tinymce/tinymce-react').then(mod => mod.Editor), {
  ssr: false,
});

export default function VideoEditorPage() {
  const [activeTab, setActiveTab] = useState('content');
  const router = useRouter();
  const params = useParams();
  const [postId, setPostId] = useState(params?.id);

  useEffect(() => {
    setPostId(params?.id);
  }, [params?.id]);

  // Post status and Auto-save
  const [postStatus, setPostStatus] = useState('draft');
  const [lastSaved, setLastSaved] = useState(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isInitialLoad = useRef(true);
  const editorCallbackRef = useRef(null);
  const [showMediaSelector, setShowMediaSelector] = useState(false);

  // content fields
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [slug, setSlug] = useState('');
  const [featuredImage, setFeaturedImage] = useState(null);

  // YouTube video
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoId, setVideoId] = useState('');
  const [videoError, setVideoError] = useState('');

  // dropdown state
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // properties fields
  const [publishDate, setPublishDate] = useState('');
  const [publishTime, setPublishTime] = useState('');

  // Preview modal
  const [showPreview, setShowPreview] = useState(false);

  // Dropdown states for multi-select
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);

  // Search states
  const [authorSearch, setAuthorSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');

  const authorDropdownRef = useRef(null);
  const categoriesDropdownRef = useRef(null);
  const tagsDropdownRef = useRef(null);

  // API and loading states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { user } = useUser();
  const { isDark } = useTheme();

  // Available options
  const [availableAuthors, setAvailableAuthors] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

  // Auto-set current date and time
  useEffect(() => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const timeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
    setPublishDate(dateStr);
    setPublishTime(timeStr);
  }, []);

  const [author, setAuthor] = useState('');
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [schema, setSchema] = useState('');

  // SEO
  const [keyword, setKeyword] = useState('');
  const [seoScore, setSeoScore] = useState(0);
  const [seoChecks, setSeoChecks] = useState([]);

  // Fetch users, categories and tags from database
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch authors/users
        const usersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, { headers });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          const usersList = Array.isArray(usersData.users) ? usersData.users : (Array.isArray(usersData.data) ? usersData.data : (Array.isArray(usersData) ? usersData : []));
          const mappedAuthors = usersList.map(u => ({
            id: u._id,
            name: u.name,
            email: u.email
          }));
          setAvailableAuthors(mappedAuthors);
        }

        // Fetch categories
        const catRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, { headers });
        if (catRes.ok) {
          const catData = await catRes.json();
          const categories = Array.isArray(catData.categories) ? catData.categories : (Array.isArray(catData.data) ? catData.data : (Array.isArray(catData) ? catData : []));
          setAvailableCategories(categories);
        }

        // Fetch tags
        const tagRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tags`, { headers });
        if (tagRes.ok) {
          const tagData = await tagRes.json();
          const tags = Array.isArray(tagData.tags) ? tagData.tags : (Array.isArray(tagData.data) ? tagData.data : (Array.isArray(tagData) ? tagData : []));
          setAvailableTags(tags);
        }
      } catch (err) {
        console.error('FetchAllData error:', err);
      }
    };

    fetchAllData();
  }, []);

  // Fetch existing post data if editing
  useEffect(() => {
    const fetchPost = async () => {
      if (postId && postId !== 'new') {
        try {
          const response = await posts.getById(postId);
          if (response && !response.error) {
            setTitle(response.title || '');
            setSummary(response.summary || response.excerpt || '');
            setContent(response.content || '');
            setSlug(response.slug || '');
            
            // Video specific
            if (response.video) {
                setYoutubeUrl(response.video.url || '');
                setVideoId(response.video.videoId || '');
            setFeaturedImage(response.featuredImage || null);
            }

            // Handle Date/Time
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

            // Handle Author
            if (response.author) {
              const authId = typeof response.author === 'object' 
                ? (response.author._id || response.author.id) 
                : response.author;
              setAuthor(String(authId));
            }

            // Handle Categories
            if (Array.isArray(response.categories)) {
                const catIds = response.categories.map(c => 
                  typeof c === 'object' && c !== null ? (c._id || c.id) : c
                ).filter(Boolean);
                setCategories(catIds);
            }

            // Handle Tags
            if (Array.isArray(response.tags)) {
                const tagIds = response.tags.map(t => 
                  typeof t === 'object' && t !== null ? (t._id || t.id) : t
                ).filter(Boolean);
                setTags(tagIds);
            }

            setMetaTitle(response.seo?.metaTitle || response.metaTitle || '');
            setMetaDescription(response.seo?.metaDescription || response.metaDescription || '');
            setSchema(response.seo?.schema ? JSON.stringify(response.seo.schema) : '');
            setKeyword(response.seo?.focusKeyword || '');
            setPostStatus(response.status || 'draft');
            
            setTimeout(() => {
              isInitialLoad.current = false;
            }, 500);
          }
        } catch (err) {
          console.error('Error fetching post:', err);
        }
      }
    };
    fetchPost();
  }, [postId]);

  // Extract YouTube video ID
  const extractYouTubeId = (url) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Handle YouTube URL change
  const handleYouTubeUrlChange = (url) => {
    setYoutubeUrl(url);
    if (!url.trim()) {
      setVideoId('');
      setVideoError('');
      return;
    }

    const id = extractYouTubeId(url);
    if (id) {
      setVideoId(id);
      setVideoError('');
      setFeaturedImage({
          url: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
          altText: title || 'Video Thumbnail',
          caption: title || ''
      });
    } else {
      setVideoId('');
      setVideoError('Invalid YouTube URL. Please enter a valid YouTube video link.');
    }
  };

  // Auto-save & Unsaved Changes Logic
  useEffect(() => {
    if (isInitialLoad.current) {
      if (postId === 'new') {
         isInitialLoad.current = false;
      } else {
         return;
      }
    }
    setHasUnsavedChanges(true);
  }, [title, summary, content, slug, youtubeUrl, publishDate, publishTime, author, categories, tags, metaTitle, metaDescription, keyword, schema]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (hasUnsavedChanges && !isLoading && !isAutoSaving) {
        console.log('Triggering auto-save...');
        handleSaveDraft(true);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [hasUnsavedChanges, isLoading, isAutoSaving]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
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

  // Auto-generate slug from title
  useEffect(() => {
    if (postStatus === 'published') return;

    if (title) {
      const autoSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(autoSlug);
    }
  }, [title, postStatus]);

  // Helper: Strip HTML tags
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

  // Helper: Calculate readability
  const calculateReadability = (text) => {
    const words = countWords(text);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const syllables = text.split(/\s+/).reduce((count, word) => {
      return count + Math.max(1, word.toLowerCase().split(/[aeiouy]+/).length - 1);
    }, 0);

    if (words === 0 || sentences === 0) return 0;

    const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
    return Math.max(0, Math.min(100, score));
  };

  // Helper: Count keyword density
  const calculateKeywordDensity = (text, keyword) => {
    if (!keyword) return 0;
    const words = countWords(text);
    const keywordRegex = new RegExp(keyword, 'gi');
    const matches = text.match(keywordRegex);
    return words > 0 ? ((matches?.length || 0) / words) * 100 : 0;
  };

  // Helper: Check heading structure
  const checkHeadingStructure = (html) => {
    const headings = {
      h1: (html.match(/<h1/gi) || []).length,
      h2: (html.match(/<h2/gi) || []).length,
      h3: (html.match(/<h3/gi) || []).length,
    };
    return headings;
  };

  // Helper: Count links
  const countLinks = (html) => {
    const internal = (html.match(/<a[^>]*href=["'](?!http)/gi) || []).length;
    const external = (html.match(/<a[^>]*href=["']http/gi) || []).length;
    return { internal, external };
  };

  // Comprehensive SEO Analysis
  useEffect(() => {
    const checks = [];
    let score = 0;
    const maxScore = 100;
    const plainContent = stripHtml(content);
    const wordCount = countWords(plainContent);
    const keywordLower = (keyword || '').toLowerCase();

    // 1. Focus Keyword
    if (!keyword) {
      checks.push({ status: 'error', text: 'Add a focus keyword' });
    } else {
      checks.push({ status: 'success', text: 'Focus keyword set' });
      score += 5;
    }

    // 2. Title Length
    if (title.length === 0) {
      checks.push({ status: 'error', text: 'Add a title' });
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

    // 3. Keyword in Title
    if (keyword && title.toLowerCase().includes(keywordLower)) {
      checks.push({ status: 'success', text: 'Keyword appears in title' });
      score += 10;
    } else if (keyword) {
      checks.push({ status: 'error', text: 'Keyword not found in title' });
    }

    // 4. Meta Description Length
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

    // 5. Keyword in Meta Description
    if (keyword && metaDescription.toLowerCase().includes(keywordLower)) {
      checks.push({ status: 'success', text: 'Keyword appears in meta description' });
      score += 10;
    } else if (keyword && metaDescription) {
      checks.push({ status: 'error', text: 'Keyword not in meta description' });
    }

    // 6. Content Length
    if (wordCount === 0) {
      checks.push({ status: 'error', text: 'Add content to your video' });
    } else if (wordCount < 300) {
      checks.push({ status: 'warning', text: `Content is too short (${wordCount} words, min 300)` });
      score += 5;
    } else if (wordCount < 600) {
      checks.push({ status: 'warning', text: `Content length is acceptable (${wordCount} words)` });
      score += 7;
    } else {
      checks.push({ status: 'success', text: `Good content length (${wordCount} words)` });
      score += 10;
    }

    // 7. Keyword in First Paragraph
    const firstParagraph = plainContent.substring(0, 200);
    if (keyword && firstParagraph.toLowerCase().includes(keywordLower)) {
      checks.push({ status: 'success', text: 'Keyword appears in first paragraph' });
      score += 8;
    } else if (keyword && plainContent) {
      checks.push({ status: 'warning', text: 'Keyword not in first paragraph' });
      score += 3;
    }

    // 8. Keyword Density
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

    // 9. Readability Score
    if (plainContent) {
      const readability = calculateReadability(plainContent);
      if (readability >= 60) {
        checks.push({ status: 'success', text: `Content is easy to read (score: ${readability.toFixed(0)})` });
        score += 8;
      } else if (readability >= 30) {
        checks.push({ status: 'warning', text: `Content readability is average (score: ${readability.toFixed(0)})` });
        score += 5;
      } else {
        checks.push({ status: 'warning', text: `Content is difficult to read (score: ${readability.toFixed(0)})` });
        score += 2;
      }
    }

    // 10. Heading Structure
    const headings = checkHeadingStructure(content);
    if (headings.h1 > 1) {
      checks.push({ status: 'warning', text: `Multiple H1 tags found (${headings.h1}), use only one` });
      score += 2;
    } else if (headings.h1 === 1) {
      checks.push({ status: 'success', text: 'Proper H1 structure' });
      score += 3;
    }

    if (headings.h2 >= 2) {
      checks.push({ status: 'success', text: `Good use of H2 headings (${headings.h2})` });
      score += 4;
    } else if (headings.h2 > 0) {
      checks.push({ status: 'warning', text: 'Add more H2 headings for better structure' });
      score += 2;
    } else if (plainContent.length > 300) {
      checks.push({ status: 'error', text: 'No H2 headings found' });
    }

    // 11. Internal/External Links
    const links = countLinks(content);
    if (links.internal > 0 && links.external > 0) {
      checks.push({ status: 'success', text: `Good link structure (${links.internal} internal, ${links.external} external)` });
      score += 5;
    } else if (links.internal > 0 || links.external > 0) {
      checks.push({ status: 'warning', text: 'Add both internal and external links' });
      score += 3;
    } else if (plainContent.length > 300) {
      checks.push({ status: 'warning', text: 'No links found in content' });
    }

    // 12. URL Slug
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

    // 13. YouTube Video (5 points)
    if (videoId) {
        checks.push({ status: 'success', text: 'YouTube video added' });
        score += 5;
    } else {
        checks.push({ status: 'warning', text: 'No YouTube video added' });
    }

    setSeoScore(Math.min(score, maxScore));
    setSeoChecks(checks);
  }, [keyword, title, summary, content, metaDescription, slug, videoId]);

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

  const handleSaveDraft = async (isAutoSave = false) => {
    try {
      if (isAutoSave) {
        setIsAutoSaving(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      setSuccess(null);

      const postData = {
        title,
        slug,
        summary,
        content,
        type: 'video',
        featuredImage,
        status: 'draft',
        author: author || null,
        categories,
        tags,
        seoScore,
        videoUrl: youtubeUrl,
        video: {
            provider: 'youtube',
            url: youtubeUrl,
            videoId: videoId
        },
        publishDate,
        publishTime,
        seo: {
          metaTitle: metaTitle || title,
          metaDescription,
          schema: schema ? JSON.parse(schema) : null,
          focusKeyword: keyword,
        },
      };

      let response;
      if (postId && postId !== 'new') {
        response = await posts.update(postId, postData);
      } else {
        response = await posts.create(postData);
      }
      
      if (response && response.error) {
        setError(response.error);
      } else {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        
        if (!isAutoSave) {
          setSuccess(postId ? 'Draft updated successfully!' : 'Draft saved successfully!');
          setTimeout(() => router.push('/posts/drafts'), 2000);
        } else {
          if (!postId && response._id) {
             setPostId(response._id);
             window.history.replaceState(null, '', `/posts/video/edit/${response._id}`);
          }
        }
      }
    } catch (err) {
      if (!isAutoSave) setError('Failed to save draft: ' + err.message);
      console.error('Save draft error:', err);
    } finally {
      setIsLoading(false);
      setIsAutoSaving(false);
    }
  };

  const handleSendForApproval = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const postData = {
        title,
        slug,
        summary,
        content,
        type: 'video',
        featuredImage,
        status: 'pending',
        author: author || null,
        categories,
        tags,
        seoScore,
        videoUrl: youtubeUrl,
        video: {
            provider: 'youtube',
            url: youtubeUrl,
            videoId: videoId
        },
        publishDate,
        publishTime,
        seo: {
          metaTitle: metaTitle || title,
          metaDescription,
          schema: schema ? JSON.parse(schema) : null,
          focusKeyword: keyword,
        },
      };

      let response;
      if (postId && postId !== 'new') {
        response = await posts.update(postId, postData);
      } else {
        response = await posts.create(postData);
      }
      
      if (response && response.error) {
        setError(response.error);
      } else {
        setSuccess(postId ? 'Sent for approval' : 'Video sent for approval!');
        setTimeout(() => router.push('/posts'), 2000);
      }
    } catch (err) {
      setError('Failed to send for approval: ' + err.message);
      console.error('Send for approval error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const now = new Date();
      const currentDate = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const currentTime = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });

      const postData = {
        title,
        slug,
        summary,
        content,
        type: 'video',
        featuredImage,
        status: 'published',
        author: author || null,
        categories,
        tags,
        seoScore,
        videoUrl: youtubeUrl,
        video: {
            provider: 'youtube',
            url: youtubeUrl,
            videoId: videoId
        },
        publishDate: currentDate,
        publishTime: currentTime,
        publishedAt: now.toISOString(),
        seo: {
          metaTitle: metaTitle || title,
          metaDescription,
          schema: schema ? JSON.parse(schema) : null,
          focusKeyword: keyword,
        },
      };

      let response;
      if (postId && postId !== 'new') {
        response = await posts.update(postId, postData);
      } else {
        response = await posts.create(postData);
      }
      
      if (response && response.error) {
        setError(response.error);
      } else {
        setSuccess('Video published successfully!');
        setTimeout(() => router.push('/posts/published'), 2000);
      }
    } catch (err) {
      setError('Failed to publish: ' + err.message);
      console.error('Publish error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      // Get the current post to preserve publishedAt
      let preservedPublishedAt = undefined;
      if (postId && postId !== 'new') {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}`);
          if (response.ok) {
            const currentPost = await response.json();
            preservedPublishedAt = currentPost.publishedAt;
          }
        } catch (e) {
          console.warn('Could not fetch current post to preserve publishedAt');
        }
      }

      const postData = {
        title,
        slug,
        summary,
        content,
        type: 'video',
        featuredImage,
        status: 'published',
        author: author || null,
        categories,
        tags,
        seoScore,
        videoUrl: youtubeUrl,
        video: {
            provider: 'youtube',
            url: youtubeUrl,
            videoId: videoId
        },
        publishDate,
        publishTime,
        // IMPORTANT: Preserve original publishedAt if it exists (don't change publish date on update)
        ...(preservedPublishedAt && { publishedAt: preservedPublishedAt }),
        seo: {
          metaTitle: metaTitle || title,
          metaDescription,
          schema: schema ? JSON.parse(schema) : null,
          focusKeyword: keyword,
        },
      };

      const response = await posts.update(postId, postData);
      
      if (response && response.error) {
        setError(response.error);
      } else {
        setSuccess('Video updated successfully!');
        setTimeout(() => router.push('/posts/published'), 2000);
      }
    } catch (err) {
      setError('Failed to update video: ' + err.message);
      console.error('Update error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = (categoryId) => {
    setCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleTag = (tagId) => {
    setTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const getSelectedCategoriesText = () => {
    if (categories.length === 0) return 'Select categories';
    const names = categories.map(id =>
      availableCategories.find(cat => cat._id === id || cat.id === id)?.name
    ).filter(Boolean);
    return names.join(', ');
  };

  const getSelectedTagsText = () => {
    if (tags.length === 0) return 'Select tags';
    const names = tags.map(id =>
      availableTags.find(tag => tag._id === id || tag.id === id)?.name
    ).filter(Boolean);
    return names.join(', ');
  };

  // Filter functions for search
  const filteredAuthors = Array.isArray(availableAuthors) ? availableAuthors.filter(author =>
    author?.name?.toLowerCase().includes(authorSearch.toLowerCase())
  ) : [];

  const filteredCategories = Array.isArray(availableCategories) ? availableCategories.filter(category =>
    category?.name?.toLowerCase().includes(categorySearch.toLowerCase())
  ) : [];

  const filteredTags = Array.isArray(availableTags) ? availableTags.filter(tag =>
    tag?.name?.toLowerCase().includes(tagSearch.toLowerCase())
  ) : [];

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

  const panel = `backdrop-blur-sm rounded-2xl shadow-md transition-colors duration-200 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white/80 ring-1 ring-gray-100'}`;

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDark ? "bg-gray-900" : "bg-gradient-to-b from-slate-50 to-white"} p-6`}>
      
      {/* Top bar */}
      <div className={`flex items-center justify-between mb-6 p-4 ${panel}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-colors ${isDark ? "text-gray-300 hover:text-white hover:bg-gray-700" : "text-gray-700 hover:text-black hover:bg-gray-100"}`}
          >
            <ArrowLeft size={18} />
            <span className="font-medium">Back</span>
          </button>
          <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>{postId ? 'Edit' : 'Create'} Video</div>
        </div>

        <div className="flex items-center gap-3">
          {(lastSaved || isAutoSaving) && (
            <span className={`text-xs mr-2 hidden md:inline-block transition-opacity duration-300 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              {isAutoSaving ? 'Saving...' : `Saved ${lastSaved?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
            </span>
          )}

          <button
            onClick={() => setShowPreview(true)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${isDark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "hover:bg-gray-50 text-gray-700"}`}
          >
            Preview
          </button>

          <button
            onClick={handleSaveDraft}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${isDark ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            {isLoading ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            onClick={handleSendForApproval}
            disabled={isLoading}
            className="px-5 py-2 rounded-full shadow border disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: isDark ? "#1f2937" : "white",
              color: isDark ? "#60a5fa" : "rgb(24 94 253)",
              borderColor: isDark ? "#60a5fa" : "rgb(24 94 253)"
            }}
          >
            {isLoading ? 'Sending...' : 'Send for Approval'}
          </button>

          {postId && postId !== 'new' && (
            <button
              onClick={handleUpdate}
              disabled={isLoading}
              className="px-5 py-2 rounded-full shadow border disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isDark ? "#1f2937" : "white",
                color: isDark ? "#60a5fa" : "rgb(24 94 253)",
                borderColor: isDark ? "#60a5fa" : "rgb(24 94 253)"
              }}
            >
              {isLoading ? 'Updating...' : 'Update'}
            </button>
          )}

          <button
            onClick={handlePublish}
            disabled={isLoading}
            className="px-5 py-2 rounded-full shadow disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "rgb(24 94 253)",
              color: "white"
            }}
          >
            {isLoading ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      {error && (
        <div className={`mb-6 p-4 rounded-lg flex items-center justify-between ${isDark ? "bg-red-900/30 border border-red-700 text-red-400" : "bg-red-50 border border-red-200 text-red-700"}`}>
          <span>{error}</span>
          <button onClick={() => setError(null)} className={`${isDark ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-800"}`}>
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className={`mb-6 p-4 rounded-lg flex items-center justify-between ${isDark ? "bg-green-900/30 border border-green-700 text-green-400" : "bg-green-50 border border-green-200 text-green-700"}`}>
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className={`${isDark ? "text-green-400 hover:text-green-300" : "text-green-600 hover:text-green-800"}`}>
            <X size={18} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <div className={`${panel} p-6 space-y-6`}> 
            <div className={`flex items-center gap-6 border-b pb-4 ${isDark ? "border-gray-700" : "border-gray-200"}`}>
              <button onClick={() => setActiveTab('content')} className={`pb-2 ${activeTab === 'content' ? 'border-b-2 border-emerald-500 font-semibold ' + (isDark ? 'text-white' : 'text-gray-900') : 'text-gray-400'}`}>Content</button>
              <button onClick={() => setActiveTab('properties')} className={`pb-2 ${activeTab === 'properties' ? 'border-b-2 border-emerald-500 font-semibold ' + (isDark ? 'text-white' : 'text-gray-900') : 'text-gray-400'}`}>Properties</button>
            </div>

            {activeTab === 'content' && (
              <div className="space-y-6">
                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Title</label>
                  <input
                    className={`w-full mt-2 p-3 rounded-xl border shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-200 text-gray-900"}`}
                    placeholder="Write the title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <div className={`flex justify-between items-center mt-2 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    <div>{title.length}/60 characters</div>
                    <div className="text-xs">Preview: <span className="font-medium">{slug || 'video-url-slug'}</span></div>
                  </div>
                </div>

                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>URL Slug</label>
                  <input
                    className={`w-full mt-2 p-3 rounded-lg border font-mono text-sm shadow-inner ${isDark ? "bg-gray-700 border-gray-600 text-gray-300" : "bg-white border-gray-100 text-gray-900"}`}
                    placeholder="video-url-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>

                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Summary</label>
                  <textarea
                    className={`w-full mt-2 p-3 rounded-xl border h-28 resize-none shadow-sm ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-100 text-gray-900"}`}
                    placeholder="Short summary..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                  />
                </div>

                {/* YouTube Video Section */}
                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>YouTube URL</label>
                  <input 
                    type="text" 
                    className={`w-full mt-2 p-3 rounded-xl border shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-200 text-gray-900"}`}
                    placeholder="https://youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                  />
                  {videoError && <p className="text-red-500 text-sm mt-1">{videoError}</p>}
                  {videoId && (
                    <div className={`mt-4 rounded-xl overflow-hidden shadow-sm border ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-gray-50"}`}>
                      <div className="aspect-video">
                        <iframe
                          width="100%"
                          height="100%"
                          src={`https://www.youtube.com/embed/${videoId}`}
                          title="YouTube video player"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className={`text-sm font-medium mb-2 block ${isDark ? "text-gray-300" : "text-gray-700"}`}>Content</label>
                  <div className={`rounded-lg overflow-hidden border ${isDark ? "border-gray-600" : "border-gray-200"}`}>
                    <Editor
                      apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                      value={content}
                      onEditorChange={(newValue) => setContent(newValue)}
                      init={{
                        height: 520,
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

                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Author</label>
                  <div className="relative mt-2" ref={authorDropdownRef}>
                    <button type="button" onClick={() => handleAuthorDropdownToggle(!showAuthorDropdown)} className={`w-full text-left p-2 rounded-lg border flex items-center justify-between ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-100 text-gray-900"}`}>
                      <span className={author ? (isDark ? 'text-white' : 'text-gray-900') : 'text-gray-400'}>{author ? (availableAuthors.find(a => a.id === author)?.name || 'Select Author') : 'Select Author'}</span>
                      <ChevronDown size={16} />
                    </button>

                    {showAuthorDropdown && (
                      <div className={`absolute z-10 w-full mt-2 rounded-xl shadow-lg ring-1 overflow-hidden ${isDark ? "bg-gray-800 ring-gray-700" : "bg-white ring-gray-100"}`}>
                        <div className={`p-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                          <input type="text" placeholder="Search authors..." value={authorSearch} onChange={(e) => setAuthorSearch(e.target.value)} className={`w-full p-2 rounded-md border ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-200 text-gray-900"}`} />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredAuthors.length > 0 ? filteredAuthors.map((authorOption) => (
                            <button key={authorOption.id} onClick={() => { setAuthor(String(authorOption.id)); handleAuthorDropdownToggle(false); }} className={`w-full text-left px-4 py-3 ${isDark ? "hover:bg-gray-700 text-gray-200" : "hover:bg-emerald-50 text-gray-900"} ${author === authorOption.id ? (isDark ? "bg-gray-700 font-medium" : "bg-emerald-50 font-medium") : ""}`}>{authorOption.name}</button>
                          )) : <div className={`p-4 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>No authors found</div>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Categories</label>
                  <div className="relative mt-2" ref={categoriesDropdownRef}>
                    <button onClick={() => handleCategoriesDropdownToggle(!showCategoriesDropdown)} className={`w-full text-left p-2 rounded-lg border flex items-center justify-between ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-100 text-gray-900"}`}>
                      <span className={categories.length > 0 ? (isDark ? 'text-white' : 'text-gray-900') : 'text-gray-400'}>{getSelectedCategoriesText()}</span>
                      <ChevronDown size={16} />
                    </button>
                    
                    {showCategoriesDropdown && (
                      <div className={`absolute z-10 w-full mt-2 rounded-xl shadow-lg ring-1 overflow-hidden ${isDark ? "bg-gray-800 ring-gray-700" : "bg-white ring-gray-100"}`}>
                        <div className={`p-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                          <input type="text" placeholder="Search categories..." value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} className={`w-full p-2 rounded-md border ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-200 text-gray-900"}`} />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredCategories.length > 0 ? filteredCategories.map((category) => (
                            <label key={category._id} className={`flex items-center gap-2 px-4 py-3 cursor-pointer ${isDark ? "hover:bg-gray-700 text-gray-200" : "hover:bg-emerald-50 text-gray-900"}`}>
                              <input type="checkbox" checked={categories.includes(category._id)} onChange={() => toggleCategory(category._id)} />
                              <span>{category.name}</span>
                            </label>
                          )) : <div className={`p-4 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>No categories found</div>}
                        </div>
                      </div>
                    )}
                  </div>

                  {categories.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {categories.map(catId => {
                        const cat = availableCategories.find(c => c._id === catId);
                        return cat ? (
                          <span key={cat._id} className={`text-xs px-3 py-1 rounded-full flex items-center gap-2 ${isDark ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}>{cat.name}<button onClick={() => toggleCategory(catId)} className="text-emerald-600"><X size={14} /></button></span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Tags</label>
                  <div className="relative mt-2" ref={tagsDropdownRef}>
                    <button onClick={() => handleTagsDropdownToggle(!showTagsDropdown)} className={`w-full text-left p-2 rounded-lg border flex items-center justify-between ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-100 text-gray-900"}`}>
                      <span className={tags.length > 0 ? (isDark ? 'text-white' : 'text-gray-900') : 'text-gray-400'}>{getSelectedTagsText()}</span>
                      <ChevronDown size={16} />
                    </button>

                    {showTagsDropdown && (
                      <div className={`absolute z-10 w-full mt-2 rounded-xl shadow-lg ring-1 overflow-hidden ${isDark ? "bg-gray-800 ring-gray-700" : "bg-white ring-gray-100"}`}>
                        <div className={`p-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                          <input type="text" placeholder="Search tags..." value={tagSearch} onChange={(e) => setTagSearch(e.target.value)} className={`w-full p-2 rounded-md border ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-200 text-gray-900"}`} />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredTags.length > 0 ? filteredTags.map((tag) => (
                            <label key={tag._id} className={`flex items-center gap-2 px-4 py-3 cursor-pointer ${isDark ? "hover:bg-gray-700 text-gray-200" : "hover:bg-emerald-50 text-gray-900"}`}>
                              <input type="checkbox" checked={tags.includes(tag._id)} onChange={() => toggleTag(tag._id)} className="w-4 h-4" />
                              <span>#{tag.name}</span>
                            </label>
                          )) : <div className={`p-4 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>No tags found</div>}
                        </div>
                      </div>
                    )}
                  </div>

                  {tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tags.map(tagId => {
                        const tag = availableTags.find(t => t._id === tagId);
                        return tag ? (
                          <span key={tag._id} className={`text-xs px-3 py-1 rounded-full ${isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"}`}>#{tag.name}<button onClick={() => toggleTag(tagId)} className="ml-2"><X size={14} /></button></span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Meta Title</label>
                  <input className={`w-full mt-2 p-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-100 text-gray-900"}`} value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Leave empty to use video title" />
                </div>

                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Meta Description</label>
                  <textarea className={`w-full mt-2 p-3 rounded-lg border h-24 ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-100 text-gray-900"}`} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} placeholder="SEO meta description..." />
                  <div className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{metaDescription.length}/160 characters</div>
                </div>

                <div>
                  <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Schema (JSON-LD)</label>
                  <textarea className={`w-full mt-2 p-3 rounded-lg border h-32 font-mono ${isDark ? "bg-gray-700 border-gray-600 text-gray-300" : "bg-white border-gray-100 text-gray-900"}`} value={schema} onChange={(e) => setSchema(e.target.value)} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SEO Score PANEL */}
        <div className="col-span-4">
          <div className={`${panel} p-6 sticky top-6`}>
            <h2 className={`font-semibold text-lg mb-4 ${isDark ? "text-white" : ""}`}>SEO Analysis</h2>

            <div className="mb-4">
              <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Focus Keyword</label>
              <input className={`w-full mt-2 p-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-100 text-gray-900"}`} placeholder="Enter keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>

            <div className={`mb-6 p-4 rounded-lg shadow-inner ${isDark ? "bg-gray-700/50" : "bg-white"}`}>
              <h3 className={`font-medium text-sm mb-3 ${isDark ? "text-gray-400" : "text-gray-500"}`}>SEO Score</h3>
              <div className="flex items-center gap-4">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getSEOColor()}`}>
                    <div className="text-sm font-bold text-white">{seoScore}</div>
                  </div>
                </div>
                <div>
                  <div className={`text-sm font-semibold ${getSEOTextColor()}`}>{getSEORating()}</div>
                  <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>out of 100</div>
                </div>
              </div>

              <div className="mt-4">
                <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
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
                    <div className={`text-sm ${check.status === 'success' ? (isDark ? 'text-gray-300' : 'text-gray-700') : check.status === 'warning' ? (isDark ? 'text-yellow-400' : 'text-yellow-700') : (isDark ? 'text-red-400' : 'text-red-700')}`}>{check.text}</div>
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPreview(false)} />
          <div className={`relative z-10 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden ${isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
            <div className={`flex items-center justify-between p-4 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
              <h3 className="text-lg font-semibold">Video Preview</h3>
              <button onClick={() => setShowPreview(false)} className={`p-2 rounded ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}><X size={18} /></button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {videoId && (
                <div className="mb-6 rounded-lg overflow-hidden aspect-video">
                    <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
              )}

              <div className="mb-4">
                {categories.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    {categories.map(catId => {
                      const cat = availableCategories.find(c => c._id === catId);
                      return cat ? <span key={cat._id} className={`text-xs px-2 py-1 rounded ${isDark ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}>{cat.name}</span> : null;
                    })}
                  </div>
                )}
              </div>

              <h1 className="text-3xl font-bold mb-4">{title || 'Untitled Video'}</h1>

              <div className={`flex items-center gap-4 text-sm mb-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                {author && <span>By {availableAuthors.find(a => a.id === author)?.name || author}</span>}
                <span>â€¢</span>
                <span>{new Date(publishDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>

              {summary && <p className={`text-lg italic mb-6 border-l-4 border-emerald-500 pl-4 ${isDark ? "text-gray-300" : "text-gray-600"}`}>{summary}</p>}

              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content || '<p>No content yet...</p>' }} />

              {tags.length > 0 && (
                <div className={`mt-8 pt-6 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                  <p className={`text-sm font-semibold mb-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tagId => {
                      const tag = availableTags.find(t => t._id === tagId);
                      return tag ? <span key={tag._id} className={`text-sm px-3 py-1 rounded-full ${isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"}`}>#{tag.name}</span> : null;
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className={`flex justify-end gap-3 p-4 border-t ${isDark ? "bg-gray-900/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
              <button onClick={() => setShowPreview(false)} className={`px-4 py-2 rounded-md border ${isDark ? "bg-gray-800 border-gray-700 hover:bg-gray-700" : "bg-white border-gray-200 hover:bg-gray-50"}`}>Close</button>
            </div>
          </div>
        </div>
      )}
      {/* Media Selector Modal */}
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
               // Handle featured image if needed, though Video/LiveBlog might handle it differently.
               // For now, let's assume it's mainly for editor insertion since that's the request.
            }
            setShowMediaSelector(false);
          }}
          onClose={() => { setShowMediaSelector(false); editorCallbackRef.current = null; }}
        />
      )}
    
    </div>
  );
}






