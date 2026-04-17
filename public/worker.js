self.onmessage = (e) => {
  self.postMessage({
    message: 'error',
    error: 'Worker disabled in production',
    index: e.data?.index,
    url: e.data?.url
  });
};
