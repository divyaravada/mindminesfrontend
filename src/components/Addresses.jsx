import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  useGetAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useMakeDefaultAddressMutation,
} from "../features/addresses/addressApi";

const initial = {
  first_name: "",
  last_name: "",
  address_line1: "",
  address_line2: "",
  postal_code: "",
  city: "",
  country: "Germany",
  phone: "",
  is_default: true,
};

export default function AccountAddresses() {
  const { data: list = [], isFetching } = useGetAddressesQuery();
  const [createAddress, { isLoading: creating }] = useCreateAddressMutation();
  const [updateAddress, { isLoading: updating }] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  const [makeDefault] = useMakeDefaultAddressMutation();

  const [form, setForm] = useState(initial);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!isFetching && !editingId) setForm(initial);
  }, [isFetching, editingId]);

  const save = async () => {
    if (editingId) {
      await updateAddress({ id: editingId, ...form }).unwrap();
    } else {
      await createAddress(form).unwrap();
    }
    setForm(initial);
    setEditingId(null);
  };

  const edit = (a) => {
    setEditingId(a.id);
    setForm({ ...initial, ...a });
  };

  const del = async (id) => {
    await deleteAddress(id).unwrap();
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-light mb-8">Shipping Addresses</h1>
        <Link to="/account" className="p-6 hover:underline">
          <h6 className="text-2xl font-light mb-8">Back to Accounts</h6>
        </Link>
        <span className="text-sm text-gray-500">
          Manage your shipping addresses
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="p-6 border rounded">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-light">
              {editingId ? "Edit address" : "New address"}
            </h2>
            <span className="text-xs bg-gray-200 px-2 py-1 rounded">
              MAIN ADDRESS
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              placeholder="First name"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="border px-3 py-2 rounded"
            />
            <input
              placeholder="Last name"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="border px-3 py-2 rounded"
            />
            <input
              placeholder="street Name and number"
              value={form.address_line1}
              onChange={(e) =>
                setForm({ ...form, address_line1: e.target.value })
              }
              className="border px-3 py-2 rounded md:col-span-2"
            />
            <input
              placeholder="Address landmark (optional)"
              value={form.address_line2}
              onChange={(e) =>
                setForm({ ...form, address_line2: e.target.value })
              }
              className="border px-3 py-2 rounded md:col-span-2"
            />
            <input
              placeholder="Postal code"
              value={form.postal_code}
              onChange={(e) =>
                setForm({ ...form, postal_code: e.target.value })
              }
              className="border px-3 py-2 rounded"
            />
            <input
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="border px-3 py-2 rounded"
            />
            <select
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="border px-3 py-2 rounded"
            >
              <option>Germany</option>
              <option>Austria</option>
              <option>Switzerland</option>
              <option>France</option>
              <option>Italy</option>
              <option>Netherlands</option>
            </select>
            <input
              placeholder="Telephone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="border px-3 py-2 rounded"
            />
          </div>

          <div className="flex items-center gap-2 mt-4">
            <input
              id="is_default"
              type="checkbox"
              checked={!!form.is_default}
              onChange={(e) =>
                setForm({ ...form, is_default: e.target.checked })
              }
            />
            <label htmlFor="is_default" className="text-sm">
              Set as main address
            </label>
          </div>

          <button
            onClick={save}
            disabled={creating || updating}
            className="mt-6 bg-black text-white px-5 py-2 rounded disabled:opacity-60"
          >
            {creating || updating
              ? "Saving…"
              : editingId
              ? "Save changes"
              : "Add a new address"}
          </button>
        </div>

        {/* List */}
        <div className="space-y-4">
          {list.map((a) => (
            <div
              key={a.id}
              className="p-5 border rounded flex justify-between items-start"
            >
              <div>
                <div className="font-semibold">
                  {a.first_name} {a.last_name}{" "}
                  {a.is_default ? (
                    <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">
                      MAIN
                    </span>
                  ) : null}
                </div>
                <div className="text-gray-700">{a.address_line1}</div>
                {a.address_line2 ? (
                  <div className="text-gray-700">{a.address_line2}</div>
                ) : null}
                <div className="text-gray-700">
                  {a.postal_code} {a.city}
                </div>
                <div className="text-gray-700">{a.country}</div>
                {a.phone ? (
                  <div className="text-gray-700">{a.phone}</div>
                ) : null}
              </div>
              <div className="flex gap-3">
                {!a.is_default && (
                  <button
                    className="underline"
                    onClick={() => makeDefault(a.id).unwrap()}
                  >
                    Make main
                  </button>
                )}
                <button className="underline" onClick={() => edit(a)}>
                  Edit
                </button>
                <button
                  className="underline text-red-600"
                  onClick={() => del(a.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {!list.length && (
            <div className="text-gray-500">No addresses yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
