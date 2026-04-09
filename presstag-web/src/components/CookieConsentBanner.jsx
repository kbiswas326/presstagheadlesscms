'use client';

import React, { useState } from 'react';

const CONSENT_KEY = 'presstag_cookie_consent_v1';

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(() => {
    try {
      const existing = localStorage.getItem(CONSENT_KEY);
      return !existing;
    } catch {
      return true;
    }
  });

  const accept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'accepted');
    } catch {}
    try {
      const maxAge = 60 * 60 * 24 * 365;
      document.cookie = `cookie_consent=accepted; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4">
      <div className="mx-auto max-w-5xl rounded-xl border border-gray-200 bg-white shadow-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 text-sm text-gray-700">
          We use cookies to improve your experience and understand site usage. By continuing, you agree to our cookie policy.
        </div>
        <div className="flex items-center gap-2 justify-end">
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
