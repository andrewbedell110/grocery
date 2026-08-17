// Vercel Serverless Function - Extract recipe from image using Claude Vision
// Accepts base64 image, returns structured recipe JSON

import { findRecipeImage } from './_image-search.js';
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

async function checkAndTrackAiUsage(supabaseToken) {
  if (!supabaseToken) return { allowed: true };
  const supabaseUrl = process.env.SUPABASE_URL || 'https://ywgexbkyrmwoaijifrnp.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return { allowed: true };
  const supabase = createClient(supabaseUrl, serviceKey);
  const { data: { user } } = await supabase.auth.getUser(supabaseToken);
  if (!user) return { allowed: true };
  const { data: sub } = await supabase.from('subscriptions').select('plan, expires_at').eq('user_id', user.id).single();
  const isPremium = sub?.plan === 'premium' && (!sub.expires_at || new Date(sub.expires_at) > new Date());
  const month = new Date().toISOString().slice(0, 7);
  const { data: usage } = await supabase.from('ai_usage').select('query_count').eq('user_id', user.id).eq('month', month).single();
  const count = usage?.query_count || 0;
  if (!isPremium && count >= 20) {
    return { allowed: false, message: 'You\'ve used all 20 free AI queries this month. Upgrade to Premium for unlimited access!' };
  }
  if (usage) {
    await supabase.from('ai_usage').update({ query_count: count + 1 }).eq('user_id', user.id).eq('month', month);
  } else {
    await supabase.from('ai_usage').insert({ user_id: user.id, month, query_count: 1 });
  }
  return { allowed: true };
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image, mediaType, supabaseToken } = req.body;

  const usageCheck = await checkAndTrackAiUsage(supabaseToken).catch(() => ({ allowed: true }));
  if (!usageCheck.allowed) {
    return res.status(403).json({ error: usageCheck.message, upgrade: true });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'AI service not configured' });
  }

  if (!image) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const prompt = `Look at this image. It could be either:
1. A photo of a dish/food — identify what it is and provide a complete recipe for it
2. A photo of a written, printed, or displayed recipe — transcribe it into a structured recipe

Return the recipe as JSON with this exact structure:
{
  "title": "Recipe Name",
  "description": "Brief 1-sentence description",
  "servings": 4,
  "prep_time": 15,
  "cook_time": 30,
  "ingredients": [
    {"quantity": 2, "unit": "cups", "name": "flour"},
    {"quantity": 1, "unit": "lb", "name": "chicken breast"}
  ],
  "instructions": "Step 1: First step here.\\nStep 2: Second step here.\\nStep 3: Third step here."
}

IMPORTANT: In the instructions field, separate each step with a newline character (\\n). Each step should start with "Step X:" prefix.
Return ONLY valid JSON, nothing else.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType || 'image/jpeg',
                  data: image
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content[0]?.text || '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse recipe from AI response');
    }

    const recipe = JSON.parse(jsonMatch[0]);

    // Find image via Pexels
    if (!recipe.image_url && recipe.title) {
      recipe.image_url = await findRecipeImage(recipe.title);
    }

    return res.status(200).json(recipe);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
