export default async function handler(req, res) {
  const { path } = req.query;

  if (!path || typeof path !== 'string') {
    return res.status(400).json({ error: 'Missing path parameter' });
  }

  if (path.includes('..') || path.startsWith('/')) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  const url = `https://dnodhcqyo2y9j.cloudfront.net/${path}`;

  let response;
  try {
    response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Origin': 'https://api.kredium.io',
        'Referer': 'https://api.kredium.io/',
      },
    });
  } catch (err) {
    return res.status(502).json({ error: 'Upstream fetch failed', detail: err.message });
  }

  if (response.status === 404) {
    return res.status(404).json({ error: 'Not found upstream' });
  }

  if (response.status !== 200) {
    const body = await response.text().catch(() => '');
    return res.status(response.status).json({ error: `Upstream error ${response.status}`, detail: body.slice(0, 300) });
  }

  const contentType = response.headers.get('content-type') || 'application/octet-stream';

  if (contentType.includes('text/html')) {
    const body = await response.text().catch(() => '');
    return res.status(502).json({ error: 'Upstream returned HTML', detail: body.slice(0, 300) });
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', buffer.length);
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.status(200).end(buffer);
}
