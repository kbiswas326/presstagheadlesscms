"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaPause, FaPlay, FaTimes, FaShare, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';

const STORY_DURATION = 6000; // 6 seconds per slide

const WebStoryViewer = ({ images = [], postTitle = '', author = null, date = null }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const startTimeRef = useRef(null);
  const animationFrameRef = useRef(null);
  const router = useRouter();

  // Filter valid images
  const validImages = images.filter(img => img && (typeof img === 'string' || img.url));

  // Navigation Handlers
  const handleNext = useCallback(() => {
    if (currentIndex < validImages.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
      startTimeRef.current = Date.now();
    } else {
        // End of story
        setIsPaused(true);
    }
  }, [currentIndex, validImages.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
      startTimeRef.current = Date.now();
    }
  }, [currentIndex]);

  const togglePause = (e) => {
    e?.stopPropagation();
    setIsPaused(prev => !prev);
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'ArrowLeft') handlePrev();
        if (e.key === 'Space') togglePause();
        if (e.key === 'Escape') router.back();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, router]);

  // Progress Timer
  useEffect(() => {
    if (isPaused || validImages.length === 0) {
        if (startTimeRef.current) {
             startTimeRef.current = Date.now() - (progress / 100) * STORY_DURATION;
        }
        return;
    }

    startTimeRef.current = Date.now() - (progress / 100) * STORY_DURATION;

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = (elapsed / STORY_DURATION) * 100;

      if (newProgress >= 100) {
        if (currentIndex < validImages.length - 1) {
          handleNext();
        } else {
          setProgress(100); 
        }
      } else {
        setProgress(newProgress);
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentIndex, isPaused, handleNext, validImages.length]);

  // Reset progress on index change
  useEffect(() => {
    setProgress(0);
    startTimeRef.current = Date.now();
  }, [currentIndex]);

  if (validImages.length === 0) return null;

  const getImageUrl = (img) => {
      const url = typeof img === 'string' ? img : img?.url;
      if (!url) return '/placeholder.jpg';
      
      if (url.startsWith('http')) return url;
      
      // Base URL handling
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
      
      let path = url.startsWith('/') ? url : `/${url}`;
      // Ensure path starts with /uploads if it looks like a file path and not a system path
      if (!path.startsWith('/uploads/')) {
          path = `/uploads${path}`;
      }
      
      return `${baseUrl}${path}`;
  };

  const currentImage = validImages[currentIndex];
  const currentImageUrl = getImageUrl(currentImage);
  const currentCaption = typeof currentImage === 'string' ? '' : currentImage.caption;
  const currentDescription = typeof currentImage === 'string' ? '' : currentImage.description;

  return (
    <div className="fixed inset-0 z-[9999] bg-black text-white flex items-center justify-center overflow-hidden">
        
        {/* Desktop Blurred Background */}
        <div className="absolute inset-0 z-0 hidden md:block">
             <Image
                src={currentImageUrl}
                alt="background"
                fill
                className="object-cover blur-3xl opacity-30 scale-110"
             />
             <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Main Story Container (Refinery29 / Snapchat Style) */}
        <div className="relative z-10 w-full h-full md:w-[450px] md:h-[90vh] md:rounded-2xl overflow-hidden bg-gray-900 shadow-2xl ring-1 ring-white/10">
            
            {/* 1. Header: Progress Bars & Meta */}
            <div className="absolute top-0 left-0 right-0 z-50 p-3 pt-4 bg-gradient-to-b from-black/80 to-transparent">
                {/* Progress Bars */}
                <div className="flex gap-1 mb-3">
                    {validImages.map((_, idx) => (
                        <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-white"
                                initial={{ width: idx < currentIndex ? '100%' : '0%' }}
                                animate={{ 
                                    width: idx < currentIndex ? '100%' : 
                                           idx === currentIndex ? `${progress}%` : '0%' 
                                }}
                                transition={{ duration: 0, ease: "linear" }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header Controls */}
                <div className="flex justify-between items-center px-1">
                    {/* Brand / Author */}
                    <div className="flex items-center gap-2 opacity-90">
                        {/* <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs">PT</div> */}
                        <div className="flex flex-col">
                            <span className="text-sm font-bold truncate max-w-[200px]">{postTitle}</span>
                            <span className="text-xs text-gray-300">{currentIndex + 1} • {author || 'SportzPoint'}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        <button onClick={togglePause} className="text-white/80 hover:text-white transition">
                            {isPaused ? <FaPlay size={16} /> : <FaPause size={16} />}
                        </button>
                         <button onClick={() => router.back()} className="text-white/80 hover:text-white transition">
                            <FaTimes size={24} />
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Main Content Layer */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 z-0"
                >
                    <Image
                        src={currentImageUrl}
                        alt={currentCaption || `Story slide ${currentIndex + 1}`}
                        fill
                        className="object-cover"
                        priority
                    />
                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />
                </motion.div>
            </AnimatePresence>

            {/* 3. Text Content Layer (Bottom) */}
            <div className="absolute bottom-0 left-0 right-0 z-40 p-6 pb-12 flex flex-col justify-end">
                <motion.div
                    key={`text-${currentIndex}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {currentCaption && (
                        <h2 className="text-2xl md:text-3xl font-black mb-3 leading-tight drop-shadow-lg font-serif">
                            {currentCaption}
                        </h2>
                    )}
                    {currentDescription && (
                        <p className="text-sm md:text-base text-gray-100 line-clamp-4 leading-relaxed drop-shadow-md">
                            {currentDescription}
                        </p>
                    )}

                    {/* "Read More" CTA (Visual Only for now) */}
                    <div className="mt-4 flex justify-center opacity-80 animate-bounce">
                        <div className="flex flex-col items-center gap-1">
                             <div className="w-1 h-1 bg-white rounded-full" />
                             <div className="w-1 h-1 bg-white rounded-full" />
                             <div className="w-1 h-1 bg-white rounded-full" />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* 4. Tap Navigation Zones (Invisible) */}
            <div className="absolute inset-0 z-30 flex">
                <div 
                    className="w-[30%] h-full cursor-pointer" 
                    onClick={handlePrev}
                    title="Previous"
                />
                <div 
                    className="w-[40%] h-full cursor-pointer flex items-center justify-center" 
                    onClick={togglePause}
                >
                    {/* Center Tap Pauses/Plays */}
                    {isPaused && (
                         <div className="bg-black/40 p-4 rounded-full backdrop-blur-sm">
                             <FaPlay className="text-white text-xl ml-1" />
                         </div>
                    )}
                </div>
                <div 
                    className="w-[30%] h-full cursor-pointer" 
                    onClick={handleNext}
                    title="Next"
                />
            </div>
        </div>

        {/* Desktop External Navigation Buttons */}
        <div className="hidden md:flex fixed inset-x-0 top-1/2 -translate-y-1/2 justify-between px-10 z-50 pointer-events-none">
             <button 
                onClick={handlePrev} 
                className={`pointer-events-auto w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition ${currentIndex === 0 ? 'opacity-0' : 'opacity-100'}`}
             >
                 <FaChevronLeft size={24} />
             </button>
             <button 
                onClick={handleNext} 
                className={`pointer-events-auto w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition ${currentIndex === validImages.length - 1 ? 'opacity-50' : 'opacity-100'}`}
             >
                 <FaChevronRight size={24} />
             </button>
        </div>

    </div>
  );
};

export default WebStoryViewer;