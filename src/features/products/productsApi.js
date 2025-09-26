import { api } from "../../services/apiSlice";

export const productsApi = api.injectEndpoints({
  endpoints: (b) => ({
    listProducts: b.query({
      // params: { page, page_size, category, material, color, min_price, max_price }
      query: (params) => ({ url: "decorative-products/", params }),
      providesTags: ["Products"],
    }),

    getProduct: b.query({
      query: (id) => `decorative-products/${id}/`,
      providesTags: (_r, _e, id) => [{ type: "Product", id }],
    }),

    listProductReviews: b.query({
      query: (id) => `decorative-products/${id}/reviews/`,
      providesTags: (_r, _e, id) => [{ type: "Reviews", id }],
    }),

    createProductReview: b.mutation({
      query: ({ id, form }) => ({
        url: `decorative-products/${id}/reviews/`,
        method: "POST",
        body: form,
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Reviews", id: arg.id }],
    }),

    updateReview: b.mutation({
      query: ({ reviewId, form }) => ({
        url: `reviews/${reviewId}/`,
        method: "PATCH",
        body: form,
      }),
      invalidatesTags: ["Reviews"],
    }),

    deleteReview: b.mutation({
      query: (reviewId) => ({ url: `reviews/${reviewId}/`, method: "DELETE" }),
      invalidatesTags: ["Reviews"],
    }),
  }),
});

export const {
  useListProductsQuery,
  useGetProductQuery,
  useListProductReviewsQuery,
  useCreateProductReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useLazyGetProductQuery,
} = productsApi;
