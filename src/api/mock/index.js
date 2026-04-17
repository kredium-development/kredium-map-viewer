import {JSONAPISerializer, Server} from "miragejs";
import projects from './fixtures/projects.fixture.js';
import buildings from './fixtures/buildings.fixture.js';
import projectEndpoint from './endpoints/project.endpoint.js';
import buildingEndpoint from './endpoints/building.endpoint.js';
import buildingUnitsEndpoint from './endpoints/building-units.endpoint.js';
import buildingFilterEndpoint from "@/api/mock/endpoints/building-filter.endpoint.js";
import projectFilterEndpoint from "@/api/mock/endpoints/project-filter.endpoint.js";

export default function ({environment = "development"} = {}) {
  return new Server({
    environment,
    logging: true,
    fixtures: {
      projects, buildings
    },
    serializers: {
      application: JSONAPISerializer,
    },

    routes() {
      this.urlPrefix = import.meta.env.VITE_API_URL + '/api';

      // START mock routes
      // - main project page
      this.get(
        "/interactive-maps/:organizationId/projects/:projectId",
        projectEndpoint
      );
      this.get(
        "/interactive-maps/:organizationId/projects/:projectId/filter",
        projectFilterEndpoint
      );

      // - building pages
      this.get(
        "/interactive-maps/:organizationId/buildings/:buildingId",
        buildingEndpoint
      );
      this.get(
        "/interactive-maps/:organizationId/buildings/:buildingId/filter",
        buildingFilterEndpoint
      );
      // - building unit list pagination
      this.get(
        "/interactive-maps/:organizationId/buildings/:buildingId/units",
        buildingUnitsEndpoint
      );
      //- END mock routes

      this.passthrough(`${this.urlPrefix}/**`);
    },
  });
}
