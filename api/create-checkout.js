// Vercel Serverless Function - Create Stripe Checkout Session
// Creates a $4/month subscription checkout

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

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(500).json({ error: 'Payment system not configured' });
  }

  const { supabaseToken, discountCode } = req.body;
  if (!supabaseToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Verify user
  const supabaseUrl = process.env.SUPABASE_URL || 'https://ywgexbkyrmwoaijifrnp.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error: authErr } = await supabase.auth.getUser(supabaseToken);
  if (authErr || !user) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  try {
    // Check for discount code
    let trialDays = 0;
    let couponId = null;
    if (discountCode) {
      const { data: code } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', discountCode.toUpperCase())
        .eq('active', true)
        .single();

      if (!code) {
        return res.status(400).json({ error: 'Invalid discount code' });
      }
      if (code.max_uses && code.current_uses >= code.max_uses) {
        return res.status(400).json({ error: 'Discount code has been fully redeemed' });
      }

      // For 100% discount, grant free premium via DB directly
      if (code.discount_percent === 100) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + code.duration_months);

        await supabase.from('subscriptions').upsert({
          user_id: user.id,
          plan: 'premium',
          discount_code: discountCode.toUpperCase(),
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString()
        }, { onConflict: 'user_id' });

        // Increment usage
        await supabase.from('discount_codes')
          .update({ current_uses: code.current_uses + 1 })
          .eq('id', code.id);

        return res.json({ success: true, free: true, message: `Premium activated for ${code.duration_months} month(s)!` });
      }

      // For partial discounts, create a Stripe coupon
      // We'll use trial_period_days as a simple approach for partial discounts
      trialDays = code.duration_months * 30;
    }

    // Create Stripe checkout session
    const stripe = (await import('stripe')).default(stripeKey);

    // Get or create Stripe customer
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId = existingSub?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
    }

    const sessionParams = {
      customer: customerId,
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'GRUNDOW Premium' },
          unit_amount: 400, // $4.00
          recurring: { interval: 'month' }
        },
        quantity: 1
      }],
      success_url: `${req.headers.origin || 'https://grundow.vercel.app'}/?subscription=success`,
      cancel_url: `${req.headers.origin || 'https://grundow.vercel.app'}/?subscription=cancelled`,
      metadata: { userId: user.id, discountCode: discountCode || '' }
    };

    if (trialDays > 0) {
      sessionParams.subscription_data = { trial_period_days: trialDays };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
