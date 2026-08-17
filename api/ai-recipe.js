// Vercel Serverless Function - AI Recipe Search
// Uses Claude API to find/generate recipes

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
  if (!supabaseToken) return { allowed: true }; // Graceful fallback if no token
  const supabaseUrl = process.env.SUPABASE_URL || 'https://ywgexbkyrmwoaijifrnp.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return { allowed: true };

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data: { user } } = await supabase.auth.getUser(supabaseToken);
  if (!user) return { allowed: true };

  // Check subscription
  const { data: sub } = await supabase.from('subscriptions').select('plan, expires_at').eq('user_id', user.id).single();
  const isPremium = sub?.plan === 'premium' && (!sub.expires_at || new Date(sub.expires_at) > new Date());
  if (isPremium) {
    // Track but don't limit
    const month = new Date().toISOString().slice(0, 7);
    await supabase.from('ai_usage').upsert({ user_id: user.id, month, query_count: 1 }, { onConflict: 'user_id,month' });
    await supabase.rpc('increment_ai_usage', { uid: user.id, m: month }).catch(() => {
      // Fallback if RPC doesn't exist yet
    });
    return { allowed: true };
  }

  // Free tier - check limit
  const month = new Date().toISOString().slice(0, 7);
  const { data: usage } = await supabase.from('ai_usage').select('query_count').eq('user_id', user.id).eq('month', month).single();
  const count = usage?.query_count || 0;

  if (count >= 20) {
    return { allowed: false, message: 'You\'ve used all 20 free AI queries this month. Upgrade to Premium for unlimited access!' };
  }

  // Increment usage
  if (usage) {
    await supabase.from('ai_usage').update({ query_count: count + 1 }).eq('user_id', user.id).eq('month', month);
  } else {
    await supabase.from('ai_usage').insert({ user_id: user.id, month, query_count: 1 });
  }

  return { allowed: true, remaining: 19 - count };
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, answers, supabaseToken } = req.body;

  // Check AI usage limits
  const usageCheck = await checkAndTrackAiUsage(supabaseToken).catch(() => ({ allowed: true }));
  if (!usageCheck.allowed) {
    return res.status(403).json({ error: usageCheck.message, upgrade: true });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'AI service not configured' });
  }

  let prompt;

  if (type === 'random') {
    const cuisines = ['American', 'Mexican', 'Italian', 'Chinese', 'Indian', 'Thai', 'Japanese', 'Korean', 'Mediterranean', 'French', 'Greek', 'Vietnamese', 'Brazilian', 'Moroccan', 'Ethiopian', 'Caribbean', 'Peruvian', 'Spanish', 'Turkish', 'Lebanese'];
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'brunch', 'appetizer', 'side dish'];
    const vibes = ['comfort food', 'healthy', 'quick weeknight', 'impressive dinner party', 'one-pot', 'grilled', 'slow cooker', 'sheet pan', 'fresh and light', 'hearty and filling', 'spicy', 'savory', 'meal prep friendly'];
    const seasons = ['spring', 'summer', 'fall', 'winter'];

    const randCuisine = cuisines[Math.floor(Math.random() * cuisines.length)];
    const randMeal = mealTypes[Math.floor(Math.random() * mealTypes.length)];
    const randVibe = vibes[Math.floor(Math.random() * vibes.length)];
    const randSeason = seasons[Math.floor(Math.random() * seasons.length)];
    const randNumber = Math.floor(Math.random() * 1000);

    prompt = `Find me a specific, real recipe. Use this random seed for variety: #${randNumber}.

Constraints (pick a recipe that fits ALL of these):
- Cuisine: ${randCuisine}
- Meal type: ${randMeal}
- Vibe: ${randVibe}
- Season: ${randSeason}

Pick a well-loved, real recipe that fits these criteria. Be specific - give me a particular named dish, not a generic one. Don't repeat common recipes like chicken stir-fry or spaghetti bolognese unless they truly fit all the criteria above.

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
  "instructions": "Step 1: First step here.\\nStep 2: Second step here.\\nStep 3: Third step here.",
  "image_url": null,
  "source_url": null
}

IMPORTANT: In the instructions field, separate each step with a newline character (\\n). Each step should start with "Step X:" prefix.
Return ONLY valid JSON, nothing else.`;

  } else if (type === 'questionnaire') {
    prompt = `Find me a real recipe that matches these preferences:
- Meal type: ${answers.meal || 'any'}
- Heartiness: ${answers.weight || 'medium'}
- Vibe: ${answers.vibe || 'any'}
- Cuisine: ${answers.cuisine || 'any'}
${answers.extra ? `- Additional preferences: ${answers.extra}` : ''}

Pick a specific, well-known recipe that fits these criteria. Be creative but practical.

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
  "instructions": "Step 1: First step here.\\nStep 2: Second step here.\\nStep 3: Third step here.",
  "image_url": null,
  "source_url": null
}

IMPORTANT: In the instructions field, separate each step with a newline character (\\n). Each step should start with "Step X:" prefix.
Return ONLY valid JSON, nothing else.`;
  } else if (type === 'chat') {
    const { message } = req.body;
    prompt = `The user is asking about recipes. Their message: "${message}"

Find or create a specific recipe that best matches their request. Be creative and helpful.

Return the recipe as JSON with this exact structure:
{
  "title": "Recipe Name",
  "description": "Brief 1-sentence description responding to the user's question",
  "servings": 4,
  "prep_time": 15,
  "cook_time": 30,
  "ingredients": [
    {"quantity": 2, "unit": "cups", "name": "flour"},
    {"quantity": 1, "unit": "lb", "name": "chicken breast"}
  ],
  "instructions": "Step 1: First step here.\\nStep 2: Second step here.\\nStep 3: Third step here.",
  "image_url": null,
  "source_url": null
}

IMPORTANT: In the instructions field, separate each step with a newline character (\\n). Each step should start with "Step X:" prefix.
Return ONLY valid JSON, nothing else.`;
  } else {
    return res.status(400).json({ error: 'Invalid request type' });
  }

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
        max_tokens: 1024,
        temperature: type === 'random' ? 0.9 : 0.7,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content[0]?.text || '';

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse recipe from AI response');
    }

    const recipe = JSON.parse(jsonMatch[0]);

    // Try to find an image via Pexels
    if (!recipe.image_url && recipe.title) {
      recipe.image_url = await findRecipeImage(recipe.title);
    }

    return res.status(200).json(recipe);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
