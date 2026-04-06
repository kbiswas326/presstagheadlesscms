const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const LayoutConfig = require('../models/LayoutConfig');
const { JWT } = require('google-auth-library');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function getJwtClient() {
  const clientEmail = String(process.env.GA4_CLIENT_EMAIL || '').trim();
  const privateKeyRaw = String(process.env.GA4_PRIVATE_KEY || '').trim();
  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) return null;

  return new JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
}

function getOAuthConfig() {
  const clientId = String(process.env.GOOGLE_OAUTH_CLIENT_ID || '').trim();
  const clientSecret = String(process.env.GOOGLE_OAUTH_CLIENT_SECRET || '').trim();
  const redirectUri = String(process.env.GOOGLE_OAUTH_REDIRECT_URI || '').trim();
  const stateSecret = String(process.env.ANALYTICS_OAUTH_STATE_SECRET || '').trim();
  const encKeyBase64 = String(process.env.ANALYTICS_TOKEN_ENC_KEY || '').trim();
  const adminUrl = String(process.env.ADMIN_URL || '').trim();

  return {
    clientId,
    clientSecret,
    redirectUri,
    stateSecret,
    encKeyBase64,
    adminUrl,
    configured: Boolean(clientId && clientSecret && redirectUri && stateSecret && encKeyBase64),
  };
}

function getEncryptionKey() {
  const { encKeyBase64 } = getOAuthConfig();
  if (!encKeyBase64) return null;
  try {
    const buf = Buffer.from(encKeyBase64, 'base64');
    if (buf.length !== 32) return null;
    return buf;
  } catch {
    return null;
  }
}

function encryptString(plainText) {
  const key = getEncryptionKey();
  if (!key) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    v: 1,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: enc.toString('base64'),
  };
}

function decryptString(payload) {
  const key = getEncryptionKey();
  if (!key) return null;
  if (!payload || typeof payload !== 'object') return null;
  const ivB64 = String(payload.iv || '');
  const tagB64 = String(payload.tag || '');
  const dataB64 = String(payload.data || '');
  if (!ivB64 || !tagB64 || !dataB64) return null;

  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString('utf8');
}

function buildStateToken({ tenantId, returnTo }) {
  const { stateSecret } = getOAuthConfig();
  if (!stateSecret) return null;
  const safeReturnTo = typeof returnTo === 'string' && returnTo.startsWith('/') ? returnTo : '/';
  return jwt.sign(
    {
      tenantId,
      returnTo: safeReturnTo,
      nonce: crypto.randomBytes(16).toString('hex'),
    },
    stateSecret,
    { expiresIn: '10m' }
  );
}

function verifyStateToken(stateToken) {
  const { stateSecret } = getOAuthConfig();
  if (!stateSecret) return null;
  try {
    return jwt.verify(stateToken, stateSecret);
  } catch {
    return null;
  }
}

