export default (schema, request) => {
  let buildingId = request.params.buildingId;
  const page = request.queryParams.page;
  const perPage = request.queryParams.perPage;
  const units = schema.db.buildings.find(buildingId).units;
  return {
    data: units.slice((page - 1) * perPage, page * perPage),
    meta: {
      current_page: Number(page),
      // from: 1,
      last_page: Math.ceil(units.length / perPage),
      per_page: perPage,
      // to: 1,
      total: units.length
    }
  };
}
