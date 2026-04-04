import Image from "next/image";
import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import ImageGallaryPagination from "./ImagegalleryPagination";
import { getTenantId } from "../lib/api";
const ImageGalleryPopup = ({ onSelect, onClose, onImageSelect }) => {
  const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/api$/, '');
  const API_BASE = `${API_ORIGIN}/api`;
  const [images, setImages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [altText, setAltText] = useState("");
  const [imageAltTexts, setImageAltTexts] = useState("");
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUploadAlt, setImageUploadAlt] = useState("");




  const fetchImages = async (url) => {
    setIsLoading(true);
    try {
      const token = Cookies.get("token");
      const response = await fetch(
        url,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "x-tenant-id": getTenantId(),
          },
        }
      );
      const data = await response.json();
      setImages(data.images || []);
      setTotalPages(data.total);
      if (data.altTexts) {
        setImageAltTexts(data.altTexts);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching images:", error);
      setIsLoading(false);
    }
  };
  useEffect(() => {
    let debounceTimeout;

    if (searchQuery === "") {
      // If searchQuery is empty, call the main API immediately
      const url = `${API_BASE}/media/img?limit=8&page=${currentPage}`;
      fetchImages(url);
    } else {
      // If searchQuery changes, delay the API call by 800ms
      debounceTimeout = setTimeout(() => {
        const url = `${API_BASE}/media/search?alt=${searchQuery}&limit=8&page=${currentPage}`;
        fetchImages(url);
      }, 800);
    }

    return () => clearTimeout(debounceTimeout); // Cleanup the timeout
  }, [searchQuery]);

  useEffect(() => {
    // Fetch images immediately when currentPage changes
    const url = searchQuery === ""
      ? `${API_BASE}/media/img?limit=8&page=${currentPage}`
      : `${API_BASE}/media/search?alt=${searchQuery}&limit=8&page=${currentPage}`;

    fetchImages(url);
  }, [currentPage]);

  const handleImageClick = (img) => {
    setSelectedImage(img);
  };

  const validateAndConfirm = () => {
    if (!selectedImage) {
      setError("Please select an image");
      return;
    }
    if (!altText.trim()) {
      setError(
        "Alt text is required for accessibility. Please describe the image."
      );
      return;
    }

    // Store the alt text for this image
    setImageAltTexts((prev) => ({
      ...prev,
      [selectedImage]: altText.trim(),
    }));

    if (onImageSelect) {
      onImageSelect(
        selectedImage.startsWith('http') ? selectedImage : `${API_ORIGIN}${selectedImage}`,
        altText.trim()
      );
    }
    if (onSelect) {
      onSelect(selectedImage);
    }
    onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      const reader = new FileReader();

      // Set the image preview when the file is read
      reader.onload = () => {
        setImagePreview(reader.result);
      };

      // Read the file as a data URL
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = async () => {
    const file = image;
    if (file && imageAltTexts) {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("alt", imageAltTexts);

      try {
        setIsLoading(true);
        const token = Cookies.get("token");
        const response = await fetch(
          `${API_BASE}/media/upload`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "x-tenant-id": getTenantId(),
            },
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error("Upload failed");
        }
        setImagePreview(null)
        setImage(null)
        setImageAltTexts("")
        setCurrentPage(1);
        fetchImages(`${API_BASE}/media/img?limit=8&page=${currentPage}`)
        
      } catch (error) {
        console.error("Error uploading file:", error);
        setError("Failed to upload image. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      alert("Enter Alt and right Image");
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };
  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-white rounded-xl w-[90%] h-[85vh] max-w-5xl shadow-2xl relative flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Image Gallery</h2>
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden ">
          {/* Left Section: Image Gallery */}
          <div className="w-2/3 p-6 flex flex-col border-r">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500"></div>
              </div>
            ) : (
              <>
                <div className="relative mb-6">
                  <input
                    type="text"
                    placeholder="Search images..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <svg
                    className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((img, index) => (
                      <div
                        key={`image-${img._id}-${index}`}
                        className={`group aspect-square relative cursor-pointer rounded-lg overflow-hidden transition-transform hover:scale-[1.02] ${
                          selectedImageId === img._id
                            ? "ring-2 ring-blue-500 ring-offset-2"
                            : "hover:shadow-lg"
                        }`}
                        onClick={() => {
                          handleImageClick(img.url);
                          setAltText(img.altText || '');
                          setSelectedImageId(img._id);
                        }}
                      >
                        <Image
                          src={img.url.startsWith('http') ? img.url : `${process.env.NEXT_PUBLIC_API_URL.replace('/api', '')}${img.url}`}
                          alt={img.altText || `Image ${index + 1}`}
                          layout="fill"
                          objectFit="cover"
                          className="transition-transform group-hover:scale-105"
                        />
                        {selectedImageId === img._id && (
                          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                            <svg
                              className="w-8 h-8 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                        {imageAltTexts[img] && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                            {imageAltTexts[img]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <ImageGallaryPagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(totalPages / 8)}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </div>

          {/* Right Section: Image Details & Actions */}
          <div className="w-1/3 p-6 flex flex-col">
            {imagePreview === null && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alt Text <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => {
                    setAltText(e.target.value);
                    setError("");
                  }}
                  placeholder="Alt text is required"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    error && !altText.trim()
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              </div>
            )}

            <div className="">
              <span className="sr-only">Upload Image</span>
              {imagePreview === null && (
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Upload New Image
                  </label>
                </div>
              )}

              {imagePreview !== null && (
                <div className="relative h-[300px]">
                  <button
                    onClick={() => setImagePreview(null)}
                    className="absolute top-0 end-0 z-10 bg-black rounded-full p-2 text-white"
                  >
                    {" "}
                    x{" "}
                  </button>

                  <div className="w-full relative h-[200px] ">
                    <Image
                      src={imagePreview}
                      alt={imageAltTexts || `""`}
                      layout="fill"
                      objectFit="cover"
                      className="transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-4">
                    <input
                      value={imageAltTexts}
                      type="text"
                      placeholder="Enter Alt here"
                      className="w-full rounded px-3 mb-2 py-1 focus:outline-none border"
                      onChange={(e) => setImageAltTexts(e.target.value)}
                    />

                    <button
                      onClick={handleFileUpload}
                      className="block px-5 bg-blue-400 rounded py-1 text-white active:bg-blue-900 active:scale-110"
                    >
                      Save Image
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={validateAndConfirm}
                disabled={!selectedImage || !altText.trim()}
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!selectedImage
                  ? "Select an Image"
                  : !altText.trim()
                  ? "Add Alt Text"
                  : "Confirm Selection"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGalleryPopup;