async function exchangeCodeForTokens(code) {
  const { clientId, clientSecret, redirectUri } = getOAuthConfig();
  const res = await axios.post(
    'https://oauth2.googleapis.com/token',
    new URLSearchParams({
      code: String(code || ''),
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
  );
  return res.data;
}

async function refreshAccessToken(refreshToken) {
  const { clientId, clientSecret } = getOAuthConfig();
  const res = await axios.post(
    'https://oauth2.googleapis.com/token',
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: String(refreshToken || ''),
      grant_type: 'refresh_token',
    }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
  );
  return res.data;
}

async function runReportWithAccessToken(propertyId, days, accessToken, { dimensions = [], metrics = [], limit = 10 } = {}) {
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

  const body = {
    dateRanges: [{ startDate: `${Number(days)}daysAgo`, endDate: 'today' }],
    dimensions: dimensions.map((name) => ({ name })),
    metrics: metrics.map((name) => ({ name })),
    limit,
  };

  const res = await axios.post(url, body, {
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: 15000,
  });
  return res.data;
}

async function runReport(propertyId, days, jwtClient, { dimensions = [], metrics = [], limit = 10 } = {}) {
  const { access_token: accessToken } = await jwtClient.authorize();
  return runReportWithAccessToken(propertyId, days, accessToken, { dimensions, metrics, limit });
}

router.get('/ga4/oauth/status', auth, async (req, res) => {
  try {
    const oauth = getOAuthConfig();
    const config = await LayoutConfig.get(req.tenantId);
    const stored = config?.analytics?.gaOAuth || null;
    const connected = Boolean(stored && stored.refreshToken);

    res.json({
      configured: oauth.configured,
      connected,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch GA4 connection status' });
  }
});

router.get('/ga4/oauth/url', auth, async (req, res) => {
  try {
    const oauth = getOAuthConfig();
    if (!oauth.configured) {
      return res.status(400).json({ error: 'Google OAuth is not configured on the server' });
    }

    const returnTo = String(req.query.returnTo || '/settings/customization?tab=integrations');
    const state = buildStateToken({ tenantId: req.tenantId, returnTo });
    if (!state) return res.status(500).json({ error: 'Failed to create state token' });

    const scope = encodeURIComponent('https://www.googleapis.com/auth/analytics.readonly');
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${encodeURIComponent(oauth.clientId)}` +
      `&redirect_uri=${encodeURIComponent(oauth.redirectUri)}` +
      `&response_type=code` +
      `&scope=${scope}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&include_granted_scopes=true` +
      `&state=${encodeURIComponent(state)}`;

    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to create GA4 OAuth URL' });
  }
});

router.post('/ga4/oauth/disconnect', auth, async (req, res) => {
  try {
    const config = await LayoutConfig.get(req.tenantId);
    const analytics = { ...(config?.analytics || {}) };
    delete analytics.gaOAuth;
    const updated = await LayoutConfig.update({ analytics }, req.tenantId);
    res.json({ ok: true, updated });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to disconnect GA4' });
  }
});

router.get('/ga4/oauth/callback', async (req, res) => {
  try {
    const oauth = getOAuthConfig();
    const code = String(req.query.code || '');
    const stateToken = String(req.query.state || '');

    if (!oauth.configured) return res.status(400).send('Google OAuth is not configured.');
    if (!code || !stateToken) return res.status(400).send('Missing code/state.');

    const state = verifyStateToken(stateToken);
    if (!state || !state.tenantId) return res.status(400).send('Invalid state.');

    const tokenData = await exchangeCodeForTokens(code);
    const refreshToken = String(tokenData.refresh_token || '').trim();
    if (!refreshToken) return res.status(400).send('No refresh token received. Try connecting again.');

    const encrypted = encryptString(refreshToken);
    if (!encrypted) return res.status(500).send('Token encryption not configured.');

    const config = await LayoutConfig.get(state.tenantId);
    const analytics = { ...(config?.analytics || {}) };
    analytics.gaOAuth = { refreshToken: encrypted, connectedAt: new Date().toISOString() };
    await LayoutConfig.update({ analytics }, state.tenantId);

    const adminBase = oauth.adminUrl || '';
    const returnTo = typeof state.returnTo === 'string' && state.returnTo.startsWith('/') ? state.returnTo : '/';
    if (adminBase) {
      return res.redirect(`${adminBase}${returnTo}${returnTo.includes('?') ? '&' : '?'}gaConnected=1`);
    }

    res.send('Google Analytics connected. You can close this tab.');
  } catch (error) {
    res.status(500).send(error.message || 'Failed to connect Google Analytics');
  }
});

router.get('/ga4/summary', auth, async (req, res) => {
  try {
    const daysRaw = Number(req.query.days || 7);
    const days = daysRaw === 30 ? 30 : 7;

    const config = await LayoutConfig.get(req.tenantId);
    const propertyId = String(config?.analytics?.gaPropertyId || '').trim();
    const measurementId = String(config?.analytics?.gaMeasurementId || '').trim();

    const oauth = getOAuthConfig();
    const storedRefreshEnc = config?.analytics?.gaOAuth?.refreshToken;
    const storedRefresh = storedRefreshEnc ? decryptString(storedRefreshEnc) : null;

    const jwtClient = getJwtClient();
    const canUseOauth = Boolean(propertyId && oauth.configured && storedRefresh);
    const canUseServiceAccount = Boolean(propertyId && jwtClient);

    if (!propertyId || (!canUseOauth && !canUseServiceAccount)) {
      return res.json({
        configured: false,
        days,
        measurementId: measurementId || null,
      });
    }

    const accessToken = canUseOauth
      ? String((await refreshAccessToken(storedRefresh)).access_token || '')
      : null;

    const totalsReport = accessToken
      ? await runReportWithAccessToken(propertyId, days, accessToken, {
        metrics: ['activeUsers', 'sessions', 'screenPageViews'],
        limit: 1,
      })
      : await runReport(propertyId, days, jwtClient, {
      metrics: ['activeUsers', 'sessions', 'screenPageViews'],
      limit: 1,
    });

    const totalsRow = (totalsReport.rows || [])[0];
    const totals = {
      activeUsers: Number(totalsRow?.metricValues?.[0]?.value || 0),
      sessions: Number(totalsRow?.metricValues?.[1]?.value || 0),
      pageViews: Number(totalsRow?.metricValues?.[2]?.value || 0),
    };

    const topPagesReport = accessToken
      ? await runReportWithAccessToken(propertyId, days, accessToken, {
        dimensions: ['pagePath'],
        metrics: ['screenPageViews'],
        limit: 10,
      })
      : await runReport(propertyId, days, jwtClient, {
      dimensions: ['pagePath'],
      metrics: ['screenPageViews'],
      limit: 10,
    });

    const topPages = (topPagesReport.rows || []).map((r) => ({
      path: r?.dimensionValues?.[0]?.value || '',
      views: Number(r?.metricValues?.[0]?.value || 0),
    })).filter((x) => x.path);

    const topAuthors = (() => {
      const map = new Map();
      for (const p of topPages) {
        const m = p.path.match(/^\/author\/([^/?#]+)/i);
        if (!m) continue;
        const slug = m[1];
        map.set(slug, (map.get(slug) || 0) + p.views);
      }
      return [...map.entries()]
        .map(([slug, views]) => ({ slug, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);
    })();

    res.json({
      configured: true,
      days,
      propertyId,
      totals,
      topPages,
      topAuthors,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch GA4 summary' });
  }
});

module.exports = router;
