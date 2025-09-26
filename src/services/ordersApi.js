import { api } from "./baseApi";

export const ordersApi = api.injectEndpoints({
  endpoints: (build) => ({
    getOrders: build.query({
      query: () => "dashboard/orders/",
      providesTags: (result) =>
        result?.results
          ? [
              ...result.results.map((o) => ({ type: "Order", id: o.id })),
              { type: "Orders", id: "LIST" },
            ]
          : [{ type: "Orders", id: "LIST" }],
      transformResponse: (res) => res.results || res,
    }),
    getOrderById: build.query({
      query: (id) => `dashboard/orders/${id}/`,
      providesTags: (_res, _err, id) => [{ type: "Order", id }],
    }),
    requestCancel: build.mutation({
      query: ({ id, message }) => ({
        url: `orders/${id}/request-cancel/`,
        method: "POST",
        body: { message },
      }),
      invalidatesTags: (_res, _err, { id }) => [{ type: "Order", id }],
    }),
    requestReturn: build.mutation({
      query: ({ id, message, files }) => {
        const fd = new FormData();
        fd.append("message", message || "");
        (files || []).forEach((f) => fd.append("files", f));
        return {
          url: `orders/${id}/request-return/`,
          method: "POST",
          body: fd,
        };
      },
      invalidatesTags: (_res, _err, { id }) => [{ type: "Order", id }],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useRequestCancelMutation,
  useRequestReturnMutation,
} = ordersApi;
