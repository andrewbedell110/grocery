// Vercel Serverless Function - Kroger Product Search
// Searches for products matching ingredients and finds cheapest options

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { items } = req.body;
  if (!items?.length) {
    return res.status(400).json({ error: 'No items provided' });
  }

  const clientId = process.env.KROGER_CLIENT_ID;
  const clientSecret = process.env.KROGER_CLIENT_SECRET;
  const locationId = process.env.KROGER_LOCATION_ID; // Smith's store location

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Kroger API not configured' });
  }

  try {
    // Get OAuth token (client credentials for product search)
    const tokenRes = await fetch('https://api.kroger.com/v1/connect/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
      },
      body: 'grant_type=client_credentials&scope=product.compact'
    });

    if (!tokenRes.ok) {
      throw new Error('Failed to authenticate with Kroger');
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Search for each ingredient
    const matches = [];
    const unmatched = [];

    for (const item of items) {
      try {
        const searchTerm = item.name.replace(/[^a-zA-Z0-9 ]/g, '').trim();
        const params = new URLSearchParams({
          'filter.term': searchTerm,
          'filter.limit': '5'
        });

        if (locationId) {
          params.set('filter.locationId', locationId);
        }

        const searchRes = await fetch(
          `https://api.kroger.com/v1/products?${params}`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        );

        if (!searchRes.ok) {
          unmatched.push(item.name);
          continue;
        }

        const searchData = await searchRes.json();
        const products = searchData.data || [];

        if (!products.length) {
          unmatched.push(item.name);
          continue;
        }

        // Find cheapest product that meets quantity needs
        let best = null;
        let bestPrice = Infinity;

        for (const product of products) {
          const price = product.items?.[0]?.price?.regular
            || product.items?.[0]?.price?.promo
            || null;

          if (price && price < bestPrice) {
            bestPrice = price;
            best = {
              ingredient: item.name,
              product_id: product.productId,
              product_name: product.description,
              brand: product.brand,
              size: product.items?.[0]?.size || '',
              price: price,
              image: product.images?.find(i => i.perspective === 'front')?.sizes?.find(s => s.size === 'medium')?.url || null
            };
          }
        }

        if (best) {
          matches.push(best);
        } else {
          unmatched.push(item.name);
        }

      } catch {
        unmatched.push(item.name);
      }
    }

    return res.status(200).json({ matches, unmatched });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
