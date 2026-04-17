import NavigationBar from "./header/Navbar";
import Footer from "./FooterServer";
import AdSpot from "./AdSpot";
import PushNotificationsPrompt from "./PushNotificationsPrompt";
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { applyTemplateToDocument, resolveTemplateFromConfig } from '../templates/applyTemplate';

export default function LayoutClient({ children, config }) {
  const searchParams = useSearchParams();

  // Config.navbar can be an array (new) or object (old)
  let navbar = [];
  let branding = config?.branding || {};

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

  useEffect(() => {
    const qp = searchParams?.get('template');
    const fromConfig = resolveTemplateFromConfig(config);
    applyTemplateToDocument(qp || fromConfig);
  }, [config, searchParams]);

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
      <main className="site-shell container mx-auto px-4 lg:px-8 mb-7">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-12 col-span-1 mt-7">{children}</div>
        </div>
      </main>
      <AdSpot position="footer_top" />
      <Footer config={config} />
      <AdSpot position="footer_bottom" />
      <PushNotificationsPrompt />
    </>
  );
}
