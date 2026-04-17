import Route from "./Route";

export default {
  projects: {
    show: (embedUuid) => new Route("/interactive-map/{embedUuid}/project").param('embedUuid', embedUuid),
    showSubProject: (embedUuid, projetUuid) => new Route("/interactive-map/{embedUuid}/project/{projetUuid}").param('embedUuid', embedUuid).param('projetUuid', projetUuid),
    filter: (embedUuid) => new Route("/interactive-map/{embedUuid}/project/filter").param('embedUuid', embedUuid),
    filterSubProject: (embedUuid, projetUuid) => new Route("/interactive-map/{embedUuid}/project/filter/{projetUuid}").param('embedUuid', embedUuid).param('projetUuid', projetUuid),
  },
  buildings: {
    show: (embedUuid, buildingUuid) => new Route("/interactive-map/{embedUuid}/building/{buildingUuid}")
      .param('embedUuid', embedUuid).param('buildingUuid', buildingUuid),
    filter: (embedUuid, buildingUuid) => new Route("/interactive-map/{embedUuid}/building/{buildingUuid}/filter")
      .param('embedUuid', embedUuid).param('buildingUuid', buildingUuid),
    filterFloors: (embedUuid, buildingUuid) => new Route("/interactive-map/{embedUuid}/building/{buildingUuid}/filter-floors")
      .param('embedUuid', embedUuid).param('buildingUuid', buildingUuid),
    units: (embedUuid, buildingUuid) => new Route("/interactive-map/{embedUuid}/building/{buildingUuid}/units")
      .param('embedUuid', embedUuid).param('buildingUuid', buildingUuid),
  },
  units: {
    paymentPlans: (embedUuid, unitUuid) => new Route("/interactive-map/{embedUuid}/unit/payment-plans/{unitUuid}")
      .param('embedUuid', embedUuid).param('unitUuid', unitUuid),
  },
  auth: {
    register: (embedUuid) => new Route("/interactive-map/{embedUuid}/auth/register").param('embedUuid', embedUuid),
  }
};
