import React from 'react';

export const revalidate = 60;

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-16 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Search</h1>
      <p className="text-gray-600">Use the search box in the header to search for posts.</p>
    </div>
  );
}

