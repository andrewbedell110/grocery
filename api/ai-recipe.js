// Vercel Serverless Function - AI Recipe Search
// Uses Claude API to find/generate recipes

import { findRecipeImage } from './_image-search.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, answers } = req.body;
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
