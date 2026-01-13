import React, { useState, useEffect } from 'react';
import { X, Search, Upload, Check } from 'lucide-react';

export default function MediaImagesSelector({ onSelect, onClose }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);

  // Fetch media on mount
  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      // Assuming API is at /media based on routes/media.js
      // You might need to adjust the base URL
      const res = await fetch('http://localhost:5000/media');
      const data = await res.json();
      if (Array.isArray(data)) {
        setImages(data);
      }
    } catch (err) {
      console.error('Failed to fetch media:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const res = await fetch('http://localhost:5000/media/upload', {
        method: 'POST',
        body: formData,
      });
      const newImage = await res.json();
      if (newImage && !newImage.message) {
        setImages(prev => [newImage, ...prev]);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const filteredImages = images.filter(img => 
    img.title?.toLowerCase().includes(search.toLowerCase()) ||
    img.altText?.toLowerCase().includes(search.toLowerCase()) ||
    img.filename?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold dark:text-white">Select Media</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <X size={20} className="dark:text-gray-300" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 flex gap-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search media..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <label className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg cursor-pointer hover:bg-emerald-700 transition-colors">
            <Upload size={18} />
            <span>{uploading ? 'Uploading...' : 'Upload'}</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              No images found. Upload one to get started.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredImages.map(img => (
                <button 
                  key={img._id || img.id}
                  onClick={() => onSelect(img)}
                  className="group relative aspect-square rounded-lg overflow-hidden border dark:border-gray-700 hover:ring-2 hover:ring-emerald-500 focus:outline-none"
                >
                  <img 
                    src={img.url.startsWith('http') ? img.url : `http://localhost:5000${img.url}`} 
                    alt={img.altText || 'Media'} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 text-white text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {img.filename}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
