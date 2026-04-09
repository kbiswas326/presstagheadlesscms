'use client';

import React, { useCallback } from 'react';

const Icon = ({ title, children }) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden={title ? undefined : true}
    role={title ? 'img' : 'presentation'}
  >
    {title ? <title>{title}</title> : null}
    {children}
  </svg>
);

const FacebookIcon = () => (
  <Icon title="Facebook">
    <path d="M13.5 22v-8.2h2.8l.4-3.2h-3.2V8.6c0-.9.3-1.6 1.7-1.6h1.7V4.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3H7.4v3.2h2.8V22h3.3z" />
  </Icon>
);

const XIcon = () => (
  <Icon title="X">
    <path d="M18.9 2H22l-6.8 7.8L23.3 22h-6.4l-5-6.1L6.6 22H3.5l7.4-8.5L1 2h6.6l4.5 5.4L18.9 2zm-1.1 18h1.7L6.8 3.9H5.1L17.8 20z" />
  </Icon>
);

const WhatsAppIcon = () => (
  <Icon title="WhatsApp">
    <path d="M20.5 3.5A10 10 0 0 0 4 18.9L3 22l3.2-1a10 10 0 0 0 4.8 1.2h.1a10 10 0 0 0 9.4-13.7zm-9.4 16.9h-.1a8.4 8.4 0 0 1-4.3-1.2l-.3-.2-1.9.6.6-1.8-.2-.3a8.4 8.4 0 1 1 6.2 2.9zm4.9-6.3c-.3-.1-1.6-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-1 1.1-.2.2-.4.2-.7.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.4 0-.6s-.7-1.7-1-2.3c-.3-.6-.6-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.2 1.1-1.2 2.7 1.2 3.1 1.3 3.3c.1.2 2.3 3.6 5.6 5 3.3 1.4 3.3.9 3.9.8.6-.1 1.6-.7 1.9-1.3.2-.6.2-1.1.2-1.3-.1-.1-.3-.2-.6-.3z" />
  </Icon>
);

const LinkIcon = () => (
  <Icon title="Copy link">
    <path d="M10.6 13.4a1 1 0 0 1 0-1.4l2.4-2.4a1 1 0 1 1 1.4 1.4l-2.4 2.4a1 1 0 0 1-1.4 0zm-2.1 2.1a4 4 0 0 1 0-5.7l2.1-2.1a4 4 0 0 1 5.7 0 1 1 0 1 1-1.4 1.4 2 2 0 0 0-2.8 0l-2.1 2.1a2 2 0 0 0 2.8 2.8 1 1 0 1 1 1.4 1.4 4 4 0 0 1-5.7 0zm7-7a4 4 0 0 1 0 5.7l-2.1 2.1a4 4 0 0 1-5.7 0 1 1 0 1 1 1.4-1.4 2 2 0 0 0 2.8 0l2.1-2.1a2 2 0 0 0-2.8-2.8 1 1 0 1 1-1.4-1.4 4 4 0 0 1 5.7 0z" />
  </Icon>
);

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
        <span style={{ fontSize: size }} className="inline-flex">
          <FacebookIcon />
        </span>
      </button>
      <button
        type="button"
        onClick={() => shareTo('twitter')}
        className="text-sky-500 hover:text-sky-600 transition"
        aria-label="Share on X"
        title="X"
      >
        <span style={{ fontSize: size }} className="inline-flex">
          <XIcon />
        </span>
      </button>
      <button
        type="button"
        onClick={() => shareTo('whatsapp')}
        className="text-green-500 hover:text-green-600 transition"
        aria-label="Share on WhatsApp"
        title="WhatsApp"
      >
        <span style={{ fontSize: size }} className="inline-flex">
          <WhatsAppIcon />
        </span>
      </button>
      <button
        type="button"
        onClick={copyLink}
        className="text-gray-500 hover:text-gray-700 transition"
        aria-label="Copy link"
        title="Copy link"
      >
        <span style={{ fontSize: size - 1 }} className="inline-flex">
          <LinkIcon />
        </span>
      </button>
    </div>
  );
}
