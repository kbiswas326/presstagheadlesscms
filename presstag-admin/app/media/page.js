///admin>app>media>page.js///
'use client'
import Image from "next/image";
import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import ImageGallaryPagination from "../../components/ImagegalleryPagination";
import { getImageUrl } from '@/lib/imageHelper';

const Page = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageAlt, setSelectedImageAlt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [altText, setAltText] = useState("");
  const [error, setError] = useState("");
  const [imageAltTexts, setImageAltTexts] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

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
            "x-tenant-id": "sportzpoint"
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
      const url = `${process.env.NEXT_PUBLIC_API_URL}/media/img?limit=12&page=${currentPage}`;
      fetchImages(url);
    } else {
      // If searchQuery changes, delay the API call by 800ms
      debounceTimeout = setTimeout(() => {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/media/search?alt=${searchQuery}&limit=12&page=${currentPage}`;
        fetchImages(url);
      }, 800);
    }

    return () => clearTimeout(debounceTimeout); // Cleanup the timeout
  }, [searchQuery]);

  useEffect(() => {
    // Fetch images immediately when currentPage changes
    const url = searchQuery === ""
      ? `${process.env.NEXT_PUBLIC_API_URL}/media/img?limit=12&page=${currentPage}`
      : `${process.env.NEXT_PUBLIC_API_URL}/media/search?alt=${searchQuery}&limit=12&page=${currentPage}`;

    fetchImages(url);
  }, [currentPage]);

  const handleImageClick = (img,alt) => {
    setSelectedImage(img);
    setSelectedImageAlt(alt)
  };
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleClosePopup = () => {

    setSelectedImage(null);
    setSelectedImageAlt("")

  };

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
      setShowUploadForm(true);
      setError("");
    } else {
      setError("Please select a valid image file");
    }
  };

  

  const uploadFile = async () => {
    if (!altText.trim()) {
      setError("Alt text is required");
      return;
    }

    if (!selectedFile) {
      setError("Please select an image");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("altText", altText.trim());

    setIsLoading(true);
    setError("");

    try {
      const token = Cookies.get("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/media/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
      const data = await response.json();
      if (data.fileName) {
        setImages((prev) => [data.fileName, ...prev]);
        setImageAltTexts(prev => ({
          ...prev,
          [data.fileName]: altText.trim()
        }));
        // Reset form
        setAltText("");
        setSelectedFile(null);
        setPreviewImage(null);
        setShowUploadForm(false);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setError("Failed to upload image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    handleFileChange(e)
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
            `${process.env.NEXT_PUBLIC_API_URL}/media/upload`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
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
          fetchImages(`${process.env.NEXT_PUBLIC_API_URL}/media/img?limit=12&page=${currentPage}`)
          
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

  return (
    <div className="p-6 pt-24">
      <div className="mb-6 flex justify-between">
        <div>

          <h1 className="text-2xl font-semibold text-gray-800">Media Library</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and upload your media assets</p>
        </div>
        <div className="w-[500px]">
          <input className="w-full focus:outline-none border rounded rounded px-3 py-1" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} type="text" />
        </div>
      </div>

      {imagePreview==null ? (
        <div
          className={`mb-8 border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="max-w-xl mx-auto">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="mt-4">
              <label className="relative cursor-pointer">
                <span className="text-gray-600">Drop images here or</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <span className="text-blue-500 hover:text-blue-600 ml-1">browse</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
        </div>
      ) :
      
      (
        <div className="mb-8 bg-white rounded-lg shadow-md p-4">

          {/* <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-medium text-gray-900">Upload Image</h2>
            <button
              onClick={() => {
                setShowUploadForm(false);
                setPreviewImage(null);
                setSelectedFile(null);
                setAltText("");
                setError("");
              }}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div> */}

          <div className="flex flex-col md:flex-row gap-3">
            {imagePreview && (
              <div className="w-full md:w-1/2">
                <div className="relative w-full" style={{ height: '280px' }}>
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    layout="fill"
                    objectFit="contain"
                    className="rounded-lg"
                  />
                </div>
              </div>
            )}

            <div className="w-full md:w-1/2 flex flex-col">
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alt Text <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={imageAltTexts}
                  onChange={(e) => {
                    setImageAltTexts(e.target.value);
                    setError("");
                  }}
                  placeholder="Describe this image..."
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${error && !altText.trim() ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {error && (
                  <p className="mt-1 text-sm text-red-600">
                    {error}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-3">
                <button
                  onClick={() => {
                   
                    setImagePreview(null)
                    setImage(null)
                    setImageAltTexts("")
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFileUpload}
                  
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  
                  {isLoading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {images.map((img, index) => (
          <div
            key={index}
            className="group aspect-square relative rounded-lg overflow-hidden border border-gray-200 bg-gray-100 hover:border-blue-500 transition-all duration-200"
            onClick={() => handleImageClick(img.img_path,img.alt)}
          >
            <Image
              src={getImageUrl(img.url || `/uploads/default/${img.img_path}`)}
              alt={img.alt || ""}
              layout="fill"
              objectFit="cover"
              className="group-hover:opacity-75 transition-opacity duration-200"
            />
           
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                {img.alt}
              </div>
            
          </div>
        ))}
      </div>
      <div className="my-5"> 

      <ImageGallaryPagination
        currentPage={currentPage}
        totalPages={Math.ceil(totalPages / 8)}
        onPageChange={handlePageChange}
        />
        </div>

      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="absolute top-2 right-2 z-50">
              <button
                onClick={handleClosePopup}
                className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors duration-200"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col">
              <div className="aspect-square relative w-full">
                <Image
                  src={getImageUrl(`/uploads/default/${selectedImage}`)}
                  alt={imageAltTexts[selectedImage] || "Selected Image"}
                  layout="fill"
                  objectFit="contain"
                  className="bg-gray-900"
                />
               
              </div>
              {selectedImageAlt && (
                <div className="p-3 bg-white border-t">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Alt Text:</span> {selectedImageAlt}
                  </p>
                </div>
              )}
            </div>
          </div>
          {/* Click outside to close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={handleClosePopup}
            aria-label="Close modal"
          />
        </div>
      )}
    </div>
  );
};

export default Page;