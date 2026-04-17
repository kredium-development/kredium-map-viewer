export default (clientX, clientY, parentRect, child) => {
  // Calculate the click coordinates relative to the container
  let x = clientX;
  let y = clientY;

  // Get the dimensions of the marker
  const markerWidth = 190; // Hardcoded marker width!
  const markerHeight = child.offsetHeight;

  // Adjust coordinates to center the marker on the click point
  x = x - (markerWidth / 2);
  y = y - (markerHeight / 2);

  // Clamp the coordinates to prevent overflow
  const padding = 20; // Padding to prevent overflow
  x = Math.max(0, Math.min(x, window.innerWidth - markerWidth - padding));
  y = Math.max(0, Math.min(y, window.innerHeight - markerHeight - padding));

  child.style.position = 'fixed';
  child.style.left = x + 'px';
  child.style.top = y + 'px';
}
