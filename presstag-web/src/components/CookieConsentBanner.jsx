'use client';

import React, { useState } from 'react';

const CONSENT_KEY = 'presstag_cookie_consent_v1';
const LAST_SHOWN_KEY = 'presstag_cookie_consent_last_shown_v1';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const COOKIE_CONSENT_KEY = 'cookie_consent';
const COOKIE_LAST_SHOWN_KEY = 'cookie_consent_last_shown';

const getCookie = (name) => {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : '';
  } catch {
    return '';
  }
};

const setCookie = (name, value, maxAgeSeconds) => {
  try {
    const expires = new Date(Date.now() + maxAgeSeconds * 1000).toUTCString();
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const domain = hostname === 'sportzpoint.com' || hostname.endsWith('.sportzpoint.com') ? '; Domain=.sportzpoint.com' : '';
    const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(String(value))}; Path=/; Max-Age=${maxAgeSeconds}; Expires=${expires}; SameSite=Lax${domain}${secure}`;
  } catch {}
};

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(() => {
    const now = Date.now();

    try {
      const cookieConsent = getCookie(COOKIE_CONSENT_KEY);
      if (cookieConsent === 'accepted') return false;

      const cookieLastShown = Number(getCookie(COOKIE_LAST_SHOWN_KEY) || '0');
      if (cookieLastShown && now - cookieLastShown < ONE_DAY_MS) return false;
    } catch {}

    try {
      const existing = localStorage.getItem(CONSENT_KEY);
      if (existing === 'accepted') return false;
      const lastShown = Number(localStorage.getItem(LAST_SHOWN_KEY) || '0');
      if (lastShown && now - lastShown < ONE_DAY_MS) return false;
    } catch {}

    return true;
  });

  const closeForNow = () => {
    const now = String(Date.now());
    try {
      localStorage.setItem(LAST_SHOWN_KEY, now);
    } catch {}
    setCookie(COOKIE_LAST_SHOWN_KEY, now, 60 * 60 * 24);
    setVisible(false);
  };

  const accept = () => {
    const now = String(Date.now());
    try {
      localStorage.setItem(CONSENT_KEY, 'accepted');
    } catch {}
    setCookie(COOKIE_CONSENT_KEY, 'accepted', 60 * 60 * 24 * 365);
    setCookie(COOKIE_LAST_SHOWN_KEY, now, 60 * 60 * 24);
    try {
      localStorage.setItem(LAST_SHOWN_KEY, now);
    } catch {}
    setVisible(false);
  };

  const decline = () => {
    const now = String(Date.now());
    try {
      localStorage.setItem(CONSENT_KEY, 'declined');
    } catch {}
    setCookie(COOKIE_CONSENT_KEY, 'declined', 60 * 60 * 24 * 365);
    setCookie(COOKIE_LAST_SHOWN_KEY, now, 60 * 60 * 24);
    try {
      localStorage.setItem(LAST_SHOWN_KEY, now);
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[2147483647] flex items-end justify-center p-4 pb-10 sm:pb-14 bg-black/10">
      <div className="relative w-full max-w-3xl rounded-xl border border-gray-200 bg-white shadow-lg p-6 sm:p-8 text-center sm:text-left">
        <button
          type="button"
          onClick={closeForNow}
          className="absolute right-4 top-4 p-2 rounded-lg hover:bg-gray-50 text-gray-900"
          aria-label="Close cookie notice"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <h3 className="text-lg font-semibold text-gray-900 pr-10 whitespace-nowrap">Accept the use of cookies.</h3>

        <div className="mt-3 text-sm text-gray-700 leading-relaxed">
          We use cookies to improve your experience and understand site usage. Accept to agree to our cookie policy.
        </div>

        <div className="mt-6 flex flex-col sm:flex-row flex-wrap items-center sm:items-start justify-center sm:justify-start gap-3">
          <button
            type="button"
            onClick={accept}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-white font-semibold text-sm"
            style={{ backgroundColor: 'var(--primary-color)' }}
          >
            Accept all Cookies
          </button>
          <button
            type="button"
            onClick={closeForNow}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 text-gray-900 hover:bg-gray-50"
          >
            Manage Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
