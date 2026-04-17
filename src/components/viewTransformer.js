/**
 * Transform an images array into view-based groups.
 * Each view starts at an image that has a view entry and includes
 * subsequent non-view images until the next view image.
 *
 * @param {Array} images
 * @returns {Array}
 */
export const buildViewsFromImages = (images = []) => {
  // Precompute lightweight view signatures to avoid deep frame comparisons later.
  if (!Array.isArray(images) || images.length === 0) {
    return [];
  }

  const hashString = (value) => {
    let hash = 5381;
    for (let i = 0; i < value.length; i += 1) {
      hash = ((hash << 5) + hash) ^ value.charCodeAt(i);
    }
    return hash >>> 0;
  };

  const hasView = (image) => Array.isArray(image?.views) && image.views.length > 0;
  const firstViewIdx = images.findIndex(hasView);

  if (firstViewIdx === -1) {
    const frames = images.map((img) => ({
      url: img.filename,
      order: img.order,
    }));
    const framesHash = frames.reduce((acc, frame) => acc ^ hashString(String(frame.url || "")), 0);
    return [
      {
        key: "view-0",
        view: null,
        image: images[0],
        frames,
        frameCount: frames.length,
        framesHash,
      },
    ];
  }

  const views = [];
  let currentView = null;

  for (let offset = 0; offset < images.length; offset += 1) {
    const i = (firstViewIdx + offset) % images.length;
    const image = images[i];

    if (hasView(image)) {
      const viewMeta = image.views[0] || null;
      const initialHash = hashString(String(image.filename || ""));
      currentView = {
        key: viewMeta?.orientation || `view-${views.length}`,
        view: viewMeta,
        image,
        frames: [
          {
            url: image.filename,
            order: image.order,
          },
        ],
        frameCount: 1,
        framesHash: initialHash,
      };
      views.push(currentView);
      continue;
    }

    if (currentView) {
      currentView.frames.push({
        url: image.filename,
        order: image.order,
      });
      currentView.frameCount += 1;
      currentView.framesHash ^= hashString(String(image.filename || ""));
    }
  }

  return views;
};
