import { useState } from "react";
import PropTypes from "prop-types";
import { useSendStoneEnquiryMutation } from "../features/stones/stonesApi";

export default function StoneEnquiryForm({
  isAuthenticated,
  presetStoneType,
  onSuccess,
}) {
  const [stoneType, setStoneType] = useState(presetStoneType || "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(""); // only for guests
  const [message, setMessage] = useState("");

  const [sendEnquiry, { isLoading, isSuccess, isError, error }] =
    useSendStoneEnquiryMutation();

  const submit = async (e) => {
    e.preventDefault();
    const body = {
      stone_type: presetStoneType || stoneType,
      name,
      message,
      ...(isAuthenticated ? {} : { email }),
    };
    try {
      await sendEnquiry(body).unwrap();
      setName("");
      setEmail("");
      setMessage("");
      if (!presetStoneType) setStoneType("");
      onSuccess?.();
    } catch (err) {
      // handled by isError + error display
    }
  };

  const fieldErrors = (() => {
    const data = error?.data;
    if (!data || typeof data !== "object") return {};
    return data;
  })();

  const showFieldError = (key) =>
    fieldErrors?.[key] ? (
      <div className="text-sm text-red-600 mt-1">
        {Array.isArray(fieldErrors[key])
          ? fieldErrors[key].join(", ")
          : String(fieldErrors[key])}
      </div>
    ) : null;

  return (
    <form onSubmit={submit} className="grid gap-3 max-w-md">
      {presetStoneType ? (
        <div className="text-sm">
          <span className="font-medium">Stone type:</span>{" "}
          <span className="inline-block rounded bg-gray-200 px-2 py-0.5">
            {presetStoneType}
          </span>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium">Stone type</label>
          <input
            value={stoneType}
            onChange={(e) => setStoneType(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="e.g. marble"
            required
          />
          {showFieldError("stone_type")}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
        {showFieldError("name")}
      </div>

      {!isAuthenticated && (
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
          {showFieldError("email")}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border rounded px-3 py-2"
          rows={4}
          required
        />
        {showFieldError("message")}
      </div>

      {fieldErrors?.detail && (
        <div className="text-red-600">{String(fieldErrors.detail)}</div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
      >
        {isLoading ? "Sending…" : "Send enquiry"}
      </button>

      {isSuccess && (
        <div className="text-green-700">
          Thank you! We’ve received your enquiry.
        </div>
      )}
      {isError && !Object.keys(fieldErrors).length && (
        <div className="text-red-600">
          Something went wrong. Please try again.
        </div>
      )}
    </form>
  );
}

StoneEnquiryForm.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired,
  presetStoneType: PropTypes.string,
  onSuccess: PropTypes.func,
};
