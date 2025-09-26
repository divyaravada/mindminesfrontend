// src/components/payment/KlarnaWidget.jsx
import { useEffect, useState } from "react";
import { api } from "../../services/apiSlice";

function useScript(src) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (document.querySelector(`script[src="${src}"]`)) {
      setReady(true);
      return;
    }
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.onload = () => setReady(true);
    el.onerror = () => setReady(false);
    document.body.appendChild(el);
  }, [src]);
  return ready;
}

function toISO(country) {
  switch ((country || "").toLowerCase()) {
    case "germany":
      return "DE";
    case "austria":
      return "AT";
    case "switzerland":
      return "CH";
    default:
      return "DE";
  }
}

export default function KlarnaWidget({
  active,
  setActive,
  items,
  form,
  total,
  category, // "pay_later" | "pay_over_time"
  months,
  label,
  onSuccess,
  setLocalOrderId,
}) {
  const ready = useScript("https://x.klarnacdn.net/kp/lib/v1/api.js");
  const [clientToken, setClientToken] = useState(null);
  const [localOrderId, setLocalId] = useState(null);
  const [loading, setLoading] = useState(false);

  const prettyLabel =
    label ||
    (category === "pay_over_time"
      ? `Pay in installments with Klarna`
      : `Pay later (Invoice) with Klarna`);

  return (
    <>
      <label className="flex items-center gap-3 border rounded p-3 cursor-pointer mt-3">
        <input
          type="radio"
          name="payment"
          value={category}
          checked={active}
          onChange={setActive}
        />
        <span className="flex-1">
          {category === "pay_over_time"
            ? "Installments (0% financing)"
            : "Invoice / Pay later with Klarna"}
        </span>
        <span className="text-xs font-semibold text-pink-600">Klarna</span>
      </label>

      {active && (
        <div className="border rounded p-3">
          {!clientToken ? (
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  const res = await api.post("payments/klarna/session/", {
                    items,
                    payment_method: "klarna",
                    category,
                    months,
                    full_name: form.fullName,
                    country: form.country,
                    house_number: form.houseNumber || "—",
                    street_name: form.street,
                    apartment: form.apartment,
                    postal_code: form.postalCode,
                    city: form.city,
                    phone: form.telephone,
                  });
                  setClientToken(res.data.client_token);
                  setLocalId(res.data.order_id);
                  setLocalOrderId(res.data.order_id);

                  if (ready && window.Klarna) {
                    window.Klarna.Payments.init({
                      client_token: res.data.client_token,
                    });
                    window.Klarna.Payments.load(
                      {
                        container: "#klarna-container",
                        payment_method_category: category,
                      },
                      (resp) => {
                        if (resp.show_form !== true)
                          console.warn("Klarna load:", resp);
                      }
                    );
                  }
                } catch {
                  alert(
                    "Failed to start Klarna session. Please log in and ensure address is valid."
                  );
                } finally {
                  setLoading(false);
                }
              }}
              disabled={!ready || loading}
              className="w-full py-3 rounded bg-pink-600 text-white font-semibold hover:bg-pink-700 disabled:opacity-60"
            >
              {loading ? "Starting Klarna…" : prettyLabel}
            </button>
          ) : (
            <>
              <div id="klarna-container" />
              <button
                onClick={() => {
                  if (!localOrderId) {
                    alert(
                      "Order reference missing. Please reload and try again."
                    );
                    return;
                  }
                  if (!window.Klarna) return;
                  window.Klarna.Payments.authorize(
                    { payment_method_category: category },
                    {
                      billing_address: {
                        given_name: form.fullName || "Customer",
                        family_name: "",
                        street_address:
                          `${form.street} ${form.houseNumber}`.trim(),
                        postal_code: form.postalCode,
                        city: form.city,
                        country: toISO(form.country),
                        email: form.email || "customer@example.com",
                        phone: form.telephone || "",
                      },
                      shipping_address: {
                        given_name: form.fullName || "Customer",
                        family_name: "",
                        street_address:
                          `${form.street} ${form.houseNumber}`.trim(),
                        postal_code: form.postalCode,
                        city: form.city,
                        country: toISO(form.country),
                        email: form.email || "customer@example.com",
                        phone: form.telephone || "",
                      },
                    },
                    async (res) => {
                      if (res.approved && res.authorization_token) {
                        try {
                          const r = await api.post("payments/klarna/confirm/", {
                            order_id: localOrderId,
                            authorization_token: res.authorization_token,
                            category,
                            months,
                          });
                          if (r.data?.status === "ok") onSuccess(localOrderId);
                          else alert("Klarna confirm failed.");
                        } catch {
                          alert("Klarna confirm failed.");
                        }
                      } else {
                        alert("Klarna was not approved.");
                      }
                    }
                  );
                }}
                className="w-full py-3 rounded bg-pink-600 text-white font-semibold hover:bg-pink-700 mt-3"
              >
                {prettyLabel} — {total.toFixed(2)} €
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
