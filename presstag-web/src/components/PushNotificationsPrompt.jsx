'use client';

import React, { useEffect, useState } from 'react';
import { fetchWithTenant } from '@/lib/fetchWithTenant';

const OPTIN_KEY = 'presstag_push_opt_in_v1';
const SUB_ENDPOINT_KEY = 'presstag_push_endpoint_v1';
const LAST_SHOWN_KEY = 'presstag_push_last_shown_v1';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const COOKIE_CONSENT_KEY = 'cookie_consent';
const COOKIE_LAST_SHOWN_KEY = 'cookie_consent_last_shown';
const COOKIE_LOCAL_KEY = 'presstag_cookie_consent_v1';
const COOKIE_LOCAL_LAST_SHOWN_KEY = 'presstag_cookie_consent_last_shown_v1';
const COOKIE_OPEN_KEY = 'presstag_cookie_banner_open_v1';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
};

const getCookie = (name) => {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : '';
  } catch {
    return '';
  }
};

const shouldDeferForCookieBanner = () => {
  try {
    const now = Date.now();

    const open = localStorage.getItem(COOKIE_OPEN_KEY);
    if (open === '1') return true;

    const cookieConsent = getCookie(COOKIE_CONSENT_KEY);
    const cookieLastShown = Number(getCookie(COOKIE_LAST_SHOWN_KEY) || '0');
    if (cookieConsent !== 'accepted') {
      if (!cookieLastShown || now - cookieLastShown >= ONE_DAY_MS) return true;
      if (now - cookieLastShown < 15_000) return true;
    }

    const localConsent = localStorage.getItem(COOKIE_LOCAL_KEY);
    const localLastShown = Number(localStorage.getItem(COOKIE_LOCAL_LAST_SHOWN_KEY) || '0');
    if (localConsent !== 'accepted') {
      if (!localLastShown || now - localLastShown >= ONE_DAY_MS) return true;
      if (now - localLastShown < 15_000) return true;
    }
  } catch {}
  return false;
};

export default function PushNotificationsPrompt() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cookieOpen, setCookieOpen] = useState(false);

  useEffect(() => {
    try {
      setCookieOpen(localStorage.getItem(COOKIE_OPEN_KEY) === '1');
    } catch {}
    const onCookieOpen = () => {
      setCookieOpen(true);
      setVisible(false);
    };
    const onCookieClosed = () => setCookieOpen(false);
    try {
      window.addEventListener('presstag:cookieBannerOpen', onCookieOpen);
      window.addEventListener('presstag:cookieBannerClosed', onCookieClosed);
    } catch {}
    return () => {
      try {
        window.removeEventListener('presstag:cookieBannerOpen', onCookieOpen);
        window.removeEventListener('presstag:cookieBannerClosed', onCookieClosed);
      } catch {}
    };
  }, []);

  useEffect(() => {
    (async () => {
      const now = Date.now();
      try {
        const existing = localStorage.getItem(OPTIN_KEY);
        if (existing === 'accepted' || existing === 'denied' || existing === 'unsupported') return;
        const lastShown = Number(localStorage.getItem(LAST_SHOWN_KEY) || '0');
        if (lastShown && now - lastShown < ONE_DAY_MS) return;
      } catch {}

      try {
        if (typeof window === 'undefined') return;
        if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;
        if (Notification.permission === 'denied') {
          try { localStorage.setItem(OPTIN_KEY, 'denied'); } catch {}
          return;
        }
        if (Notification.permission === 'granted') {
          const reg = await navigator.serviceWorker.getRegistration('/');
          const sub = reg ? await reg.pushManager.getSubscription() : null;
          if (sub) {
            try { localStorage.setItem(OPTIN_KEY, 'accepted'); } catch {}
            return;
          }
        }
      } catch {}

      const waitForCookieBanner = () => new Promise((resolve) => {
        const start = Date.now();
        const onClosed = () => resolve();
        try {
          window.addEventListener('presstag:cookieBannerClosed', onClosed, { once: true });
        } catch {}
        const poll = () => {
          if (!shouldDeferForCookieBanner() || Date.now() - start > 120_000) {
            try { window.removeEventListener('presstag:cookieBannerClosed', onClosed); } catch {}
            resolve();
            return;
          }
          setTimeout(poll, 500);
        };
        poll();
      });

      if (shouldDeferForCookieBanner()) {
        await waitForCookieBanner();
      }

      try { localStorage.setItem(LAST_SHOWN_KEY, String(now)); } catch {}
      setVisible(true);
    })();
  }, []);

  const dismiss = (choice, persist = true) => {
    if (persist) {
      try {
        if (choice === 'dismissed') {
          localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
        } else {
          localStorage.setItem(OPTIN_KEY, choice);
        }
      } catch {}
    }
    setVisible(false);
  };

  const enable = async () => {
    setBusy(true);
    try {
      if (typeof window === 'undefined') return;
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        dismiss('unsupported');
        return;
      }
      if (!window.isSecureContext && window.location.hostname !== 'localhost') {
        alert('Notifications require HTTPS.');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        dismiss('denied');
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

      let publicKey = String(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim();
      if (!publicKey) {
        const res = await fetchWithTenant('/push/vapid-public-key', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          publicKey = String(data?.publicKey || '').trim();
        }
      }
      if (!publicKey) {
        alert('Notifications are not configured yet (missing VAPID key).');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      try {
        localStorage.setItem(SUB_ENDPOINT_KEY, subscription.endpoint || '');
      } catch {}

      const res = await fetchWithTenant('/push/subscribe', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });

      if (!res.ok) {
        const fallback = `Could not enable notifications. Please try again. (HTTP ${res.status})`;
        try {
          const data = await res.json();
          const msg = typeof data?.error === 'string' && data.error.trim() ? data.error.trim() : fallback;
          alert(msg);
        } catch {
          alert(fallback);
        }
        return;
      }

      dismiss('accepted');
    } finally {
      setBusy(false);
    }
  };

  if (!visible || cookieOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9998] px-4 pb-20 pointer-events-none">
      <div className="relative mx-auto max-w-5xl rounded-xl border border-gray-200 bg-white shadow-lg pt-10 pb-4 px-4 sm:pb-5 sm:px-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pointer-events-auto">
        <button
          type="button"
          onClick={() => dismiss('dismissed')}
          className="absolute right-3 top-3 p-2 rounded-lg hover:bg-gray-50 text-gray-500 z-10"
          aria-label="Close notifications prompt"
          disabled={busy}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <div className="flex-1 text-sm text-gray-700">
          Enable notifications to get alerts when new articles are published, including every live blog updates we publish.
        </div>
        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={() => dismiss('dismissed')}
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50"
            disabled={busy}
          >
            Not now
          </button>
          <button
            type="button"
            onClick={enable}
            className="px-4 py-2 rounded-lg text-white font-semibold text-sm disabled:opacity-60"
            style={{ backgroundColor: 'var(--primary-color)' }}
            disabled={busy}
          >
            {busy ? 'Enabling…' : 'Enable'}
          </button>
        </div>
      </div>
    </div>
  );
}
