/// web/src/app/layout.js | This file defines the root layout for the PressTag web application. It sets up the HTML structure, including the head and body elements, and applies global styles and fonts. The layout also fetches configuration data for the site, such as branding and ad blocks, from the backend API. It includes components for Google Analytics, scroll-to-top functionality, and a client-side layout component that wraps around the main content. The layout is designed to be responsive and supports dynamic metadata generation based on the fetched configuration.
import Script from "next/script";
import "./globals.css";
import "../styles/scrollbar-hide.css";
import { Roboto, PT_Serif } from 'next/font/google';
import LayoutClient from "../components/LayoutClient";
import GoogleAnalytics from "../components/GoogleAnalytics";
import ScrollToTop from "../components/ScrollToTop";
import { AdProvider } from '../context/AdContext';
import { fetchWithTenant, fetchLayoutConfig } from '../lib/fetchWithTenant';

const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

const ptSerif = PT_Serif({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pt-serif',
});

export async function generateMetadata() {
  const config = await getLayoutConfig();
  const siteTitle = config?.branding?.siteTitle || 'PressTag';
  const siteTagline = config?.branding?.siteTagline || '';
  
  const title = siteTagline ? `${siteTitle} - ${siteTagline}` : siteTitle;
  const description = config?.footer?.companyDescription || "Get the latest sports news, live scores, and updates from the world of Cricket, Football, Tennis, Hockey, and more.";

  return {
    title: {
      default: title,
      template: `%s | ${siteTitle}`
    },
    description: description,
    icons: {
      icon: config?.branding?.logo || '/favicon.ico', // Use logo as favicon if available
    }
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
    const res = await fetchWithTenant('/ad-blocks', { cache: 'no-store' });
    if (res.ok) return res.json();
  } catch(e) { console.error(e); }
  return [];
}

export default async function RootLayout({ children }) {
  const config = await getLayoutConfig();
  const ads = await getAds();

  return (
    <html lang="en" className={`${roboto.variable} ${ptSerif.variable}`}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <GoogleAnalytics />
        {/* Load embed scripts early with inline initialization */}
        <Script 
          src="https://platform.twitter.com/widgets.js" 
          strategy="afterInteractive"
          async
          charset="utf-8"
        />
        <Script 
          src="https://www.instagram.com/embed.js" 
          strategy="afterInteractive"
          async
        />
      </head>
      <body className="flex flex-col min-h-screen">
        <ScrollToTop />
        <AdProvider ads={ads}>
            <LayoutClient config={config}>
              {children}
            </LayoutClient>
        </AdProvider>
      </body>
    </html>
  );
}
