import React from 'react';
import { getPostById } from '../../../lib/api';
import { notFound } from 'next/navigation';
import WebStoryViewer from '../../../components/WebStoryViewer';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const post = await getPostById(resolvedParams.slug);
  
  if (!post) {
    return {
      title: 'Story Not Found',
    };
  }

  return {
    title: post.seo?.metaTitle || post.title,
    description: post.seo?.metaDescription || post.summary,
  };
}

export default async function WebStoryPage({ params }) {
  const resolvedParams = await params;
  const post = await getPostById(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  const cleanType = post.type?.toLowerCase().trim();
  const isWebStory = cleanType === 'web story' || cleanType === 'web-story' || cleanType === 'story';

  if (!isWebStory) {
    notFound(); 
  }

  let storyImages = [];
  if (post.stories && post.stories.length > 0) {
      storyImages = post.stories.map(story => ({
          url: story.image,
          caption: story.title,
          description: story.paragraph
      }));
  } else if (post.images && post.images.length > 0) {
      storyImages = post.images;
  }

  return (
      <WebStoryViewer 
          images={storyImages} 
          postTitle={post.title}
          author={post.author?.name || post.authorName}
          date={post.publishedAt}
      />
  );
}
