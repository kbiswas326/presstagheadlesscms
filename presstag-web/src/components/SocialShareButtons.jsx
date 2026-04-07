'use client';

import React, { useCallback } from 'react';
import { FaFacebook, FaTwitter, FaWhatsapp, FaLink } from 'react-icons/fa';

const encode = (value) => encodeURIComponent(String(value || '').trim());

const openPopup = (url) => {
  if (typeof window === 'undefined') return;
  const width = 640;
  const height = 520;
  const left = Math.max(0, Math.round((window.screen.width - width) / 2));
  const top = Math.max(0, Math.round((window.screen.height - height) / 2));
  window.open(
    url,
    'share',
    `noopener,noreferrer,width=${width},height=${height},left=${left},top=${top}`
  );
};

export default function SocialShareButtons({ title = '', url: urlProp = '', showLabel = true, size = 20 }) {
  const getUrl = useCallback(() => {
    if (urlProp) return String(urlProp);
    if (typeof window === 'undefined') return '';
    return window.location.href;
  }, [urlProp]);

  const shareTo = useCallback((platform) => {
    const url = getUrl();
    if (!url) return;
    const encodedUrl = encode(url);
    const encodedTitle = encode(title || (typeof document !== 'undefined' ? document.title : ''));

    if (platform === 'facebook') {
      openPopup(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`);
      return;
    }
    if (platform === 'twitter') {
      openPopup(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`);
      return;
    }
    if (platform === 'whatsapp') {
      openPopup(`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`);
      return;
    }
  }, [getUrl, title]);

  const copyLink = useCallback(async () => {
    const url = getUrl();
    if (!url) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        return;
      }
    } catch {}
    try {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    } catch {}
  }, [getUrl]);

  return (
    <div className="flex items-center gap-3">
      {showLabel && <span className="text-gray-500 font-medium text-sm hidden sm:block">Share On:</span>}
      <button
        type="button"
        onClick={() => shareTo('facebook')}
        className="text-blue-600 hover:text-blue-700 transition"
        aria-label="Share on Facebook"
        title="Facebook"
      >
        <FaFacebook size={size} />
      </button>
      <button
        type="button"
        onClick={() => shareTo('twitter')}
        className="text-sky-500 hover:text-sky-600 transition"
        aria-label="Share on X"
        title="X"
      >
        <FaTwitter size={size} />
      </button>
      <button
        type="button"
        onClick={() => shareTo('whatsapp')}
        className="text-green-500 hover:text-green-600 transition"
        aria-label="Share on WhatsApp"
        title="WhatsApp"
      >
        <FaWhatsapp size={size} />
      </button>
      <button
        type="button"
        onClick={copyLink}
        className="text-gray-500 hover:text-gray-700 transition"
        aria-label="Copy link"
        title="Copy link"
      >
        <FaLink size={size - 1} />
      </button>
    </div>
  );
}

