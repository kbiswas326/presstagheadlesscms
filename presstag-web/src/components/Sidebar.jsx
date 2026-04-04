/// web> src> components> Sidebar.jsx | The Sidebar component is responsible for rendering the sidebar section of the homepage and post pages. It fetches the sidebar configuration from the backend API, which includes the list of widgets to display and their respective types. The component manages the loading state while fetching the configuration and renders a placeholder skeleton UI during that time. Once the configuration is loaded, it dynamically renders each widget using the SidebarWidget component, passing necessary props such as currentPostId, categorySlug, primaryColor, and fallbackImage. The Sidebar also includes AdSpot components at the top and bottom positions to display advertisements. The component is designed to be flexible and can adapt to different widget configurations defined by the admin in the backend. // --- IGNORE ---
'use client';

import React, { useEffect, useState } from 'react';
import SidebarWidget from './SidebarWidget';
import AdSpot from './AdSpot';

const Sidebar = ({ currentPostId, categorySlug, excludePostKeys = [] }) => {
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [primaryColor, setPrimaryColor] = useState('#006356'); // Default color
  const [fallbackImage, setFallbackImage] = useState(null);
  const [urlStructure, setUrlStructure] = useState('/{category}/{slug}');

  useEffect(() => {
    const fetchConfig = async () => {
        try {
            const { fetchWithTenant } = await import('../lib/fetchWithTenant');
            const res = await fetchWithTenant('/layout-config');
            if (res.ok) {
                const data = await res.json();
                
                // Set branding color
                if (data.branding && data.branding.primaryColor) {
                    setPrimaryColor(data.branding.primaryColor);
                }

                if (data.branding?.fallbackImage) {
                setFallbackImage(data.branding.fallbackImage);
                }

                if (data?.seo?.postUrlStructure) {
                    setUrlStructure(data.seo.postUrlStructure);
                }

                if (data && data.sidebar && data.sidebar.widgets && data.sidebar.widgets.length > 0) {
                    setWidgets(data.sidebar.widgets);
                } else {
                    setWidgets([
                        { type: 'trending', title: 'Trending Now' },
                        { type: 'newsletter', title: 'Subscribe' },
                        { type: 'social_links', title: 'Follow Us' }
                    ]);
                }
            } else {
                 setWidgets([
                    { type: 'trending', title: 'Trending Now' },
                    { type: 'newsletter', title: 'Subscribe' },
                    { type: 'social_links', title: 'Follow Us' }
                ]);
            }
        } catch (e) {
            console.error('Failed to fetch sidebar config', e);
             setWidgets([
                { type: 'trending', title: 'Trending Now' },
                { type: 'newsletter', title: 'Subscribe' },
                { type: 'social_links', title: 'Follow Us' }
            ]);
        } finally {
            setLoading(false);
        }
    };
    fetchConfig();
  }, []);

  if (loading) {
      return <div className="space-y-8 animate-pulse">
          <div className="h-64 bg-gray-100 rounded-lg"></div>
          <div className="h-48 bg-gray-100 rounded-lg"></div>
      </div>;
  }

  return (
    <div className="space-y-8">
        <AdSpot position="sidebar_top" />
        {widgets.map((widget, i) => (
            <SidebarWidget 
                key={i} 
                widget={widget} 
                currentPostId={currentPostId} 
                categorySlug={categorySlug} 
                primaryColor={primaryColor}
                fallbackImage={fallbackImage}
                excludePostKeys={excludePostKeys}
                urlStructure={urlStructure}
            />
        ))}
        <AdSpot position="sidebar_bottom" />
    </div>
  );
};

export default Sidebar;
