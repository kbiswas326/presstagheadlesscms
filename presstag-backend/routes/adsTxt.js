const express = require('express');
const router = express.Router();
const LayoutConfig = require('../models/LayoutConfig');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const cfg = await LayoutConfig.get(req.tenantId);
    res.json({ adsTxt: String(cfg?.adsTxt || '') });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/', auth, async (req, res) => {
  try {
    const adsTxt = String(req.body?.adsTxt || '');
    const existing = await LayoutConfig.get(req.tenantId);
    if (!existing) {
      await LayoutConfig.create(
        {
          navbar: [
            { label: 'Home', slug: '/' },
            { label: 'Cricket', slug: '/category/cricket' },
            { label: 'Football', slug: '/category/football' },
            { label: 'More', slug: '/category/more' },
          ],
          homepage: {
            sections: [
              { id: 'latest', type: 'system', name: 'Latest Articles', enabled: true, order: 1, limit: 12, design: 'grid' },
              { id: 'trending', type: 'system', name: 'Trending Now', enabled: true, order: 2, limit: 12, design: 'grid' },
              { id: 'custom1', type: 'custom', name: 'Cricket News', sourceType: 'category', sourceValue: 'cricket', enabled: true, order: 3, limit: 12, design: 'grid' },
            ],
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
              { type: 'about', title: 'About', content: '' },
            ],
          },
          footer: {
            sections: ['Quick Links', 'Company Info', 'Social Media', 'Contact Info', 'Copyright'],
            showNewsletter: true,
            showSocial: true,
          },
          branding: {},
          analytics: {},
          seo: {},
          adsTxt: '',
        },
        req.tenantId
      );
    }

    const updated = await LayoutConfig.update({ adsTxt }, req.tenantId);
    const doc = updated?.value || updated;
    res.json({ adsTxt: String(doc?.adsTxt ?? adsTxt) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
