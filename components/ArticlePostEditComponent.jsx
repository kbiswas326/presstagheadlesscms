"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { FaPlusCircle } from "react-icons/fa";
import { usePathname } from "next/navigation";
import useAllPostDataStore from "../store/useAllPostDataStore";
import ImageGalleryPopup from "./ImageGalleryPopup";
import YoutubeLinkss from "./Youtube";

const ArticlePostEditComponent = ({
  handleArticleFromData,
  formDataPostEdit,
}) => {
 
  const pathname = usePathname();
  
  


  const [gallery, setGallery] = useState(false);
  const toggleGalleyButton = () => {
    setGallery((pre) => !pre);
  };

  const [dragOver, setDragOver] = useState(false);


  const handleTitleChange = (e) => {
    handleArticleFromData("title", e.target.value);
  };

  const handleEnglishTitleChange = (e) => {
    // setEnglishTitle(e.target.value);
    handleArticleFromData("slug", e.target.value);
  };

  const handleSummaryChange = (e) => {
    // setSummary(e.target.value.slice(0, 250)); // Enforce 250-character limit
    handleArticleFromData("summary", e.target.value);
  };

  const handleMetaDescriptionChange = (e) => {
    // setMetaDescription(e.target.value.slice(0, 160));
    handleArticleFromData("seo_desc", e.target.value);
  };
  const handleBanner_descDescriptionChange = (e) => {
    const value = e.target.value;
    handleArticleFromData("banner_desc", value);
  };

  const selecttedImageForBanner = (filename) => {
    
    handleArticleFromData("banner_image", filename);
  };

  const handleImageAltText = (altText) => {
    handleArticleFromData("banner_desc", altText);
  };
  const handleBanner_caption = (banner_caption) => {
    handleArticleFromData("banner_caption", banner_caption.target.value);
  };
  const handleBanner_video_caption = (video_caption) => {
    handleArticleFromData("video_caption", video_caption.target.value);
  };

  const [videoPopUp, setVideoPopUp] = useState(false);
  const [youtubeLink, setYoutubeLink] = useState(formDataPostEdit.video || "");

  // Toggle video popup
  const videoPopUpToggle = () => setVideoPopUp((prev) => !prev);
  const saveYoutubeLink = () => {
    handleArticleFromData("video", youtubeLink);

    setVideoPopUp(false);
  };

  // Handle Delete
  const deleteYoutubeLink = () => {
    setYoutubeLink("");
    handleArticleFromData("video", "");
  };
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {gallery && (
        <ImageGalleryPopup
          onSelect={selecttedImageForBanner}
          onImageSelect={(url, altText) => {
            // Extract the relative path from the URL
            // If it's a full URL with API_URL, extract just the path
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
            const relativePath = url.startsWith(apiUrl) 
              ? url.replace(apiUrl, '') 
              : url.startsWith('http') 
                ? url 
                : url;
            
            selecttedImageForBanner(relativePath);
            handleImageAltText(altText);
            handleBanner_caption({ target: { value: altText } });
          }}
          onClose={toggleGalleyButton}
        />
      )}
      <h2 className="text-xl font-bold mb-4">Manage Post Properties</h2>

      {/* Title */}
      <div className="mb-4">
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Title
        </label>
        <input
          type="text"
          id="title"
          value={formDataPostEdit.title}
          onChange={handleTitleChange}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-200 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      {/* English Title */}
      <div className="mb-4">
        <label
          htmlFor="englishTitle"
          className="block text-sm font-medium text-gray-700"
        >
          English Title (Permalink)
        </label>
        <input
          type="text"
          id="englishTitle"
          value={formDataPostEdit.slug}
          onChange={handleEnglishTitleChange}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-200 focus:border-indigo-500 sm:text-sm"
        />
        <p className="mt-1 text-sm text-gray-500">
          Only lowercase letters, numbers, and hyphens are allowed. Special
          characters will be converted to hyphens.
        </p>
      </div>

      {/* Summary */}
      <div className="mb-4">
        <label
          htmlFor="summary"
          className="block text-sm font-medium text-gray-700"
        >
          Summary
        </label>
        <textarea
          id="summary"
          value={formDataPostEdit.summary}
          onChange={handleSummaryChange}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-200 focus:border-indigo-500 sm:text-sm"
        />
        <div className="text-sm text-gray-500 mt-1">
          {formDataPostEdit.summary.length} / 250
        </div>
      </div>

      {/* Meta Description */}
      <div className="mb-4">
        <label
          htmlFor="metaDescription"
          className="block text-sm font-medium text-gray-700"
        >
          Meta Description
        </label>
        <textarea
          id="metaDescription"
          value={formDataPostEdit.seo_desc}
          onChange={handleMetaDescriptionChange}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-200 focus:border-indigo-500 sm:text-sm"
        />
        <div className="text-sm text-gray-500 mt-1">
          {formDataPostEdit.seo_desc ? formDataPostEdit.seo_desc.length : 0} /
          160
        </div>
      </div>

      {/* Featured Image */}
      <div className="mb-4">
        <label
          htmlFor="featuredImage"
          className="block text-sm font-medium text-gray-700"
        >
         {pathname.split("/")[2] === "Video"?"Feature Video": "  Featured Image"}
        </label>

        {pathname.split("/")[2] === "Video" ? (
          <>
            <div className="mb-4">
              

              {formDataPostEdit.video === "" ? (
                <div
                  className="bg-blue-50 rounded shadow-md w-full h-[300px] cursor-pointer flex items-center justify-center"
                  onClick={videoPopUpToggle}
                >
                  <p className="text-gray-700">Click to upload your video</p>
                </div>
              ) : (
                <div className="relative bg-gray-100 w-full h-[300px] flex flex-col items-center">
                  <iframe
                    className="w-full h-full rounded-md"
                    src={`https://www.youtube.com/embed/${
                      formDataPostEdit.video.split("v=")[1]
                    }`}
                    title="YouTube Video"
                    frameBorder="0"
                    allowFullScreen
                  ></iframe>
                  {/* Options Menu */}
                  <div className="absolute top-2 right-2">
                    <button
                      className="text-gray-700 hover:text-gray-900"
                      onClick={videoPopUpToggle}
                    >
                      •••
                    </button>
                    <div className="bg-white border shadow-md rounded-md mt-1 p-2 space-y-2">
                      <button
                        onClick={videoPopUpToggle}
                        className="text-blue-500 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={deleteYoutubeLink}
                        className="text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {videoPopUp && (
              <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <h3 className="text-lg font-bold mb-4">
                    Add/Edit Video Link
                  </h3>
                  <input
                    type="text"
                    value={youtubeLink}
                    onChange={(e) => setYoutubeLink(e.target.value)}
                    placeholder="Paste YouTube link here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <div className="flex justify-end mt-4 space-x-2">
                    <button
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md"
                      onClick={() => setVideoPopUp(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 bg-blue-500 text-white rounded-md"
                      onClick={saveYoutubeLink}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          // <div>
          //   {formDataPostEdit.video === "" ? (
          //     <div
          //       className="bg-red-200 w-full h-[300px]   cursor-pointer  "
          //       onClick={() => videoPopUpToogle(youtubeLink, true)}
          //     >
          //       Hi Upload your Video
          //     </div>
          //   ) : (
          //     <div>Helo {formDataPostEdit.video} </div>
          //   )}
          // </div>
          <div
            className={`flex items-center justify-center w-full h-40 mt-1 border rounded-md cursor-pointer ${
              dragOver
                ? "border-blue-500 bg-blue-100"
                : "border-dashed border-gray-300 bg-gray-200"
            }`}
            onClick={toggleGalleyButton}
          >
            <label
              htmlFor="featuredImage"
              className="flex items-center justify-center w-full h-full"
            >
              {formDataPostEdit.banner_image ? (
                <img
                  src={formDataPostEdit.banner_image.startsWith('http') 
                    ? formDataPostEdit.banner_image 
                    : `${process.env.NEXT_PUBLIC_API_URL.replace('/api', '')}${formDataPostEdit.banner_image}`}
                  alt={formDataPostEdit.banner_desc}
                  className="object-cover w-full h-full rounded-md"
                />
              ) : (
                <>
                  <p className="mt-2 text-sm text-gray-500 text-center">
                    Add Featured Image
                    <br />
                    Recommended Size: 1280x720
                  </p>
                </>
              )}
            </label>
          </div>
        )}
        {pathname.split("/")[2] === "Video" ? (
          <div>
            <input
              type="text"
              onChange={handleBanner_video_caption}
              value={formDataPostEdit.video_caption}
              placeholder="Write Video Caption"
              className="mt-4 border border-dashed rounded outline-none focus:outline-none px-5 py-1 w-1/2 border-gray-100 bg-gray-100 mx-auto"
            />
          </div>
        ) : (
          <div className="flex gap-5">
            <input
              type="text"
              onChange={handleBanner_descDescriptionChange}
              value={formDataPostEdit.banner_desc}
              placeholder="Alt Text"
              className="mt-4 border border-dashed rounded outline-none focus:outline-none px-5 py-1 w-1/2 border-gray-100 bg-gray-100 mx-auto"
            />
            <input
              type="text"
              onChange={handleBanner_caption}
              value={formDataPostEdit.banner_caption}
              placeholder="Banner Caption"
              className="mt-4 border border-dashed rounded outline-none focus:outline-none px-5 py-1 w-1/2 border-gray-100 bg-gray-100 mx-auto"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticlePostEditComponent;
