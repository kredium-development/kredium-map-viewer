export default (svg) => {
  const svgMapUnitIdToPath = {};
  const allPaths = svg.querySelectorAll('path');

  // Go through all <path> elements
  allPaths.forEach(path => {
    path.classList.add('tw-block', 'tw-w-full', 'tw-h-full', 'tw-fill-transparent');

    // map each path element based off of it's data-id
    const pathId = path.getAttribute('data-id')

    if(pathId) {
      svgMapUnitIdToPath[pathId] = path;
    }
  });

  return svgMapUnitIdToPath;
}
