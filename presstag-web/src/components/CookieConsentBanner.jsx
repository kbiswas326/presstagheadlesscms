'use client';

import React, { useState } from 'react';

const CONSENT_KEY = 'presstag_cookie_consent_v1';
const LAST_SHOWN_KEY = 'presstag_cookie_consent_last_shown_v1';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(() => {
    try {
      const existing = localStorage.getItem(CONSENT_KEY);
      if (existing === 'accepted') return false;
      const lastShown = Number(localStorage.getItem(LAST_SHOWN_KEY) || '0');
      if (lastShown && Date.now() - lastShown < ONE_DAY_MS) return false;
      return true;
    } catch {
      return true;
    }
  });

  const closeForNow = () => {
    try {
      localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
    } catch {}
    setVisible(false);
  };

  const accept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'accepted');
    } catch {}
    try {
      const maxAge = 60 * 60 * 24 * 365;
      document.cookie = `cookie_consent=accepted; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
    } catch {}
    try {
      localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
    } catch {}
    setVisible(false);
  };

  const decline = () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'declined');
    } catch {}
    try {
      const maxAge = 60 * 60 * 24 * 365;
      document.cookie = `cookie_consent=declined; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
    } catch {}
    try {
      localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4">
      <div className="relative mx-auto max-w-5xl rounded-xl border border-gray-200 bg-white shadow-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={closeForNow}
          className="absolute right-3 top-3 p-2 rounded-lg hover:bg-gray-50 text-gray-500"
          aria-label="Close cookie notice"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <div className="flex-1 text-sm text-gray-700">
          We use cookies to improve your experience and understand site usage. By continuing, you agree to our cookie policy.
        </div>
        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={decline}
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={accept}
            className="px-4 py-2 rounded-lg text-white font-semibold text-sm"
            style={{ backgroundColor: 'var(--primary-color)' }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
