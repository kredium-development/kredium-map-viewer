/**
 * Converts a snake_case string to title case.
 *
 * @param {string} snakeCaseString The snake_case string to be converted.
 * @returns {string} The converted title case string.
 */
export const snakeCaseToTitleCase = (snakeCaseString) => {
  if(!snakeCaseString) return '';

  return snakeCaseString
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}


/**
 * Wraps an index around the given length to ensure it stays within bounds.
 *
 * @param {number} index - The index to be wrapped
 * @param {number} len - The length of the array or list
 * @returns {number} - The wrapped index value that is always in the range [0, len-1]
 */
export const wrapIndex = (index, len) => {
  return (index + len) % len;
}


/**
 * Detects if the current browser is mobile based on user agent or screen size.
 *
 * @returns {boolean} True if the browser is detected as mobile, false otherwise.
 */
export const isMobile = () => {
  // Check via user agent (not 100% reliable but useful as first check)
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  if (
    /android|iPad|iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
  ) {
    return true;
  }

  // Additional check using screen width (more reliable in many cases)
  return window.innerWidth <= 768;
};


/**
 * Checks if the user has enabled "Save Data" mode in their browser.
 * This can be used to detect if a user is requesting content to be delivered with reduced data usage.
 *
 * @returns {boolean} Returns true if the Save Data feature is enabled, false otherwise.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/saveData
 * @see https://web.dev/articles/optimizing-content-efficiency-save-data?hl=en
 */
export const saveDataConnection = () => {
  return 'connection' in navigator && navigator.connection.saveData;
}


/**
 * Checks if the user has reduced motion preferences enabled.
 * This function checks both direct comparison and 'matches' property
 * to ensure compatibility across browsers.
 *
 * @returns {boolean} True if reduced motion is preferred, false otherwise
 */
export const isReducedMotion = () => window.matchMedia(`(prefers-reduced-motion: reduce)`) === true || window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

/**
 * Retrieves a boolean value from a URL query parameter, with support for various truthy/falsy formats.
 *
 * @param {string} paramName - The name of the query parameter to retrieve
 * @param {boolean} [defaultValue=false] - Value to return if parameter is not present or invalid
 * @returns {boolean} The boolean value of the parameter, or the default value if not found or invalid
 *
 * @example
 * // URL: "http://example.com?showDetails=true"
 * const shouldShowDetails = getQueryParamBoolean('showDetails'); // returns true
 *
 * @example
 * // URL: "http://example.com?debug=1"
 * const isDebugMode = getQueryParamBoolean('debug'); // returns true
 *
 * @example
 * // URL: "http://example.com"
 * const isVisible = getQueryParamBoolean('visible', true); // returns true (default)
 */
export const getQueryParamBoolean = (paramName, defaultValue = false) => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const param = urlParams.get(paramName);

    if (param === null) return defaultValue;

    // Convert to lowercase string for comparison
    const normalizedParam = param.toLowerCase();

    // Check for truthy values
    if (normalizedParam === 'true' || normalizedParam === '1' || normalizedParam === 'yes') {
      return true;
    }

    // Check for falsy values
    if (normalizedParam === 'false' || normalizedParam === '0' || normalizedParam === 'no') {
      return false;
    }

    // If parameter exists but with invalid value, return the default
    return defaultValue;
  } catch (error) {
    console.error(`Error parsing query parameter '${paramName}':`, error);
    return defaultValue;
  }
};
