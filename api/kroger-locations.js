// Vercel Serverless Function - Kroger Store Location Lookup

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const zipCode = req.query.zip || '84070';
  const clientId = process.env.KROGER_CLIENT_ID;
  const clientSecret = process.env.KROGER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Kroger API not configured' });
  }

  try {
    // Get OAuth token
    const tokenRes = await fetch('https://api.kroger.com/v1/connect/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
      },
      body: 'grant_type=client_credentials&scope=product.compact'
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      throw new Error(`Auth failed: ${tokenRes.status} - ${err}`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Search for Smith's locations
    const params = new URLSearchParams({
      'filter.zipCode.near': zipCode,
      'filter.limit': '10',
      'filter.chain': 'SMITHS'
    });

    const locRes = await fetch(`https://api.kroger.com/v1/locations?${params}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!locRes.ok) {
      const err = await locRes.text();
      throw new Error(`Location search failed: ${locRes.status} - ${err}`);
    }

    const locData = await locRes.json();
    const locations = (locData.data || []).map(loc => ({
      locationId: loc.locationId,
      name: loc.name,
      address: loc.address?.addressLine1,
      city: loc.address?.city,
      state: loc.address?.state,
      zipCode: loc.address?.zipCode,
      phone: loc.phone
    }));

    return res.status(200).json({ locations });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
