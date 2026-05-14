/// web> src> app> page.js | Main homepage component for the Presstag web app. This component fetches the layout configuration and posts from the backend API to dynamically render the homepage sections based on the admin-defined settings. It includes a hero section with featured posts, followed by multiple sections that can be customized to display posts from specific categories, tags, authors, or content types. The component also handles fallback images for posts that do not have a specific image set, ensuring a consistent visual experience. The sidebar is included for additional widgets and content as defined in the layout configuration. //
import React from "react";
import { getFallbackImage, resolvePostImage } from '../lib/imageHelper';
import { fetchWithTenant, fetchLayoutConfig } from '../lib/fetchWithTenant';
import { resolveTemplateId } from '../lib/templates';
import { renderHomeByTemplate } from '../templates/home';
import { headers } from 'next/headers';

export const revalidate = 60;

const isObjectId = (v) => /^[a-f0-9]{24}$/i.test(String(v || '').trim());

const normalizeTagQuery = (v) => {
  let raw = String(v || '').trim().replace(/^#/, '').trim();
  if (!raw) return '';
  try {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      raw = new URL(raw).pathname || raw;
    }
  } catch {}
  raw = raw.split('?')[0].split('#')[0];
  const parts = raw.split('/').filter(Boolean);
  const last = parts.length > 0 ? parts[parts.length - 1] : raw;
  const withSpaces = String(last || '').replace(/\+/g, ' ');
  try {
    raw = decodeURIComponent(withSpaces);
  } catch {
    raw = withSpaces;
  }
  raw = raw.trim();
  if (!raw) return '';
  if (isObjectId(raw)) return raw;
  return raw;
};

async function getLayoutConfig() {
  try {
    const res = await fetchLayoutConfig({ next: { revalidate: 60 } });
    if (res.ok) return res.json();
  } catch (e) { console.error(e); }
  return null;
}

async function getPosts(params = {}) {
  const { type = 'latest', value, limit = 10, excludeKeys = [], sort } = params;
  let path = `/posts?status=published&excludeType=custompage&limit=${limit}&lite=1`;
  const normalizedValue = value != null ? String(value).trim() : '';
  const cleanedValue = normalizedValue.replace(/^#/, '').trim();
  const normalizedSlug = cleanedValue.toLowerCase();
  if (type === 'category' && cleanedValue) path += '&category=' + encodeURIComponent(normalizedSlug);
  else if (type === 'tag' && cleanedValue) path += '&tag=' + encodeURIComponent(normalizeTagQuery(cleanedValue));
  else if (type === 'author' && cleanedValue) path += '&author=' + encodeURIComponent(cleanedValue);
  else if ((type === 'content_type' || type === 'type') && cleanedValue) path += '&type=' + encodeURIComponent(normalizedSlug.replace(/\s+/g, '-'));
  if (sort) path += '&sort=' + encodeURIComponent(String(sort));
  try {
    const res = await fetchWithTenant(path, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    const posts = Array.isArray(data) ? data : (data.posts || []);
    if (!excludeKeys || excludeKeys.length === 0) return posts;
    const exclude = new Set(excludeKeys.map((k) => String(k || '')).filter(Boolean));
    return posts.filter((p) => !exclude.has(String(p?.slug || p?._id || '')));
  } catch (e) { return []; }
}

export default async function Page() {
  const config = await getLayoutConfig();
  const fallbackImage = await getFallbackImage();

  const primaryColor = config?.branding?.primaryColor || '#006356';
  const urlStructure = config?.seo?.postUrlStructure || '/{category}/{slug}';
  const tagPrefix = String(config?.seo?.tagPrefix || 'tag').trim() === 'tags' ? 'tags' : 'tag';
  const h = await headers();
  const templateOverride = h.get('x-template-id');
  const templateId = resolveTemplateId(templateOverride || config?.branding?.templateId);

  // HERO POSTS
  const heroPosts = await getPosts({ limit: 5 });
  const featuredPost = heroPosts[0]
    ? { ...heroPosts[0], image: resolvePostImage(heroPosts[0], fallbackImage) }
    : null;
  const sidePosts = heroPosts
    .slice(1, 5)
    .map((p) => ({ ...p, image: resolvePostImage(p, fallbackImage) }));

  const excludePostKeys = Array.from(
    new Set(
      [...heroPosts]
        .map((p) => String(p?.slug || p?._id || ''))
        .filter(Boolean)
    )
  );

  // DYNAMIC SECTIONS
  let sectionsData = [];

  if (config?.homepage?.sections) {
    const sectionsPromise = config.homepage.sections
      .filter(section => section.enabled)
      .sort((a, b) => a.order - b.order)
      .map(async (section) => {
        let posts = [];
        const limit = section.limit || 12;
        let viewAllUrl = null;

        if (section.type === 'system') {
          if (section.id === 'latest') {
            posts = await getPosts({ limit: limit + 5, excludeKeys: excludePostKeys });
            posts = posts.slice(0, limit);
            viewAllUrl = '/posts';
          } else if (section.id === 'trending') {
            posts = await getPosts({ limit: limit + 5, excludeKeys: excludePostKeys, sort: 'trending' });
            posts = posts.slice(0, limit);
            viewAllUrl = '/posts?sort=trending';
          }
        } else if (section.type === 'custom') {
          posts = await getPosts({
            type: section.sourceType,
            value: section.sourceValue,
            limit: limit + 5,
            excludeKeys: excludePostKeys,
          });
          if (posts.length === 0) {
            posts = await getPosts({
              type: section.sourceType,
              value: section.sourceValue,
              limit: limit + 5,
              excludeKeys: [],
            });
          }
          posts = posts.slice(0, limit);

          const rawValue = section.sourceValue != null ? String(section.sourceValue).trim() : '';
          const cleanedValue = rawValue.replace(/^#/, '').trim();
          const normalized = cleanedValue.toLowerCase();
          if (section.sourceType === 'category') viewAllUrl = `/category/${encodeURIComponent(normalized)}`;
          else if (section.sourceType === 'tag') {
            const tagSlug = normalizeTagQuery(cleanedValue);
            viewAllUrl = `/${tagPrefix}/${encodeURIComponent(tagSlug)}`;
          }
          else if (section.sourceType === 'author') viewAllUrl = `/author/${encodeURIComponent(cleanedValue)}`;
        }

        return {
          ...section,
          posts,
          viewAllUrl
        };
      });

    sectionsData = await Promise.all(sectionsPromise);
  } else {
    const latestNews = await getPosts({ limit: 12 });
    sectionsData = [
      { name: 'Latest News', posts: latestNews, viewAllUrl: '/posts' }
    ];
  }

  const hydratedSections = sectionsData.map((section) => ({
    ...section,
    posts: (section.posts || []).map((post) => ({
      ...post,
      image: resolvePostImage(post, fallbackImage),
    })),
  }));

  return renderHomeByTemplate(templateId, {
    featuredPost,
    sidePosts,
    sectionsData: hydratedSections,
    excludePostKeys,
    fallbackImage,
    primaryColor,
    urlStructure,
  });
}
