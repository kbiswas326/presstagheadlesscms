import React from 'react';
import Link from 'next/link';

const Pagination = ({ currentPage, totalPages, baseUrl }) => {
  if (totalPages <= 1) return null;

  const createPageLink = (page) => {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}page=${page}`;
  };

  const renderPageButton = (page, isActive) => (
    <Link
      key={page}
      href={createPageLink(page)}
      className={`relative inline-flex items-center justify-center w-10 h-10 text-sm font-semibold rounded-lg transition-all duration-200 ${
        isActive
          ? 'z-10 bg-emerald-600 text-white shadow-md scale-105'
          : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:text-emerald-600 hover:border-emerald-200 shadow-sm'
      }`}
    >
      {page}
    </Link>
  );

  // Pagination logic
  const pages = [];
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, currentPage + 2);

  // Adjust window if close to boundaries
  if (currentPage <= 3) {
      endPage = Math.min(totalPages, 5);
  } else if (currentPage >= totalPages - 2) {
      startPage = Math.max(1, totalPages - 4);
  }

  if (startPage > 1) {
    pages.push(renderPageButton(1, currentPage === 1));
    if (startPage > 2) {
      pages.push(
        <span key="start-ellipsis" className="relative inline-flex items-center justify-center w-10 h-10 text-sm font-semibold text-gray-400">
          ...
        </span>
      );
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(renderPageButton(i, currentPage === i));
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pages.push(
        <span key="end-ellipsis" className="relative inline-flex items-center justify-center w-10 h-10 text-sm font-semibold text-gray-400">
          ...
        </span>
      );
    }
    pages.push(renderPageButton(totalPages, currentPage === totalPages));
  }

  return (
    <div className="flex items-center justify-center mt-12 mb-8">
      <nav className="flex items-center gap-2" aria-label="Pagination">
        {currentPage > 1 ? (
            <Link
              href={createPageLink(currentPage - 1)}
              className="relative inline-flex items-center justify-center px-4 h-10 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-emerald-600 hover:border-emerald-200 transition-all duration-200 shadow-sm"
            >
              <span className="sr-only">Previous</span>
              <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Prev
            </Link>
        ) : (
             <span className="relative inline-flex items-center justify-center px-4 h-10 text-sm font-medium text-gray-300 bg-gray-50 border border-gray-100 rounded-lg cursor-not-allowed">
              <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Prev
            </span>
        )}

        <div className="flex items-center gap-1 mx-2">
            {pages}
        </div>

        {currentPage < totalPages ? (
            <Link
              href={createPageLink(currentPage + 1)}
              className="relative inline-flex items-center justify-center px-4 h-10 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-emerald-600 hover:border-emerald-200 transition-all duration-200 shadow-sm"
            >
              Next
              <span className="sr-only">Next</span>
              <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
        ) : (
            <span className="relative inline-flex items-center justify-center px-4 h-10 text-sm font-medium text-gray-300 bg-gray-50 border border-gray-100 rounded-lg cursor-not-allowed">
              Next
              <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </span>
        )}
      </nav>
    </div>
  );
};

export default Pagination;
