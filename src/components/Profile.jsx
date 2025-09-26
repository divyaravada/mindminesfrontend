import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import avatar from "../assets/avatar.png";
import {
  useGetAccountQuery,
  useUpdateAccountMutation,
  useRequestDeletionMutation,
} from "../features/account/accountApi";

export default function Profile() {
  const { data: account, isLoading, refetch } = useGetAccountQuery();
  const [updateAccount, { isLoading: saving }] = useUpdateAccountMutation();
  const [requestDeletion, { isLoading: sendingDeletion }] =
    useRequestDeletionMutation();

  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ username: "", full_name: "" });
  const [upload, setUpload] = useState(null);

  // deletion modal
  const [editDeletion, setEditDeletion] = useState(false);
  const [deletionReason, setDeletionReason] = useState("");
  const [deletionMsg, setDeletionMsg] = useState(null);

  useEffect(() => {
    if (account) {
      setForm({
        username: account.username || "",
        full_name: account.full_name || "",
      });
    }
  }, [account]);

  const imgSrc = useMemo(() => account?.image || avatar, [account]);

  const onChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const save = async () => {
    const fd = new FormData();
    fd.append("username", form.username ?? "");
    fd.append("full_name", form.full_name ?? "");
    if (upload) fd.append("image", upload);
    await updateAccount(fd).unwrap();
    setEdit(false);
    setUpload(null);
    refetch();
  };

  const submitDeletion = async () => {
    if (!deletionReason.trim()) {
      setDeletionMsg("Please tell us why you want to delete your account.");
      return;
    }
    try {
      setDeletionMsg(null);
      await requestDeletion({ reason: deletionReason.trim() }).unwrap();
      setDeletionMsg("Your request has been sent. We'll get back to you soon.");
      setTimeout(() => {
        setEditDeletion(false);
        setDeletionReason("");
        setDeletionMsg(null);
      }, 1200);
    } catch {
      setDeletionMsg("Could not send your request. Please try again later.");
    }
  };

  if (isLoading) return <div>Loading…</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-light mb-8">Your Profile</h1>
        <Link to="/account" className="p-6 hover:underline">
          <h6 className="text-2xl font-light mb-8">Back to Accounts</h6>
        </Link>
      </div>

      <div className="max-w-xl mx-auto bg-white shadow p-6 rounded">
        {!edit ? (
          <>
            <div className="flex items-center gap-4">
              <img
                src={imgSrc}
                alt=""
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <div className="text-lg font-semibold">
                  {account?.full_name || "—"}
                </div>
                <div className="text-sm text-gray-500">{account?.email}</div>
              </div>
            </div>

            <div className="mt-4 text-sm space-y-1">
              <div>
                <strong>Username:</strong> {account?.username}
              </div>
              <div>
                <strong>Verified:</strong> {account?.verified ? "Yes" : "No"}
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setEdit(true)}
                className="mt-4 px-3 py-2 rounded border text-sm"
              >
                Edit profile
              </button>
              <button
                onClick={() => setEditDeletion(true)}
                className="mt-4 px-3 py-2 rounded border text-sm"
              >
                Request To delete Account
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3">
              <label className="text-sm text-gray-600">Username</label>
              <input
                name="username"
                value={form.username}
                onChange={onChange}
                className="w-full border rounded px-3 py-2"
              />

              <label className="text-sm text-gray-600">Full name</label>
              <input
                name="full_name"
                value={form.full_name}
                onChange={onChange}
                className="w-full border rounded px-3 py-2"
              />

              <label className="text-sm text-gray-600">Avatar</label>
              <input
                type="file"
                onChange={(e) => setUpload(e.target.files?.[0] || null)}
              />
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="px-3 py-2 rounded bg-gray-900 text-white text-sm disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => {
                  setEdit(false);
                  setUpload(null);
                  setForm({
                    username: account?.username || "",
                    full_name: account?.full_name || "",
                  });
                }}
                className="px-3 py-2 rounded border text-sm"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>

      {/* Deletion modal */}
      {editDeletion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !sendingDeletion && setEditDeletion(false)}
          />
          <div className="relative bg-white w-[95%] max-w-lg rounded-lg shadow-xl p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold">
                Request account deletion
              </h3>
              <button
                onClick={() => !sendingDeletion && setEditDeletion(false)}
                className="rounded px-2 py-1 text-gray-500 hover:bg-gray-100"
                aria-label="Close"
                disabled={sendingDeletion}
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Please tell us briefly why you want to delete your account. We’ll
              review and get back to you.
            </p>
            <textarea
              value={deletionReason}
              onChange={(e) => setDeletionReason(e.target.value)}
              rows={4}
              className="w-full border rounded px-3 py-2"
              placeholder="Your reason…"
              disabled={sendingDeletion}
            />
            {deletionMsg && <div className="mt-3 text-sm">{deletionMsg}</div>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditDeletion(false)}
                className="px-3 py-2 rounded border text-sm"
                disabled={sendingDeletion}
              >
                Cancel
              </button>
              <button
                onClick={submitDeletion}
                className="px-3 py-2 rounded bg-black text-white text-sm disabled:opacity-60"
                disabled={sendingDeletion}
              >
                {sendingDeletion ? "Sending…" : "Send request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
