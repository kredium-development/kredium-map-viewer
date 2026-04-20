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

    const CLOUDFRONT = 'https://dnodhcqyo2y9j.cloudfront.net';

    const normalizeUrl = (url) => {
      if (!url) return url;
      if (url.startsWith('https://api.kredium.io')) url = url.slice('https://api.kredium.io'.length);
      else if (url.startsWith(CLOUDFRONT)) url = url.slice(CLOUDFRONT.length);
      if (url.startsWith('http')) {
        try {
          const parsed = new URL(url);
          url = parsed.pathname;
        } catch (e) {
          return url;
        }
      }
      if (!url.startsWith('/')) url = '/' + url;
      if (url.startsWith('/proxy-assets/')) url = url.slice('/proxy-assets'.length);
      const cleanUrl = url.replace(/(\.(webp|jpg|png)).*$/, '$1');
      return '/api/cdn' + cleanUrl + '?t=' + Date.now();
    };

    const normalizeImages = (images) => {
      if (!Array.isArray(images)) return;
      images.forEach(img => {
        img.filename = normalizeUrl(img.filename);
        (img.views ?? []).forEach(v => { v.video_filename = normalizeUrl(v.video_filename); });
      });
    };
    normalizeImages(payload?.building?.images);
    normalizeImages(payload?.building?.images_night);

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
