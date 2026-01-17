'use client';  // This tells Next.js that this component should only run in the browser

import useAllPostDataStore from '../../../store/useAllPostDataStore';
import Table from '../../../components/Table';
import TableHeader from '../../../components/TableHeader';
import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

const Page = () => {
  const { fetchAllPostedData, allPosts, totalPages, loading } = useAllPostDataStore();
  const { isDark } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState('published'); // Default status
  const limit = 15;

  // Function to update data when status or page changes
  const fetchData = () => {
    let url;
    if(status==='pending-approval'){
      url = `${process.env.NEXT_PUBLIC_API_URL}/posts/pending-approval/all?type=Article&limit=${limit}&page=${currentPage}`;

    }else{

      url = `${process.env.NEXT_PUBLIC_API_URL}/posts/${status}?type=Article&limit=${limit}&page=${currentPage}`;
    }
    fetchAllPostedData(url, 'Article');
  };

  // useEffect hook ensures fetchData runs only on the client
  useEffect(() => {
    fetchData();
  }, [currentPage, status]);

  // Only execute scroll logic on the client
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    if (typeof window !== 'undefined') {  // Check if window is defined (client-side only)
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
            type="Article"
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
              loading={loading} 
              type={'Article'}
              status={status}
              onStatusChange={handleStatusChange} // Optionally pass this to Table for status-specific actions
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
