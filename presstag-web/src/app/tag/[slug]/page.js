import React from 'react';
import TemplateListing from '../../../components/TemplateListing';
import { fetchWithTenant } from '../../../lib/fetchWithTenant';
import { buildOpenGraphImage, fillTemplate, resolveSiteAssetUrl } from '../../../lib/seo';
import { permanentRedirect } from 'next/navigation';
import { resolveTemplateId } from '../../../lib/templates';

async function getLayoutConfig() {
  try {
    const res = await fetchWithTenant('/layout-config', { cache: 'no-store' });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

async function getTag(slug) {
  try {
    const res = await fetchWithTenant(`/tags/by-slug/${encodeURIComponent(String(slug || ''))}`, { cache: 'no-store' });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

async function getTagPosts(slug, page = 1) {
  if (!slug) return { articles: [], totalPages: 0 };
  const limit = 20;
  try {
    const decoded = (() => {
      const s = String(slug || '').replace(/\+/g, ' ');
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    })();
    const tag = await getTag(decoded);
    const tagKey = tag?._id ? String(tag._id) : decoded;
    const res = await fetchWithTenant(
        `/posts?status=published&excludeType=custompage&tag=${encodeURIComponent(tagKey)}&page=${page}&limit=${limit}&lite=1`,
      { cache: 'no-store' }
    );
    if (!res.ok) {
      throw new Error('Failed to fetch posts');
    }
    const data = await res.json();
    
    let articles = [];
    let totalPages = 1;
    
    if (Array.isArray(data)) {
        const totalCount = data.length;
        totalPages = Math.ceil(totalCount / limit);
        
        // Slice the array for the current page
        const startIndex = (page - 1) * limit;
        articles = data.slice(startIndex, startIndex + limit);
        
    } else if (data.posts && Array.isArray(data.posts)) {
        articles = data.posts;
        totalPages = data.pagination?.totalPages || Math.ceil((data.pagination?.total || articles.length) / limit);
    }
    
    return { articles, totalPages };
  } catch (error) {
    console.error("Error fetching tag posts:", error);
    return { articles: [], totalPages: 0 };
  }
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const decodedSlug = (() => {
    const s = String(slug || '').replace(/\+/g, ' ');
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  })();
  const [config, tag] = await Promise.all([
    getLayoutConfig(),
    decodedSlug ? getTag(decodedSlug) : null,
  ]);

  const siteTitle = config?.branding?.siteTitle || 'PressTag';
  const preferredPrefix = String(config?.seo?.tagPrefix || 'tag').trim() === 'tags' ? 'tags' : 'tag';
  const tagName = tag?.name || (decodedSlug ? decodedSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Tag');

  const title = tag?.metaTitle
    || fillTemplate(config?.seo?.tagMetaTitleTemplate || 'Tag: {tag} | {site}', { tag: tagName, site: siteTitle });

  const description = tag?.metaDescription
    || fillTemplate(config?.seo?.tagMetaDescriptionTemplate || 'Read posts tagged {tag} on {site}', { tag: tagName, site: siteTitle });

  const ogImage = resolveSiteAssetUrl(tag?.image || config?.seo?.defaultOgImage || config?.branding?.fallbackImage || config?.branding?.logo || '/favicon.ico');

  return {
    title,
    description,
    alternates: slug ? { canonical: `/${preferredPrefix}/${slug}` } : undefined,
    openGraph: {
      title,
      description,
      siteName: siteTitle,
      images: buildOpenGraphImage(ogImage),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    }
  };
}

export default async function TagPage({ params, searchParams }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  const decodedSlug = (() => {
    const s = String(slug || '').replace(/\+/g, ' ');
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  })();
  
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams?.page) || 1;
  
  if (!decodedSlug) {
    return <div className="container mx-auto px-4 py-8">Invalid tag</div>;
  }

  const config = await getLayoutConfig();
  const preferredPrefix = String(config?.seo?.tagPrefix || 'tag').trim() === 'tags' ? 'tags' : 'tag';
  if (preferredPrefix !== 'tag') {
    const qs = page && page > 1 ? `?page=${page}` : '';
    permanentRedirect(`/${preferredPrefix}/${encodeURIComponent(decodedSlug)}${qs}`);
  }

  const { articles: posts, totalPages } = await getTagPosts(decodedSlug, page);
  const templateId = resolveTemplateId(config?.branding?.templateId);
  const primaryColor = config?.branding?.primaryColor || '#006356';
  const urlStructure = config?.seo?.postUrlStructure || '/{category}/{slug}';
  
  // Format title from slug
  const title = decodedSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <TemplateListing
      templateId={templateId}
      heading={
        <>
          Tag:{' '}
          <span style={{ color: primaryColor }}>{title}</span>
        </>
      }
      meta={posts.length ? `${posts.length} articles • Page ${page}` : `Page ${page}`}
      posts={posts}
      page={page}
      totalPages={totalPages}
      baseUrl={`/${preferredPrefix}/${encodeURIComponent(decodedSlug)}`}
      primaryColor={primaryColor}
      urlStructure={urlStructure}
      sidebar={true}
    />
  );
}
