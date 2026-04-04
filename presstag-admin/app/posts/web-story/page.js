///posts/web-story/page.js | Main page component for listing and managing Web Story posts in the PressTag CMS admin panel. Handles fetching post data, pagination, status filtering, and rendering the Table and TableHeader components.///
'use client';
import useAllPostDataStore from '../../../store/useAllPostDataStore';
import Table from '../../../components/Table';
import TableHeader from '../../../components/TableHeader';
import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

const Page = () => {
  const { isDark } = useTheme();
  const { fetchAllPostedData, allPosts, totalPages, loading } = useAllPostDataStore();
  const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/api$/, '');
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState('published'); // Default status
  const limit = 15;

  // Function to update data when status or page changes
  const fetchData = () => {
    let url;
    if (status === 'pending-approval') {
      url = `${BASE}/api/posts?status=pending&type=Web Story&limit=${limit}&page=${currentPage}`;
    } else {
      url = `${BASE}/api/posts?status=${status}&type=Web Story&limit=${limit}&page=${currentPage}`;
    }
    fetchAllPostedData(url, 'Web Story');
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, status]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
    

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setCurrentPage(1); // Reset to the first page when status changes
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className='max-w-7xl mx-auto p-4'>
        <div className={`rounded-lg shadow transition-colors duration-200 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <TableHeader
            type="Web Story"
            currentPage={currentPage}
            loading={loading}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onStatusChange={handleStatusChange} 
            totalItems={allPosts.length}
            status={status} // Pass current status
          />
          <div className="overflow-x-auto">
            <Table 
              posts={allPosts} 
              type={'Web Story'}
              status={status}
              loading={loading} 
              onStatusChange={handleStatusChange} // Optionally pass this to Table for status-specific actions
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;




