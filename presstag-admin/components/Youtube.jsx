'use client';
import React, { useState } from 'react';

const YoutubeLinks = () => {
  const [link, setLink] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Submitted link: ${link}`); // Replace this with your actual logic
  };

  return (
    <form
      className="absolute bg-white rounded p-5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center space-y-4"
      onSubmit={handleSubmit}
    >
      <input
        type="text"
        className="border border-gray-300 p-2 rounded w-64"
        placeholder="Enter YouTube Link"
        value={link}
        onChange={(e) => setLink(e.target.value)}
      />
      <button
        type="submit"
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
      >
        Submit
      </button>
    </form>
  );
};

export default YoutubeLinks;

