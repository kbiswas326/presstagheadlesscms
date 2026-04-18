import FeaturedHero from '../components/FeaturedHero';
import HorizontalCard from '../components/HorizontalCard';
import ArticleGridCard from '../components/ArticleGridCard';
import ResponsivePostGrid from '../components/ResponsivePostGrid';
import Sidebar from '../components/Sidebar';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '../util/timeFormat';
import { buildPostUrl } from '../lib/urlBuilder';
import { getImageUrl } from '../lib/imageHelper';

const SectionHeading = ({ label, primaryColor, viewAllUrl }) => {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-lg font-bold text-gray-900 border-l-4 pl-3" style={{ borderColor: primaryColor }}>
        {label}
      </h2>
      {viewAllUrl ? (
        <a href={viewAllUrl} className="text-sm font-medium hover:underline" style={{ color: primaryColor }}>
          View all
        </a>
      ) : null}
    </div>
  );
};

export const renderHomeClassic = ({
  featuredPost,
  sidePosts,
  sectionsData,
  excludePostKeys,
  fallbackImage,
  primaryColor,
  urlStructure,
}) => {
  const variant = 'classic';
  return (
    <div className="bg-white min-h-screen pb-16">
      <div className="container mx-auto px-4 pt-6">
        {featuredPost ? (
          <section className="mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              <div className="lg:col-span-2">
                <FeaturedHero post={featuredPost} urlStructure={urlStructure} />
              </div>
              <div className="lg:col-span-1 flex flex-col h-full">
                <SectionHeading label="Top Stories" primaryColor={primaryColor} />
                <div className="flex flex-col gap-4 flex-grow">
                  {sidePosts.map((post, i) => (
                    <HorizontalCard key={i} post={post} urlStructure={urlStructure} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            {sectionsData.map((section, index) => (
              <ResponsivePostGrid
                key={index}
                posts={section.posts}
                sectionName={section.name}
                primaryColor={primaryColor}
                viewAllUrl={section.viewAllUrl}
                urlStructure={urlStructure}
                variant={variant}
              />
            ))}
          </div>
          <div className="lg:col-span-4 lg:sticky lg:top-0">
            <Sidebar variant="homepage" excludePostKeys={excludePostKeys} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const renderHomeBold = ({
  featuredPost,
  sidePosts,
  sectionsData,
  excludePostKeys,
  primaryColor,
  urlStructure,
}) => {
  const variant = 'bold';

  const normalizeKey = (p) => String(p?.slug || p?._id || '').trim();
  const allSectionPosts = Array.isArray(sectionsData)
    ? sectionsData.flatMap((s) => Array.isArray(s?.posts) ? s.posts : [])
    : [];

  const pool = [featuredPost, ...(Array.isArray(sidePosts) ? sidePosts : []), ...allSectionPosts]
    .filter(Boolean)
    .reduce((acc, p) => {
      const k = normalizeKey(p);
      if (!k || acc.seen.has(k)) return acc;
      acc.seen.add(k);
      acc.items.push(p);
      return acc;
    }, { seen: new Set(), items: [] }).items;

  const used = new Set();
  const pick = (preferredList, count) => {
    const out = [];
    const preferred = Array.isArray(preferredList) ? preferredList : [];
    for (const p of preferred) {
      if (out.length >= count) break;
      const k = normalizeKey(p);
      if (!k || used.has(k)) continue;
      used.add(k);
      out.push(p);
    }
    if (out.length < count) {
      for (const p of pool) {
        if (out.length >= count) break;
        const k = normalizeKey(p);
        if (!k || used.has(k)) continue;
        used.add(k);
        out.push(p);
      }
    }
    return out;
  };

  const section = (idx) => (Array.isArray(sectionsData) ? sectionsData[idx] : null);

  const hero = featuredPost || pool[0] || null;
  if (hero) used.add(normalizeKey(hero));

  const headlinesSection = section(0);
  const headlines = pick(headlinesSection?.posts, 6);

  const twoColSection = section(1);
  const twoCol = pick(twoColSection?.posts, 2);

  const fourColSection = section(2);
  const fourCol = pick(fourColSection?.posts, 4);

  const splitSection = section(3);
  const splitLeft = pick(splitSection?.posts, 3);
  const splitRight = pick(splitSection?.posts, 1);

  const nextFourASection = section(4);
  const nextFourA = pick(nextFourASection?.posts, 4);

  const nextFourBSection = section(5);
  const nextFourB = pick(nextFourBSection?.posts, 4);

  const resolveImageSrc = (post) => {
    const imageUrl = post?.image || getImageUrl(post?.featuredImage?.url || post?.featuredImage || post?.banner_image || post?.coverImage?.url || post?.coverImage);
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('/uploads')) return `${process.env.NEXT_PUBLIC_API_URL}${imageUrl}`;
    return `${process.env.NEXT_PUBLIC_API_URL}/uploads/${imageUrl}`;
  };

  const getPrimaryCategoryLabel = (post) => {
    const cat = (post?.primary_category?.[0] || post?.categories?.[0]) || null;
    const raw = typeof cat === 'string' ? cat : (cat?.name || cat?.title || cat?.slug || '');
    const cleaned = String(raw || '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
    return cleaned ? cleaned.replace(/\b\w/g, (ch) => ch.toUpperCase()) : '';
  };

  const getAuthorLabel = (post) => {
    const list = Array.isArray(post?.authors) ? post.authors.map((a) => a?.name).filter(Boolean) : [];
    return list.length ? list.join(', ') : (post?.author?.name || 'SportzPoint');
  };

  const BoldHero = ({ post }) => {
    if (!post) return null;
    const postUrl = buildPostUrl(post, urlStructure);
    const img = resolveImageSrc(post);
    const category = getPrimaryCategoryLabel(post);
    const displayDate = post?.publishedAt || post?.publishDate || post?.createdAt || post?.updatedAt;
    const author = getAuthorLabel(post);
    return (
      <Link href={postUrl} className="block h-full rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="h-full flex flex-col">
          <div className="px-6 pt-5 pb-4">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="font-medium text-gray-700">{author}</span>
              <span>{formatDate(displayDate)}</span>
            </div>
            <h1 className="mt-3 text-2xl md:text-3xl font-bold text-gray-900 leading-tight line-clamp-3">
              {post.title}
            </h1>
            {category ? (
              <div className="mt-3">
                <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
                  {category}
                </span>
              </div>
            ) : null}
          </div>
          <div className="relative flex-1 bg-gray-100">
            {img ? (
              <Image
                src={img}
                alt={post?.featuredImage?.altText || post?.title || ''}
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover"
                priority
              />
            ) : null}
          </div>
        </div>
      </Link>
    );
  };

  const HeadlineItem = ({ post }) => {
    if (!post) return null;
    const postUrl = buildPostUrl(post, urlStructure);
    const img = resolveImageSrc(post);
    const displayDate = post?.publishedAt || post?.publishDate || post?.createdAt || post?.updatedAt;
    return (
      <Link href={postUrl} className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 hover:bg-gray-50 transition-colors">
        <div className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
          {img ? <Image src={img} alt={post?.featuredImage?.altText || post?.title || ''} fill sizes="80px" className="object-cover" /> : null}
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{post.title}</div>
          <div className="text-[10px] text-gray-500">{formatDate(displayDate)}</div>
        </div>
      </Link>
    );
  };

  return (
    <div className="bg-white min-h-screen pb-16">
      <div className="container mx-auto px-4 pt-6">
        {hero ? (
          <section className="mb-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-8">
                <div className="h-[520px]">
                  <BoldHero post={hero} />
                </div>
              </div>
              <div className="lg:col-span-4">
                <div className="h-[520px] flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 border-l-4 pl-3" style={{ borderColor: primaryColor }}>
                      {headlinesSection?.name || 'Headlines'}
                    </h2>
                  </div>
                  <div className="flex flex-col gap-3 overflow-auto pr-1">
                    {headlines.map((post, i) => (
                      <HeadlineItem key={normalizeKey(post) || i} post={post} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 border-l-4 pl-3" style={{ borderColor: primaryColor }}>
              {twoColSection?.name || 'Featured'}
            </h2>
            {twoColSection?.viewAllUrl ? (
              <a href={twoColSection.viewAllUrl} className="text-sm font-medium hover:underline" style={{ color: primaryColor }}>
                View all
              </a>
            ) : null}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {twoCol.map((post, i) => (
              <ArticleGridCard key={normalizeKey(post) || i} post={post} urlStructure={urlStructure} variant={variant} />
            ))}
          </div>
        </section>

        <section className="mb-12 rounded-2xl overflow-hidden" style={{ backgroundColor: primaryColor }}>
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white tracking-wide">
                {fourColSection?.name || 'Top Stories'}
              </h2>
              {fourColSection?.viewAllUrl ? (
                <a href={fourColSection.viewAllUrl} className="text-sm font-medium underline text-white">
                  View all
                </a>
              ) : null}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {fourCol.map((post, i) => (
                <ArticleGridCard key={normalizeKey(post) || i} post={post} urlStructure={urlStructure} variant={variant} />
              ))}
            </div>
          </div>
        </section>

        <section className="mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900 border-l-4 pl-3" style={{ borderColor: primaryColor }}>
                  {splitSection?.name || 'Latest'}
                </h2>
                {splitSection?.viewAllUrl ? (
                  <a href={splitSection.viewAllUrl} className="text-sm font-medium hover:underline" style={{ color: primaryColor }}>
                    View all
                  </a>
                ) : null}
              </div>
              <div className="flex flex-col gap-4">
                {splitLeft.map((post, i) => (
                  <HorizontalCard key={normalizeKey(post) || i} post={post} urlStructure={urlStructure} variant={variant} />
                ))}
              </div>
            </div>
            <div className="lg:col-span-4">
              <div className="flex flex-col gap-4">
                {splitRight.map((post, i) => (
                  <ArticleGridCard key={normalizeKey(post) || i} post={post} urlStructure={urlStructure} variant={variant} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            {[{ s: nextFourASection, posts: nextFourA }, { s: nextFourBSection, posts: nextFourB }]
              .filter((x) => x.posts && x.posts.length > 0)
              .map((block, idx) => (
                <section key={idx} className="mb-12">
                  <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
                    <h2 className="text-xl font-bold text-gray-900">{block.s?.name || 'More'}</h2>
                    {block.s?.viewAllUrl ? (
                      <a href={block.s.viewAllUrl} className="text-sm font-medium hover:underline" style={{ color: primaryColor }}>
                        View all
                      </a>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {block.posts.map((post, i) => (
                      <ArticleGridCard key={normalizeKey(post) || i} post={post} urlStructure={urlStructure} variant={variant} />
                    ))}
                  </div>
                </section>
              ))}
          </div>
          <div className="lg:col-span-4 lg:sticky lg:top-0">
            <Sidebar variant="homepage" excludePostKeys={excludePostKeys} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const renderHomeModern = ({
  featuredPost,
  sidePosts,
  sectionsData,
  excludePostKeys,
  primaryColor,
  urlStructure,
}) => {
  const variant = 'modern';
  const topGrid = [featuredPost, ...sidePosts].filter(Boolean).slice(0, 4);
  return (
    <div className="bg-white min-h-screen pb-16">
      <div className="container mx-auto px-4 pt-8">
        <section className="mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              {topGrid[0] ? (
                <FeaturedHero post={topGrid[0]} urlStructure={urlStructure} />
              ) : null}
            </div>
            <div className="lg:col-span-4">
              <div className="grid grid-cols-1 gap-4">
                {topGrid.slice(1, 4).map((post, i) => (
                  <HorizontalCard key={i} post={post} urlStructure={urlStructure} variant={variant} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            {sectionsData.map((section, index) => (
              <section key={index} className="mb-12">
                <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
                  <h2 className="text-xl font-bold text-gray-900">{section.name}</h2>
                  {section.viewAllUrl ? (
                    <a href={section.viewAllUrl} className="text-sm font-medium hover:underline" style={{ color: primaryColor }}>
                      View all
                    </a>
                  ) : null}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {section.posts.slice(0, 9).map((post, i) => (
                    <ArticleGridCard key={i} post={post} urlStructure={urlStructure} variant={variant} />
                  ))}
                </div>
              </section>
            ))}
          </div>
          <div className="lg:col-span-4 lg:sticky lg:top-0">
            <Sidebar variant="homepage" excludePostKeys={excludePostKeys} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const renderHomeNews = ({
  featuredPost,
  sidePosts,
  sectionsData,
  excludePostKeys,
  primaryColor,
  urlStructure,
}) => {
  const variant = 'news';
  const headlinePosts = sidePosts.slice(0, 4);
  const leadSection = sectionsData[0];
  return (
    <div className="bg-white min-h-screen pb-16">
      <div className="container mx-auto px-4 pt-6">
        <section className="mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              {featuredPost ? <FeaturedHero post={featuredPost} urlStructure={urlStructure} /> : null}
            </div>
            <div className="lg:col-span-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Headlines</h2>
              </div>
              <div className="flex flex-col gap-4">
                {headlinePosts.map((post, i) => (
                  <HorizontalCard key={i} post={post} urlStructure={urlStructure} variant={variant} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            {leadSection ? (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-5 border-b border-gray-200 pb-3">
                  <h2 className="text-xl font-bold text-gray-900">{leadSection.name}</h2>
                  {leadSection.viewAllUrl ? (
                    <a href={leadSection.viewAllUrl} className="text-sm font-medium hover:underline" style={{ color: primaryColor }}>
                      View all
                    </a>
                  ) : null}
                </div>
                <div className="flex flex-col gap-5">
                  {leadSection.posts.slice(0, 10).map((post, i) => (
                    <div key={i} className="border-b border-gray-100 pb-5 last:border-b-0 last:pb-0">
                      <HorizontalCard post={post} urlStructure={urlStructure} variant={variant} />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
            {sectionsData.slice(1).map((section, index) => (
              <ResponsivePostGrid
                key={index}
                posts={section.posts}
                sectionName={section.name}
                primaryColor={primaryColor}
                viewAllUrl={section.viewAllUrl}
                urlStructure={urlStructure}
                variant={variant}
              />
            ))}
          </div>
          <div className="lg:col-span-4 lg:sticky lg:top-0">
            <Sidebar variant="homepage" excludePostKeys={excludePostKeys} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const renderHomeMagazine = ({
  featuredPost,
  sidePosts,
  sectionsData,
  excludePostKeys,
  primaryColor,
  urlStructure,
}) => {
  const variant = 'magazine';
  const topMosaic = sidePosts.slice(0, 4);
  return (
    <div className="bg-white min-h-screen pb-16">
      <div className="container mx-auto px-4 pt-6">
        <section className="mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              {featuredPost ? <FeaturedHero post={featuredPost} urlStructure={urlStructure} /> : null}
            </div>
            <div className="lg:col-span-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {topMosaic.map((post, i) => (
                  <ArticleGridCard key={i} post={post} urlStructure={urlStructure} variant={variant} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            {sectionsData.map((section, index) => {
              const lead = section.posts[0];
              const rest = section.posts.slice(1, 7);
              return (
                <section key={index} className="mb-14">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-2xl font-bold text-gray-900">{section.name}</h2>
                    {section.viewAllUrl ? (
                      <a href={section.viewAllUrl} className="text-sm font-medium hover:underline" style={{ color: primaryColor }}>
                        View all
                      </a>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-7">
                      {lead ? <FeaturedHero post={lead} urlStructure={urlStructure} /> : null}
                    </div>
                    <div className="lg:col-span-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {rest.map((post, i) => (
                          <ArticleGridCard key={i} post={post} urlStructure={urlStructure} variant={variant} />
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
          <div className="lg:col-span-4 lg:sticky lg:top-0">
            <Sidebar variant="homepage" excludePostKeys={excludePostKeys} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const renderHomeByTemplate = (templateId, props) => {
  if (templateId === 'bold') return renderHomeBold(props);
  if (templateId === 'modern') return renderHomeModern(props);
  if (templateId === 'news') return renderHomeNews(props);
  if (templateId === 'magazine') return renderHomeMagazine(props);
  return renderHomeClassic(props);
};
