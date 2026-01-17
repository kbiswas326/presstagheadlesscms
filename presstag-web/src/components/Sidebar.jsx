
'use client';

import React, { useEffect, useState } from 'react';
import SidebarWidget from './SidebarWidget';
import AdSpot from './AdSpot';

const Sidebar = ({ currentPostId, categorySlug }) => {
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [primaryColor, setPrimaryColor] = useState('#006356'); // Default color

  useEffect(() => {
    const fetchConfig = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await fetch(apiUrl + '/api/layout-config');
            if (res.ok) {
                const data = await res.json();
                
                // Set branding color
                if (data.branding && data.branding.primaryColor) {
                    setPrimaryColor(data.branding.primaryColor);
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
            />
        ))}
        <AdSpot position="sidebar_bottom" />
    </div>
  );
};

export default Sidebar;
