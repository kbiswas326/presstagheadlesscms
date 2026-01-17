'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, Video, Image } from 'lucide-react';

export default function PostTypePage() {
  const postTypes = [
    {
      label: 'Article',
      description: 'Create a new article post',
      href: '/posts/new/article',
      icon: FileText,
    },
    {
      label: 'Video',
      description: 'Upload a new video post',
      href: '/posts/new/video',
      icon: Video,
    },
    {
      label: 'Web Story',
      description: 'Create a new web story',
      href: '/posts/new/web-story',
      icon: Image,
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Select Post Type</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {postTypes.map((type) => (
          <Link
            key={type.label}
            href={type.href}
            className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition flex flex-col items-start gap-2"
          >
            <type.icon className="w-8 h-8 text-blue-600" />
            <h2 className="text-lg font-semibold">{type.label}</h2>
            <p className="text-gray-500 text-sm">{type.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
