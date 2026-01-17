///app>media>MediaImagesSelector.js///
"use client";

import { useState, useEffect } from "react";
import { X, Image, Upload, Library, Search, Filter } from "lucide-react";
import { uploadMedia, getMediaLibrary, auth } from "../../lib/api";
import { getImageUrl } from '@/lib/imageHelper';

export default function MediaImagesSelector({ onSelect, onClose }) {
  const [activeTab, setActiveTab] = useState("upload");
  const [filterType, setFilterType] = useState("all");
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);

  const [libraryImages, setLibraryImages] = useState([]);
  const [filteredLibraryImages, setFilteredLibraryImages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  const [imageMetadata, setImageMetadata] = useState({
    fileName: "",
    slug: "",
    altText: "",
    title: "",
    caption: "",
    credits: "",
  });

  const [errors, setErrors] = useState({});

  /* ===============================
     FETCH USER
  =============================== */
  useEffect(() => {
    auth.me().then(user => {
        if (user) setCurrentUser(user);
    }).catch(console.error);
  }, []);

  /* ===============================
     SEO SCORE CALCULATION
  =============================== */
  const calculateSEOScore = () => {
    let score = 0;
    
    // Alt text (required) - 40 points
    if (imageMetadata.altText.trim()) {
      score += 40;
    }
    
    // Title - 20 points
    if (imageMetadata.title.trim()) {
      score += 20;
    }
    
    // Caption - 20 points
    if (imageMetadata.caption.trim()) {
      score += 20;
    }
    
    // Credits - 10 points
    if (imageMetadata.credits.trim()) {
      score += 10;
    }
    
    // File uploaded - 10 points
    if (uploadPreview || selectedImage) {
      score += 10;
    }
    
    return score;
  };

  const seoScore = calculateSEOScore();
  
  const getSEOColor = (score) => {
    if (score >= 80) return { bg: "bg-green-100", text: "text-green-700", label: "Excellent" };
    if (score >= 60) return { bg: "bg-blue-100", text: "text-blue-700", label: "Good" };
    if (score >= 40) return { bg: "bg-yellow-100", text: "text-yellow-700", label: "Fair" };
    return { bg: "bg-red-100", text: "text-red-700", label: "Poor" };
  };

  const seoColors = getSEOColor(seoScore);

  /* ===============================
     HELPERS
  =============================== */
  const resolveImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${process.env.NEXT_PUBLIC_API_URL.replace('/api', '')}${url}`;
  };

  const generateSlug = (name) =>
    name
      .toLowerCase()
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleMetadataChange = (field, value) => {
    setImageMetadata((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  /* ===============================
     FETCH MEDIA LIBRARY
  =============================== */
  useEffect(() => {
    if (activeTab === "library") {
      setLoadingLibrary(true);
      getMediaLibrary()
        .then((data) => {
          const normalized = (data || []).map((img) => ({
            ...img,
            src: resolveImageUrl(img.url),
          }));
          setLibraryImages(normalized);
          setFilteredLibraryImages(normalized);
        })
        .catch(console.error)
        .finally(() => setLoadingLibrary(false));
    }
  }, [activeTab]);

  /* ===============================
     SEARCH FILTER
  =============================== */
    useEffect(() => {
    let filtered = libraryImages;

    // Filter by uploader
    if (filterType === "uploaded_by_me" && currentUser) {
      filtered = filtered.filter(img => img.uploadedBy === currentUser._id || img.uploadedBy === currentUser.id);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((img) => {
        const name = (img.filename || "").toLowerCase();
        const alt = (img.altText || "").toLowerCase();
        const title = (img.title || "").toLowerCase();
        const caption = (img.caption || "").toLowerCase();
        return name.includes(q) || alt.includes(q) || title.includes(q) || caption.includes(q);
      });
    }

    setFilteredLibraryImages(filtered);
  }, [searchQuery, libraryImages, filterType, currentUser]);

  /* ===============================
     FILE UPLOAD
  =============================== */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadPreview({
      file,
      previewUrl: URL.createObjectURL(file),
    });

    setImageMetadata({
      fileName: file.name,
      slug: generateSlug(file.name),
      altText: "",
      title: "",
      caption: "",
      credits: "",
    });

    setErrors({});
  };

  const validateMetadata = () => {
    if (!imageMetadata.altText.trim()) {
      setErrors({ altText: "Alt text is required for SEO and accessibility" });
      return false;
    }
    return true;
  };

  /* ===============================
     LIBRARY SELECT
  =============================== */
  const handleLibraryImageClick = (img) => {
    setSelectedImage(img);
    setImageMetadata({
      fileName: img.filename || "",
      slug: generateSlug(img.filename || ""),
      altText: img.altText || "",
      title: img.title || "",
      caption: img.caption || "",
      credits: img.credits || "",
    });
  };

  /* ===============================
     INSERT HANDLER
  =============================== */
  const handleInsert = async () => {
    if (!validateMetadata()) return;

    try {
      // FROM LIBRARY
      if (activeTab === "library" && selectedImage) {
        // ✅ Return multiple formats for maximum compatibility
        onSelect({
          ...selectedImage,
          src: selectedImage.src,           // For editors expecting 'src'
          url: selectedImage.src,           // For editors expecting 'url'
          imageUrl: selectedImage.src,      // For editors expecting 'imageUrl'
          preview: selectedImage.src,       // For editors expecting 'preview'
          alt: imageMetadata.altText,       // For editors expecting 'alt'
          altText: imageMetadata.altText,   // For editors expecting 'altText'
          title: imageMetadata.title,
          caption: imageMetadata.caption,
          credits: imageMetadata.credits,
          filename: selectedImage.filename,
          _id: selectedImage._id || selectedImage.id,
          id: selectedImage.id || selectedImage._id,
        });
        onClose();
        return;
      }

      // FROM UPLOAD
      if (activeTab === "upload" && uploadPreview) {
        // Pass metadata to uploadMedia function
        const saved = await uploadMedia(uploadPreview.file, {
          altText: imageMetadata.altText,
          title: imageMetadata.title,
          caption: imageMetadata.caption,
          credits: imageMetadata.credits,
        });
        
        const fullUrl = resolveImageUrl(saved.url);

        // ✅ Return multiple formats for maximum compatibility
        onSelect({
          ...saved,
          src: fullUrl,                     // For editors expecting 'src'
          url: fullUrl,                     // For editors expecting 'url'
          imageUrl: fullUrl,                // For editors expecting 'imageUrl'
          preview: fullUrl,                 // For editors expecting 'preview'
          alt: imageMetadata.altText,       // For editors expecting 'alt'
          altText: imageMetadata.altText,   // For editors expecting 'altText'
          title: imageMetadata.title,
          caption: imageMetadata.caption,
          credits: imageMetadata.credits,
          filename: saved.filename,
          _id: saved._id,
          id: saved._id,
        });

        onClose();
      }
    } catch (err) {
      console.error("Insert image failed:", err);
      alert("Image upload failed. Please try again.");
    }
  };

  /* ===============================
     UI
  =============================== */
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl shadow-xl w-[650px] max-h-[90vh] overflow-y-auto relative">

        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <h2 className="text-xl font-semibold mb-4">Select Image</h2>

        {/* Tabs */}
        <div className="flex gap-2 border-b mb-4">
          <button 
            onClick={() => setActiveTab("upload")} 
            className={`px-4 py-2 font-medium flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "upload" 
                ? "border-blue-600 text-blue-600" 
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <Upload size={16} /> Upload New
          </button>
          <button 
            onClick={() => setActiveTab("library")} 
            className={`px-4 py-2 font-medium flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "library" 
                ? "border-blue-600 text-blue-600" 
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <Library size={16} /> Media Library
          </button>
        </div>

        {/* UPLOAD TAB */}
        {activeTab === "upload" && (
          <>
            {!uploadPreview ? (
              <label className="border-2 border-dashed border-gray-300 h-48 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                <Image size={48} className="text-gray-400 mb-2" />
                <span className="text-sm text-gray-600 font-medium">Click to upload image</span>
                <span className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 10MB</span>
                <input type="file" accept="image/*" hidden onChange={handleFileChange} />
              </label>
            ) : (
              <div className="mb-4">
                <div className="relative">
                  <img 
                    src={uploadPreview.previewUrl} 
                    className="w-full h-64 object-cover rounded-lg border border-gray-200" 
                    alt="Preview"
                  />
                  <label className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-lg">
                    <span className="text-white text-sm font-medium bg-black/70 px-4 py-2 rounded">
                      Click to change image
                    </span>
                    <input type="file" accept="image/*" hidden onChange={handleFileChange} />
                  </label>
                </div>
              </div>
            )}
          </>
        )}

        {/* LIBRARY TAB */}
        {activeTab === "library" && (
          <>
            {/* Search & Filter */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by filename..."
                  className="w-full border border-gray-300 pl-10 pr-4 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="relative">
                 <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                    <Filter size={16} />
                 </div>
                 <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 appearance-none bg-white cursor-pointer"
                 >
                    <option value="all">All Images</option>
                    <option value="uploaded_by_me">Uploaded by me</option>
                 </select>
              </div>
            </div>

            {loadingLibrary ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-500 text-sm">Loading library...</p>
                </div>
              </div>
            ) : filteredLibraryImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <Image size={48} className="mb-2" />
                <p className="text-sm">
                  {searchQuery ? `No images found for "${searchQuery}"` : "No images in library yet"}
                </p>
              </div>
            ) : (
              <>
                {/* Image Grid */}
                <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1 mb-4">
                  {filteredLibraryImages.map((img) => (
                    <div
                      key={img._id}
                      onClick={() => handleLibraryImageClick(img)}
                      className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                        selectedImage?._id === img._id 
                          ? "border-blue-600 ring-2 ring-blue-200" 
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <img
                        src={getImageUrl(img.url || img.src)}
                        alt={img.altText || img.filename}
                        className="w-full h-full object-cover"
                      />
                      {selectedImage?._id === img._id && (
                        <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          ✓
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Selected Image Preview */}
                {selectedImage && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Selected Image Preview:</p>
                    <div className="relative border border-gray-300 rounded-lg overflow-hidden">
                      <img
                        src={getImageUrl(selectedImage.url || selectedImage.src)}
                        alt={selectedImage.altText || selectedImage.filename}
                        className="w-full h-48 object-contain bg-gray-50"
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* METADATA SECTION */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Image Details</h3>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* File Name */}
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">File Name</label>
              <input 
                value={imageMetadata.fileName} 
                readOnly 
                className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm bg-gray-50 text-gray-600" 
              />
            </div>

            {/* Slug */}
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Slug</label>
              <input 
                value={imageMetadata.slug} 
                readOnly 
                className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm bg-gray-50 text-gray-600" 
              />
            </div>
          </div>

          {/* Alt Text - Required */}
          <div className="mb-3">
            <label className="text-xs font-medium text-gray-700 block mb-1">
              Alt Text <span className="text-red-500">*</span>
            </label>
            <input
              placeholder="Describe the image for accessibility and SEO"
              value={imageMetadata.altText}
              onChange={(e) => handleMetadataChange("altText", e.target.value)}
              className={`w-full border px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${
                errors.altText ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.altText && (
              <p className="text-red-600 text-xs mt-1">{errors.altText}</p>
            )}
          </div>

          {/* Title */}
          <div className="mb-3">
            <label className="text-xs font-medium text-gray-600 block mb-1">Title</label>
            <input
              placeholder="Image title (optional)"
              value={imageMetadata.title}
              onChange={(e) => handleMetadataChange("title", e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Caption */}
          <div className="mb-3">
            <label className="text-xs font-medium text-gray-600 block mb-1">Caption</label>
            <input
              placeholder="Image caption (optional)"
              value={imageMetadata.caption}
              onChange={(e) => handleMetadataChange("caption", e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Credits */}
          <div className="mb-3">
            <label className="text-xs font-medium text-gray-600 block mb-1">Credits / Source</label>
            <input
              placeholder="Photo credit or source (optional)"
              value={imageMetadata.credits}
              onChange={(e) => handleMetadataChange("credits", e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* SEO SCORE */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">SEO Score</p>
                <p className="text-xs text-gray-500">
                  {seoScore < 40 && "Add more details to improve SEO"}
                  {seoScore >= 40 && seoScore < 60 && "Good progress! Add more for better SEO"}
                  {seoScore >= 60 && seoScore < 80 && "Great! Your image is well optimized"}
                  {seoScore >= 80 && "Excellent! Your image is fully optimized"}
                </p>
              </div>
              <div className="text-right">
                <div className={`inline-block px-4 py-2 rounded-lg ${seoColors.bg}`}>
                  <span className={`text-2xl font-bold ${seoColors.text}`}>{seoScore}</span>
                  <span className={`text-xs ${seoColors.text} ml-1`}>/ 100</span>
                </div>
                <p className={`text-xs font-medium ${seoColors.text} mt-1`}>{seoColors.label}</p>
              </div>
            </div>
          </div>
        </div>

        {/* INSERT BUTTON */}
        <button
          onClick={handleInsert}
          disabled={!imageMetadata.altText.trim() || (!uploadPreview && !selectedImage)}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {activeTab === "upload" ? "Upload & Insert Image" : "Insert Selected Image"}
        </button>
      </div>
    </div>
  );
}


