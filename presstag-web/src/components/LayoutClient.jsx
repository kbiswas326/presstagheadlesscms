"use client";
import NavigationBar from "./header/Navbar";
import Footer from "./Footer";
import { useEffect } from "react";
import AdSpot from "./AdSpot";

export default function LayoutClient({ children, config }) {
  // Config.navbar can be an array (new) or object (old)
  let navbar = [];
  let branding = config?.branding || {};
  
  useEffect(() => {
    if (branding.primaryColor) {
      document.documentElement.style.setProperty('--primary-color', branding.primaryColor);
    } else {
      document.documentElement.style.setProperty('--primary-color', '#006356');
    }
  }, [branding.primaryColor]);

  if (Array.isArray(config?.navbar)) {
      navbar = config.navbar;
  } else if (config?.navbar?.items) {
      // If it was the object structure with items array
      navbar = config.navbar.items.map(item => {
          if (typeof item === 'string') return { label: item, slug: `/${item.toLowerCase()}` };
          return item;
      });
  } else {
      // Fallback
      navbar = [
        { label: 'Home', slug: '/' },
        { label: 'Cricket', slug: '/category/cricket' },
        { label: 'Football', slug: '/category/football' }
      ];
  }

  return (
    <>
      <AdSpot position="header_top" />
      <NavigationBar
        navigationItems={navbar}
        top_nav={null}
        after_nav={null}
        branding={branding}
      />
      <AdSpot position="header_bottom" />
      <main className="container mx-auto px-4 lg:px-8 mb-7">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-12 col-span-1 mt-7">{children}</div>
        </div>
      </main>
      <AdSpot position="footer_top" />
      <Footer config={config} />
      <AdSpot position="footer_bottom" />
    </>
  );
}
