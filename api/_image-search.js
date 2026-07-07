// Shared helper — search Pexels for a food image matching a recipe title
// Returns a URL string or null. Always best-effort (never throws).

export async function findRecipeImage(recipeName) {
  const key = process.env.PEXELS_API_KEY;
  if (!key || !recipeName) return null;

  try {
    const query = encodeURIComponent(recipeName + ' food');
    const res = await fetch(`https://api.pexels.com/v1/search?query=${query}&per_page=1&orientation=landscape`, {
      headers: { Authorization: key }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.photos?.[0]?.src?.medium || null;
  } catch {
    return null;
  }
}
