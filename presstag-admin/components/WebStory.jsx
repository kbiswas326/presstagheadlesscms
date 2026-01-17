import Image from "next/image";
import React, { useState } from "react";
import ImageGalleryPopup from "./ImageGalleryPopup";
import { v4 as uuidv4 } from 'uuid';
const generateMongoId = () => {
  return uuidv4().replace(/-/g, '').slice(0, 24); // Ensure it resembles MongoDB's format
};
const WebStoryEditor = ({ content, htmlJsonGrab }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [showImageGallery, setShowImageGallery] = useState(false);

  // Handle item edit
  const handleEdit = (item) => {
    setSelectedItem(item);
  };

  // Handle item save
  const handleSave = () => {
    const updatedWebStory = content.map((item) =>
      item._id === selectedItem._id ? selectedItem : item
    );
    htmlJsonGrab(updatedWebStory);
    setSelectedItem(null);
  };

  // Handle add new item
  const handleAdd = () => {
    const newItem = {
      type: "image",
      cta_link: "",
      cta_text: "",
      title: "",
      img_src: "add",
      desc: "",
      _id: generateMongoId(), 
    };

    const updatedWebStory = Array.isArray(content)
      ? [...content, newItem]
      : [newItem];
    htmlJsonGrab(updatedWebStory);
    setSelectedItem(newItem);
  };

  // Handle item deletion
  const handleDelete = (title) => {
    const updatedWebStory = content.filter((item) => item.title !== title);
    htmlJsonGrab(updatedWebStory);
  };
  

  return (
    <div className="container mx-auto p-4 bg-white">
      <h1 className="text-2xl font-bold mb-4">Web Story Editor</h1>

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {content &&
          content.map((item, index) => (
            <div
              key={index}
              className="relative border rounded-lg overflow-hidden shadow-md hover:shadow-lg"
            >
              {/* Delete Button */}
              <button
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center z-10"
                onClick={() => handleDelete(item.title)}
              >
                ✕
              </button>

              {/* Image Display */}
              <div
                className="relative cursor-pointer"
                style={{ width: "150px", height: "150px" }}
                onClick={() => handleEdit(item)}
              >
                {item.img_src && (
                  <Image
                    src={item.img_src.startsWith('http') ? item.img_src : `${process.env.NEXT_PUBLIC_API_URL}${item.img_src}`}
                    alt={item.title}
                    layout="fill"
                    objectFit="cover"
                    className="rounded"
                  />
                )}
              </div>
            </div>
          ))}
      </div>

      {/* Add Button */}
      <button
        onClick={handleAdd}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Add New Story
      </button>

      {/* Edit Form */}
      {selectedItem && (
        <div className="fixed  inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm z-50 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-2/3">
            <h2 className="text-lg font-bold mb-4">Edit Story</h2>

            <div className="flex gap-2 items-center ">
              <div className="flex-1">
                <div className="w-full h-[300px] relative">
                  <Image
                    src={selectedItem.img_src.startsWith('http') ? selectedItem.img_src : `${process.env.NEXT_PUBLIC_API_URL}${selectedItem.img_src}`}
                    alt=""
                    layout="fill"
                    objectFit="cover"
                    objectPosition="center"
                  />
                </div>
                <div className="mb-4 mt-1">
                  <button
                    className="bg-zinc-500 text-white px-2 py-1 rounded"
                    onClick={() => setShowImageGallery(true)}
                  >
                    {selectedItem.img_src==='add'?'Add Image':'Change Image'}
                   
                  </button>
                </div>
              </div>
              <div className="flex-1">

             

              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">Title</label>
                <input
                  type="text"
                  value={selectedItem.title}
                  onChange={(e) =>
                    setSelectedItem({ ...selectedItem, title: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">
                  Description
                </label>
                <textarea
                  value={selectedItem.desc}
                  rows={5}
                  onChange={(e) =>
                    setSelectedItem({ ...selectedItem, desc: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 h-32"
                />
              </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery Popup */}
      {showImageGallery && (
        <ImageGalleryPopup
          onSelect={(src) => setSelectedItem({ ...selectedItem, img_src: src })}
          onClose={() => setShowImageGallery(false)}
        />
      )}
    </div>
  );
};

export default WebStoryEditor;