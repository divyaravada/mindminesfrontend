import { API_BASE } from "../services/apiSlice";

// API_BASE looks like "http://127.0.0.1:8000/api/"
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "/"); // -> "http://127.0.0.1:8000/"

export function toAbsoluteUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url; // already absolute
  return API_ORIGIN + String(url).replace(/^\/+/, ""); // join with backend origin
}
