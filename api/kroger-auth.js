// Vercel Serverless Function - Kroger OAuth: Auth + Callback
// Handles both initiating authorization and the OAuth callback
// Dispatches based on whether `code` or `error` query params are present

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

function setCors(req, res) {
  const allowed = ['https://grundow.vercel.app', 'capacitor://localhost', 'https://localhost', 'http://localhost'];
  const origin = req.headers.origin;
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  }
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(c => {
    const [key, ...rest] = c.trim().split('=');
    if (key) cookies[key] = decodeURIComponent(rest.join('='));
  });
  return cookies;
}

async function handleCallback(req, res) {
  const { code, state, error: oauthError, error_description: oauthDesc } = req.query;

  if (oauthError) {
    const msg = oauthDesc || oauthError;
    return res.redirect(302, '/?kroger_error=' + encodeURIComponent(msg));
  }

  if (!code) {
    return res.redirect(302, '/?kroger_error=no_code');
  }

  const clientId = process.env.KROGER_CLIENT_ID;
  const clientSecret = process.env.KROGER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.redirect(302, '/?kroger_error=not_configured');
  }

  // Read cookies set during auth initiation
  const cookies = parseCookies(req.headers.cookie);
  const savedState = cookies.kroger_state;
  const supabaseToken = cookies.sb_token;
  const isNative = cookies.kroger_native === 'true';

  // Verify CSRF state
  if (!savedState || savedState !== state) {
    return res.redirect(302, '/?kroger_error=' + encodeURIComponent('State mismatch - please try again'));
  }

  // Use hardcoded redirect URI (must match what was sent in the auth request)
  const redirectUri = process.env.KROGER_REDIRECT_URI || 'https://grundow.vercel.app/api/kroger-callback';

  // Clear the cookies
  res.setHeader('Set-Cookie', [
    'kroger_state=; Path=/; HttpOnly; Secure; Max-Age=0',
    'sb_token=; Path=/; HttpOnly; Secure; Max-Age=0',
    'kroger_native=; Path=/; HttpOnly; Secure; Max-Age=0'
  ]);

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://api.kroger.com/v1/connect/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      }).toString()
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Token exchange failed:', errText);
      return res.redirect(302, '/?kroger_error=' + encodeURIComponent('Token exchange failed. Please try again.'));
    }

    const tokenData = await tokenRes.json();

    // Store tokens in Supabase
    if (!supabaseToken) {
      return res.redirect(302, '/?kroger_error=' + encodeURIComponent('Session expired during login. Please try again.'));
    }

    const supabaseUrl = process.env.SUPABASE_URL || 'https://ywgexbkyrmwoaijifrnp.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
      return res.redirect(302, '/?kroger_error=' + encodeURIComponent('Server configuration error (missing service key)'));
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user's Supabase token to get their ID
    const { data: { user }, error: authErr } = await supabase.auth.getUser(supabaseToken);

    if (authErr || !user) {
      return res.redirect(302, '/?kroger_error=' + encodeURIComponent('Session expired. Please sign in again and retry.'));
    }

    // Store Kroger tokens in the profiles table
    const { error: updateErr } = await supabase.from('profiles').update({
      kroger_access_token: tokenData.access_token,
      kroger_refresh_token: tokenData.refresh_token,
      kroger_token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    }).eq('id', user.id);

    if (updateErr) {
      console.error('Failed to store Kroger tokens:', updateErr);
      return res.redirect(302, '/?kroger_error=' + encodeURIComponent('Failed to save connection. Check database columns.'));
    }

    // Redirect back to the app settings page with success
    if (isNative) {
      return res.redirect(302, 'grundow://kroger-callback?kroger_connected=true');
    }
    return res.redirect(302, '/?kroger_connected=true');

  } catch (err) {
    console.error('Kroger callback error:', err);
    return res.redirect(302, '/?kroger_error=' + encodeURIComponent(err.message || 'server_error'));
  }
}

function handleAuthInit(req, res) {
  const clientId = process.env.KROGER_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'Kroger API not configured' });
  }

  const supabaseToken = req.query.state || '';
  const isNative = req.query.native === 'true';

  // Use hardcoded redirect URI to avoid Vercel host mismatches
  const redirectUri = process.env.KROGER_REDIRECT_URI || 'https://grundow.vercel.app/api/kroger-callback';

  // Generate a short random state for CSRF protection
  const state = crypto.randomBytes(16).toString('hex');

  // Store the Supabase token and native flag in secure cookies so we can retrieve them in the callback
  const cookies = [
    `kroger_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    `sb_token=${encodeURIComponent(supabaseToken)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  ];
  if (isNative) {
    cookies.push('kroger_native=true; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600');
  }
  res.setHeader('Set-Cookie', cookies);

  const scope = 'cart.basic:write product.compact profile.compact';

  const authUrl = `https://api.kroger.com/v1/connect/oauth2/authorize?` +
    `client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${encodeURIComponent(state)}`;

  res.redirect(302, authUrl);
}

async function handleTokenRefresh(req, res) {
  const { supabaseToken } = req.body;
  if (!supabaseToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || 'https://ywgexbkyrmwoaijifrnp.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser(supabaseToken);
    if (authErr || !user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('kroger_access_token, kroger_refresh_token, kroger_token_expires_at')
      .eq('id', user.id)
      .single();

    if (!profile?.kroger_refresh_token) {
      return res.status(401).json({ error: 'Kroger account not connected', needsAuth: true });
    }

    const expiresAt = new Date(profile.kroger_token_expires_at);
    if (expiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
      return res.status(200).json({ accessToken: profile.kroger_access_token });
    }

    const clientId = process.env.KROGER_CLIENT_ID;
    const clientSecret = process.env.KROGER_CLIENT_SECRET;

    const tokenRes = await fetch('https://api.kroger.com/v1/connect/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: profile.kroger_refresh_token
      }).toString()
    });

    if (!tokenRes.ok) {
      await supabase.from('profiles').update({
        kroger_access_token: null,
        kroger_refresh_token: null,
        kroger_token_expires_at: null
      }).eq('id', user.id);
      return res.status(401).json({ error: 'Kroger session expired. Please reconnect.', needsAuth: true });
    }

    const tokenData = await tokenRes.json();

    await supabase.from('profiles').update({
      kroger_access_token: tokenData.access_token,
      kroger_refresh_token: tokenData.refresh_token || profile.kroger_refresh_token,
      kroger_token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    }).eq('id', user.id);

    return res.status(200).json({ accessToken: tokenData.access_token });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  // POST = token refresh (previously kroger-token.js)
  if (req.method === 'POST') {
    return handleTokenRefresh(req, res);
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Dispatch: callback has `code` or `error` query params
  if (req.query.code || req.query.error) {
    return handleCallback(req, res);
  }

  return handleAuthInit(req, res);
}
