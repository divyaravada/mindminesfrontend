import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGetOrdersQuery } from "../features/orders/ordersApi";
import OrderDialog from "./OrderDialog";

function formatMoney(v) {
  if (v === null || v === undefined) return "0.00 €";
  const n =
    typeof v === "number"
      ? v
      : parseFloat(
          v
            .toString()
            .replace(/[^\d.,-]/g, "")
            .replace(",", ".")
        );
  const safe = Number.isFinite(n) ? n : 0;
  return `${safe.toFixed(2)} €`;
}

export default function Orders() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith("de") ? "de" : "en";

  const { data: orders = [], isFetching, error } = useGetOrdersQuery();

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const loc = useLocation();

  const statusClass = (s) =>
    s === "delivered"
      ? "bg-green-100 text-green-700"
      : s === "shipped"
      ? "bg-blue-100 text-blue-700"
      : s === "processing"
      ? "bg-yellow-100 text-yellow-700"
      : s === "cancelled"
      ? "bg-red-100 text-red-700"
      : "bg-gray-100 text-gray-700";

  const statusLabel = (s) =>
    t(`order.status.${s}`, s.charAt(0).toUpperCase() + s.slice(1));

  const productTitle = (p) =>
    (lang === "de" ? p?.title_de : p?.title_en) ||
    p?.title_en ||
    p?.title_de ||
    t("order.item");

  const coverFor = (o) => o.items?.[0]?.product?.image || "";

  if (error?.status === 401) {
    const next = encodeURIComponent(loc.pathname + loc.search);
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-light mb-3">
          {t("auth.signInRequired", "Sign in required")}
        </h2>
        <p className="text-gray-600 mb-6">
          {t(
            "auth.signInToViewOrders",
            "Please sign in to view your orders and invoices."
          )}
        </p>
        <Link
          to={`/login?next=${next}`}
          className="inline-block bg-black text-white px-5 py-2 rounded"
        >
          {t("auth.signIn", "Sign in")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-4xl font-light mb-8">
          {t("order.yourOrders", "Your Orders")}
        </h2>
        <Link to="/account" className="p-6 hover:underline">
          <h6 className="text-2xl font-light mb-8">Back to Accounts</h6>
        </Link>
        <span className="text-sm text-gray-500">
          {t("order.count", "{{count}} orders", { count: orders.length })}
        </span>
      </div>

      {isFetching ? (
        <div className="text-gray-500">{t("common.loading", "Loading…")}</div>
      ) : orders.length === 0 ? (
        <div className="text-gray-400">{t("order.none", "No orders yet.")}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((o) => (
            <button
              key={o.id}
              onClick={() => {
                setSelectedId(o.id);
                setOpen(true);
              }}
              className="bg-white text-left p-4 rounded shadow hover:shadow-md transition"
            >
              <div className="flex gap-3">
                <img
                  src={coverFor(o)}
                  alt={productTitle(o.items?.[0]?.product)}
                  className="w-20 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="font-semibold leading-tight line-clamp-2">
                      {productTitle(o.items?.[0]?.product)}
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${statusClass(
                        o.status
                      )}`}
                    >
                      {statusLabel(o.status)}
                    </span>
                  </div>

                  <div className="text-sm text-gray-500">
                    {new Date(o.created_at).toLocaleString()}
                  </div>

                  <div className="text-sm">
                    {t("order.total", "Total")}: {formatMoney(o.total_price)}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && selectedId !== null && (
        <OrderDialog orderId={selectedId} open onClose={() => setOpen(false)} />
      )}
    </div>
  );
}
