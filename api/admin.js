// Vercel Serverless Function - Admin Dashboard API
// Provides admin data: users, subscriptions, feedback, discount codes

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

  const { supabaseToken, action, data } = req.body;
  if (!supabaseToken) return res.status(401).json({ error: 'Not authenticated' });

  const supabaseUrl = process.env.SUPABASE_URL || 'https://ywgexbkyrmwoaijifrnp.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return res.status(500).json({ error: 'Not configured' });

  const supabase = createClient(supabaseUrl, serviceKey);

  // Verify admin (check against ADMIN_EMAIL env var)
  const { data: { user }, error: authErr } = await supabase.auth.getUser(supabaseToken);
  if (authErr || !user) return res.status(401).json({ error: 'Invalid session' });

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  try {
    switch (action) {
      case 'dashboard': {
        // Get user count
        const { count: userCount } = await supabase.from('profiles').select('id', { count: 'exact', head: true });

        // Get subscription counts
        const { data: subs } = await supabase.from('subscriptions').select('plan');
        const premiumCount = subs?.filter(s => s.plan === 'premium').length || 0;

        // Get recent feedback
        const { data: feedback } = await supabase
          .from('feedback')
          .select('*, profiles(email, display_name)')
          .order('created_at', { ascending: false })
          .limit(50);

        // Get discount codes
        const { data: codes } = await supabase.from('discount_codes').select('*').order('created_at', { ascending: false });

        // Get recipe count
        const { count: recipeCount } = await supabase.from('recipes').select('id', { count: 'exact', head: true });

        return res.json({
          userCount: userCount || 0,
          premiumCount,
          recipeCount: recipeCount || 0,
          feedback: feedback || [],
          discountCodes: codes || []
        });
      }

      case 'create-discount': {
        const { code, discountPercent, durationMonths, maxUses } = data;
        if (!code) return res.status(400).json({ error: 'Code required' });

        const { error } = await supabase.from('discount_codes').insert({
          code: code.toUpperCase(),
          discount_percent: discountPercent || 100,
          duration_months: durationMonths || 1,
          max_uses: maxUses || null,
          active: true
        });
        if (error) return res.status(400).json({ error: error.message });
        return res.json({ success: true });
      }

      case 'toggle-discount': {
        const { codeId, active } = data;
        await supabase.from('discount_codes').update({ active }).eq('id', codeId);
        return res.json({ success: true });
      }

      case 'update-feedback': {
        const { feedbackId, status, adminNotes } = data;
        await supabase.from('feedback').update({ status, admin_notes: adminNotes }).eq('id', feedbackId);
        return res.json({ success: true });
      }

      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (err) {
    console.error('Admin error:', err);
    return res.status(500).json({ error: err.message });
  }
}
