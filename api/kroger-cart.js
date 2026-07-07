// Vercel Serverless Function - Kroger Cart Management
// Adds items to user's Kroger/Smith's cart
// Requires user's OAuth token (cart.basic:write scope)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { items, krogerAccessToken } = req.body;

  if (!items?.length) {
    return res.status(400).json({ error: 'No items to add' });
  }

  if (!krogerAccessToken) {
    return res.status(401).json({
      error: 'Kroger authentication required. Please connect your Kroger account.'
    });
  }

  try {
    // Add items to cart using user's OAuth token
    const cartRes = await fetch('https://api.kroger.com/v1/cart/add', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${krogerAccessToken}`
      },
      body: JSON.stringify({
        items: items.map(item => ({
          upc: item.productId,
          quantity: item.quantity || 1
        }))
      })
    });

    if (!cartRes.ok) {
      const errorText = await cartRes.text();
      if (cartRes.status === 401) {
        throw new Error('Kroger session expired. Please reconnect your account.');
      }
      throw new Error(`Failed to add to cart: ${cartRes.status}`);
    }

    return res.status(200).json({
      success: true,
      message: `${items.length} items added to your Smith's cart`
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
