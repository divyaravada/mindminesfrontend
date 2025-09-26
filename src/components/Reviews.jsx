import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  useGetMyReviewsQuery,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
} from "../features/reviews/reviewsApi";

export default function Reviews() {
  const {
    data: reviews = [],
    isFetching,
    error,
    refetch,
  } = useGetMyReviewsQuery();
  const [updateReview, { isLoading: saving }] = useUpdateReviewMutation();
  const [deleteReview] = useDeleteReviewMutation();

  const [editingId, setEditingId] = useState(null);
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [clearImage, setClearImage] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (editingId == null) {
      setRating(5);
      setMessage("");
      setClearImage(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [editingId]);

  const startEdit = (rv) => {
    setEditingId(rv.id);
    setRating(rv.rating);
    setMessage(rv.message);
    setClearImage(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const cancelEdit = () => {
    setEditingId(null);
    setClearImage(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const save = async (id) => {
    const fd = new FormData();
    fd.append("rating", String(rating));
    fd.append("message", message);
    if (clearImage) fd.append("clear_image", "true");
    if (fileRef.current?.files?.[0])
      fd.append("image", fileRef.current.files[0]);

    await updateReview({ id, formData: fd }).unwrap();
    cancelEdit();
    refetch();
  };

  const remove = async (id) => {
    await deleteReview(id).unwrap();
    if (editingId === id) cancelEdit();
    refetch();
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-light mb-8">Your Reviews</h1>
        <Link to="/account" className="p-6 hover:underline">
          <h6 className="text-2xl font-light mb-8">Back to Accounts</h6>
        </Link>
        <span className="text-sm text-gray-500">
          {reviews.length} review{reviews.length !== 1 ? "s" : ""}
        </span>
      </div>

      {isFetching && <div className="text-gray-500">Loading…</div>}
      {error && !isFetching && (
        <div className="text-red-600 mb-4">
          {error?.status === 401
            ? "Please sign in to view your reviews."
            : "Failed to load reviews."}
        </div>
      )}

      {!isFetching && !error && reviews.length === 0 && (
        <div className="text-gray-400">
          You haven’t written any reviews yet.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map((rv) => (
          <div key={rv.id} className="bg-white p-4 shadow rounded">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{rv.product_name}</h3>
                <div className="text-xs text-gray-500">
                  {new Date(rv.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-2">
                {editingId !== rv.id && (
                  <button
                    onClick={() => startEdit(rv)}
                    className="text-sm px-2 py-1 border rounded"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => remove(rv.id)}
                  className="text-sm px-2 py-1 border rounded text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>

            {editingId === rv.id ? (
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-3">
                  <label className="font-medium">Rating:</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="border rounded px-2 py-1"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} ★
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                />
                <div className="flex items-center gap-3">
                  <input ref={fileRef} type="file" accept="image/*" />
                  {rv.image && (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={clearImage}
                        onChange={(e) => setClearImage(e.target.checked)}
                      />
                      Remove current image
                    </label>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => save(rv.id)}
                    className="px-3 py-1 bg-black text-white rounded disabled:opacity-60"
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-3 py-1 border rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-2">
                  {Array.from({ length: rv.rating }).map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                <p className="mt-2 whitespace-pre-line">{rv.message}</p>
                {rv.image ? (
                  <img src={rv.image} alt="" className="mt-2 w-40 rounded" />
                ) : null}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
