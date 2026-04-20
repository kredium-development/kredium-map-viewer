export default async function handler(req, res) {
  console.log('CDN FUNCTION HIT', { url: req.url, query: req.query });

  const segments = req.query.path;
  const pathStr = Array.isArray(segments) ? segments.join('/') : segments ?? '';

  // Temporary: confirm function is reachable before fetching CloudFront
  if (req.query.ping === '1') {
    res.status(200).send('OK');
    return;
  }

  const url = `https://dnodhcqyo2y9j.cloudfront.net/${pathStr}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://kredium-map-viewer.vercel.app',
      'Origin': 'https://kredium-map-viewer.vercel.app',
    },
  });

  console.log('[cdn-proxy] url:', url);
  console.log('[cdn-proxy] status:', response.status);
  console.log('[cdn-proxy] content-type:', response.headers.get('content-type'));
  console.log('[cdn-proxy] content-length:', response.headers.get('content-length'));

  if (response.status !== 200) {
    res.status(response.status).send(`CloudFront error: ${response.status}`);
    return;
  }

  const contentType = response.headers.get('content-type') || 'image/webp';
  if (contentType.includes('text/html')) {
    const body = await response.text();
    console.log('[cdn-proxy] HTML body (first 500):', body.slice(0, 500));
    res.status(502).send(`CloudFront HTML error [${response.status}]: ${body.slice(0, 300)}`);
    return;
  }

  const buffer = await response.arrayBuffer();
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-CDN-Proxy', 'hit');
  res.status(200).send(Buffer.from(buffer));
}
