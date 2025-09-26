// src/pages/CheckoutSuccess.jsx
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import http from "../services/http";
import { toAbsoluteUrl } from "../utils/urls";

export default function CheckoutSuccess() {
  const [sp] = useSearchParams();
  const orderId = sp.get("order");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bankInfo, setBankInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("bank_checkout_info");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && String(parsed.order_id) === String(orderId)) {
        setBankInfo(parsed);
      }
    } catch {}
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    let timer;
    let stopped = false;

    const load = async () => {
      try {
        const res = await http.get(`dashboard/orders/${orderId}/`);
        setOrder(res.data);
        setError(null);
        if (res.data?.invoice_pdf) {
          stopped = true;
          if (timer) clearInterval(timer);
        }
      } catch (e) {
        setError(e?.response?.data?.detail || "Failed to load order.");
      } finally {
        setLoading(false);
      }
    };

    load();
    timer = setInterval(() => !stopped && load(), 5000);
    return () => clearInterval(timer);
  }, [orderId]);

  if (!orderId)
    return <div className="p-10 text-center">No order specified.</div>;
  if (loading) return <div className="p-10 text-center">Loading…</div>;
  if (error)
    return <div className="p-10 text-center text-red-600">{error}</div>;

  const hasInvoice = !!order?.invoice_pdf;
  const isBank = order?.payment_method === "bank";
  const isPaid = order?.status === "paid";

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-10 text-center">
      <h1 className="text-2xl font-bold mb-2 text-center">Thank you!</h1>
      <p className="text-gray-600 mb-6 text-center">
        Your order <span className="font-semibold">{order.number}</span> was
        created.
      </p>

      {isBank && !isPaid && bankInfo && (
        <div className="mb-6 border rounded p-4 bg-gray-50">
          <h2 className="font-semibold mb-2">Bank transfer instructions</h2>
          <p className="text-sm text-gray-600 mb-3">
            We’ve also emailed these details to you. Please transfer{" "}
            <span className="font-semibold">{bankInfo.amount} €</span> and
            include the reference below.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <KV k="Amount" v={`${bankInfo.amount} €`} />
            <KV k="Reference" v={bankInfo.reference} />
            <KV k="IBAN" v={bankInfo.iban} />
            <KV k="BIC" v={bankInfo.bic} />
            <KV k="Beneficiary" v={bankInfo.beneficiary} />
          </div>

          {bankInfo.instructions && (
            <p className="text-xs text-gray-500 mt-3">
              {bankInfo.instructions}
            </p>
          )}
        </div>
      )}

      <div className="text-center">
        {hasInvoice ? (
          <a
            href={toAbsoluteUrl(order.invoice_pdf)}
            target="_blank"
            rel="noreferrer"
            className="inline-block px-4 py-2 rounded bg-gray-900 text-white"
          >
            Download invoice (PDF)
          </a>
        ) : isBank && !isPaid ? (
          <p className="text-sm text-gray-600">
            As soon as we receive your payment, your invoice will be generated
            here automatically. This page refreshes every few seconds.
          </p>
        ) : (
          <p className="text-sm text-gray-500">
            Generating invoice… please wait a moment.
          </p>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link to="/account/orders" className="text-blue-600 underline">
          Go to your orders
        </Link>
      </div>
    </div>
  );
}

function KV({ k, v }) {
  return (
    <div className="flex items-center justify-between bg-white rounded px-3 py-2">
      <div className="text-gray-500">{k}</div>
      <div className="font-medium">{v}</div>
    </div>
  );
}
