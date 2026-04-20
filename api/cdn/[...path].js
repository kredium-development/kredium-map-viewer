export default async function handler(req, res) {
  const segments = req.query.path;
  const pathStr = Array.isArray(segments) ? segments.join('/') : segments ?? '';
  const url = `https://dnodhcqyo2y9j.cloudfront.net/${pathStr}`;
  const host = req.headers.host;

  const upstream = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Referer': `https://${host}/`,
      'Origin': `https://${host}`,
    },
  });

  if (!upstream.ok) {
    res.status(upstream.status).end(`Upstream error: ${upstream.status} ${upstream.statusText}`);
    return;
  }

  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'no-store');

  const buffer = await upstream.arrayBuffer();
  res.end(Buffer.from(buffer));
}
