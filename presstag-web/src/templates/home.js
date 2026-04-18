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
import { calculateReadTime } from '../util/readTime';

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

  const getAuthorAvatar = (post) => {
    const primary = (Array.isArray(post?.authors) && post.authors.length > 0) ? post.authors[0] : post?.author;
    const raw = primary?.image || primary?.avatar || '';
    const src = raw ? getImageUrl(raw) : '';
    if (!src) return null;
    if (src.startsWith('http')) return src;
    if (src.startsWith('/uploads')) return `${process.env.NEXT_PUBLIC_API_URL}${src}`;
    return `${process.env.NEXT_PUBLIC_API_URL}/uploads/${src}`;
  };

  const getInitials = (name) => {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
    return (first + last).toUpperCase() || 'SP';
  };

  const BoldHero = ({ post }) => {
    if (!post) return null;
    const postUrl = buildPostUrl(post, urlStructure);
    const img = resolveImageSrc(post);
    const category = getPrimaryCategoryLabel(post);
    const displayDate = post?.publishedAt || post?.publishDate || post?.createdAt || post?.updatedAt;
    const author = getAuthorLabel(post);
    const avatar = getAuthorAvatar(post);
    const readTime = post?.content ? calculateReadTime(post.content) : '';
    return (
      <Link href={postUrl} className="block h-full group cursor-pointer">
        <div className="h-full flex flex-col">
          <div className="mb-6 flex-1 order-2 lg:order-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200 relative">
                {avatar ? (
                  <Image src={avatar} alt={author} fill sizes="40px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-gray-600">
                    {getInitials(author)}
                  </div>
                )}
              </div>
              <div className="text-[11px] font-bold">
                <span className="text-gray-900 uppercase">{author}</span>
                <span className="text-gray-300 mx-2">/</span>
                <span className="text-gray-400 uppercase">{formatDate(displayDate)}</span>
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.9] group-hover:opacity-90 transition-opacity mb-4">
              {post.title}
            </h1>
            <div className="flex items-center gap-2">
              {category ? (
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--primary-color)' }}>
                  {category}
                </span>
              ) : null}
              {category && readTime ? <span className="text-gray-300">•</span> : null}
              {readTime ? (
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">
                  {readTime}
                </span>
              ) : null}
            </div>
          </div>
          <div className="relative aspect-video rounded-xl overflow-hidden mb-0 order-1 lg:order-2 shadow-2xl bg-gray-100 border border-gray-100">
            {img ? (
              <>
                <Image
                  src={img}
                  alt={post?.featuredImage?.altText || post?.title || ''}
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  priority
                />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
              </>
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
                <div className="h-[520px] flex flex-col bg-[#fcfcfc] border border-gray-100 rounded-xl p-8">
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                          {headlinesSection?.name || 'Headlines'}
                        </h2>
                      </div>
                      {headlines.map((post, i) => (
                        <div key={normalizeKey(post) || i} className="border-b border-gray-100 last:border-0 pb-4 mb-4 last:pb-0 last:mb-0">
                          <HeadlineItem post={post} />
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 pt-8 border-t border-gray-200 lg:block hidden">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Must Read</h4>
                        <span className="text-xs font-bold" style={{ color: 'var(--primary-color)' }}>&rarr;</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed font-medium">
                        Our team provides in-depth analysis and key updates as the biggest stories develop.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          {twoCol.map((post, i) => {
            const postUrl = buildPostUrl(post, urlStructure);
            const img = resolveImageSrc(post);
            const displayDate = post?.publishedAt || post?.publishDate || post?.createdAt || post?.updatedAt;
            const category = getPrimaryCategoryLabel(post);
            return (
              <Link key={normalizeKey(post) || i} href={postUrl} className="relative aspect-[16/9] rounded-2xl overflow-hidden group cursor-pointer">
                {img ? (
                  <Image
                    src={img}
                    alt={post?.featuredImage?.altText || post?.title || ''}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-8 flex flex-col justify-end">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/90">
                    {category ? `${category} • ` : ''}{formatDate(displayDate)}
                  </div>
                  <h2 className="text-2xl md:text-3xl text-white font-bold leading-tight max-w-sm mt-2 line-clamp-2">
                    {post.title}
                  </h2>
                </div>
              </Link>
            );
          })}
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
