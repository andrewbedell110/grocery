// Vercel Serverless Function - Stripe Webhook Handler
// Processes subscription events from Stripe

import { createClient } from '@supabase/supabase-js';

export const config = { api: { bodyParser: false } };

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) {
    return res.status(500).json({ error: 'Not configured' });
  }

  const stripe = (await import('stripe')).default(stripeKey);
  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || 'https://ywgexbkyrmwoaijifrnp.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        if (!userId) break;

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          plan: 'premium',
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          discount_code: session.metadata?.discountCode || null,
          started_at: new Date().toISOString(),
          expires_at: null // Active subscription, no expiry
        }, { onConflict: 'user_id' });
        break;
      }

      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Find user by stripe_customer_id
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (sub) {
          const isActive = subscription.status === 'active' || subscription.status === 'trialing';
          await supabase.from('subscriptions').update({
            plan: isActive ? 'premium' : 'free',
            expires_at: isActive ? null : new Date().toISOString()
          }).eq('user_id', sub.user_id);
        }
        break;
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
  }

  res.json({ received: true });
}
