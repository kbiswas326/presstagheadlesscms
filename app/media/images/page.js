///app/media/images/page.js///
"use client";

import { useState, useEffect, useCallback } from "react";
import Cropper from "react-easy-crop";
import {
  Upload,
  X,
  Image as ImageIcon,
  MoreVertical,
  Crop,
  Edit3,
  Trash2,
  AlertTriangle,
  Search,
} from "lucide-react";
import { uploadMedia, getMediaLibrary } from "../../../lib/api";
import { useTheme } from "context/ThemeContext";

export default function MediaImagesPage() {
  const { isDark } = useTheme();
  const [images, setImages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [editingImage, setEditingImage] = useState(null);
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [cropImage, setCropImage] = useState(null);
  const [cropImageId, setCropImageId] = useState(null);
  const [cropAspect, setCropAspect] = useState(16 / 9);
  const [cropData, setCropData] = useState({ crop: { x: 0, y: 0 }, zoom: 1 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [uploadData, setUploadData] = useState({
    file: null,
    preview: null,
    filename: "",
    altText: "",
    title: "",
    caption: "",
    credits: "",
    slug: "",
    width: 0,
    height: 0,
    fileSize: "",
    seoScore: 0,
  });

  const [uploadErrors, setUploadErrors] = useState({});

  // Resolve image URL - match MediaImagesSelector behavior
const resolveImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  
  // Remove /api/ prefix if it exists (backend doesn't serve from /api/uploads)
  const cleanUrl = url.replace('/api/uploads/', '/uploads/');
  
  return `http://localhost:5000${cleanUrl}`;
};

  // Generate slug
  const generateSlug = (name) =>
    name
      .toLowerCase()
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  // Fetch images from backend
useEffect(() => {
  const fetchImages = async () => {
    setLoading(true);
    try {
      const data = await getMediaLibrary();
      console.log('📦 Raw data from backend:', data);
      
      const normalized = (data || []).map((img, index) => {
        // Backend returns url as "/uploads/filename.jpg"
        // Make sure we don't have /api/ prefix
        let cleanUrl = img.url || "";
        cleanUrl = cleanUrl.replace('/api/uploads/', '/uploads/'); // Remove incorrect /api/ prefix
        
        const fullUrl = cleanUrl.startsWith('http') 
          ? cleanUrl 
          : `http://localhost:5000${cleanUrl}`;
        
        if (index === 0) {
          console.log('✅ Sample image:', { 
            originalUrl: img.url,
            cleanUrl: cleanUrl,
            fullUrl: fullUrl
          });
        }
        
        return {
          ...img,
          id: img._id || img.id,
          preview: fullUrl,
          src: fullUrl,
          url: fullUrl,
          alt: img.altText || img.alt || "",
          altText: img.altText || img.alt || "",
          filename: img.filename || img.name || "",
          width: img.width || 0,
          height: img.height || 0,
          fileSize: formatFileSize(img.size || 0),
          seoScore: calculateSEOScore(img),
        };
      });
      
      console.log('📊 Total images:', normalized.length);
      setImages(normalized);
    } catch (error) {
      console.error("❌ Error fetching images:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchImages();
}, []);

  // Auto-generate slug
  useEffect(() => {
    if (uploadData.filename) {
      setUploadData((prev) => ({
        ...prev,
        slug: generateSlug(prev.filename),
      }));
    }
  }, [uploadData.filename]);

  // Calculate SEO Score (matching MediaImagesSelector)
  const calculateSEOScore = (data) => {
    let score = 0;
    
    // Alt text (required) - 40 points
    if ((data.altText || data.alt || "").trim()) {
      score += 40;
    }
    
    // Title - 20 points
    if ((data.title || "").trim()) {
      score += 20;
    }
    
    // Caption - 20 points
    if ((data.caption || "").trim()) {
      score += 20;
    }
    
    // Credits - 10 points
    if ((data.credits || "").trim()) {
      score += 10;
    }
    
    // File uploaded - 10 points
    if (data.file || data.url || data.preview) {
      score += 10;
    }
    
    return score;
  };

  useEffect(() => {
    const score = calculateSEOScore(uploadData);
    setUploadData((prev) => ({ ...prev, seoScore: score }));
  }, [uploadData.altText, uploadData.title, uploadData.caption, uploadData.credits, uploadData.file]);

  // Convert file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // File select
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const preview = URL.createObjectURL(file);

    img.onload = () => {
      setUploadData({
        file,
        preview,
        filename: file.name.replace(/\.[^/.]+$/, ""),
        altText: "",
        title: "",
        caption: "",
        credits: "",
        slug: generateSlug(file.name),
        fileSize: formatFileSize(file.size),
        width: img.width,
        height: img.height,
        seoScore: 0,
      });
    };

    img.src = preview;
    setUploadErrors({});
  };

  // Validate upload data
  const validateUpload = () => {
    const errors = {};
    if (!uploadData.altText.trim()) {
      errors.altText = "Alt text is required for SEO and accessibility";
    }
    if (!uploadData.file) {
      errors.file = "Please select an image file";
    }
    setUploadErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Upload to backend
  const handleUpload = async () => {
    if (!validateUpload()) return;

    setUploading(true);
    try {
      const saved = await uploadMedia(uploadData.file, {
        altText: uploadData.altText,
        title: uploadData.title,
        caption: uploadData.caption,
        credits: uploadData.credits,
      });

      // Refresh images from backend
      const data = await getMediaLibrary();
      const normalized = (data || []).map((img) => ({
        ...img,
        id: img._id || img.id,
        preview: resolveImageUrl(img.url),
        alt: img.altText || img.alt || "",
        filename: img.filename || "",
        width: img.width || 0,
        height: img.height || 0,
        fileSize: img.fileSize || "",
        seoScore: calculateSEOScore(img),
      }));
      setImages(normalized);

      setIsUploadOpen(false);
      setUploadData({
        file: null,
        preview: null,
        filename: "",
        altText: "",
        title: "",
        caption: "",
        credits: "",
        slug: "",
        width: 0,
        height: 0,
        fileSize: "",
        seoScore: 0,
      });
      setUploadErrors({});
    } catch (error) {
      console.error("Error uploading image:", error);
      setUploadErrors({ upload: "Failed to upload image. Please try again." });
    } finally {
      setUploading(false);
    }
  };

  // Open crop modal
  const openCropper = (img) => {
    setCropImage(img.preview);
    setCropImageId(img.id);
    setIsCropOpen(true);
    setOpenMenuIndex(null);
  };

  // Create cropped image
  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop, imageElement) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return null;
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      imageElement,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        const url = URL.createObjectURL(blob);
        resolve({ url, width: pixelCrop.width, height: pixelCrop.height });
      }, "image/jpeg");
    });
  };

  // Handle crop complete callback
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Handle save crop
  const handleSaveCrop = useCallback(async () => {
    if (!cropImage || !cropImageId || !croppedAreaPixels) return;

    try {
      const image = await createImage(cropImage);
      const result = await getCroppedImg(cropImage, croppedAreaPixels, image);
      
      if (result) {
        // Update the image in the images array
        setImages((prev) =>
          prev.map((img) =>
            img.id === cropImageId
              ? {
                  ...img,
                  preview: result.url,
                  width: result.width,
                  height: result.height,
                }
              : img
          )
        );
        setIsCropOpen(false);
        setCropImage(null);
        setCropImageId(null);
        setCropData({ crop: { x: 0, y: 0 }, zoom: 1 });
        setCroppedAreaPixels(null);
      }
    } catch (e) {
      console.error("Error cropping image:", e);
    }
  }, [cropImage, cropImageId, croppedAreaPixels]);

  // Open edit modal
  const openEditModal = (img) => {
    setEditingImage({ ...img });
    setIsEditOpen(true);
    setOpenMenuIndex(null);
  };

  // Save edited image
  const handleSaveEdit = () => {
    if (!editingImage) return;

    const updatedScore = calculateSEOScore(editingImage);

    setImages((prev) =>
      prev.map((img) =>
        img.id === editingImage.id
          ? {
              ...img,
              ...editingImage,
              seoScore: updatedScore,
            }
          : img
      )
    );

    setIsEditOpen(false);
    setEditingImage(null);
  };

  // Open delete confirmation
  const openDeleteConfirm = (imgId) => {
    setDeletingImageId(imgId);
    setIsDeleteConfirmOpen(true);
    setOpenMenuIndex(null);
  };

  // Delete image
  const handleDelete = () => {
    if (deletingImageId) {
      setImages((prev) => prev.filter((img) => img.id !== deletingImageId));
      setIsDeleteConfirmOpen(false);
      setDeletingImageId(null);
    }
  };

  // Filter images based on search query (title, alt-text, filename, caption)
  const filteredImages = images.filter((img) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const name = (img.filename || "").toLowerCase();
    const alt = (img.alt || img.altText || "").toLowerCase();
    const title = (img.title || "").toLowerCase();
    const caption = (img.caption || "").toLowerCase();
    return name.includes(query) || alt.includes(query) || title.includes(query) || caption.includes(query);
  });

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500 mb-4">
        <a href="/" className="hover:underline">Home</a>
        <span className="mx-2">›</span>
        <a href="/media/images" className={`hover:underline font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Media</a>
        <span className="mx-2">›</span>
        <span className="text-blue-600 font-semibold">Images</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-xl font-semibold ${isDark ? "text-white" : ""}`}>Images Library</h1>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Upload size={18} />
          Upload Image
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow border max-w-md ${isDark ? "bg-gray-800 border-gray-700" : "bg-white"}`}>
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or alt-text..."
            className={`flex-1 outline-none text-sm ${isDark ? "bg-transparent text-white placeholder-gray-400" : "text-gray-900"}`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Image Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500 text-sm">Loading images...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredImages.map((img) => (
          <div key={img.id} className="bg-white p-3 rounded-xl shadow relative">
            {/* Action Menu */}
            <button
              className="absolute right-3 top-3 p-1 hover:bg-gray-200 rounded z-10"
              onClick={() => setOpenMenuIndex(openMenuIndex === img.id ? null : img.id)}
            >
              <MoreVertical size={18} />
            </button>

            {openMenuIndex === img.id && (
              <div className="absolute right-2 top-10 bg-white border rounded shadow-lg z-50 w-40">
                <button
                  onClick={() => openCropper(img)}
                  className="flex items-center gap-2 px-3 py-2 w-full hover:bg-gray-100 text-left"
                >
                  <Crop size={16} /> Crop
                </button>

                <button
                  onClick={() => openEditModal(img)}
                  className="flex items-center gap-2 px-3 py-2 w-full hover:bg-gray-100 text-left"
                >
                  <Edit3 size={16} /> Edit
                </button>

                <button
                  onClick={() => openDeleteConfirm(img.id)}
                  className="flex items-center gap-2 px-3 py-2 w-full hover:bg-gray-100 text-red-600 text-left"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            )}

            {/* Image */}
            <ImageWithFallback
              src={img.preview || img.src || img.url}
              alt={img.alt || img.altText || "Image"}
              className="w-full h-40 object-cover rounded-md"
            />

            {/* Info */}
            <div className="mt-3">
              <p className="font-semibold text-sm">{img.filename || "Untitled"}</p>
              <p className="text-xs text-gray-500">Alt: {img.alt || img.altText || "—"}</p>
              {(img.width > 0 || img.fileSize) && (
                <p className="text-xs text-gray-500 mt-1">
                  {img.width > 0 && `${img.width}×${img.height}px`}
                  {img.width > 0 && img.fileSize && " • "}
                  {img.fileSize}
                </p>
              )}

              <div className="mt-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    img.seoScore >= 80
                      ? "bg-green-100 text-green-700"
                      : img.seoScore >= 60
                      ? "bg-blue-100 text-blue-700"
                      : img.seoScore >= 40
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  SEO: {img.seoScore}
                </span>
              </div>
            </div>
          </div>
        ))}

        {!loading && images.length === 0 && (
          <p className="col-span-full text-center text-gray-400 py-20">
            No images uploaded yet.
          </p>
        )}

        {!loading && images.length > 0 && filteredImages.length === 0 && (
          <p className="col-span-full text-center text-gray-400 py-20">
            No images found matching "{searchQuery}".
          </p>
        )}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <UploadModal
          uploadData={uploadData}
          setUploadData={setUploadData}
          handleFileSelect={handleFileSelect}
          handleUpload={handleUpload}
          uploading={uploading}
          errors={uploadErrors}
          close={() => {
            setIsUploadOpen(false);
            setUploadData({
              file: null,
              preview: null,
              filename: "",
              altText: "",
              title: "",
              caption: "",
              credits: "",
              slug: "",
              width: 0,
              height: 0,
              fileSize: "",
              seoScore: 0,
            });
            setUploadErrors({});
          }}
        />
      )}

      {/* Crop Modal */}
      {isCropOpen && (
        <CropModal
          cropImage={cropImage}
          cropData={cropData}
          setCropData={setCropData}
          cropAspect={cropAspect}
          setCropAspect={setCropAspect}
          onCropComplete={onCropComplete}
          handleSaveCrop={handleSaveCrop}
          close={() => {
            setIsCropOpen(false);
            setCropImage(null);
            setCropImageId(null);
            setCroppedAreaPixels(null);
          }}
        />
      )}

      {/* Edit Modal */}
      {isEditOpen && editingImage && (
        <EditModal
          editingImage={editingImage}
          setEditingImage={setEditingImage}
          handleSaveEdit={handleSaveEdit}
          close={() => {
            setIsEditOpen(false);
            setEditingImage(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <DeleteConfirmModal
          onConfirm={handleDelete}
          onCancel={() => {
            setIsDeleteConfirmOpen(false);
            setDeletingImageId(null);
          }}
        />
      )}
    </div>
  );
}

/* ---------------------- UPLOAD MODAL ---------------------- */

function UploadModal({ uploadData, setUploadData, handleFileSelect, handleUpload, uploading, errors, close }) {
  const getSEOColor = (score) => {
    if (score >= 80) return { bg: "bg-green-100", text: "text-green-700", label: "Excellent" };
    if (score >= 60) return { bg: "bg-blue-100", text: "text-blue-700", label: "Good" };
    if (score >= 40) return { bg: "bg-yellow-100", text: "text-yellow-700", label: "Fair" };
    return { bg: "bg-red-100", text: "text-red-700", label: "Poor" };
  };

  const seoColors = getSEOColor(uploadData.seoScore);

  const handleMetadataChange = (field, value) => {
    setUploadData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl shadow-xl w-[650px] max-h-[90vh] overflow-y-auto relative">
        {/* Close Button */}
        <button 
          onClick={close} 
          className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <h2 className="text-xl font-semibold mb-4">Upload Image</h2>

        {/* Upload Box */}
        {!uploadData.preview ? (
          <label className="border-2 border-dashed border-gray-300 h-48 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
            <ImageIcon size={48} className="text-gray-400 mb-2" />
            <span className="text-sm text-gray-600 font-medium">Click to upload image</span>
            <span className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 10MB</span>
            <input type="file" accept="image/*" hidden onChange={handleFileSelect} />
          </label>
        ) : (
          <div className="mb-4">
            <div className="relative">
              <img 
                src={uploadData.preview} 
                className="w-full h-64 object-cover rounded-lg border border-gray-200" 
                alt="Preview"
              />
              <label className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-lg">
                <span className="text-white text-sm font-medium bg-black/70 px-4 py-2 rounded">
                  Click to change image
                </span>
                <input type="file" accept="image/*" hidden onChange={handleFileSelect} />
              </label>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errors.upload && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{errors.upload}</p>
          </div>
        )}

        {/* METADATA SECTION */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Image Details</h3>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* File Name */}
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">File Name</label>
              <input 
                value={uploadData.filename} 
                readOnly 
                className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm bg-gray-50 text-gray-600" 
              />
            </div>

            {/* Slug */}
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Slug</label>
              <input 
                value={uploadData.slug} 
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
              value={uploadData.altText}
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
              value={uploadData.title}
              onChange={(e) => handleMetadataChange("title", e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Caption */}
          <div className="mb-3">
            <label className="text-xs font-medium text-gray-600 block mb-1">Caption</label>
            <input
              placeholder="Image caption (optional)"
              value={uploadData.caption}
              onChange={(e) => handleMetadataChange("caption", e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Credits */}
          <div className="mb-3">
            <label className="text-xs font-medium text-gray-600 block mb-1">Credits / Source</label>
            <input
              placeholder="Photo credit or source (optional)"
              value={uploadData.credits}
              onChange={(e) => handleMetadataChange("credits", e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Technical Info */}
          {uploadData.width > 0 && (
            <p className="text-xs text-gray-500 mb-3">
              Dimensions: {uploadData.width}×{uploadData.height}px • {uploadData.fileSize}
            </p>
          )}

          {/* SEO SCORE */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">SEO Score</p>
                <p className="text-xs text-gray-500">
                  {uploadData.seoScore < 40 && "Add more details to improve SEO"}
                  {uploadData.seoScore >= 40 && uploadData.seoScore < 60 && "Good progress! Add more for better SEO"}
                  {uploadData.seoScore >= 60 && uploadData.seoScore < 80 && "Great! Your image is well optimized"}
                  {uploadData.seoScore >= 80 && "Excellent! Your image is fully optimized"}
                </p>
              </div>
              <div className="text-right">
                <div className={`inline-block px-4 py-2 rounded-lg ${seoColors.bg}`}>
                  <span className={`text-2xl font-bold ${seoColors.text}`}>{uploadData.seoScore}</span>
                  <span className={`text-xs ${seoColors.text} ml-1`}>/ 100</span>
                </div>
                <p className={`text-xs font-medium ${seoColors.text} mt-1`}>{seoColors.label}</p>
              </div>
            </div>
          </div>
        </div>

        {/* UPLOAD BUTTON */}
        <button
          onClick={handleUpload}
          disabled={!uploadData.altText.trim() || !uploadData.file || uploading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? "Uploading..." : "Upload & Insert Image"}
        </button>
      </div>
    </div>
  );
}

/* ---------------------- CROP MODAL ---------------------- */

function CropModal({ cropImage, cropData, setCropData, cropAspect, setCropAspect, onCropComplete, handleSaveCrop, close }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl w-[700px] max-w-[90vw] relative">
        <button className="absolute right-4 top-4 z-10" onClick={close}>
          <X size={20} />
        </button>

        <h2 className="text-lg font-semibold mb-4">Crop Image</h2>

        {/* Aspect Ratio Buttons */}
        <div className="flex gap-3 mb-4">
          <button
            className={`px-3 py-1 rounded ${
              cropAspect === 16 / 9 ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setCropAspect(16 / 9)}
          >
            16 : 9
          </button>
          <button
            className={`px-3 py-1 rounded ${
              cropAspect === 4 / 5 ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setCropAspect(4 / 5)}
          >
            4 : 5
          </button>
          <button
            className={`px-3 py-1 rounded ${
              cropAspect === 1 ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setCropAspect(1)}
          >
            1 : 1
          </button>
        </div>

        <div className="relative w-full h-[350px] bg-black/20 rounded-lg overflow-hidden">
          <Cropper
            image={cropImage}
            crop={cropData.crop}
            zoom={cropData.zoom}
            aspect={cropAspect}
            onCropChange={(c) => setCropData((p) => ({ ...p, crop: c }))}
            onZoomChange={(z) => setCropData((p) => ({ ...p, zoom: z }))}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={close}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveCrop}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Save Crop
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------- EDIT MODAL ---------------------- */

