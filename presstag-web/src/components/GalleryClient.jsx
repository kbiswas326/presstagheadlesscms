'use client';
import { useState, useEffect, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaTimes, FaChevronLeft, FaChevronRight, FaSearchPlus, FaTh } from 'react-icons/fa';
import { Merriweather } from 'next/font/google';
import Sidebar from './Sidebar';
import AdSpot from './AdSpot';
import { getImageUrl } from '@/lib/imageHelper';
import SocialShareButtons from './SocialShareButtons';
import { formatPublishDateTime } from '../util/timeFormat';

const merriweather = Merriweather({ 
  weight: ['300', '400', '700', '900'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
});

const GalleryClient = ({ post }) => {
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const isDark = useSyncExternalStore(
        (callback) => {
            if (typeof window === 'undefined' || !window.matchMedia) return () => {};
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', callback);
            return () => mediaQuery.removeEventListener('change', callback);
        },
        () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false),
        () => false
    );

    const images = post.images || [];

    const formattedDate = formatPublishDateTime(
      post.publishDate,
      post.publishTime,
      post.publishedAt || post.createdAt
    );

    const openLightbox = (index) => {
        setCurrentImageIndex(index);
        setIsLightboxOpen(true);
    };

    const closeLightbox = () => {
        setIsLightboxOpen(false);
    };

    const nextImage = (e) => {
        e?.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = (e) => {
        e?.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const prevOverflow = document.body.style.overflow;
        if (isLightboxOpen) document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prevOverflow;
        };
    }, [isLightboxOpen]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isLightboxOpen) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') prevImage();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLightboxOpen, images.length]);

    if (!post) return null;

    const mainImage = getImageUrl(post.featuredImage || post.banner_image || images[0]);
    const currentImage = images[currentImageIndex] || null;
    const currentHeading = currentImage?.heading || currentImage?.title || currentImage?.caption || `Image ${currentImageIndex + 1}`;

    return (
        <div className={`min-h-screen bg-gray-50 text-gray-900 ${merriweather.className}`}>
            
            <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 pt-6 pb-12">
                
                <div className="w-full pb-16 flex flex-col lg:flex-row gap-5 items-start">
                    <main className="w-full lg:w-[72%] bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-8">
                        {/* Meta Area - Matching Article Contents */}
                        <header className="w-full pt-4 pb-6">
                            {/* Breadcrumb */}
                            <nav className="flex items-center text-xs text-gray-500 mb-4 whitespace-nowrap overflow-hidden">
                                <Link href="/" className="transition-colors hover:text-[var(--primary-color)] flex-shrink-0" style={{ '--primary-color': '#e11d48' }}>
                                    Home
                                </Link>
                                {post.categories?.[0] && (
                                    <>
                                        <span className="mx-2 text-gray-300 flex-shrink-0">/</span>
                                        <Link href={`/category/${post.categories[0].slug || post.categories[0].name || post.categories[0].title || ''}`} className="transition-colors font-medium hover:text-[var(--primary-color)] flex-shrink-0">
                                            {String(post.categories[0].name || post.categories[0].title || post.categories[0].slug || '').replace(/Ãƒâ€”/g, "").replace(/Ã—/g, "").trim()}
                                        </Link>
                                    </>
                                )}
                                <span className="mx-2 text-gray-300 flex-shrink-0">/</span>
                                <span className="text-gray-400 truncate min-w-0 flex-1">{post.title}</span>
                            </nav>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {post.categories?.slice(0, 3).map((cat, index) => (
                                    <Link key={index} href={`/category/${cat.slug || cat.name || cat.title || ''}`} className="px-3 py-1 bg-gray-50 text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-gray-100 transition-colors cursor-pointer text-rose-600">
                                        {String(cat.name || cat.title || cat.slug || '').replace(/Ã—/g, "").replace(/×/g, "").trim()}
                                    </Link>
                                ))}
                            </div>
                            
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
                                {post.title}
                            </h1>
                            
                            <h2 className="text-lg md:text-xl text-gray-600 leading-relaxed mb-6 font-light">
                                {post.summary || post.sub_title}
                            </h2>

                            {(() => {
                              const authorsList = Array.isArray(post.authors) && post.authors.length > 0
                                ? post.authors
                                : (post.author ? [post.author] : []);
                              const primaryAuthor = authorsList[0] || post.author || null;
                              const safeAuthors = authorsList.filter((a) => a && typeof a === 'object' && (a._id || a.id));
                              const editorUser = post.editor && typeof post.editor === 'object' ? post.editor : null;
                              const editorDisplayName = (editorUser?.name || (typeof post.editorName === 'string' ? post.editorName : '')).trim();
                              const editorId = editorUser?._id ? String(editorUser._id) : (typeof post.editor === 'string' ? post.editor : '');
                              const showEditor = !!(editorDisplayName && primaryAuthor && String(editorId) !== String(primaryAuthor?._id || ''));
                              const authorAvatar = getImageUrl(primaryAuthor?.image || post.authorImage);
                              const bylineNodes = safeAuthors.length > 0
                                ? safeAuthors
                                    .map((a) => {
                                      if (!a) return null;
                                      const name = String(a?.name || '').trim();
                                      if (!name) return null;
                                      const slug = String(a?.slug || '').trim();
                                      if (slug) return <Link key={String(a?._id || a?.id || slug)} href={`/author/${slug}`} className="hover:text-[var(--primary-color)] transition-colors">{name}</Link>;
                                      return <span key={String(a?._id || a?.id || name)}>{name}</span>;
                                    })
                                    .filter(Boolean)
                                : [<span key="desk">{post.authorName || 'SportzPoint Editor'}</span>];
                              return (
                                <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden relative">
                                        {authorAvatar ? (
                                            <Image
                                                src={authorAvatar}
                                                alt={primaryAuthor?.name || post.authorName || 'Author'}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <svg className="w-full h-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900 text-sm">
                                            {bylineNodes.reduce((acc, node, idx) => {
                                                if (idx === 0) return [node];
                                                return acc.concat([<span key={`sep-${idx}`}>, </span>, node]);
                                            }, [])}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {formattedDate}
                                            {showEditor && (
                                                <>
                                                    {' '}• Edited by{' '}
                                                    {editorUser?.slug ? (
                                                        <Link href={`/author/${editorUser.slug}`} className="transition-colors hover:text-[var(--primary-color)]">
                                                            {editorDisplayName}
                                                        </Link>
                                                    ) : (
                                                        <span>{editorDisplayName}</span>
                                                    )}
                                                </>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <SocialShareButtons title={post.title} />
                                </div>
                              );
                            })()}
                        </header>

                        {/* Featured Image - 16:9 988x556 with Caption Card Style */}
                        {mainImage && (
                            <figure className="w-full mb-8 rounded-xl overflow-hidden shadow-md bg-white border border-gray-100">
                                <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                                    <img
                                        src={mainImage}
                                        alt={post.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {(post.featuredImageCaption || post.caption || (post.images && post.images[0]?.caption)) && (
                                    <figcaption className="p-3 text-center text-sm text-gray-800 border-t border-gray-100 bg-white">
                                        {post.featuredImageCaption || post.caption || (post.images && post.images[0]?.caption)}
                                    </figcaption>
                                )}
                            </figure>
                        )}

                        <div className="py-8">
                            <div className="flex items-center justify-between mb-6 gap-4">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <FaTh className="text-green-500" />
                                    Gallery Photos <span className="text-gray-500 text-lg font-normal">({images.length})</span>
                                </h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={prevImage}
                                        disabled={images.length <= 1}
                                        className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-label="Previous image"
                                    >
                                        <FaChevronLeft />
                                    </button>
                                    <div className="text-sm text-gray-500 tabular-nums">
                                        {images.length ? `${currentImageIndex + 1} / ${images.length}` : '0 / 0'}
                                    </div>
                                    <button
                                        onClick={nextImage}
                                        disabled={images.length <= 1}
                                        className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-label="Next image"
                                    >
                                        <FaChevronRight />
                                    </button>
                                </div>
                            </div>

                            <AdSpot position="article_top" />

                            {currentImage ? (
                                <div className="my-8">
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                                        {currentHeading}
                                    </h2>

                                    <figure className="w-full mb-4 rounded-xl overflow-hidden shadow-md bg-white border border-gray-100 cursor-pointer" onClick={() => openLightbox(currentImageIndex)}>
                                        <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                                            <Image
                                                src={getImageUrl(currentImage)}
                                                alt={currentImage?.caption || `Gallery image ${currentImageIndex + 1}`}
                                                fill
                                                sizes="(max-width: 1024px) 100vw, 72vw"
                                                className="object-cover"
                                                priority
                                            />
                                            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
                                                <FaSearchPlus className="text-white drop-shadow-lg" size={32} />
                                            </div>
                                        </div>
                                        {currentImage?.caption && (
                                            <figcaption className="p-3 text-center text-sm text-gray-800 border-t border-gray-100 bg-white">
                                                {currentImage.caption}
                                            </figcaption>
                                        )}
                                    </figure>

                                    {currentImage?.description && (
                                        <div className="prose prose-lg text-gray-700 leading-loose max-w-none">
                                            <p>{currentImage.description}</p>
                                        </div>
                                    )}

                                    {images.length > 1 && (
                                        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
                                            {images.map((img, idx) => {
                                                const thumb = getImageUrl(img);
                                                const active = idx === currentImageIndex;
                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setCurrentImageIndex(idx)}
                                                        className={`relative w-20 h-14 rounded-lg overflow-hidden border flex-shrink-0 ${active ? 'ring-2 ring-emerald-500 border-emerald-300' : 'border-gray-200 hover:border-gray-300'}`}
                                                        aria-label={`Go to image ${idx + 1}`}
                                                    >
                                                        <Image src={thumb} alt={img?.caption || `thumb-${idx + 1}`} fill sizes="80px" className="object-cover" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-gray-500">No gallery images found.</div>
                            )}

                            <AdSpot position="article_bottom" />

                            {post.content && (
                                <div className={`mt-16 prose prose-lg max-w-none`} dangerouslySetInnerHTML={{ __html: post.content }} />
                            )}
                        </div>
                    </main>

                    {/* Sidebar */}
                    <aside className="w-full lg:w-[28%] space-y-8 lg:sticky lg:top-0">
                        <Sidebar currentPostId={post?.slug || post?._id} categorySlug={post?.categories?.[0]?.slug} excludePostKeys={[String(post?.slug || post?._id || '')].filter(Boolean)} />
                    </aside>
                </div>
            </div>

            {isLightboxOpen && (
                <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center" onClick={closeLightbox}>
                    <button
                        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors z-50"
                        onClick={closeLightbox}
                    >
                        <FaTimes size={32} />
                    </button>

                    <button
                        className="absolute left-4 p-4 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
                        onClick={prevImage}
                    >
                        <FaChevronLeft size={40} />
                    </button>

                    <div className="relative w-full h-full max-w-6xl max-h-[90vh] p-4 flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
                        <div className="relative w-full h-full">
                             <Image
                                src={getImageUrl(images[currentImageIndex])}
                                alt={`Gallery image ${currentImageIndex + 1}`}
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        { (images[currentImageIndex]?.caption || images[currentImageIndex]?.description) && (
                            <div className="absolute bottom-8 left-0 right-0 text-center">
                                <p className="text-white/90 text-lg font-medium bg-black/50 inline-block px-6 py-2 rounded-full backdrop-blur-md">
                                    {images[currentImageIndex].caption}
                                </p>
                            </div>
                        )}
                        <div className="absolute top-4 left-4 text-white/80 font-mono text-sm">
                            {currentImageIndex + 1} / {images.length}
                        </div>
                    </div>

                    <button
                        className="absolute right-4 p-4 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
                        onClick={nextImage}
                    >
                        <FaChevronRight size={40} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default GalleryClient;
