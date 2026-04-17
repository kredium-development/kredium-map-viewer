export default (schema, request) => {
  // const organizationId = request.params.organizationId;
  const projectId = request.params.projectId;
  const buildings = schema.db.projects.find(projectId).buildings;

  const filters = {
    number_of_bedrooms: request.queryParams.number_of_bedrooms,
    unit_area_min: request.queryParams.unit_area_min,
    unit_area_max: request.queryParams.unit_area_max,
    price_min: request.queryParams.price_min,
    price_max: request.queryParams.price_max,
  };

  const noFiltersPassedIn = Object.values(filters).every(value => value === undefined);

  if (noFiltersPassedIn) {
    return {
      data: buildings.map(building => building.id),
    };
  }

  const ids = [];
  buildings.forEach(building => {
    const hasMatchingUnit = schema.db.buildings.find(building.id).units.some(unit => {
      const matchesBedrooms = filters.number_of_bedrooms
        ? filters.number_of_bedrooms.includes(unit.number_of_bedrooms)
        : true;
      const matchesUnitArea = filters.unit_area_min !== undefined && filters.unit_area_max !== undefined
        ? unit.unit_area >= filters.unit_area_min && unit.unit_area <= filters.unit_area_max
        : true;
      const matchesPrice = filters.price_min !== undefined && filters.price_max !== undefined
        ? unit.price >= filters.price_min && unit.price <= filters.price_max
        : true;

      return matchesBedrooms && matchesUnitArea && matchesPrice;
    });

    if (hasMatchingUnit) {
      ids.push(building.id);
    }
  });

  return {
    data: ids,
  };
};
