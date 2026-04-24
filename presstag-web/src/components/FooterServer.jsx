import React from 'react';
import Link from 'next/link';
import { fetchWithTenant } from '@/lib/fetchWithTenant';
import { buildPostUrl } from '@/lib/urlBuilder';

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

const SocialIcon = ({ platform }) => {
  const name = String(platform || '').toLowerCase().trim();
  if (!name) return null;

  if (name === 'facebook') {
    return (
      <Icon title="Facebook">
        <path d="M13.5 22v-8.2h2.8l.4-3.2h-3.2V8.6c0-.9.3-1.6 1.7-1.6h1.7V4.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3H7.4v3.2h2.8V22h3.3z" />
      </Icon>
    );
  }

  if (name === 'twitter' || name === 'x' || name === 'twitter / x') {
    return (
      <Icon title="X">
        <path d="M18.9 2H22l-6.8 7.8L23.3 22h-6.4l-5-6.1L6.6 22H3.5l7.4-8.5L1 2h6.6l4.5 5.4L18.9 2zm-1.1 18h1.7L6.8 3.9H5.1L17.8 20z" />
      </Icon>
    );
  }

  if (name === 'instagram') {
    return (
      <Icon title="Instagram">
        <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2zm9 2h-9A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4z" />
        <path d="M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2.1a2.9 2.9 0 1 0 0 5.8 2.9 2.9 0 0 0 0-5.8z" />
        <path d="M17.7 6.3a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
      </Icon>
    );
  }

  if (name === 'youtube') {
    return (
      <Icon title="YouTube">
        <path d="M21.6 7.2a2.8 2.8 0 0 0-2-2C17.9 4.7 12 4.7 12 4.7s-5.9 0-7.6.5a2.8 2.8 0 0 0-2 2A29.7 29.7 0 0 0 2 12a29.7 29.7 0 0 0 .4 4.8 2.8 2.8 0 0 0 2 2c1.7.5 7.6.5 7.6.5s5.9 0 7.6-.5a2.8 2.8 0 0 0 2-2A29.7 29.7 0 0 0 22 12a29.7 29.7 0 0 0-.4-4.8zM10.2 15.5V8.5L16.4 12l-6.2 3.5z" />
      </Icon>
    );
  }

  if (name === 'linkedin') {
    return (
      <Icon title="LinkedIn">
        <path d="M6.5 7.5A2.5 2.5 0 1 1 6.5 2.5a2.5 2.5 0 0 1 0 5zM4 21.5V9h5v12.5H4zM11 9h4.8v1.7h.1c.7-1.2 2.3-2.4 4.7-2.4 5 0 5.9 3.2 5.9 7.4v5.8h-5v-5.2c0-1.3 0-3-1.9-3s-2.2 1.4-2.2 2.9v5.3H11V9z" />
      </Icon>
    );
  }

  return (
    <Icon title={platform}>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 5v10h-2V7h2zm0 12v2h-2v-2h2z" />
    </Icon>
  );
};

async function getLatestStories(limit = 10) {
  try {
    const res = await fetchWithTenant(`/posts?status=published&excludeType=custompage&limit=${limit}&lite=1`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.posts || []);
  } catch {
    return [];
  }
}

