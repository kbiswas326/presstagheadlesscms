"use client";
import { useState, useEffect } from 'react';

const ContentTable = ({ contentType }) => {
  const [content, setContent] = useState([]);
  const [activeStatus, setActiveStatus] = useState('all');

  // Mock data generator based on content type
  useEffect(() => {
    const getMockData = () => {
      switch (contentType) {
        case 'video':
          return [
            { id: 1, title: 'Summer Travel Guide', duration: '5:30', views: '1.2K', status: 'published', lastModified: '2 hours ago', seoScore: 92 },
            { id: 2, title: 'Cooking Tutorial', duration: '12:45', views: '856', status: 'draft', lastModified: '1 day ago', seoScore: 85 },
          ];
        case 'webstory':
          return [
            { id: 1, title: 'Top 10 Travel Destinations', slides: 12, views: '2.3K', status: 'published', lastModified: '1 hour ago', seoScore: 88 },
            { id: 2, title: 'Fashion Week Highlights', slides: 8, views: '1.5K', status: 'draft', lastModified: '3 days ago', seoScore: 78 },
          ];
        case 'gallery':
          return [
            { id: 1, title: 'Nature Photography Collection', images: 24, views: '3.4K', status: 'published', lastModified: '5 hours ago', seoScore: 90 },
            { id: 2, title: 'City Life Gallery', images: 15, views: '987', status: 'pending', lastModified: '2 days ago', seoScore: 82 },
          ];
        default:
          return [];
      }
    };

    setContent(getMockData());
  }, [contentType]);

  const statusFilters = [
    { label: 'All', value: 'all' },
    { label: 'Published', value: 'published' },
    { label: 'Draft', value: 'draft' },
    { label: 'Pending', value: 'pending' },
    { label: 'Scheduled', value: 'scheduled' },
  ];

  const getStatusColor = (status) => {
    const colors = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      scheduled: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Custom columns based on content type
  const getColumns = () => {
    const commonColumns = [
      { key: 'title', label: 'Title' },
      { key: 'seoScore', label: 'SEO Score' },
      { key: 'status', label: 'Status' },
      { key: 'lastModified', label: 'Last Modified' },
      { key: 'views', label: 'Views' },
    ];

    const specificColumns = {
      video: [{ key: 'duration', label: 'Duration' }],
      webstory: [{ key: 'slides', label: 'Slides' }],
      gallery: [{ key: 'images', label: 'Images' }],
    };

    return [...commonColumns.slice(0, 1), ...(specificColumns[contentType] || []), ...commonColumns.slice(1)];
  };

  return (
    <div className="p-6 pt-20">
      {/* Status Filters */}
      <div className="flex gap-2 mb-6">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActiveStatus(filter.value)}
            className={`px-4 py-2 rounded-md text-sm ${
              activeStatus === filter.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                {getColumns().map((column) => (
                  <th key={column.key} className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                    {column.label}
                  </th>
                ))}
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {content
                .filter(item => activeStatus === 'all' || item.status === activeStatus)
                .map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    {getColumns().map((column) => (
                      <td key={column.key} className="px-6 py-4 text-sm text-gray-700">
                        {column.key === 'status' ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        ) : column.key === 'seoScore' ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${item.seoScore >= 90 ? 'bg-green-100 text-green-800' :
                              item.seoScore >= 70 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'}`}>
                            {item.seoScore}
                          </span>
                        ) : (
                          item[column.key]
                        )}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {/* Add edit action */}}
                          className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded-md text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {/* Add view action */}}
                          className="px-2 py-1 text-green-600 hover:bg-green-50 rounded-md text-sm"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ContentTable; 