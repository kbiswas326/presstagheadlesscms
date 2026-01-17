"use client";

import { useState, useRef } from "react";
import { Upload, MoreVertical, X, FileText, Search } from "lucide-react";

export default function FilesPage() {
  const [files, setFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const [fileToUpload, setFileToUpload] = useState(null);
  const [fileTitle, setFileTitle] = useState("");

  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const menuRef = useRef(null);

  const fileInputRef = useRef(null);

  // Allowed non-image file formats
  const allowedFiles = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    "text/plain",
  ];

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!allowedFiles.includes(file.type)) {
      alert("Only document, text, and zip files allowed.");
      return;
    }

    setFileToUpload(file);
    setFileTitle(file.name.replace(/\.[^/.]+$/, "")); // default title without extension
    setIsUploadOpen(true);
  };

  const handleUpload = () => {
    if (!fileToUpload) return;

    const newFile = {
      name: fileTitle || fileToUpload.name,
      size: (fileToUpload.size / 1024).toFixed(1), // KB
      type: fileToUpload.type,
      extension: fileToUpload.name.split(".").pop(),
      uploadedOn: new Date().toLocaleDateString(),
    };

    setFiles([newFile, ...files]);

    // Reset
    setIsUploadOpen(false);
    setFileToUpload(null);
    setFileTitle("");
  };

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Files</h1>

        <div className="flex gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded-lg py-2 pl-10 pr-4 w-64 focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
          </div>

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current.click()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Upload size={18} />
            Upload File
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* File Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredFiles.map((file, idx) => (
          <div
            key={idx}
            className="border rounded-lg bg-white shadow hover:shadow-lg transition relative p-4"
          >
            {/* File icon */}
            <div className="flex justify-center mb-3">
              <FileText size={48} className="text-blue-600" />
            </div>

            {/* Title */}
            <p className="font-semibold text-gray-800 text-center">{file.name}</p>

            {/* Details */}
            <p className="text-sm text-gray-500 text-center mt-1">
              {file.extension.toUpperCase()} • {file.size} KB
            </p>

            <p className="text-xs text-gray-400 text-center">
              Uploaded {file.uploadedOn}
            </p>

            {/* Action Menu */}
            <div className="absolute top-3 right-3" ref={menuRef}>
              <button
                onClick={() =>
                  setOpenMenuIndex(openMenuIndex === idx ? null : idx)
                }
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <MoreVertical size={18} />
              </button>

              {openMenuIndex === idx && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg z-50">
                  <ul>

                    {/* Delete Step 1 */}
                    <li>
                      {confirmDeleteIndex === idx ? (
                        <div className="px-4 py-2">
                          <p className="text-sm text-red-600 mb-2">
                            Confirm delete?
                          </p>

                          <div className="flex justify-between text-xs">
                            <button
                              onClick={() => {
                                setFiles(files.filter((_, i) => i !== idx));
                                setConfirmDeleteIndex(null);
                                setOpenMenuIndex(null);
                              }}
                              className="bg-red-600 text-white px-2 py-1 rounded"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setConfirmDeleteIndex(null)}
                              className="text-gray-600 px-2 py-1"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteIndex(idx)}
                          className="px-4 py-2 w-full text-left text-red-600 hover:bg-gray-100"
                        >
                          Delete
                        </button>
                      )}
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredFiles.length === 0 && (
          <p className="text-gray-400 text-center w-full col-span-4 mt-10">
            No files found
          </p>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white w-96 p-6 rounded-xl shadow-xl relative">
            {/* Close */}
            <button
              onClick={() => setIsUploadOpen(false)}
              className="absolute right-4 top-4 text-gray-500 hover:text-black"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-semibold mb-4">Upload File</h2>

            <label className="font-medium text-sm">File Title</label>
            <input
              type="text"
              value={fileTitle}
              onChange={(e) => setFileTitle(e.target.value)}
              className="border rounded-md w-full p-2 mt-1 mb-4"
              placeholder="Enter file title"
            />

            <button
              onClick={handleUpload}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
            >
              Upload
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
