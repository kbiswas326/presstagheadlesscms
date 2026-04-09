'use client';

import React, { useEffect, useState } from 'react';
import { fetchWithTenant } from '@/lib/fetchWithTenant';

const OPTIN_KEY = 'presstag_push_opt_in_v1';
const SUB_ENDPOINT_KEY = 'presstag_push_endpoint_v1';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
};

export default function PushNotificationsPrompt() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const existing = localStorage.getItem(OPTIN_KEY);
      if (existing) return;
    } catch {}
    setVisible(true);
  }, []);

  const dismiss = (choice) => {
    try {
      localStorage.setItem(OPTIN_KEY, choice);
    } catch {}
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
        dismiss('no_key');
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
        dismiss('error');
        return;
      }

      dismiss('accepted');
    } finally {
      setBusy(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-20">
      <div className="mx-auto max-w-5xl rounded-xl border border-gray-200 bg-white shadow-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 text-sm text-gray-700">
          Enable notifications to get alerts when new articles are published (including live blog updates you publish).
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

