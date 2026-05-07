/// web/src/app/layout.js | This file defines the root layout for the PressTag web application. It sets up the HTML structure, including the head and body elements, and applies global styles and fonts. The layout also fetches configuration data for the site, such as branding and ad blocks, from the backend API. It includes components for Google Analytics, scroll-to-top functionality, and a client-side layout component that wraps around the main content. The layout is designed to be responsive and supports dynamic metadata generation based on the fetched configuration.
import Script from "next/script";
import "./globals.css";
import "../styles/scrollbar-hide.css";
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import LayoutClient from "../components/LayoutClient";
import GoogleAnalytics from "../components/GoogleAnalytics";
import ScrollToTop from "../components/ScrollToTop";
import { AdProvider } from '../context/AdContext';
import { fetchWithTenant, fetchLayoutConfig } from '../lib/fetchWithTenant';
import { buildOpenGraphImage, resolveSiteAssetUrl } from '../lib/seo';
import { renderHtmlInjection } from '../lib/htmlInjections';
import { resolveTemplateId } from '../lib/templates';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export async function generateMetadata() {
  const config = await getLayoutConfig();
  const siteTitle = config?.branding?.siteTitle || 'PressTag';
  const siteTagline = config?.branding?.siteTagline || '';
  const siteUrlFromConfig = String(config?.branding?.siteUrl || '').trim();
  const googleSiteVerification = String(config?.analytics?.googleSiteVerification || '').trim();
  const facebookAppId = String(config?.analytics?.facebookAppId || '').trim();

  let metadataBase;
  try {
    const explicit = String(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || '').trim();
    const inferred = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';
    let base = siteUrlFromConfig || explicit || inferred;
    if (!base) {
      try {
        const h = headers();
        const host = String(h.get('x-forwarded-host') || h.get('host') || '').trim();
        const proto = String(h.get('x-forwarded-proto') || 'https').trim() || 'https';
        if (host) base = `${proto}://${host}`;
      } catch {}
    }
    const normalizedBase = (() => {
      const v = String(base || '').trim();
      if (!v) return '';
      if (v.startsWith('http://') || v.startsWith('https://')) return v;
      if (v.startsWith('//')) return `https:${v}`;
      return `https://${v}`;
    })();
    metadataBase = new URL(normalizedBase || 'http://localhost:3000');
  } catch {}
  
  const title = config?.seo?.homeMetaTitle || (siteTagline ? `${siteTitle} - ${siteTagline}` : siteTitle);
  const description = config?.seo?.homeMetaDescription || config?.footer?.companyDescription || "Get the latest sports news, live scores, and updates from the world of Cricket, Football, Tennis, Hockey, and more.";
  const iconUrl = resolveSiteAssetUrl(config?.branding?.favicon || config?.branding?.logo || '/favicon.ico');
  const ogImage = resolveSiteAssetUrl(
    config?.seo?.defaultOgImage ||
    config?.branding?.fallbackImage ||
    config?.branding?.logo ||
    '/favicon.ico'
  );

  return {
    metadataBase,
    title: {
      default: title,
      template: `%s | ${siteTitle}`
    },
    description: description,
    alternates: {
      canonical: '/',
    },
    icons: {
      icon: iconUrl,
      shortcut: iconUrl,
      apple: iconUrl,
    },
    verification: {
      google: googleSiteVerification || undefined,
    },
    openGraph: {
      title,
      description,
      siteName: siteTitle,
      images: buildOpenGraphImage(ogImage),
      type: 'website',
      appId: facebookAppId || undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    }
  };
}

export async function generateViewport() {
  const config = await getLayoutConfig();
  const primaryColor = String(config?.branding?.primaryColor || '').trim();
  return {
    width: 'device-width',
    initialScale: 1,
    themeColor: primaryColor || undefined,
  };
}

async function getLayoutConfig() {
  try {
    const res = await fetchLayoutConfig();
    if (res.ok) return res.json();
  } catch(e) { console.error(e); }
  return null;
}

async function getAds() {
  try {
    const res = await fetchWithTenant('/ad-blocks', { next: { revalidate: 60 } });
    if (res.ok) return res.json();
  } catch(e) { console.error(e); }
  return [];
}

async function getHtmlInjections() {
  try {
    const res = await fetchWithTenant('/html-injections', { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      return data?.htmlInjections || null;
    }
  } catch(e) { console.error(e); }
  return null;
}

export default async function RootLayout({ children }) {
  const config = await getLayoutConfig();
  const ads = await getAds();
  const htmlInjections = await getHtmlInjections();
  const faviconHref = resolveSiteAssetUrl(config?.branding?.favicon || config?.branding?.logo || '/favicon.ico');
  const faviconVersion = config?.updatedAt ? new Date(config.updatedAt).getTime() : '';
  const faviconUrl = faviconHref
    ? `${faviconHref}${faviconVersion ? `${faviconHref.includes('?') ? '&' : '?'}v=${faviconVersion}` : ''}`
    : '';
  const primaryColor = config?.branding?.primaryColor || '#006356';
  const templateId = resolveTemplateId(config?.branding?.templateId);

  return (
    <html lang="en" data-template={templateId} className={inter.variable} style={{ '--primary-color': primaryColor }}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {faviconUrl ? (
          <>
            <link rel="icon" href={faviconUrl} />
            <link rel="shortcut icon" href={faviconUrl} />
            <link rel="apple-touch-icon" href={faviconUrl} />
          </>
        ) : null}
        {renderHtmlInjection(htmlInjections?.head)}
        <GoogleAnalytics measurementId={config?.analytics?.gaMeasurementId} />
        {renderHtmlInjection(htmlInjections?.headEnd)}
      </head>
      <body className="flex flex-col min-h-screen">
        {renderHtmlInjection(htmlInjections?.bodyStart)}
        <ScrollToTop />
        <AdProvider ads={ads}>
            <LayoutClient config={config}>
              {children}
            </LayoutClient>
        </AdProvider>
        {renderHtmlInjection(htmlInjections?.bodyEnd)}
      </body>
    </html>
  );
}
