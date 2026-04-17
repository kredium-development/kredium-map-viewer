export default (schema, request) => {
  let buildingId = request.params.buildingId;
  return {
    data: schema.db.buildings.find(buildingId),
  };
}
