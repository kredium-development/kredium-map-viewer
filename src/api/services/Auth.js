import HttpClient from "./Http";
import endpoints from "./endpoints";

export default class AuthService {
  /**
   * @param {string} embedId
   * @returns
   */
  async register(embedId, data) {
    return HttpClient.post(
      endpoints.auth.register(embedId).render(), data
    );
  }
};
