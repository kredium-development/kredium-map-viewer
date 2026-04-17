// Worker image loading is disabled. CloudFront does not return CORS headers,
// so fetch() cannot be used here. All image loading is handled on the main thread.
self.onmessage = (e) => {
  self.postMessage({ message: 'error', error: 'Worker image loading disabled', index: e.data.index, url: e.data.url });
}
