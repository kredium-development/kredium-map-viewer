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

    if (import.meta.env.DEV) {
      const rewriteUrl = (url) => {
        if (!url) return url;
        for (const origin of ['https://api.kredium.io', 'https://dnodhcqyo2y9j.cloudfront.net']) {
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
