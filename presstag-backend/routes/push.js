const express = require('express');
const webPush = require('web-push');
const { getDB } = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const getWebPushConfig = () => {
  const publicKey = String(process.env.VAPID_PUBLIC_KEY || '').trim();
  const privateKey = String(process.env.VAPID_PRIVATE_KEY || '').trim();
  const subject = String(process.env.VAPID_SUBJECT || 'mailto:admin@presstag.com').trim();
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
};

const configureWebPush = () => {
  const cfg = getWebPushConfig();
  if (!cfg) return null;
  webPush.setVapidDetails(cfg.subject, cfg.publicKey, cfg.privateKey);
  return cfg;
};

router.get('/vapid-public-key', (req, res) => {
  const cfg = getWebPushConfig();
  res.json({ publicKey: cfg?.publicKey || '' });
});

router.get('/stats', async (req, res) => {
  try {
    const cfg = getWebPushConfig();
    const db = getDB(req.tenantId);
    if (!db) return res.status(500).json({ error: 'Database unavailable' });

    const subscriptionCount = await db.collection('pushSubscriptions').countDocuments({});
    res.json({
      vapidConfigured: !!cfg,
      tenantId: req.tenantId || null,
      subscriptionCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/subscribe', async (req, res) => {
  try {
    const cfg = configureWebPush();
    if (!cfg) return res.status(400).json({ error: 'VAPID keys not configured' });

    const subscription = req.body?.subscription;
    const endpoint = subscription?.endpoint;
    const keys = subscription?.keys;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'Invalid subscription' });
    }

    const db = getDB(req.tenantId);
    if (!db) return res.status(500).json({ error: 'Database unavailable' });

    const doc = {
      endpoint,
      keys: { p256dh: keys.p256dh, auth: keys.auth },
      allowed: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      userAgent: String(req.headers['user-agent'] || '').slice(0, 500),
    };

    await db.collection('pushSubscriptions').updateOne(
      { endpoint },
      { $set: doc, $setOnInsert: { createdAt: doc.createdAt } },
      { upsert: true }
    );

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/subscriptions', authMiddleware, async (req, res) => {
  try {
    const db = getDB(req.tenantId);
    if (!db) return res.status(500).json({ error: 'Database unavailable' });
    const subs = await db.collection('pushSubscriptions')
      .find({})
      .project({ endpoint: 1, allowed: 1, userAgent: 1, createdAt: 1, updatedAt: 1 })
      .sort({ updatedAt: -1 })
      .toArray();
    res.json({ subscriptions: subs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/subscriptions', authMiddleware, async (req, res) => {
  try {
    const endpoint = String(req.body?.endpoint || '').trim();
    const allowed = req.body?.allowed;
    if (!endpoint) return res.status(400).json({ error: 'Missing endpoint' });
    if (typeof allowed !== 'boolean') return res.status(400).json({ error: 'Missing allowed boolean' });
    const db = getDB(req.tenantId);
    if (!db) return res.status(500).json({ error: 'Database unavailable' });
    await db.collection('pushSubscriptions').updateOne(
      { endpoint },
      { $set: { allowed, updatedAt: new Date() } }
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/unsubscribe', async (req, res) => {
  try {
    const endpoint = String(req.body?.endpoint || '').trim();
    if (!endpoint) return res.status(400).json({ error: 'Missing endpoint' });
    const db = getDB(req.tenantId);
    if (!db) return res.status(500).json({ error: 'Database unavailable' });

    await db.collection('pushSubscriptions').deleteOne({ endpoint });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = { router, configureWebPush, getWebPushConfig };
