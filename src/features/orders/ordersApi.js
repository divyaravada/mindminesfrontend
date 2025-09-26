import { api } from "../../services/apiSlice";

export const ordersApi = api.injectEndpoints({
  endpoints: (build) => ({
    getOrders: build.query({
      query: () => "dashboard/orders/",
      transformResponse: (res) =>
        Array.isArray(res) ? res : res?.results ?? [],
      providesTags: (list) =>
        Array.isArray(list)
          ? [
              ...list.map((o) => ({ type: "Orders", id: o.id })),
              { type: "Orders", id: "LIST" },
            ]
          : [{ type: "Orders", id: "LIST" }],
    }),
    getOrder: build.query({
      query: (id) => `dashboard/orders/${id}/`,
      providesTags: (_r, _e, id) => [{ type: "Orders", id }],
    }),
  }),
});

export const { useGetOrdersQuery, useGetOrderQuery } = ordersApi;
