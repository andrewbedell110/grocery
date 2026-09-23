// Vercel Serverless Function - Alexa Skill Handler + OAuth Account Linking
// Routes: POST /api/alexa (webhook), GET/POST /api/alexa?mode=auth (OAuth login),
//         POST /api/alexa?mode=token (OAuth token exchange)

import { createClient } from '@supabase/supabase-js';

export const config = { api: { bodyParser: false } };

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || 'https://ywgexbkyrmwoaijifrnp.supabase.co';
  return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// ── Alexa Webhook Helpers ─────────────────────────────────────

function speak(text, shouldEndSession = true) {
  return {
    version: '1.0',
    response: {
      outputSpeech: { type: 'PlainText', text },
      shouldEndSession
    }
  };
}

function linkAccountResponse() {
  return {
    version: '1.0',
    response: {
      outputSpeech: { type: 'PlainText', text: 'Please link your GRUNDOW account first. I\'ve sent a card to your Alexa app to get started.' },
      card: { type: 'LinkAccount' },
      shouldEndSession: true
    }
  };
}

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day;
  const sunday = new Date(now);
  sunday.setDate(diff);
  return sunday.toISOString().split('T')[0];
}

// ── Alexa Webhook Handler ─────────────────────────────────────

async function handleAlexaWebhook(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const body = buf.toString('utf8');

  const certUrl = req.headers['signaturecertchainurl'];
  const signature = req.headers['signature-256'] || req.headers['signature'];
  if (!certUrl || !signature) {
    return res.status(400).json({ error: 'Missing signature headers' });
  }

  try {
    const { default: verifier } = await import('alexa-verifier');
    await verifier(certUrl, signature, body);
  } catch (err) {
    console.error('Alexa signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(body);
  const requestType = event.request.type;
  const supabase = getSupabase();

  if (requestType === 'LaunchRequest') {
    return res.json(speak(
      'Welcome to GRUNDOW! You can say things like "add apples to my list", "what\'s on my list", or "remove milk". What would you like to do?',
      false
    ));
  }

  if (requestType === 'SessionEndedRequest') {
    return res.json(speak('', true));
  }

  if (requestType === 'IntentRequest') {
    const intent = event.request.intent;
    const intentName = intent.name;

    if (intentName === 'AMAZON.HelpIntent') {
      return res.json(speak(
        'You can add items by saying "add milk" or "add 2 pounds of chicken". Say "what\'s on my list" to hear your items, or "remove eggs" to cross something off. What would you like to do?',
        false
      ));
    }
    if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
      return res.json(speak('Goodbye! Happy cooking!'));
    }
    if (intentName === 'AMAZON.FallbackIntent') {
      return res.json(speak('I didn\'t understand that. Try saying "add apples" or "what\'s on my list".', false));
    }

    const accessToken = event.session?.user?.accessToken;
    if (!accessToken) {
      return res.json(linkAccountResponse());
    }

    const { data: tokenData } = await supabase
      .from('alexa_tokens')
      .select('user_id')
      .eq('token', accessToken)
      .eq('token_type', 'access')
      .eq('revoked', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (!tokenData) {
      return res.json(linkAccountResponse());
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('household_id')
      .eq('id', tokenData.user_id)
      .maybeSingle();

    if (!profile?.household_id) {
      return res.json(speak('You need to set up a household in the GRUNDOW app first. Open the app and create or join a household.'));
    }

    const householdId = profile.household_id;

    try {
      switch (intentName) {
        case 'AddItemIntent':
          return res.json(await handleAddItem(supabase, householdId, intent));
        case 'RemoveItemIntent':
          return res.json(await handleRemoveItem(supabase, householdId, intent));
        case 'ListItemsIntent':
          return res.json(await handleListItems(supabase, householdId));
        default:
          return res.json(speak('I\'m not sure how to help with that. Try saying "add milk" or "what\'s on my list".', false));
      }
    } catch (err) {
      console.error('Intent handler error:', err);
      return res.json(speak('Sorry, something went wrong. Please try again.'));
    }
  }

  res.json(speak('I\'m not sure how to help with that.'));
}

// ── Grocery List Intent Handlers ──────────────────────────────

async function getOrCreatePlan(supabase, householdId) {
  const weekStart = getWeekStart();

  const { data, error } = await supabase
    .from('weekly_plans')
    .upsert(
      { household_id: householdId, week_start: weekStart },
      { onConflict: 'household_id,week_start', ignoreDuplicates: true }
    )
    .select('id')
    .single();

  if (error) {
    const { data: existing } = await supabase
      .from('weekly_plans')
      .select('id')
      .eq('household_id', householdId)
      .eq('week_start', weekStart)
      .maybeSingle();
    if (existing) return existing.id;

    const { data: created } = await supabase
      .from('weekly_plans')
      .insert({ household_id: householdId, week_start: weekStart })
      .select('id')
      .single();
    return created?.id;
  }

  return data?.id;
}

async function handleAddItem(supabase, householdId, intent) {
  const item = intent.slots?.item?.value;
  if (!item) {
    return speak('What item would you like to add? Try saying "add milk" or "add apples".', false);
  }

  const quantity = intent.slots?.quantity?.value ? parseFloat(intent.slots.quantity.value) : null;
  const unit = intent.slots?.unit?.value || null;

  const planId = await getOrCreatePlan(supabase, householdId);
  if (!planId) {
    return speak('Sorry, I couldn\'t access your grocery list. Please try again.');
  }

  const { data: existing } = await supabase
    .from('shopping_list_items')
    .select('id, quantity, unit')
    .eq('plan_id', planId)
    .ilike('ingredient_name', item)
    .eq('already_have', false)
    .maybeSingle();

  if (existing) {
    if (quantity && existing.quantity) {
      const newQty = existing.quantity + quantity;
      await supabase.from('shopping_list_items')
        .update({ quantity: newQty, unit: unit || existing.unit })
        .eq('id', existing.id);
      const unitStr = unit || existing.unit || '';
      return speak(`Updated ${item} to ${newQty} ${unitStr} on your grocery list.`.trim());
    }
    return speak(`${item} is already on your grocery list.`);
  }

  await supabase.from('shopping_list_items').insert({
    plan_id: planId,
    ingredient_name: item,
    quantity,
    unit,
    already_have: false
  });

  const qtyStr = quantity ? `${quantity} ${unit || ''} of `.trim() + ' ' : '';
  return speak(`Added ${qtyStr}${item} to your grocery list.`.trim());
}

async function handleRemoveItem(supabase, householdId, intent) {
  const item = intent.slots?.item?.value;
  if (!item) {
    return speak('What item would you like to remove? Try saying "remove milk".', false);
  }

  const weekStart = getWeekStart();
  const { data: plan } = await supabase
    .from('weekly_plans')
    .select('id')
    .eq('household_id', householdId)
    .eq('week_start', weekStart)
    .maybeSingle();

  if (!plan) {
    return speak('Your grocery list is empty. There\'s nothing to remove.');
  }

  const { data: existing } = await supabase
    .from('shopping_list_items')
    .select('id')
    .eq('plan_id', plan.id)
    .ilike('ingredient_name', item)
    .eq('already_have', false)
    .maybeSingle();

  if (!existing) {
    return speak(`I couldn't find ${item} on your grocery list.`);
  }

  await supabase.from('shopping_list_items')
    .update({ already_have: true })
    .eq('id', existing.id);

  return speak(`Crossed off ${item} from your grocery list.`);
}

async function handleListItems(supabase, householdId) {
  const weekStart = getWeekStart();
  const { data: plan } = await supabase
    .from('weekly_plans')
    .select('id')
    .eq('household_id', householdId)
    .eq('week_start', weekStart)
    .maybeSingle();

  if (!plan) {
    return speak('Your grocery list is empty. Say "add milk" to get started.', false);
  }

  const { data: items } = await supabase
    .from('shopping_list_items')
    .select('ingredient_name, quantity, unit')
    .eq('plan_id', plan.id)
    .eq('already_have', false)
    .order('created_at', { ascending: true });

  if (!items || items.length === 0) {
    return speak('Your grocery list is empty. Say "add milk" to get started.', false);
  }

  const itemList = items.map(i => {
    if (i.quantity && i.unit) return `${i.quantity} ${i.unit} of ${i.ingredient_name}`;
    if (i.quantity) return `${i.quantity} ${i.ingredient_name}`;
    return i.ingredient_name;
  });

  const count = items.length;
  const itemWord = count === 1 ? 'item' : 'items';

  if (count <= 5) {
    return speak(`You have ${count} ${itemWord} on your list: ${itemList.join(', ')}.`);
  }

  const first5 = itemList.slice(0, 5).join(', ');
  return speak(`You have ${count} ${itemWord} on your list. Here are the first 5: ${first5}. Open the GRUNDOW app to see the full list.`);
}

// ── OAuth Authorization Handler ───────────────────────────────

const ALLOWED_REDIRECT_PREFIXES = [
  'https://pitangui.amazon.com',
  'https://layla.amazon.com',
  'https://alexa.amazon.co.jp'
];

function escapeAttr(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function loginPage(state, redirectUri, clientId, error) {
  const errorHtml = error
    ? `<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:12px;margin-bottom:16px;color:#991b1b;font-size:14px;">${error}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link GRUNDOW to Alexa</title>
  <link href="https://fonts.googleapis.com/css2?family=Literata:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #FDFCF0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: #FAF9F0;
      border-radius: 16px;
      padding: 32px 24px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 4px 24px rgba(45,106,79,0.06);
      border: 1px solid rgba(27,67,50,0.05);
    }
    .logo {
      font-family: 'Literata', serif;
      font-size: 28px;
      font-weight: 700;
      color: #1B4332;
      text-align: center;
      margin-bottom: 8px;
    }
    .subtitle {
      text-align: center;
      color: #666;
      font-size: 14px;
      margin-bottom: 24px;
    }
    label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #1B4332;
      margin-bottom: 6px;
    }
    input {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid #ddd;
      border-radius: 10px;
      font-size: 15px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      margin-bottom: 16px;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus { border-color: #0f5238; }
    button {
      width: 100%;
      padding: 14px;
      background: #FF7043;
      color: white;
      border: none;
      border-radius: 999px;
      font-size: 15px;
      font-weight: 600;
      font-family: 'Plus Jakarta Sans', sans-serif;
      cursor: pointer;
      transition: transform 0.1s;
    }
    button:active { transform: scale(0.97); }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">GRUNDOW</div>
    <p class="subtitle">Sign in to link your account with Alexa</p>
    ${errorHtml}
    <form method="POST" action="/api/alexa?mode=auth">
      <input type="hidden" name="state" value="${escapeAttr(state)}">
      <input type="hidden" name="redirect_uri" value="${escapeAttr(redirectUri)}">
      <input type="hidden" name="client_id" value="${escapeAttr(clientId)}">
      <label for="email">Email</label>
      <input type="email" id="email" name="email" required autocomplete="email">
      <label for="password">Password</label>
      <input type="password" id="password" name="password" required autocomplete="current-password">
      <button type="submit">Sign In & Link Account</button>
    </form>
  </div>
</body>
</html>`;
}

async function handleAuthGet(req, res) {
  const { state, redirect_uri, client_id } = req.query;

  if (!state || !redirect_uri || !client_id) {
    return res.status(400).send('Missing required OAuth parameters.');
  }
  if (!ALLOWED_REDIRECT_PREFIXES.some(prefix => redirect_uri.startsWith(prefix))) {
    return res.status(400).send('Invalid redirect URI.');
  }

  res.setHeader('Content-Type', 'text/html');
  return res.send(loginPage(state, redirect_uri, client_id, null));
}

async function handleAuthPost(req, res, rawBody) {
  const body = Object.fromEntries(new URLSearchParams(rawBody));
  const { email, password, state, redirect_uri, client_id } = body;

  if (!email || !password || !state || !redirect_uri || !client_id) {
    res.setHeader('Content-Type', 'text/html');
    return res.send(loginPage(state || '', redirect_uri || '', client_id || '', 'Please fill in all fields.'));
  }

  if (!ALLOWED_REDIRECT_PREFIXES.some(prefix => redirect_uri.startsWith(prefix))) {
    return res.status(400).send('Invalid redirect URI.');
  }

  const supabase = getSupabase();
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

  if (authError || !authData?.user) {
    res.setHeader('Content-Type', 'text/html');
    return res.send(loginPage(state, redirect_uri, client_id, 'Invalid email or password. Please try again.'));
  }

  const code = crypto.randomUUID();

  await supabase.from('alexa_auth_codes').insert({
    code,
    user_id: authData.user.id,
    redirect_uri,
    client_id,
    created_at: new Date().toISOString(),
    used: false
  });

  const redirectUrl = `${redirect_uri}?state=${encodeURIComponent(state)}&code=${encodeURIComponent(code)}`;
  return res.redirect(302, redirectUrl);
}

// ── OAuth Token Exchange Handler ──────────────────────────────

async function handleTokenExchange(req, res, rawBody) {
  const body = Object.fromEntries(new URLSearchParams(rawBody));
  const { grant_type, code, refresh_token } = body;

  const supabase = getSupabase();

  if (grant_type === 'authorization_code') {
    if (!code) {
      return res.status(400).json({ error: 'invalid_request', error_description: 'Missing code' });
    }

    const { data: authCode } = await supabase
      .from('alexa_auth_codes')
      .select('*')
      .eq('code', code)
      .eq('used', false)
      .maybeSingle();

    if (!authCode) {
      return res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid or expired code' });
    }

    const codeAge = Date.now() - new Date(authCode.created_at).getTime();
    if (codeAge > 10 * 60 * 1000) {
      await supabase.from('alexa_auth_codes').update({ used: true }).eq('code', code);
      return res.status(400).json({ error: 'invalid_grant', error_description: 'Code expired' });
    }

    await supabase.from('alexa_auth_codes').update({ used: true }).eq('code', code);

    const accessToken = crypto.randomUUID();
    const refreshToken = crypto.randomUUID();
    const expiresIn = 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    await supabase.from('alexa_tokens').insert({
      token: accessToken,
      user_id: authCode.user_id,
      token_type: 'access',
      refresh_token_ref: refreshToken,
      expires_at: expiresAt,
      revoked: false
    });

    await supabase.from('alexa_tokens').insert({
      token: refreshToken,
      user_id: authCode.user_id,
      token_type: 'refresh',
      refresh_token_ref: null,
      expires_at: null,
      revoked: false
    });

    return res.json({
      access_token: accessToken,
      token_type: 'bearer',
      expires_in: expiresIn,
      refresh_token: refreshToken
    });
  }

  if (grant_type === 'refresh_token') {
    if (!refresh_token) {
      return res.status(400).json({ error: 'invalid_request', error_description: 'Missing refresh_token' });
    }

    const { data: tokenData } = await supabase
      .from('alexa_tokens')
      .select('user_id')
      .eq('token', refresh_token)
      .eq('token_type', 'refresh')
      .eq('revoked', false)
      .maybeSingle();

    if (!tokenData) {
      return res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid refresh token' });
    }

    const newAccessToken = crypto.randomUUID();
    const expiresIn = 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    await supabase.from('alexa_tokens').insert({
      token: newAccessToken,
      user_id: tokenData.user_id,
      token_type: 'access',
      refresh_token_ref: refresh_token,
      expires_at: expiresAt,
      revoked: false
    });

    return res.json({
      access_token: newAccessToken,
      token_type: 'bearer',
      expires_in: expiresIn,
      refresh_token: refresh_token
    });
  }

  res.status(400).json({ error: 'unsupported_grant_type' });
}

// ── Main Router ───────────────────────────────────────────────

export default async function handler(req, res) {
  const mode = req.query.mode;

  // OAuth authorization page (GET = show login, POST = submit credentials)
  if (mode === 'auth') {
    if (req.method === 'GET') {
      return handleAuthGet(req, res);
    }
    if (req.method === 'POST') {
      const buf = await buffer(req);
      return handleAuthPost(req, res, buf.toString('utf8'));
    }
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // OAuth token exchange (POST only)
  if (mode === 'token') {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    const buf = await buffer(req);
    return handleTokenExchange(req, res, buf.toString('utf8'));
  }

  // Default: Alexa webhook handler
  return handleAlexaWebhook(req, res);
}
