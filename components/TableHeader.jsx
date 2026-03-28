'use client'
import React from 'react';
import Pagination from './Pagination';
import useAllPostDataStore from '../store/useAllPostDataStore';
import { useTheme } from 'context/ThemeContext';

const TableHeader = ({ totalPages, currentPage, onPageChange, type, loading, status }) => {
  const { totalPostCount, pendingApprovalCount } = useAllPostDataStore();
  const { isDark } = useTheme();
  
  return (
    <div className={`border-b shadow-sm transition-colors duration-200 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      {/* Main Header */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center gap-3">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{type} Posts</h2>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700'
              }`}>
                {status === 'pending-approval' ? pendingApprovalCount : totalPostCount}
              </span>
            </div>
          </div>

          {/* Right Section - Pagination */}
          <div className="flex items-center gap-4">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Page {currentPage} of {totalPages}
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableHeader;
