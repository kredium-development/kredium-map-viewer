export default async function handler(req, res) {
  const segments = req.query.path;
  const pathStr = Array.isArray(segments) ? segments.join('/') : segments ?? '';
  const url = `https://dnodhcqyo2y9j.cloudfront.net/${pathStr}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://kredium-map-viewer.vercel.app',
      'Origin': 'https://kredium-map-viewer.vercel.app',
    },
  });

  if (response.status !== 200) {
    res.status(response.status).send(`CloudFront error: ${response.status}`);
    return;
  }

  const buffer = await response.arrayBuffer();
  res.setHeader('Content-Type', response.headers.get('content-type') || 'image/webp');
  res.setHeader('Cache-Control', 'no-store');
  res.status(response.status).send(Buffer.from(buffer));
}
