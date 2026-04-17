import { supabase } from "@/lib/supabase";
import HttpClient from "./Http";
import endpoints from "./endpoints";

export default class ProjectService {
  /**
   * @param {string} embedId
   * @param {string} subProjectUuid
   */
  async show(embedId, subProjectUuid = undefined) {
    const { data, error } = await supabase.rpc("get_project_map", { p_embed: embedId });

    if (error) {
      throw error;
    }

    const payload = data?.data ?? data;

    const CLOUDFRONT = 'https://dnodhcqyo2y9j.cloudfront.net';

    const normalizeUrl = (url) => {
      if (!url) return url;
      if (url.startsWith('https://api.kredium.io')) url = url.slice('https://api.kredium.io'.length);
      else if (url.startsWith(CLOUDFRONT)) url = url.slice(CLOUDFRONT.length);
      if (url.startsWith('http')) return url;
      if (!url.startsWith('/')) url = '/' + url;
      if (url.startsWith('/proxy-assets/')) url = url.slice('/proxy-assets'.length);
      return CLOUDFRONT + url;
    };

    const normalizeImages = (images) => {
      if (!Array.isArray(images)) return;
      images.forEach(img => {
        img.filename = normalizeUrl(img.filename);
        (img.views ?? []).forEach(v => { v.video_filename = normalizeUrl(v.video_filename); });
      });
    };
    normalizeImages(payload?.project?.images);
    normalizeImages(payload?.project?.images_night);

    console.log("FIRST PROJECT IMAGE", payload?.project?.images?.[0]);
    console.log("RPC RAW DATA", data);
    console.log("RPC PAYLOAD", payload);
    console.log("PROJECT", payload?.project);
    console.log("IMAGES", payload?.project?.images);
    console.log("IMAGES_NIGHT", payload?.project?.images_night);

    return { data: payload ?? {} };
  }

  /**
   * @param {number} embedId
   * @param {string} subProjectUuid
   * @param {URLSearchParams} filters
   */
  async filter(embedId, filters, subProjectUuid = undefined) {
    return HttpClient.get(
      subProjectUuid ?
        `${endpoints.projects.filterSubProject(embedId, subProjectUuid).render()}?${filters.toString()}` :
        `${endpoints.projects.filter(embedId).render()}?${filters.toString()}`
    );
  }
}
