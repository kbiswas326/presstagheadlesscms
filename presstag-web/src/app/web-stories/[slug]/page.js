import React from 'react';
import { getPostById } from '../../../lib/api';
import { notFound } from 'next/navigation';
import WebStoryViewer from '../../../components/WebStoryViewer';
import { fetchWithTenant } from '../../../lib/fetchWithTenant';
import { buildOpenGraphImage, resolveSiteAssetUrl } from '../../../lib/seo';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const [post, config] = await Promise.all([
    getPostById(resolvedParams.slug),
    fetchWithTenant('/layout-config', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  ]);
  
  if (!post) {
    return {
      title: 'Story Not Found',
    };
  }

  const siteTitle = config?.branding?.siteTitle || 'PressTag';
  const ogImage = resolveSiteAssetUrl(
    post?.seo?.ogImage ||
    post?.featuredImage?.url ||
    post?.featuredImage ||
    post?.banner_image ||
    post?.coverImage ||
    config?.seo?.defaultOgImage ||
    config?.branding?.fallbackImage ||
    config?.branding?.logo ||
    '/favicon.ico'
  );

  return {
    title: post.seo?.metaTitle || post.title,
    description: post.seo?.metaDescription || post.summary,
    openGraph: {
      title: post.seo?.metaTitle || post.title,
      description: post.seo?.metaDescription || post.summary,
      siteName: siteTitle,
      images: buildOpenGraphImage(ogImage),
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seo?.metaTitle || post.title,
      description: post.seo?.metaDescription || post.summary,
      images: ogImage ? [ogImage] : undefined,
    }
  };
}

export default async function WebStoryPage({ params }) {
  const resolvedParams = await params;
  const post = await getPostById(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  const cleanType = String(post?.type || '').toLowerCase().trim();
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
