"use client";

import React, { useEffect, useCallback } from 'react';
import Link from 'next/link';
import usePostStore from '../store/postStore';
import { 
  FaFacebookF, FaTwitter, FaInstagram, FaYoutube, FaLinkedinIn, 
  FaTiktok, FaPinterest, FaReddit, FaWhatsapp, FaTelegram 
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

const SocialIcon = ({ platform }) => {
  switch (platform?.toLowerCase()) {
    case 'facebook': return <FaFacebookF />;
    case 'twitter': return <FaTwitter />;
    case 'x': 
    case 'twitter / x': return <FaXTwitter />;
    case 'instagram': return <FaInstagram />;
    case 'youtube': return <FaYoutube />;
    case 'linkedin': return <FaLinkedinIn />;
    case 'tiktok': return <FaTiktok />;
    case 'pinterest': return <FaPinterest />;
    case 'reddit': return <FaReddit />;
    case 'whatsapp': return <FaWhatsapp />;
    case 'telegram': return <FaTelegram />;
    default: return null;
  }
};

const Footer = ({ config }) => {
  const { fetchLatestStory, latestStory } = usePostStore();
  
  const branding = config?.branding || {};
  const footerConfig = config?.footer || {};
  const sidebarConfig = config?.sidebar || {};
  
  const primaryColor = branding?.primaryColor || '#006356';
  const siteTitle = branding?.siteTitle || 'PressTag';
  
  // Find social links from sidebar widgets if available
  const socialWidget = sidebarConfig.widgets?.find(w => w.type === 'social_links' || w.type === 'social');
  const socialLinks = socialWidget?.socialLinks || [];

  const fetchStories = useCallback(async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const url = `${apiUrl}/api/posts?limit=10`; // Increased limit to 10
    await fetchLatestStory(url);
  }, [fetchLatestStory]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

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

  // Determine which sections to show based on config
  // Admin sends: ['Quick Links', 'Company Info', 'Social Media', 'Contact Info']
  const sections = footerConfig.sections || ['Quick Links', 'Company Info', 'Social Media', 'Contact Info']; 
  
  const showQuickLinks = sections.includes('Quick Links');
  const showCompanyInfo = sections.includes('Company Info');
  const showContactInfo = sections.includes('Contact Info');
  const showSocialSection = sections.includes('Social Media');
  const showNewsletter = sections.includes('Newsletter');
  
  // Dynamic Content from Config
  const companyDesc = footerConfig.companyDescription || `${siteTitle} is your go-to source for the latest sports news, updates, and in-depth analysis. We bring you closer to the game with real-time coverage and expert insights.`;
  const address = footerConfig.contactAddress || '123 Sports Avenue, Stadium District, NY 10001, USA';
  const email = footerConfig.contactEmail || `contact@${siteTitle.toLowerCase().replace(/\s+/g, '')}.com`;
  const phone = footerConfig.contactPhone || '+1 (555) 123-4567';

  return (
    <footer style={{ backgroundColor: primaryColor }} className="text-white mt-auto pt-8 pb-4">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Top Section: Logo */}
        <div className="mb-8 border-b border-white/10 pb-6">
           <span className="text-white font-bold text-3xl tracking-tighter">{siteTitle}</span>
        </div>

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* Company Info */}
          {showCompanyInfo && (
            <div>
              <h3 className="text-lg font-bold uppercase mb-4 border-l-4 border-white pl-3">About Us</h3>
              <p className="text-zinc-200 text-sm leading-relaxed mb-4 whitespace-pre-line">
                {companyDesc}
              </p>
            </div>
          )}

          {/* Quick Links */}
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

          {/* Contact Info */}
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

          {/* Newsletter or Social Column */}
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
                          className="px-4 py-2 rounded bg-white text-emerald-900 font-bold text-sm hover:bg-zinc-100 transition-colors"
                          style={{ color: primaryColor }}
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
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
                         >
                            <SocialIcon platform={link.platform} />
                         </a>
                       ))}
                    </div>
                 </div>
               )}
            </div>
          )}
        </div>
        
        {/* Latest Stories */}
        <div className="mb-8 border-t border-white/10 pt-6">
          <h3 className="text-lg font-bold uppercase mb-4">Latest Stories</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestStory && latestStory.slice(0, 10).map((story, index) => (
              <Link 
                key={index}
                href={`/posts/${story.slug || story._id}`}
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

        {/* Copyright - Always Visible */}
        <div className="border-t border-white/10 pt-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-300">
            <div>
              &copy; {new Date().getFullYear()} {siteTitle}. All rights reserved.
            </div>
            <div className="flex items-center gap-1">
               Made with <span className="text-red-400">♥</span> by {siteTitle} Team
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
