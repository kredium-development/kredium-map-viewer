export default (schema, request) => {
  let buildingId = request.params.buildingId;
  const building = schema.db.buildings.find(buildingId);

  if (request.queryParams.show_all === 'true') {
    return {
      data: building.units.map(unit => unit.id),
    }
  }

  const filters = {
    number_of_bedrooms: request.queryParams.number_of_bedrooms?.map(i => Number(i)),
    area_min: request.queryParams.area_min,
    area_max: request.queryParams.area_max,
    price_min: request.queryParams.price_min,
    price_max: request.queryParams.price_max,
  }

  let noFiltersPassedIn = true;
  const filterKeys = Object.keys(filters);
  for (let i = 0; i < filterKeys.length && noFiltersPassedIn; i++) {
    noFiltersPassedIn = filters[filterKeys[i]] === undefined;
  }

  if (noFiltersPassedIn) {
    return {
      data: building.units.map(unit => unit.id),
    }
  }

  const ids = [];
  for (let i = 0; i < building.units.length; i++) {
    const unit = building.units[i];
    if (filters.number_of_bedrooms?.includes(unit.number_of_bedrooms)) ids.push(unit.id);
    else if (unit.unit_area >= filters.area_min && unit.unit_area <= filters.area_max) ids.push(unit.id);
    else if (unit.price >= filters.price_min && unit.price <= filters.price_max) ids.push(unit.id);
  }

  return {
    data: ids,
  };
}
