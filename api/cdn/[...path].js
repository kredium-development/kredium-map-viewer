export default async function handler(req, res) {
  const segments = req.query.path;
  const pathStr = Array.isArray(segments) ? segments.join('/') : segments ?? '';
  const url = `https://dnodhcqyo2y9j.cloudfront.net/${pathStr}`;

  const upstream = await fetch(url, {
    headers: {
      Origin: 'https://api.kredium.io',
      Referer: 'https://api.kredium.io/',
    },
  });

  if (!upstream.ok) {
    res.status(upstream.status).end();
    return;
  }

  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

  const buffer = await upstream.arrayBuffer();
  res.end(Buffer.from(buffer));
}
