import {workerLoadImage} from "@/worker";

/**
 * Given the images array compute all the views and image between
 * each view. Because the animation is circular we need to compute
 * in the clockwise direction.
 * @param {Images} images
 * @returns {Views}
 */
export const computeImageViews = (images) => {
  if (images.length === 0) {
    return [];
  }

  // Find the first image that has a view to use as starting point
  const firstViewIdx = images.findIndex(img => img.hasView);

  // If no views exist, return a single view containing all images
  if (firstViewIdx === -1) {
    return [{
      startIndex: 0,
      images: images.map((img, i) => ({ index: i, url: img.url })),
      loaded: false,
    }];
  }

  const views = [];
  let currentView = null;

  // Iterate through images starting from the first view, wrapping around circularly
  for (let offset = 0; offset < images.length; offset++) {
    const i = (firstViewIdx + offset) % images.length;
    const image = images[i];

    if (image.hasView) {
      // Start a new view
      currentView = {
        startIndex: i,
        images: [{
          index: i,
          url: image.url,
        }],
        loaded: false,
      };
      views.push(currentView);
    } else if (currentView) {
      // Add non-view images to the current view
      currentView.images.push({
        index: i,
        url: image.url,
      });
    }
  }

  return views;
}

/**
 * A queue for preloading images to control the number of concurrent connections
 * and avoid overwhelming the browser.
 * @param {number} maxConnections - Maximum number of concurrent connections
 * @param {number} delayBetweenLoads - Delay between image loads in milliseconds
 * @returns {Object} - Queue control functions
 */
const createImagePreloadQueue = (maxConnections = 4, delayBetweenLoads = 50) => {
  let queue = [];
  let processing = 0;

  /**
   * Process the queue of images
   * @returns {Promise} - Resolves when all queued images are loaded
   */
  const processQueue = () => {
    if (processing >= maxConnections || queue.length === 0) {
      return Promise.resolve();
    }

    const item = queue.shift();
    processing++;

    setTimeout(async () => {
      const response = await fetch(item.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image (${response.status}): ${item.url}`);
      }
      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.startsWith('image/')) {
        const preview = await response.clone().text().then(t => t.slice(0, 200)).catch(() => '');
        throw new Error(`Expected image, got "${contentType}" for ${item.url}. Body: ${preview}`);
      }
      const blob = await response.blob();
      const imageBitmap = await createImageBitmap(blob);
      item?.callback({image: imageBitmap, index: item.index, url: item.url});
      processing--;
      processQueue();
    }, delayBetweenLoads);
  };

  return {
    /**
     * Add multiple images to the preload queue
     * @param {Array} images - Array of image objects with url and index
     * @returns {Array<Promise>} - Array of promises that resolve when each image is loaded
     */
    addBatch: (images) => {
      const promises = images.map(img => {
        return new Promise(resolve => {
          queue.push({
            url: img.url,
            index: img.index,
            callback: resolve
          });
        });
      });

      // Start processing the queue
      processQueue();

      return promises;
    },

    /**
     * Clear the queue
     */
    clear: () => {
      queue = [];
    }
  };
};

const imagePreloadQueue = createImagePreloadQueue(4, 50);

/**
 * Preload images either by web worker or if on mobile (useWorker flag)
 * use the standard image constructor.
 * @param {Array<{url: string, index: number}>} images - Array of image objects with url and index
 * @param {boolean} useWorker - Whether to use web worker for loading
 * @returns {Promise[]} - Array of promises that resolve when images are loaded
 */
export const preloadImages = (images, useWorker = true) => {
  if (useWorker) {
    return images.map(img => workerLoadImage(img.url, img.index));
  } else {
    return imagePreloadQueue.addBatch(images);
  }
}
