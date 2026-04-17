async function loadImage(url, index) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image (${response.status}): ${url}`);
  }
  const blob = await response.blob();
  const imageBitmap = await createImageBitmap(blob);
  self.postMessage({ message: 'loaded', imageBitmap, index, url }, [imageBitmap]);
}

self.onmessage = async(e) => {
    await loadImage(e.data.url, e.data.index);
}
