import HttpClient from "./Http";
import endpoints from "./endpoints";

export default class UnitService {

  /**
   * @param {string} embedId
   * @param {number} uId
   * @returns
   */
  async paymentPlans(embedId, uId) {
    return HttpClient.get(
      `${endpoints.units.paymentPlans(embedId, uId).render()}`
    );
  }
};
