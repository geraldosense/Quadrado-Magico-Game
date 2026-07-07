/**
 * API de comunidade — proxy serverless (Vercel).
 * Resolve CORS: o jogo no GitHub Pages chama esta API,
 * que guarda/lê as críticas no repositório cloud.
 */
const BIN_URL = 'https://jsonbin-zeta.vercel.app/api/bins/_7tTWtw1xf';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  cors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    if (req.method === 'GET') {
      const response = await fetch(`${BIN_URL}?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) {
        return res.status(response.status).json({ reviews: [], error: 'fetch_failed' });
      }
      const data = await response.json();
      return res.status(200).json(data?.reviews ? data : { reviews: [] });
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const body = req.body?.reviews ? req.body : { reviews: [] };
      const response = await fetch(BIN_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const text = await response.text();
        return res.status(response.status).json({ ok: false, error: text });
      }
      const data = await response.json();
      return res.status(200).json(data?.reviews ? data : body);
    }

    return res.status(405).json({ error: 'method_not_allowed' });
  } catch (err) {
    return res.status(500).json({ reviews: [], error: String(err?.message ?? err) });
  }
}
