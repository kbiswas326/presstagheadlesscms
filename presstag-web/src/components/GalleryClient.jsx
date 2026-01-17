'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaTimes, FaChevronLeft, FaChevronRight, FaSearchPlus, FaTh, FaFacebook, FaTwitter, FaWhatsapp } from 'react-icons/fa';
import { Merriweather } from 'next/font/google';
import Sidebar from './Sidebar';
import AdSpot from './AdSpot';
import { getImageUrl } from '@/lib/imageHelper';

const merriweather = Merriweather({ 
  weight: ['300', '400', '700', '900'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
});

const GalleryClient = ({ post }) => {
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsDark(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e) => setIsDark(e.matches);
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, []);

    const images = post.images || [];

    const getImageUrl = (img) => {
        if (!img) return '/placeholder.jpg';
        const url = typeof img === 'string' ? img : (img.url || img);
        
        if (!url || typeof url !== 'string') return '/placeholder.jpg';

        if (url.startsWith('http')) {
            // Fix port compatibility: replace localhost:5000 with localhost:5001
            return url.replace('localhost:5000', 'localhost:5001');
        }
        
        // Base URL handling
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
        const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
        
        let path = url.startsWith('/') ? url : `/${url}`;
        if (!path.startsWith('/uploads/')) {
            path = `/uploads${path}`;
        }
        
        return `${baseUrl}${path}`;
    };

    const formattedDate = (() => {
        if (post.publishDate && post.publishTime) {
          try {
            const dateObj = new Date(post.publishDate);
            const [hours, minutes] = post.publishTime.split(':');
            if (!isNaN(dateObj.getTime()) && hours && minutes) {
                dateObj.setHours(parseInt(hours), parseInt(minutes));
                return dateObj.toLocaleString('en-US', {
                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                });
            }
          } catch (e) {}
        }
        return new Date(post.publishedAt || post.createdAt).toLocaleString('en-US', {
          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    })();

    const openLightbox = (index) => {
        setCurrentImageIndex(index);
        setIsLightboxOpen(true);
        if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        setIsLightboxOpen(false);
        if (typeof document !== 'undefined') document.body.style.overflow = 'auto';
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
                                        <Link href={`/category/${post.categories[0].slug}`} className="transition-colors font-medium hover:text-[var(--primary-color)] flex-shrink-0">
                                            {post.categories[0].name?.replace(/Ãƒâ€”/g, "").replace(/Ã—/g, "").trim()}
                                        </Link>
                                    </>
                                )}
                                <span className="mx-2 text-gray-300 flex-shrink-0">/</span>
                                <span className="text-gray-400 truncate min-w-0 flex-1">{post.title}</span>
                            </nav>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {post.categories?.map((cat, index) => (
                                    <Link key={index} href={`/category/${cat.slug}`} className="px-3 py-1 bg-gray-50 text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-gray-100 transition-colors cursor-pointer text-rose-600">
                                        {cat.name?.replace(/Ã—/g, "").replace(/×/g, "").trim()}
                                    </Link>
                                ))}
                            </div>
                            
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
                                {post.title}
                            </h1>
                            
                            <h2 className="text-lg md:text-xl text-gray-600 leading-relaxed mb-6 font-light">
                                {post.summary || post.sub_title}
                            </h2>

                            <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden relative">
                                        <Image
                                            src={getImageUrl(post.author?.image || post.authorImage)}
                                            alt={post.author?.name || post.authorName || 'Author'}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900 text-sm">
                                            {post.author?.name || post.authorName || 'SportzPoint Editor'}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {formattedDate}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="text-gray-500 font-medium text-sm hidden sm:block">Share On:</span>
                                    <FaFacebook className="text-blue-600 hover:text-blue-700 cursor-pointer transition" size={20} />
                                    <FaTwitter className="text-sky-500 hover:text-sky-600 cursor-pointer transition" size={20} />
                                    <FaWhatsapp className="text-green-500 hover:text-green-600 cursor-pointer transition" size={20} />
                                </div>
                            </div>
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
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <FaTh className="text-green-500" />
                                    Gallery Photos <span className="text-gray-500 text-lg font-normal">({images.length})</span>
                                </h2>
                            </div>

                            <AdSpot position="article_top" />

                            {/* Gallery List - Vertical Stack */}
                            <div className="space-y-12 my-8">
                                {images.map((img, idx) => (
                                    <div key={idx} className="border-b border-gray-100 pb-12 last:border-0 last:pb-0">
                                        {/* 1. Image Heading */}
                                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                            {img.heading || img.title || img.caption || `Image ${idx + 1}`}
                                        </h2>

                                        {/* 2. Image with Caption (Standard Design) */}
                                        <figure className="w-full mb-6 rounded-xl overflow-hidden shadow-md bg-white border border-gray-100 cursor-pointer" onClick={() => openLightbox(idx)}>
                                            <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                                                <img
                                                    src={getImageUrl(img)}
                                                    alt={img.caption || `Gallery image ${idx + 1}`}
                                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
                                                    <FaSearchPlus className="text-white drop-shadow-lg" size={32} />
                                                </div>
                                            </div>
                                            {img.caption && (
                                                <figcaption className="p-3 text-center text-sm text-gray-800 border-t border-gray-100 bg-white">
                                                    {img.caption}
                                                </figcaption>
                                            )}
                                        </figure>

                                        {/* 3. Image Description */}
                                        {img.description && (
                                            <div className="prose prose-lg text-gray-700 leading-loose max-w-none">
                                                <p>{img.description}</p>
                                            </div>
                                        )}
                                        
                                        {/* Ad Spot after every 3rd image */}
                                        {(idx + 1) % 3 === 0 && <AdSpot position="article_middle" />}
                                    </div>
                                ))}
                            </div>
                            
                            <AdSpot position="article_bottom" />

                            {post.content && (
                                <div className={`mt-16 prose prose-lg max-w-none`} dangerouslySetInnerHTML={{ __html: post.content.replace(/http:\/\/localhost:5000/g, 'http://localhost:5001') }} />
                            )}
                        </div>
                    </main>

                    {/* Sidebar */}
                    <aside className="w-full lg:w-[28%] space-y-8">
                        <Sidebar />
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