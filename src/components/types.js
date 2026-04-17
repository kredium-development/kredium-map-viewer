/**
 * @typedef {object} ImageItem
 * @property {boolean} hasView - Indicates if the image has a view.
 * @property {string} url - URL of the image.
 * @property {number} order - Order of the image.
 */

/**
 * @typedef {ImageItem[]} Images - Collection of image items.
 */


/**
 * @typedef {object} ViewImageItem
 * @property {number} index - Index of the image.
 * @property {string} url - URL of the image.
 */

/**
 * @typedef {object} ViewItem
 * @property {number} startIndex - Starting index of the view.
 * @property {ViewImageItem[]} images - Array of image URLs.
 * @property {number} loaded - Number of loaded images.
 */

/**
 * @typedef {ViewItem[]} Views - Collection of view items.
 */
