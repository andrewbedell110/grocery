// Vercel Serverless Function - Extract recipe from image using Claude Vision
// Accepts base64 image, returns structured recipe JSON

import { findRecipeImage } from './_image-search.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image, mediaType } = req.body;
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
