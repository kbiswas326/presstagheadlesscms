import React from 'react'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'

const Pagination = ({ currentPage, totalPages, onPageChange, compact = true, loading }) => {
  const pageNumbers = []
  const maxVisiblePages = compact ? 3 : 5 // Show fewer pages in compact mode

  // Calculate range of visible page numbers
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

  // Adjust if we're near the end
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i)
  }

  return (
    <div className="flex items-center gap-1">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={loading || currentPage === 1}
        className={`flex items-center p-1 rounded ${
          loading || currentPage === 1
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
        title="Previous page"
      >
        <FaChevronLeft size={14} />
      </button>

      {/* First Page */}
      {startPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            disabled={loading}
            className={`w-8 h-8 rounded flex items-center justify-center ${
              currentPage === 1
                ? 'bg-blue-500 text-white'
                : loading
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            1
          </button>
          {startPage > 2 && <span className="text-gray-400">...</span>}
        </>
      )}

      {/* Page Numbers */}
      {pageNumbers.map((number) => (
        <button
          key={number}
          onClick={() => onPageChange(number)}
          disabled={loading}
          className={`w-8 h-8 rounded flex items-center justify-center ${
            currentPage === number
              ? 'bg-blue-500 text-white'
              : loading
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {number}
        </button>
      ))}

      {/* Last Page */}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="text-gray-400">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={loading}
            className={`w-8 h-8 rounded flex items-center justify-center ${
              currentPage === totalPages
                ? 'bg-blue-500 text-white'
                : loading
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={loading || currentPage === totalPages}
        className={`flex items-center p-1 rounded ${
          loading || currentPage === totalPages
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
        title="Next page"
      >
        <FaChevronRight size={14} />
      </button>
    </div>
  )
}

export default Pagination
