const express = require('express');
const router = express.Router();
const LayoutConfig = require('../models/LayoutConfig');
const auth = require('../middleware/auth');

// @route   GET api/layout-config
// @desc    Get layout configuration
// @access  Public
router.get('/', async (req, res) => {
  try {
    let config = await LayoutConfig.get();
    
    if (!config) {
      // Create default config if not exists
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
          widgets: [
             { type: 'trending', title: 'Trending Now', limit: 5 },
             { type: 'newsletter', title: 'Subscribe to our Newsletter' },
             { type: 'social_links', title: 'Follow Us' }
          ]
        },
        footer: {
          sections: ['Quick Links', 'Company Info', 'Social Media', 'Contact Info', 'Copyright'],
          showNewsletter: true,
          showSocial: true,
        },
        branding: {
          logo: '/images/logo.png',
          primaryColor: '#006356',
          siteTitle: 'PressTag',
          logoFile: null,
        }
      };
      
      config = await LayoutConfig.create(defaultConfig);
    }
    
    res.json(config);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/layout-config
// @desc    Update layout configuration
// @access  Private (Admin)
router.put('/', auth, async (req, res) => {
  try {
    const { homepage, sidebar, navbar, mobileNav, footer, branding } = req.body;
    
    // Construct update object
    const updateData = {};
    if (homepage) updateData.homepage = homepage;
    if (sidebar) updateData.sidebar = sidebar;
    if (navbar) updateData.navbar = navbar;
    if (mobileNav) updateData.mobileNav = mobileNav;
    if (footer) updateData.footer = footer;
    if (branding) updateData.branding = branding;
    
    // Use the update method which handles upsert
    const updatedConfig = await LayoutConfig.update(updateData);
    
    // In native driver, findOneAndUpdate returns the result object.
    // If we used returnDocument: 'after', the doc is in result.value (v4) or just the doc (v6).
    // Let's assume v4 or later. If it's v6, it returns the doc directly if includeResultMetadata is false (default).
    // Let's just re-fetch to be safe if we are unsure about driver version, 
    // OR just trust the return. 
    // Wait, let's check LayoutConfig.update implementation again.
    
    res.json(updatedConfig);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
