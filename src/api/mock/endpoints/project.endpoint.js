export default (schema, request) => {
  let projectId = request.params.projectId;
  return {
    data: schema.db.projects.find(projectId),
  };
}
