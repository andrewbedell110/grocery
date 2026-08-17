// Vercel Serverless Function - Check subscription status and usage
// Returns plan, recipe count, AI usage for the current month

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

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { supabaseToken } = req.body;
  if (!supabaseToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || 'https://ywgexbkyrmwoaijifrnp.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: { user }, error: authErr } = await supabase.auth.getUser(supabaseToken);
  if (authErr || !user) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  try {
    // Get subscription
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Check if premium has expired (for discount-code based subs)
    let plan = 'free';
    if (sub?.plan === 'premium') {
      if (sub.expires_at && new Date(sub.expires_at) < new Date()) {
        // Expired - downgrade
        await supabase.from('subscriptions')
          .update({ plan: 'free' })
          .eq('user_id', user.id);
        plan = 'free';
      } else {
        plan = 'premium';
      }
    }

    // Get recipe count for user's household
    const { data: profile } = await supabase
      .from('profiles')
      .select('household_id')
      .eq('id', user.id)
      .single();

    const { count: recipeCount } = await supabase
      .from('recipes')
      .select('id', { count: 'exact', head: true })
      .eq('household_id', profile.household_id);

    // Get AI usage for current month
    const month = new Date().toISOString().slice(0, 7); // '2026-07'
    const { data: usage } = await supabase
      .from('ai_usage')
      .select('query_count')
      .eq('user_id', user.id)
      .eq('month', month)
      .single();

    return res.json({
      plan,
      recipeCount: recipeCount || 0,
      recipeLimit: plan === 'premium' ? null : 20,
      aiQueriesUsed: usage?.query_count || 0,
      aiQueryLimit: plan === 'premium' ? null : 20,
      expiresAt: sub?.expires_at || null
    });
  } catch (err) {
    console.error('Status check error:', err);
    return res.status(500).json({ error: 'Failed to check status' });
  }
}
