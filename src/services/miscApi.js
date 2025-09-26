import { api } from "./apiSlice";

export const miscApi = api.injectEndpoints({
  endpoints: (build) => ({
    subscribeNewsletter: build.mutation({
      query: (email) => ({
        url: "newsletter/",
        method: "POST",
        body: { email: String(email).trim() },
        // TEMP: if server sends HTML with 400, don't try to JSON-parse it
        responseHandler: async (response) => {
          const ct = response.headers.get("content-type") || "";
          if (ct.includes("application/json")) return response.json();
          const text = await response.text();
          // throw structured error so RTK Query populates error.data
          if (!response.ok) throw { status: response.status, data: text };
          return text;
        },
      }),
    }),
  }),
});

export const { useSubscribeNewsletterMutation } = miscApi;
