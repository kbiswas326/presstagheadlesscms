'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft, ChevronDown, CheckCircle2, XCircle, AlertCircle, X, Video } from "lucide-react";
import { useTheme } from '../../context/ThemeContext';

// Load TinyMCE dynamically
const Editor = dynamic(() => import('@tinymce/tinymce-react').then(mod => mod.Editor), {
  ssr: false,
});

export default function VideoEditorPage() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState("content");

  // content fields
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [slug, setSlug] = useState("");

  // YouTube video
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [videoError, setVideoError] = useState("");

  // dropdown state
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Preview modal
  const [showPreview, setShowPreview] = useState(false);

  // properties fields
  const [publishDate, setPublishDate] = useState("");
  const [publishTime, setPublishTime] = useState("");
  const [author, setAuthor] = useState("");
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  // Dropdown states for multi-select
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);
  
  // Search states
  const [authorSearch, setAuthorSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  
  const authorDropdownRef = useRef(null);
  const categoriesDropdownRef = useRef(null);
  const tagsDropdownRef = useRef(null);

  // Available options
  const availableAuthors = [
    { id: 1, name: "John Doe" },
    { id: 2, name: "Jane Smith" },
    { id: 3, name: "Mike Johnson" },
    { id: 4, name: "Sarah Williams" },
    { id: 5, name: "David Brown" },
    { id: 6, name: "Emily Davis" },
  ];

  const availableCategories = [
    { id: 1, name: "Sports" },
    { id: 2, name: "Football" },
    { id: 3, name: "Technology" },
    { id: 4, name: "Politics" },
    { id: 5, name: "Business" },
    { id: 6, name: "Entertainment" },
    { id: 7, name: "Health" },
    { id: 8, name: "Science" },
  ];

  const availableTags = [
    { id: 1, name: "India" },
    { id: 2, name: "News" },
    { id: 3, name: "Breaking" },
    { id: 4, name: "Featured" },
    { id: 5, name: "Trending" },
    { id: 6, name: "Analysis" },
    { id: 7, name: "Opinion" },
    { id: 8, name: "Exclusive" },
  ];

  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [schema, setSchema] = useState("");

  // SEO
  const [keyword, setKeyword] = useState("");
  const [seoScore, setSeoScore] = useState(0);
  const [seoChecks, setSeoChecks] = useState([]);

  // Auto-set current date and time
  useEffect(() => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 5);
    setPublishDate(dateStr);
    setPublishTime(timeStr);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (authorDropdownRef.current && !authorDropdownRef.current.contains(event.target)) {
        setShowAuthorDropdown(false);
        setAuthorSearch("");
      }
      if (categoriesDropdownRef.current && !categoriesDropdownRef.current.contains(event.target)) {
        setShowCategoriesDropdown(false);
        setCategorySearch("");
      }
      if (tagsDropdownRef.current && !tagsDropdownRef.current.contains(event.target)) {
        setShowTagsDropdown(false);
        setTagSearch("");
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    if (title) {
      const autoSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(autoSlug);
    }
  }, [title]);

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
      setVideoId("");
      setVideoError("");
      return;
    }

    const id = extractYouTubeId(url);
    if (id) {
      setVideoId(id);
      setVideoError("");
    } else {
      setVideoId("");
      setVideoError("Invalid YouTube URL. Please enter a valid YouTube video link.");
    }
  };

  // Helper: Strip HTML tags for content analysis
  const stripHtml = (html) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  // Helper: Count words
  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Helper: Calculate readability
  const calculateReadability = (text) => {
    const words = countWords(text);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const syllables = text.split(/\s+/).reduce((count, word) => {
      return count + word.toLowerCase().split(/[aeiouy]+/).length - 1;
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
    const keywordLower = keyword.toLowerCase();

    if (!keyword) {
      checks.push({ status: 'error', text: 'Add a focus keyword' });
    } else {
      checks.push({ status: 'success', text: 'Focus keyword set' });
      score += 5;
    }

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

    if (keyword && title.toLowerCase().includes(keywordLower)) {
      checks.push({ status: 'success', text: 'Keyword appears in title' });
      score += 10;
    } else if (keyword) {
      checks.push({ status: 'error', text: 'Keyword not found in title' });
    }

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

    if (keyword && metaDescription.toLowerCase().includes(keywordLower)) {
      checks.push({ status: 'success', text: 'Keyword appears in meta description' });
      score += 10;
    } else if (keyword && metaDescription) {
      checks.push({ status: 'error', text: 'Keyword not in meta description' });
    }

    if (wordCount === 0) {
      checks.push({ status: 'error', text: 'Add content to your video post' });
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

    const firstParagraph = plainContent.substring(0, 200);
    if (keyword && firstParagraph.toLowerCase().includes(keywordLower)) {
      checks.push({ status: 'success', text: 'Keyword appears in first paragraph' });
      score += 8;
    } else if (keyword && plainContent) {
      checks.push({ status: 'warning', text: 'Keyword not in first paragraph' });
      score += 3;
    }

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

    if (videoId) {
      checks.push({ status: 'success', text: 'Featured video added' });
      score += 5;
    } else {
      checks.push({ status: 'warning', text: 'No featured video added' });
    }

    setSeoScore(Math.min(score, maxScore));
    setSeoChecks(checks);
  }, [keyword, title, summary, content, metaDescription, slug, videoId]);

  const getSEOColor = () => {
    if (seoScore < 40) return "bg-red-400";
    if (seoScore < 70) return "bg-yellow-400";
    return "bg-emerald-500";
  };

  const getSEOTextColor = () => {
    if (seoScore < 40) return "text-red-600";
    if (seoScore < 70) return "text-yellow-600";
    return "text-emerald-600";
  };

  const getSEORating = () => {
    if (seoScore < 40) return "Poor";
    if (seoScore < 70) return "Good";
    return "Excellent";
  };

  const btnBase = 'px-4 py-2 rounded-full transition-all duration-150 inline-flex items-center justify-center text-sm';
  const publishNormal = 'bg-[rgb(24_94_253)] text-white';
  const publishHover = 'hover:bg-white hover:text-[rgb(24_94_253)] hover:border hover:border-[rgb(24_94_253)]';
  const sendNormal = 'bg-white text-[rgb(24_94_253)] border border-[rgb(24_94_253)]';
  const sendHover = 'hover:bg-[rgb(24_94_253)] hover:text-white';

  const handleSaveDraft = () => {
    console.log("Saving draft...");
    setShowDropdown(false);
  };

  const handleSendForApproval = () => {
    console.log("Sending for approval...");
    setShowDropdown(false);
  };

  const handlePublish = () => {
    console.log("Publishing...");
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
    if (categories.length === 0) return "Select categories";
    const names = categories.map(id => 
      availableCategories.find(cat => cat.id === id)?.name
    ).filter(Boolean);
    return names.join(", ");
  };

  const getSelectedTagsText = () => {
    if (tags.length === 0) return "Select tags";
    const names = tags.map(id => 
      availableTags.find(tag => tag.id === id)?.name
    ).filter(Boolean);
    return names.join(", ");
  };

  const filteredAuthors = availableAuthors.filter(author =>
    author.name.toLowerCase().includes(authorSearch.toLowerCase())
  );

  const filteredCategories = availableCategories.filter(category =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(tagSearch.toLowerCase())
  );

  const handleAuthorDropdownToggle = (value) => {
    setShowAuthorDropdown(value);
    if (!value) setAuthorSearch("");
  };

  const handleCategoriesDropdownToggle = (value) => {
    setShowCategoriesDropdown(value);
    if (!value) setCategorySearch("");
  };

  const handleTagsDropdownToggle = (value) => {
    setShowTagsDropdown(value);
    if (!value) setTagSearch("");
  };

  return (
    <div className={`min-h-screen p-6 transition-colors duration-200 ${isDark ? 'bg-gray-900' : 'bg-gradient-to-b from-slate-50 to-white'}`}>
      <div className="max-w-7xl mx-auto">
      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col ${isDark ? 'bg-gray-800 text-white' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className="text-xl font-semibold">Video Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className={`p-1 rounded ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8">
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
                      const cat = availableCategories.find(c => c.id === catId);
                      return cat ? (
                        <span key={catId} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {cat.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              <h1 className="text-4xl font-bold mb-4">{title || "Untitled Video"}</h1>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                {author && <span>By {availableAuthors.find(a => a.id === parseInt(author))?.name || author}</span>}
                <span>•</span>
                <span>{new Date(publishDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>

              {summary && (
                <p className="text-lg text-gray-600 italic mb-6 border-l-4 border-blue-500 pl-4">
                  {summary}
                </p>
              )}

              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: content || "<p>No content yet...</p>" }}
              />

              {tags.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <p className="text-sm font-semibold text-gray-600 mb-2">Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tagId => {
                      const tag = availableTags.find(t => t.id === tagId);
                      return tag ? (
                        <span key={tagId} className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                          #{tag.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className={`flex justify-end gap-3 p-4 border-t ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <button
                onClick={() => setShowPreview(false)}
                className={`px-4 py-2 rounded-lg ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('content')}
            className={`px-3 py-2 rounded-full ${activeTab === 'content' ? 'bg-[rgb(24_94_253)] text-white' : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')}`}
          >
            Content
          </button>
          <button
            onClick={() => setActiveTab('properties')}
            className={`px-3 py-2 rounded-full ${activeTab === 'properties' ? 'bg-[rgb(24_94_253)] text-white' : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')}`}
          >
            Properties
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 justify-end">
          <button
            onClick={() => setShowPreview(true)}
            className={`${btnBase} border`}
          >
            Preview
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className={`${btnBase} ${sendNormal} ${sendHover} gap-2`}
            >
              Save Draft
              <ChevronDown size={16} />
            </button>
            {showDropdown && (
              <div className={`absolute right-0 mt-2 shadow-lg rounded-xl w-48 border z-10 overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <button onClick={handleSaveDraft} className={`px-4 py-2 w-full text-left ${isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`}>Save Draft</button>
                <button onClick={handleSendForApproval} className={`px-4 py-2 w-full text-left ${isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`}>Send for Approval</button>
              </div>
            )}
          </div>

          <button
            onClick={handlePublish}
            className={`${btnBase} ${publishNormal} ${publishHover}`}
          >
            Publish
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-7">
          <div className={`backdrop-blur-sm rounded-2xl p-6 shadow-md transition-colors duration-200 ${isDark ? 'bg-gray-800' : 'bg-white/80'}`}>

          

          {activeTab === "content" && (
            <div className="space-y-6">

              <div>
                <label className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>Title</label>
                <input
                  className={`w-full border p-3 rounded mt-1 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'}`}
                  placeholder="Write the title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">{title.length}/60 characters</p>
              </div>

              <div>
                <label className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>URL Slug</label>
                <input
                  className={`w-full border p-3 rounded mt-1 font-mono text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                  placeholder="video-url-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>

              <div>
                <label className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>Summary</label>
                <textarea
                  className={`w-full border p-3 rounded mt-1 h-28 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'}`}
                  placeholder="Short summary..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
              </div>

              {/* YouTube Video Embed */}
              <div>
                <label className="font-medium block mb-2">Featured YouTube Video</label>
                
                {!videoId ? (
                  <div className="border-2 border-dashed border-gray-300 p-10 text-center rounded-lg hover:border-blue-400 transition-colors">
                    <input
                      type="text"
                      className={`w-full border p-3 rounded mb-3 ${videoError ? 'border-red-500' : (isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-white')}`}
                      placeholder="Paste YouTube URL (e.g., https://www.youtube.com/watch?v=...)"
                      value={youtubeUrl}
                      onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                    />
                    {videoError && (
                      <p className="text-red-500 text-sm">{videoError}</p>
                    )}
                    {!videoError && (
                      <p className="text-xs text-gray-500">
                        Supports: youtube.com/watch?v=, youtu.be/, youtube.com/embed/
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="relative group rounded-lg overflow-hidden">
                    <div className="w-full aspect-video bg-gray-100">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      ></iframe>
                    </div>

                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => {
                          const newUrl = prompt("Enter new YouTube URL:", youtubeUrl);
                          if (newUrl !== null) {
                            handleYouTubeUrlChange(newUrl);
                          }
                        }}
                        className="bg-white text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors shadow-lg"
                      >
                        Change Video
                      </button>
                      <button
                        onClick={() => {
                          setYoutubeUrl("");
                          setVideoId("");
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors shadow-lg"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-sm font-medium truncate">{youtubeUrl}</p>
                      <p className="text-white text-xs opacity-75">Video ID: {videoId}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>Content</label>
                <Editor
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  value={content}
                  onEditorChange={(newValue) => setContent(newValue)}
                  init={{
                    skin: isDark ? "oxide-dark" : "oxide",
                    content_css: isDark ? "dark" : "default",
                    height: 600,
                    menubar: true,
                    plugins: "link image media table lists code wordcount",
                    toolbar:
                      "undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist | link image media | code",
                  }}
                />
              </div>

            </div>
          )}

          {activeTab === "properties" && (
            <div className="space-y-6">

              <div>
                <label className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>Publish Date</label>
                <input
                  type="date"
                  className={`border p-2 rounded w-full mt-1 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Default: Today&apos;s date</p>
              </div>

              <div>
                <label className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>Publish Time</label>
                <input
                  type="time"
                  className={`border p-2 rounded w-full mt-1 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                  value={publishTime}
                  onChange={(e) => setPublishTime(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Default: Current time</p>
              </div>

              <div>
                <label className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>Author</label>
                <div className="relative" ref={authorDropdownRef}>
                  <button
                    type="button"
                    onClick={() => handleAuthorDropdownToggle(!showAuthorDropdown)}
                    className={`w-full border p-2 rounded mt-1 text-left flex items-center justify-between hover:border-gray-400 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                  >
                    <span className={author ? (isDark ? "text-gray-100" : "text-gray-900") : (isDark ? "text-gray-500" : "text-gray-400")}>
                      {author ? availableAuthors.find(a => a.id === parseInt(author))?.name : "Select Author"}
                    </span>
                    <ChevronDown size={16} />
                  </button>

                  {showAuthorDropdown && (
                    <div className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                      <div className={`p-2 border-b sticky top-0 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                        <input
                          type="text"
                          placeholder="Search authors..."
                          value={authorSearch}
                          onChange={(e) => setAuthorSearch(e.target.value)}
                          onMouseDown={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'}`}
                          autoFocus
                        />
                      </div>
                      
                      <div className="max-h-60 overflow-y-auto">
                        {filteredAuthors.length > 0 ? (
                          filteredAuthors.map((authorOption) => (
                            <button
                              key={authorOption.id}
                              type="button"
                              onClick={() => {
                                setAuthor(authorOption.id.toString());
                                handleAuthorDropdownToggle(false);
                              }}
                              className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-blue-50'} ${
                                author === authorOption.id.toString() ? (isDark ? "bg-blue-900/50 font-medium text-blue-100" : "bg-blue-100 font-medium") : ""
                              }`}
                            >
                              {authorOption.name}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500 text-sm text-center">
                            No authors found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>Categories</label>
                <div className="relative" ref={categoriesDropdownRef}>
                  <button
                    type="button"
                    onClick={() => handleCategoriesDropdownToggle(!showCategoriesDropdown)}
                    className={`w-full border p-2 rounded mt-1 text-left flex items-center justify-between hover:border-gray-400 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                  >
                    <span className={categories.length > 0 ? (isDark ? "text-gray-100" : "text-gray-900") : (isDark ? "text-gray-500" : "text-gray-400")}>
                      {getSelectedCategoriesText()}
                    </span>
                    <ChevronDown size={16} />
                  </button>

                  {showCategoriesDropdown && (
                    <div className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                      <div className={`p-2 border-b sticky top-0 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                        <input
                          type="text"
                          placeholder="Search categories..."
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          onMouseDown={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'}`}
                          autoFocus
                        />
                      </div>
                      
                      <div className="max-h-60 overflow-y-auto">
                        {filteredCategories.length > 0 ? (
                          filteredCategories.map((category) => (
                            <label
                              key={category.id}
                              className={`flex items-center gap-2 px-4 py-2 cursor-pointer ${isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-blue-50'}`}
                            >
                              <input
                                type="checkbox"
                                checked={categories.includes(category.id)}
                                onChange={() => toggleCategory(category.id)}
                                className="w-4 h-4"
                              />
                              <span>{category.name}</span>
                            </label>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500 text-sm text-center">
                            No categories found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {categories.map(catId => {
                      const cat = availableCategories.find(c => c.id === catId);
                      return cat ? (
                        <span key={catId} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center gap-1">
                          {cat.name}
                          <button
                            onClick={() => toggleCategory(catId)}
                            className="hover:text-blue-900"
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>Tags</label>
                <div className="relative" ref={tagsDropdownRef}>
                  <button
                    type="button"
                    onClick={() => handleTagsDropdownToggle(!showTagsDropdown)}
                    className={`w-full border p-2 rounded mt-1 text-left flex items-center justify-between hover:border-gray-400 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                  >
                    <span className={tags.length > 0 ? (isDark ? "text-gray-100" : "text-gray-900") : (isDark ? "text-gray-500" : "text-gray-400")}>
                      {getSelectedTagsText()}
                    </span>
                    <ChevronDown size={16} />
                  </button>

                  {showTagsDropdown && (
                    <div className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                      <div className={`p-2 border-b sticky top-0 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                        <input
                          type="text"
                          placeholder="Search tags..."
                          value={tagSearch}
                          onChange={(e) => setTagSearch(e.target.value)}
                          onMouseDown={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'}`}
                          autoFocus
                        />
                      </div>
                      
                      <div className="max-h-60 overflow-y-auto">
                        {filteredTags.length > 0 ? (
                          filteredTags.map((tag) => (
                            <label
                              key={tag.id}
                              className={`flex items-center gap-2 px-4 py-2 cursor-pointer ${isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-blue-50'}`}
                            >
                              <input
                                type="checkbox"
                                checked={tags.includes(tag.id)}
                                onChange={() => toggleTag(tag.id)}
                                className="w-4 h-4"
                              />
                              <span>{tag.name}</span>
                            </label>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500 text-sm text-center">
                            No tags found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tags.map(tagId => {
                      const tag = availableTags.find(t => t.id === tagId);
                      return tag ? (
                        <span key={tagId} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded flex items-center gap-1">
                          #{tag.name}
                          <button
                            onClick={() => toggleTag(tagId)}
                            className="hover:text-gray-900"
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>Meta Title</label>
                <input
                  className={`border p-2 rounded w-full mt-1 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Leave empty to use video title"
                />
              </div>

              <div>
                <label className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>Meta Description</label>
                <textarea
                  className={`border p-2 rounded w-full mt-1 h-24 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="SEO meta description..."
                />
                <p className="text-xs text-gray-500 mt-1">{metaDescription.length}/160 characters</p>
              </div>

              <div>
                <label className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>Schema (JSON-LD)</label>
                <textarea
                  className="border p-2 rounded w-full mt-1 h-32 font-mono text-sm"
                  value={schema}
                  onChange={(e) => setSchema(e.target.value)}
                  placeholder='{"@context": "https://schema.org", "@type": "VideoObject"...}'
                />
              </div>

            </div>
          )}

          </div>
        </div>

        {/* SEO PANEL */}
        <div className="col-span-5 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-md max-h-[calc(100vh-150px)] overflow-y-auto sticky top-6">
          <h2 className="font-semibold text-xl mb-4">SEO Analysis</h2>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Focus Keyword</label>
            <input
              className="w-full p-3 rounded-xl border border-gray-200"
              placeholder="Enter keyword…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className="mb-6 p-4 rounded-2xl bg-white shadow-inner">
            <h3 className="font-medium text-sm text-gray-600 mb-2">SEO Score</h3>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getSEOColor()}`}>
                  <div className="text-sm font-bold text-white">{seoScore}</div>
                </div>
              </div>
              <div>
                <p className={`text-sm font-semibold ${getSEOTextColor()}`}>{getSEORating()}</p>
                <p className="text-xs text-gray-500">out of 100</p>
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
                  <div className={
                    `text-sm ${
                      check.status === 'success' ? 'text-gray-700' :
                      check.status === 'warning' ? 'text-yellow-700' :
                      'text-red-700'
                    }`
                  }>{check.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
    </div>
  );
}