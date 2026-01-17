'use client'
import useAllPostDataStore from '../../../store/useAllPostDataStore';
import Table from '../../../components/Table'
import TableHeader from '../../../components/TableHeader'
import React, { useEffect, useState } from 'react'

const Page = () => {
  const { fetchAllPostedData, allPosts, totalPages, loading } = useAllPostDataStore()
  const [currentPage, setCurrentPage] = useState(1)
  const limit = 15

  useEffect(() => {
    fetchAllPostedData(
      `${process.env.NEXT_PUBLIC_API_URL}/articles/type/Newsletter?limit=${limit}&page=${currentPage}`,
      'Newsletter'
    )
  }, [])

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className='bg-gray-50 min-h-screen'>
      <div className='max-w-7xl mx-auto p-4'>
        <div className='bg-white rounded-lg shadow'>
          <TableHeader
            type="Newsletter"
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={allPosts.length}
          />
          <Table posts={allPosts} loading={loading} />
        </div>
      </div>
    </div>
  )
}

export default Page 