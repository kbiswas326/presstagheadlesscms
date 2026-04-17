/// backend>routes>LayoutConfig.js | Backend route for managing layout configuration (navbar, homepage sections, sidebar widgets, footer, branding)//
const express = require('express');
const router = express.Router();
const LayoutConfig = require('../models/LayoutConfig');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

router.get('/', async (req, res) => {
  try {
    let config = await LayoutConfig.get(req.tenantId);
    
    if (!config) {
      const defaultConfig = {
        navbar: [
          { label: 'Home', slug: '/' },
          { label: 'Cricket', slug: '/category/cricket' },
          { label: 'Football', slug: '/category/football' },
          { label: 'More', slug: '/category/more' }
        ],
        homepage: {
          sections: [
            { id: 'latest', type: 'system', name: 'Latest Articles', enabled: true, order: 1, limit: 12, design: 'grid' },
            { id: 'trending', type: 'system', name: 'Trending Now', enabled: true, order: 2, limit: 12, design: 'grid' },
            { id: 'custom1', type: 'custom', name: 'Cricket News', sourceType: 'category', sourceValue: 'cricket', enabled: true, order: 3, limit: 12, design: 'grid' },
          ]
        },
        sidebar: {
          homepageWidgets: [
            { type: 'trending', title: 'Trending Now', limit: 5 },
            { type: 'recent_posts', title: 'Latest Posts', limit: 5 },
            { type: 'categories', title: 'Categories' },
            { type: 'newsletter', title: 'Subscribe to our Newsletter' },
            { type: 'social_links', title: 'Follow Us' },
          ],
          postWidgets: [
            { type: 'related_posts', title: 'Related Posts', limit: 5 },
            { type: 'author_posts', title: 'More from the Author', limit: 5 },
            { type: 'trending', title: 'Trending Now', limit: 5 },
            { type: 'recent_posts', title: 'Latest Posts', limit: 5 },
            { type: 'categories', title: 'Categories' },
            { type: 'newsletter', title: 'Subscribe to our Newsletter' },
            { type: 'social_links', title: 'Follow Us' },
            { type: 'about', title: 'About', content: '' },
          ],
          widgets: [
            { type: 'trending', title: 'Trending Now', limit: 5 },
            { type: 'recent_posts', title: 'Latest Posts', limit: 5 },
            { type: 'related_posts', title: 'Related Posts', limit: 5 },
            { type: 'author_posts', title: 'More from the Author', limit: 5 },
            { type: 'categories', title: 'Categories' },
            { type: 'newsletter', title: 'Subscribe to our Newsletter' },
            { type: 'social_links', title: 'Follow Us' },
            { type: 'about', title: 'About', content: '' }
          ]
        },
        footer: {
          sections: ['Quick Links', 'Company Info', 'Social Media', 'Contact Info', 'Copyright'],
          showNewsletter: true,
          showSocial: true,
        },
        branding: {
          logo: '/images/logo.png',
          favicon: '',
          primaryColor: '#185EFD',
          siteTitle: 'SportzPoint',
          siteTagline: '',
          siteUrl: '',
          templateId: 'classic',
          logoDisplayMode: 'both',
          showTaglineInHeader: false,
          logoFile: null,
          fallbackImage: ''
        },
        analytics: {}
      };
      
      config = await LayoutConfig.create(defaultConfig, req.tenantId);
    }
    
    res.json(config);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { homepage, sidebar, navbar, mobileNav, footer, branding, seo, analytics } = req.body;
    
    const updateData = {};
    if (homepage) updateData.homepage = homepage;
    if (sidebar) updateData.sidebar = sidebar;
    if (navbar) updateData.navbar = navbar;
    if (mobileNav) updateData.mobileNav = mobileNav;
    if (footer) updateData.footer = footer;
    if (branding) updateData.branding = branding;
    if (seo) updateData.seo = seo;
    if (analytics) updateData.analytics = analytics;
    
    const updatedConfig = await LayoutConfig.update(updateData, req.tenantId);
    res.json(updatedConfig);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
