// Vercel Serverless Function - Kroger OAuth: Initiate Authorization
// Redirects user to Kroger's authorization page

import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientId = process.env.KROGER_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'Kroger API not configured' });
  }

  const supabaseToken = req.query.state || '';

  // Use hardcoded redirect URI to avoid Vercel host mismatches
  const redirectUri = process.env.KROGER_REDIRECT_URI || 'https://grocery-pied-two.vercel.app/api/kroger-callback';

  // Generate a short random state for CSRF protection
  const state = crypto.randomBytes(16).toString('hex');

  // Store the Supabase token in a secure cookie so we can retrieve it in the callback
  // This avoids putting the long JWT in the URL state parameter
  res.setHeader('Set-Cookie', [
    `kroger_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    `sb_token=${encodeURIComponent(supabaseToken)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  ]);

  const scope = 'cart.basic:write product.compact profile.compact';

  const authUrl = `https://api.kroger.com/v1/connect/oauth2/authorize?` +
    `client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${encodeURIComponent(state)}`;

  res.redirect(302, authUrl);
}
