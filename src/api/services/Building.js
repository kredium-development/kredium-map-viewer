import { supabase } from "@/lib/supabase";
import HttpClient from "./Http";
import endpoints from "./endpoints";

export default class BuildingService {
  /**
   * @param {string} embedId
   * @param {number} bId
   * @returns
   */
  async show(embedId, bId) {
    const { data, error } = await supabase.rpc("get_building_map", {
      p_embed: embedId,
      p_building: bId,
    });

    if (error) {
      throw error;
    }

    const payload = data?.data ?? data ?? {};

    if (import.meta.env.DEV) {
      const rewriteUrl = (url) => {
        if (!url) return url;
        for (const origin of ['https://dnodhcqyo2y9j.cloudfront.net', 'https://api.kredium.io']) {
          if (url.startsWith(origin)) return '/proxy-assets' + url.slice(origin.length);
        }
        return url;
      };
      const rewriteImages = (images) => {
        if (!Array.isArray(images)) return;
        images.forEach(img => {
          img.filename = rewriteUrl(img.filename);
          (img.views ?? []).forEach(v => { v.video_filename = rewriteUrl(v.video_filename); });
        });
      };
      rewriteImages(payload?.building?.images);
      rewriteImages(payload?.building?.images_night);
    }

    console.log("FIRST BUILDING IMAGE", payload?.building?.images?.[0]);
    const building = payload?.building ?? {};

    return { data: { ...payload, building } };
  }

  /**
   * @param {string} embedId
   * @param {number} bId
   * @param {URLSearchParams} filters
   * @returns
   */
  async filter(embedId, bId, filters) {
    return HttpClient.get(
      `${endpoints.buildings.filter(embedId, bId).render()}?${filters.toString()}`
    );
  }

  /**
   * @param {string} embedId
   * @param {number} bId
   * @param {URLSearchParams} filters
   * @returns
   */
  async filterFloors(embedId, bId, filters) {
    return HttpClient.get(
      `${endpoints.buildings.filterFloors(embedId, bId).render()}?${filters.toString()}`
    );
  }

  /**
   * @param {string} embedId
   * @param {number} bId
   * @param {URLSearchParams} filters
   * @returns
   */
  async units(embedId, bId, filters) {
    return HttpClient.get(
      `${endpoints.buildings.units(embedId, bId).render()}?${filters.toString()}`
    );
  }
};
