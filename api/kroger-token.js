// Vercel Serverless Function - Kroger Token Refresh
// Returns a valid Kroger access token for the authenticated user

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    // Verify user
    const { data: { user }, error: authErr } = await supabase.auth.getUser(supabaseToken);
    if (authErr || !user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Get stored tokens
    const { data: profile } = await supabase
      .from('profiles')
      .select('kroger_access_token, kroger_refresh_token, kroger_token_expires_at')
      .eq('id', user.id)
      .single();

    if (!profile?.kroger_refresh_token) {
      return res.status(401).json({ error: 'Kroger account not connected', needsAuth: true });
    }

    // Check if token is still valid (with 5 min buffer)
    const expiresAt = new Date(profile.kroger_token_expires_at);
    if (expiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
      return res.status(200).json({ accessToken: profile.kroger_access_token });
    }

    // Token expired, refresh it
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
      // Refresh token expired, need re-auth
      await supabase.from('profiles').update({
        kroger_access_token: null,
        kroger_refresh_token: null,
        kroger_token_expires_at: null
      }).eq('id', user.id);
      return res.status(401).json({ error: 'Kroger session expired. Please reconnect.', needsAuth: true });
    }

    const tokenData = await tokenRes.json();

    // Store new tokens
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
