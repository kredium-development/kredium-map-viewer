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

    if (import.meta.env.DEV) {
      const rewriteUrl = (url) => {
        if (!url) return url;
        for (const origin of ['https://api.kredium.io', CLOUDFRONT]) {
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
      rewriteImages(payload?.project?.images);
      rewriteImages(payload?.project?.images_night);
    } else {
      const normalizeUrl = (url) => {
        if (!url) return url;
        if (url.startsWith('https://api.kredium.io')) return CLOUDFRONT + url.slice('https://api.kredium.io'.length);
        if (!url.startsWith('http')) return CLOUDFRONT + (url.startsWith('/') ? '' : '/') + url;
        return url;
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
    }

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
