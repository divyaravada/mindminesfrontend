import { useRef, useState } from "react";
import avatar from "../assets/avatar.png";
import {
  useListProductReviewsQuery,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
} from "../features/products/productsApi";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "../features/auth/authSlice";

export default function ProductReviews({ productId }) {
  const isLoggedIn = useSelector(selectIsAuthenticated);
  const { data } = useListProductReviewsQuery(productId);
  const items = data?.results ?? data ?? [];
  const [editingId, setEditingId] = useState(null);
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [clearImage, setClearImage] = useState(false);
  const fileRef = useRef(null);

  const [updateReview] = useUpdateReviewMutation();
  const [deleteReview] = useDeleteReviewMutation();

  const startEdit = (rv) => {
    setEditingId(rv.id);
    setRating(rv.rating);
    setMessage(rv.message);
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
    await updateReview({ reviewId: id, form: fd }).unwrap();
    setEditingId(null);
  };

  const remove = async (id) => {
    await deleteReview(id).unwrap();
    if (editingId === id) setEditingId(null);
  };

  return (
    <div className="mt-12">
      <h3 className="text-xl font-semibold mb-4">Reviews</h3>

      {!isLoggedIn && (
        <div className="text-sm text-gray-600 mb-6">
          Log in to post or edit your review.
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-gray-500">No reviews yet.</div>
      ) : (
        <div className="space-y-4">
          {items.map((rv) => (
            <div key={rv.id} className="bg-white p-4 rounded border">
              <div className="flex items-start gap-3">
                <img
                  src={rv.author_avatar || avatar}
                  onError={(e) => (e.currentTarget.src = avatar)}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{rv.author_name}</div>
                    {rv.is_owner && (
                      <div className="flex gap-2">
                        {editingId !== rv.id && (
                          <button
                            onClick={() => startEdit(rv)}
                            className="text-xs px-2 py-1 border rounded"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => remove(rv.id)}
                          className="text-xs px-2 py-1 border rounded text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(rv.created_at).toLocaleString()}
                  </div>

                  {editingId === rv.id ? (
                    <div className="mt-2 space-y-2">
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
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        rows={3}
                      />
                      <div className="flex items-center gap-3">
                        <input ref={fileRef} type="file" accept="image/*" />
                        {rv.image && (
                          <label className="text-sm flex items-center gap-2">
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
                          className="px-3 py-1 bg-black text-white rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 border rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mt-1">
                        {Array.from({ length: rv.rating }).map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                      <p className="mt-2 whitespace-pre-line">{rv.message}</p>
                      {rv.image ? (
                        <img
                          src={rv.image}
                          alt=""
                          className="mt-2 w-40 rounded"
                        />
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