export default async function FooterServer({ config }) {
  const branding = config?.branding || {};
  const footerConfig = config?.footer || {};
  const sidebarConfig = config?.sidebar || {};
  const urlStructure = config?.seo?.postUrlStructure || '/{category}/{slug}';
  const primaryColor = branding?.primaryColor || '#006356';
  const siteTitle = branding?.siteTitle || 'PressTag';
  const templateId = String(branding?.templateId || '').trim().toLowerCase();
  const isBold = templateId === 'bold';

  const sidebarWidgets = sidebarConfig.postWidgets || sidebarConfig.homepageWidgets || sidebarConfig.widgets || [];
  const socialWidget = sidebarWidgets?.find((w) => w.type === 'social_links' || w.type === 'social');
  const socialLinks = socialWidget?.socialLinks || [];

  const defaultQuickLinks = [
    { text: "About Us", href: "/about-us" },
    { text: "FAQ", href: "/faq" },
    { text: "Partners", href: "/partners" },
    { text: "Disclaimer", href: "/disclaimer" },
    { text: "Privacy Policy", href: "/privacy" },
    { text: "Contact", href: "/contact" },
    { text: "Advertise with Us", href: "/advertise" },
    { text: "Sports Guest Post", href: "/sports-guest-post" },
  ];

  const quickLinks = footerConfig.quickLinks && footerConfig.quickLinks.length > 0
    ? footerConfig.quickLinks
    : defaultQuickLinks;

  const sections = footerConfig.sections || ['Quick Links', 'Company Info', 'Social Media', 'Contact Info'];
  const showQuickLinks = sections.includes('Quick Links');
  const showCompanyInfo = sections.includes('Company Info');
  const showContactInfo = sections.includes('Contact Info');
  const showSocialSection = sections.includes('Social Media');
  const showNewsletter = sections.includes('Newsletter');

  const companyDesc = footerConfig.companyDescription || `${siteTitle} is your go-to source for the latest sports news, updates, and in-depth analysis. We bring you closer to the game with real-time coverage and expert insights.`;
  const address = footerConfig.contactAddress || '123 Sports Avenue, Stadium District, NY 10001, USA';
  const email = footerConfig.contactEmail || `contact@${siteTitle.toLowerCase().replace(/\s+/g, '')}.com`;
  const phone = footerConfig.contactPhone || '+1 (555) 123-4567';

  const latestStory = await getLatestStories(10);

  return (
    <footer style={{ backgroundColor: primaryColor }} className="text-white mt-auto pt-8 pb-4">
      <div className="max-w-7xl mx-auto px-4">
        {isBold ? (
          <div className="mb-10 border-b border-white/10 pb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <span className="text-white font-bold text-3xl tracking-tighter">{siteTitle}</span>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center w-full md:max-w-md">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-4 py-3 rounded bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white text-sm"
              />
              <button
                type="button"
                className="px-5 py-3 rounded font-bold text-sm bg-orange-500 hover:bg-orange-600 transition-colors text-white whitespace-nowrap"
              >
                Subscribe
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-8 border-b border-white/10 pb-6">
            <span className="text-white font-bold text-3xl tracking-tighter">{siteTitle}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {showCompanyInfo && (
            <div>
              <h3 className="text-lg font-bold uppercase mb-4 border-l-4 border-white pl-3">About Us</h3>
              <p className="text-zinc-200 text-sm leading-relaxed mb-4 whitespace-pre-line">
                {companyDesc}
              </p>
            </div>
          )}

          {showQuickLinks && (
            <div>
              <h3 className="text-lg font-bold uppercase mb-4 border-l-4 border-white pl-3">Quick Links</h3>
              <ul className="space-y-2">
                {quickLinks.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-zinc-200 hover:text-white text-sm flex items-center gap-2 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white/50"></span>
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showContactInfo && (
            <div>
              <h3 className="text-lg font-bold uppercase mb-4 border-l-4 border-white pl-3">Contact Us</h3>
              <ul className="space-y-4 text-sm text-zinc-200">
                <li className="flex items-start gap-3">
                  <div className="min-w-[20px] pt-1 opacity-70">📍</div>
                  <span>{address}</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="min-w-[20px] opacity-70">📧</div>
                  <a href={`mailto:${email}`} className="hover:text-white">{email}</a>
                </li>
                <li className="flex items-center gap-3">
                  <div className="min-w-[20px] opacity-70">📞</div>
                  <a href={`tel:${phone}`} className="hover:text-white">{phone}</a>
                </li>
              </ul>
            </div>
          )}

          {(showNewsletter || showSocialSection) && (
            <div>
              {showNewsletter && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold uppercase mb-4 border-l-4 border-white pl-3">Newsletter</h3>
                  <p className="text-zinc-200 text-sm mb-4">Subscribe to our newsletter for the latest updates.</p>
                  <form className="flex flex-col gap-2">
                    <input
                      type="email"
                      placeholder="Your email address"
                      className="px-4 py-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white text-sm"
                    />
                    <button
                      type="button"
                      className={isBold ? "px-4 py-2 rounded bg-orange-500 font-bold text-sm hover:bg-orange-600 transition-colors text-white" : "px-4 py-2 rounded bg-white font-bold text-sm hover:bg-zinc-100 transition-colors"}
                      style={isBold ? undefined : { color: primaryColor }}
                    >
                      Subscribe
                    </button>
                  </form>
                </div>
              )}

              {showSocialSection && socialLinks.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold uppercase mb-4 border-l-4 border-white pl-3">Follow Us</h3>
                  <div className="flex flex-wrap gap-3">
                    {socialLinks.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={link.platform || 'Social link'}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
                      >
                        <SocialIcon platform={link.platform} />
                        <span className="sr-only">{link.platform || 'Social link'}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-8 border-t border-white/10 pt-6">
          <h3 className="text-lg font-bold uppercase mb-4">Latest Stories</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestStory.slice(0, 10).map((story, index) => (
              <Link
                key={index}
                href={buildPostUrl(story, urlStructure)}
                className="group flex items-start gap-3 p-2 rounded hover:bg-white/5 transition-colors"
              >
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/50 group-hover:bg-white transition-colors flex-shrink-0"></span>
                <span className="text-zinc-200 group-hover:text-white text-sm line-clamp-1 leading-snug">
                  {story.title}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 pt-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-300">
            <div>
              &copy; {new Date().getFullYear()} {siteTitle}. All rights reserved.
            </div>
            <div className="flex items-center gap-1">
              Made with <span className="text-red-400">💖</span> by PressTag
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