function EditModal({ editingImage, setEditingImage, handleSaveEdit, close }) {
  // Calculate SEO Score (matching MediaImagesSelector)
  const calculateSEOScore = (data) => {
    let score = 0;
    
    // Alt text (required) - 40 points
    if ((data.altText || data.alt || "").trim()) {
      score += 40;
    }
    
    // Title - 20 points
    if ((data.title || "").trim()) {
      score += 20;
    }
    
    // Caption - 20 points
    if ((data.caption || "").trim()) {
      score += 20;
    }
    
    // Credits - 10 points
    if ((data.credits || "").trim()) {
      score += 10;
    }
    
    // File uploaded - 10 points
    if (data.url || data.preview) {
      score += 10;
    }
    
    return score;
  };

  const generateSlug = (name) =>
    name
      .toLowerCase()
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  // Auto-generate slug when filename changes and update SEO score
  useEffect(() => {
    if (editingImage?.filename) {
      const newSlug = generateSlug(editingImage.filename);
      const newSeoScore = calculateSEOScore(editingImage);
      
      if (editingImage.slug !== newSlug || editingImage.seoScore !== newSeoScore) {
        setEditingImage((prev) => ({
          ...prev,
          slug: newSlug,
          seoScore: newSeoScore,
        }));
      }
    }
  }, [editingImage?.filename, editingImage?.alt, editingImage?.altText, editingImage?.title, editingImage?.caption, editingImage?.credits, setEditingImage]);

  const seoScore = calculateSEOScore(editingImage);

  const getSEOColor = (score) => {
    if (score >= 80) return { bg: "bg-green-100", text: "text-green-700", label: "Excellent" };
    if (score >= 60) return { bg: "bg-blue-100", text: "text-blue-700", label: "Good" };
    if (score >= 40) return { bg: "bg-yellow-100", text: "text-yellow-700", label: "Fair" };
    return { bg: "bg-red-100", text: "text-red-700", label: "Poor" };
  };

  const seoColors = getSEOColor(seoScore);

  const handleMetadataChange = (field, value) => {
    setEditingImage((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl shadow-xl w-[650px] max-h-[90vh] overflow-y-auto relative">
        {/* Close Button */}
        <button 
          onClick={close} 
          className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <h2 className="text-xl font-semibold mb-4">Edit Image</h2>

        {/* Image Preview */}
        {editingImage?.preview && (
          <div className="mb-4">
            <div className="relative border border-gray-300 rounded-lg overflow-hidden">
              <img 
                src={editingImage.preview} 
                className="w-full h-64 object-contain bg-gray-50" 
                alt={editingImage.altText || editingImage.alt || "Preview"}
              />
            </div>
          </div>
        )}

        {/* METADATA SECTION */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Image Details</h3>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* File Name */}
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">File Name</label>
              <input 
                value={editingImage?.filename || ""} 
                onChange={(e) => handleMetadataChange("filename", e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" 
              />
            </div>

            {/* Slug */}
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Slug</label>
              <input 
                value={editingImage?.slug || ""} 
                onChange={(e) => handleMetadataChange("slug", e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" 
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
              value={editingImage?.altText || editingImage?.alt || ""}
              onChange={(e) => {
                handleMetadataChange("altText", e.target.value);
                handleMetadataChange("alt", e.target.value); // Keep both for compatibility
              }}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Title */}
          <div className="mb-3">
            <label className="text-xs font-medium text-gray-600 block mb-1">Title</label>
            <input
              placeholder="Image title (optional)"
              value={editingImage?.title || ""}
              onChange={(e) => handleMetadataChange("title", e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Caption */}
          <div className="mb-3">
            <label className="text-xs font-medium text-gray-600 block mb-1">Caption</label>
            <input
              placeholder="Image caption (optional)"
              value={editingImage?.caption || ""}
              onChange={(e) => handleMetadataChange("caption", e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Credits */}
          <div className="mb-3">
            <label className="text-xs font-medium text-gray-600 block mb-1">Credits / Source</label>
            <input
              placeholder="Photo credit or source (optional)"
              value={editingImage?.credits || ""}
              onChange={(e) => handleMetadataChange("credits", e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Technical Info */}
          {editingImage?.width > 0 && (
            <p className="text-xs text-gray-500 mb-3">
              Dimensions: {editingImage.width}×{editingImage.height}px • {editingImage.fileSize || ""}
            </p>
          )}

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

        <div className="mt-6 flex gap-3">
          <button
            onClick={close}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveEdit}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------- DELETE CONFIRMATION MODAL ---------------------- */

function DeleteConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl w-[400px] relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-100 p-2 rounded-full">
            <AlertTriangle className="text-red-600" size={24} />
          </div>
          <h2 className="text-lg font-semibold">Delete Image</h2>
        </div>

        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this image? This action cannot be undone.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------- IMAGE WITH FALLBACK COMPONENT ---------------------- */

function ImageWithFallback({ src, alt, className }) {
  const [imgError, setImgError] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    console.log('🖼️ ImageWithFallback received src:', src);
    setImgSrc(src);
    setImgError(false);
  }, [src]);

  if (!src || imgError) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <ImageIcon size={40} className="text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        console.error("❌ Image failed to load:", imgSrc);
        console.error("Error details:", e);
        setImgError(true);
      }}
    />
  );
}

/* ---------------------- FORM INPUT COMPONENT ---------------------- */

function FormInput({ label, value, onChange }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        value={value}
        onChange={onChange}
        className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-blue-500 focus:ring-2 focus:outline-none"
      />
    </div>
  );
}

