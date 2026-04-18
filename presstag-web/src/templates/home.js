import FeaturedHero from '../components/FeaturedHero';
import HorizontalCard from '../components/HorizontalCard';
import ArticleGridCard from '../components/ArticleGridCard';
import ResponsivePostGrid from '../components/ResponsivePostGrid';
import Sidebar from '../components/Sidebar';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '../util/timeFormat';
import { buildPostUrl } from '../lib/urlBuilder';
import { getImageUrl, resolvePostImage } from '../lib/imageHelper';
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
  fallbackImage,
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
  const fourCol = pick(fourColSection?.posts, 8);

  const splitSection = section(3);
  const splitLeft = pick(splitSection?.posts, 4);
  const splitRight = pick(splitSection?.posts, 1);

  const nextFourASection = section(4);
  const nextFourA = pick(nextFourASection?.posts, 8);

  const extraSections = [];
  const totalSections = Array.isArray(sectionsData) ? sectionsData.length : 0;
  for (let idx = 5; idx < totalSections; idx += 1) {
    const sec = section(idx);
    const posts = pick(sec?.posts, 8);
    if (posts.length > 0) extraSections.push({ section: sec, posts });
  }

  const resolveImageSrc = (post) => {
    const direct = getImageUrl(post?.image);
    if (direct) return direct;
    return resolvePostImage(post, fallbackImage ? String(fallbackImage).trim() : null);
  };

  const getPrimaryCategoryLabel = (post) => {
    const cat = (post?.primary_category?.[0] || post?.categories?.[0]) || null;
    const raw = typeof cat === 'string' ? cat : (cat?.name || cat?.title || cat?.slug || '');
    const cleaned = String(raw || '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
    const label = cleaned ? cleaned.replace(/\b\w/g, (ch) => ch.toUpperCase()) : '';
    return /^[0-9a-f]{24}$/i.test(label) ? '' : label;
  };

  const getAuthorLabel = (post) => {
    const list = Array.isArray(post?.authors) ? post.authors.map((a) => a?.name).filter(Boolean) : [];
    return list.length ? list.join(', ') : (post?.author?.name || 'SportzPoint');
  };

  const getAuthorAvatar = (post) => {
    const primary = (Array.isArray(post?.authors) && post.authors.length > 0) ? post.authors[0] : post?.author;
    const raw = primary?.image || primary?.avatar || '';
    return getImageUrl(raw) || null;
  };

  const getInitials = (name) => {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
    return (first + last).toUpperCase() || 'SP';
  };

  const getPrimaryAuthor = (post) => {
    if (!post) return null;
    if (Array.isArray(post?.authors) && post.authors.length > 0) return post.authors[0];
    return post?.author || null;
  };

  const getAuthorSlug = (post) => {
    const a = getPrimaryAuthor(post);
    const slug = String(a?.slug || '').trim();
    return slug || '';
  };

  const getAuthorKey = (post) => {
    const a = getPrimaryAuthor(post);
    const slug = String(a?.slug || '').trim();
    if (slug) return `slug:${slug.toLowerCase()}`;
    const id = String(a?._id || a?.id || '').trim();
    if (id) return `id:${id}`;
    const name = String(a?.name || '').trim().toLowerCase();
    if (name) return `name:${name}`;
    return '';
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
              {post.isLive ? (
                <span className="inline-flex items-center gap-2 mr-3 align-middle">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                  </span>
                  <span className="text-red-600 text-xs font-extrabold uppercase tracking-widest">Live</span>
                </span>
              ) : null}
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
            ) : (
              <div className="absolute inset-0 bg-gray-200" />
            )}
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
          <div className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
            {post.isLive ? <span className="text-red-600 font-extrabold uppercase mr-2">Live</span> : null}
            {post.title}
          </div>
          <div className="text-[10px] text-gray-500">{formatDate(displayDate)}</div>
        </div>
      </Link>
    );
  };

  const authorOfWeekKey = getAuthorKey(hero);
  const authorOfWeekName = getAuthorLabel(hero);
  const authorOfWeekSlug = getAuthorSlug(hero);
  const authorOfWeekAvatar = getAuthorAvatar(hero);
  const authorOfWeekPosts = authorOfWeekKey
    ? pool
        .filter((p) => getAuthorKey(p) === authorOfWeekKey)
        .filter((p) => normalizeKey(p) && normalizeKey(p) !== normalizeKey(hero))
        .slice(0, 4)
    : [];
  const authorSectionPosts = authorOfWeekPosts.length ? authorOfWeekPosts : headlines.slice(0, 4);

  const AuthorStoryCard = ({ post }) => {
    if (!post) return null;
    const postUrl = buildPostUrl(post, urlStructure);
    const img = resolveImageSrc(post);
    const displayDate = post?.publishedAt || post?.publishDate || post?.createdAt || post?.updatedAt;
    return (
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
        <Link href={postUrl} className="block relative pb-[56.25%] bg-gray-100">
          {img ? (
            <Image
              src={img}
              alt={post?.featuredImage?.altText || post?.title || ''}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : null}
        </Link>
        <div className="p-5">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {authorOfWeekSlug ? (
              <Link href={`/author/${authorOfWeekSlug}`} className="hover:underline">
                {authorOfWeekName}
              </Link>
            ) : (
              <span>{authorOfWeekName}</span>
            )}
            <span className="text-gray-300">•</span>
            <span>{formatDate(displayDate)}</span>
          </div>
          <Link href={postUrl} className="block mt-2 text-base font-bold text-gray-900 leading-snug line-clamp-2 hover:opacity-90 transition-opacity">
            {post.title}
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white min-h-screen pb-16">
      <div className="container mx-auto px-4 pt-6">
        {hero ? (
          <section className="mb-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-8 min-h-[520px] h-full">
                <BoldHero post={hero} />
              </div>
              <div className="lg:col-span-4">
                <div className="min-h-[520px] h-full flex flex-col bg-[#fcfcfc] border border-gray-100 rounded-xl p-8">
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
                  {post.isLive ? (
                    <div className="mt-3 inline-flex items-center gap-2 text-white">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      <span className="text-xs font-extrabold uppercase tracking-widest">Live</span>
                    </div>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </section>

        <section className="mb-24">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">{fourColSection?.name || 'Latest Articles'}</h2>
            {fourColSection?.viewAllUrl ? (
              <a href={fourColSection.viewAllUrl} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest hover:gap-3 transition-all" style={{ color: 'var(--primary-color)' }}>
                Show More <span aria-hidden="true">&rarr;</span>
              </a>
            ) : null}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {fourCol.slice(0, 8).map((post, i) => (
              <ArticleGridCard key={normalizeKey(post) || i} post={post} urlStructure={urlStructure} variant={variant} />
            ))}
          </div>
        </section>

        {splitSection ? (
          <section className="mb-24 py-16 border-y border-gray-100">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">{splitSection?.name || 'News in Video'}</h2>
              {splitSection?.viewAllUrl ? (
                <a href={splitSection.viewAllUrl} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest hover:gap-3 transition-all" style={{ color: 'var(--primary-color)' }}>
                  Show More <span aria-hidden="true">&rarr;</span>
                </a>
              ) : null}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
              <div className="lg:col-span-5 flex flex-col h-full bg-[#fafafa] p-8 rounded-xl border border-gray-100">
                <div className="divide-y divide-gray-200 flex-1 flex flex-col justify-between">
                  {splitLeft.map((post, i) => {
                    const postUrl = buildPostUrl(post, urlStructure);
                    const img = resolveImageSrc(post);
                    return (
                      <Link key={normalizeKey(post) || i} href={postUrl} className="py-5 first:pt-0 last:pb-0 group flex items-center gap-4">
                        <div className="relative h-16 w-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {img ? <Image src={img} alt={post?.featuredImage?.altText || post?.title || ''} fill sizes="96px" className="object-cover group-hover:scale-105 transition-transform duration-700" /> : null}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{getPrimaryCategoryLabel(post) || 'Video'}</div>
                          <div className="mt-1 text-sm font-bold text-gray-900 leading-snug line-clamp-2">{post.title}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                {splitSection?.viewAllUrl ? (
                  <div className="mt-6">
                    <a href={splitSection.viewAllUrl} className="w-full inline-flex justify-center bg-white border border-gray-200 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white hover:border-black transition-all">
                      Read more
                    </a>
                  </div>
                ) : null}
              </div>
              <div className="lg:col-span-7 flex flex-col">
                {splitRight[0] ? (() => {
                  const post = splitRight[0];
                  const postUrl = buildPostUrl(post, urlStructure);
                  const img = resolveImageSrc(post);
                  return (
                    <>
                      <Link href={postUrl} className="relative flex-1 rounded-xl overflow-hidden group cursor-pointer mb-8 shadow-2xl bg-gray-100">
                        {img ? <Image src={img} alt={post?.featuredImage?.altText || post?.title || ''} fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover group-hover:scale-105 transition-transform duration-1000" /> : null}
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors">
                          <div className="w-20 h-20 bg-white/10 backdrop-blur text-white rounded-full flex items-center justify-center border border-white/30">
                            <div className="w-0 h-0 border-y-[12px] border-y-transparent border-l-[18px] border-l-white ml-1" />
                          </div>
                        </div>
                      </Link>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--primary-color)' }}>
                          {getPrimaryCategoryLabel(post) || 'Featured Video'}
                        </div>
                        <Link href={postUrl} className="block mt-2 text-3xl font-bold mb-4 hover:opacity-90 transition-opacity leading-tight">
                          {post.title}
                        </Link>
                        <p className="text-gray-500 text-lg leading-relaxed max-w-2xl">
                          Watch the latest highlight and analysis in this featured clip.
                        </p>
                      </div>
                    </>
                  );
                })() : null}
              </div>
            </div>
          </section>
        ) : null}

        <section className="mb-24">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold">Author of the week</h2>
            <p className="text-gray-500 mt-2">Read the articles from our author of the week</p>
          </div>
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-10">
              <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                {authorOfWeekAvatar ? <Image src={authorOfWeekAvatar} alt={authorOfWeekName} fill sizes="56px" className="object-cover" /> : null}
              </div>
              <div className="text-left">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Author of the week</div>
                {authorOfWeekSlug ? (
                  <Link href={`/author/${authorOfWeekSlug}`} className="text-lg font-bold hover:underline" style={{ color: 'var(--primary-color)' }}>
                    {authorOfWeekName}
                  </Link>
                ) : (
                  <div className="text-lg font-bold text-gray-900">{authorOfWeekName}</div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {authorSectionPosts.slice(0, 4).map((post, i) => (
                <AuthorStoryCard key={normalizeKey(post) || i} post={post} />
              ))}
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">{nextFourASection?.name || 'Basketball News'}</h2>
            {nextFourASection?.viewAllUrl ? (
              <a href={nextFourASection.viewAllUrl} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest hover:gap-3 transition-all" style={{ color: 'var(--primary-color)' }}>
                Show More <span aria-hidden="true">&rarr;</span>
              </a>
            ) : null}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {nextFourA.slice(0, 8).map((post, i) => (
              <ArticleGridCard key={normalizeKey(post) || i} post={post} urlStructure={urlStructure} variant={variant} />
            ))}
          </div>
        </section>

        {extraSections.map((block, idx) => (
          <section key={block.section?.name || idx} className="py-24 border-t border-gray-100">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">{block.section?.name || 'More'}</h2>
              {block.section?.viewAllUrl ? (
                <a href={block.section.viewAllUrl} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest hover:gap-3 transition-all" style={{ color: 'var(--primary-color)' }}>
                  Show More <span aria-hidden="true">&rarr;</span>
                </a>
              ) : null}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {block.posts.slice(0, 8).map((post, i) => (
                <ArticleGridCard key={normalizeKey(post) || i} post={post} urlStructure={urlStructure} variant={variant} />
              ))}
            </div>
          </section>
        ))}
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
