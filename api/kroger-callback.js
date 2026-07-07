// Vercel Serverless Function - Kroger OAuth Callback
// Exchanges authorization code for tokens and stores them in Supabase

import { createClient } from '@supabase/supabase-js';

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(c => {
    const [key, ...rest] = c.trim().split('=');
    if (key) cookies[key] = decodeURIComponent(rest.join('='));
  });
  return cookies;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

  // Verify CSRF state
  if (!savedState || savedState !== state) {
    return res.redirect(302, '/?kroger_error=' + encodeURIComponent('State mismatch - please try again'));
  }

  // Use hardcoded redirect URI (must match what was sent in the auth request)
  const redirectUri = process.env.KROGER_REDIRECT_URI || 'https://grocery-pied-two.vercel.app/api/kroger-callback';

  // Clear the cookies
  res.setHeader('Set-Cookie', [
    'kroger_state=; Path=/; HttpOnly; Secure; Max-Age=0',
    'sb_token=; Path=/; HttpOnly; Secure; Max-Age=0'
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
    return res.redirect(302, '/?kroger_connected=true');

  } catch (err) {
    console.error('Kroger callback error:', err);
    return res.redirect(302, '/?kroger_error=' + encodeURIComponent(err.message || 'server_error'));
  }
}
