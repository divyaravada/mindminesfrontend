import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
// If you followed my earlier advice, use the axios client with auth:
import http from "../services/http"; // <-- change to `../services/api` if that's your axios instance
import MessageDialog from "./MessageDialog";
import { toAbsoluteUrl } from "../utils/urls";

function formatMoney(v) {
  if (v === null || v === undefined) return "0.00 €";
  const n =
    typeof v === "number"
      ? v
      : parseFloat(
          String(v)
            .replace(/[^\d.,-]/g, "")
            .replace(",", ".")
        );
  const safe = Number.isFinite(n) ? n : 0;
  return `${safe.toFixed(2)} €`;
}

function parseDateLoose(v) {
  if (!v) return null;
  const d1 = new Date(v);
  if (!isNaN(d1.getTime())) return d1;

  const m = String(v).match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/
  );
  if (m) {
    const [, Y, M, D, h, mi, s] = m;
    const d2 = new Date(
      Number(Y),
      Number(M) - 1,
      Number(D),
      Number(h),
      Number(mi),
      Number(s || 0)
    );
    if (!isNaN(d2.getTime())) return d2;
  }

  const ep = Number(v);
  if (Number.isFinite(ep)) {
    const d3 = new Date(ep);
    if (!isNaN(d3.getTime())) return d3;
  }
  return null;
}

export default function OrderDialog({ orderId, open, onClose }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith("de") ? "de" : "en";

  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  // Cancel modal
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelMsg, setCancelMsg] = useState("");

  // Return modal
  const [retOpen, setRetOpen] = useState(false);
  const [retMsg, setRetMsg] = useState("");
  const [retFiles, setRetFiles] = useState([]);

  // Toast/message dialog
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgKind, setMsgKind] = useState("success"); // "success" | "error"
  const [msgTitle, setMsgTitle] = useState("");
  const [msgText, setMsgText] = useState("");

  function showMessage(title, text, kind = "success") {
    setMsgTitle(title);
    setMsgText(text);
    setMsgKind(kind);
    setMsgOpen(true);
  }

  // Load order details when opened
  useEffect(() => {
    if (!open || !orderId) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await http.get(`dashboard/orders/${orderId}/`);
        if (!cancelled) setOrder(res.data);
      } catch (err) {
        if (!cancelled) {
          setError(t("order.loadError", "Failed to load order details."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, orderId, t]);

  if (!open || !orderId) return null;

  const productTitle = (p) =>
    (lang === "de" ? p?.title_de : p?.title_en) ||
    p?.title_en ||
    p?.title_de ||
    t("order.item", "Item");

  const totalQty =
    order?.items?.reduce((sum, it) => sum + (it.quantity || 0), 0) ?? 0;

  const isDelivered = order?.status === "delivered";
  const isPaidOrLater =
    order?.status === "paid" ||
    order?.status === "shipped" ||
    order?.status === "delivered";
  const isBeforePaid =
    order?.status === "pending" || order?.status === "processing";
  const showInvoice = !!order?.invoice_pdf;

  const deliveredAt =
    order && order.status === "delivered"
      ? parseDateLoose(order.delivered_at || null) ||
        parseDateLoose(order.created_at || null)
      : null;

  const ageDays = deliveredAt
    ? Math.floor((Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Return visible on delivered; disabled after 15 days
  const showReturnBtn = !!order && isDelivered;
  const RETURN_WINDOW_DAYS = 1;
  const returnDisabled =
    typeof ageDays === "number" ? ageDays > RETURN_WINDOW_DAYS : true;
  const daysLeft =
    typeof ageDays === "number"
      ? Math.max(0, RETURN_WINDOW_DAYS - ageDays)
      : null;

  // Cancel visible only before payment
  const showCancelBtn = !!order && isBeforePaid;

  // Download visible once paid/shipped/delivered AND invoice exists
  const showDownload = !!order && isPaidOrLater && showInvoice;

  async function submitCancel() {
    if (!order) return;
    try {
      await http.post(`orders/${order.id}/request-cancel/`, {
        message: cancelMsg,
      });
      showMessage(
        t("order.cancelRequestedTitle", "Cancellation requested"),
        t(
          "order.cancelRequested",
          "We received your cancellation request. We’ll email you shortly."
        ),
        "success"
      );
      setCancelOpen(false);
      setCancelMsg("");
    } catch (e) {
      showMessage(
        t("order.cancelFailedTitle", "Cancellation failed"),
        e?.response?.data?.detail ||
          t("order.cancelFailed", "Failed to request cancellation."),
        "error"
      );
    }
  }

  async function submitReturn() {
    if (!order) return;
    const fd = new FormData();
    fd.append("message", retMsg);
    retFiles.forEach((f) => fd.append("files", f));
    try {
      await http.post(`orders/${order.id}/request-return/`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showMessage(
        t("order.returnRequestedTitle", "Return requested"),
        t(
          "order.returnRequested",
          "We received your return request. We’ll email you shortly."
        ),
        "success"
      );
      setRetOpen(false);
      setRetMsg("");
      setRetFiles([]);
    } catch (e) {
      showMessage(
        t("order.returnFailedTitle", "Return failed"),
        e?.response?.data?.detail ||
          t("order.returnFailed", "Failed to request a return."),
        "error"
      );
    }
  }

  const statusClass = (s) =>
    s === "delivered"
      ? "bg-green-100 text-green-700"
      : s === "shipped"
      ? "bg-blue-100 text-blue-700"
      : s === "processing"
      ? "bg-yellow-100 text-yellow-700"
      : s === "cancelled" || s === "failed"
      ? "bg-red-100 text-red-700"
      : "bg-gray-100 text-gray-700";

  const statusLabel = (s) =>
    t(`order.status.${s}`, s.charAt(0).toUpperCase() + s.slice(1));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 w-[95%] max-w-2xl rounded-lg shadow-xl p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold">
              {t("order.details", "Order Details")}
            </h3>
            {order && (
              <p className="text-sm text-gray-500">
                {t("order.orderHash", "Order")} #{order.number || order.id} •{" "}
                {new Date(order.created_at).toLocaleString()}
                {isDelivered && deliveredAt ? (
                  <span className="ml-2 text-xs text-gray-500">
                    ({t("order.delivered", "Delivered")}:{" "}
                    {deliveredAt.toLocaleDateString()}
                    {typeof ageDays === "number" ? ` • ${ageDays}d ago` : ""})
                  </span>
                ) : null}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={t("common.close", "Close")}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        {loading && <div>{t("common.loading", "Loading…")}</div>}
        {error && <div className="text-red-600">{error}</div>}

        {order && (
          <div className="space-y-6">
            {/* Status & total */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`text-sm font-medium px-2 py-1 rounded ${statusClass(
                    order.status
                  )}`}
                >
                  {statusLabel(order.status)}
                </span>
                {order.tracking_number ? (
                  <span className="text-xs text-gray-500">
                    {t("order.tracking", "Tracking")}:{" "}
                    <span className="font-mono">{order.tracking_number}</span>
                  </span>
                ) : null}
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">
                  {t("order.total", "Total")}
                </div>
                <div className="text-lg font-semibold">
                  {formatMoney(order.total_price)}
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3 max-h-[50vh] overflow-auto pr-1">
              {order.items.map((it) => (
                <div key={it.id} className="flex gap-4 items-center">
                  <img
                    src={it.product?.image}
                    alt={productTitle(it.product)}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <div className="font-semibold">
                      {productTitle(it.product)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {t("order.qty", "Qty")}: {it.quantity} •{" "}
                      {t("order.unit", "Unit")}: {formatMoney(it.unit_price)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-2 border-t pt-3 grid grid-cols-2 gap-y-1 text-sm">
              <div className="text-gray-500">{t("order.items", "Items")}</div>
              <div className="text-right">{totalQty}</div>
              <div className="text-gray-500">
                {t("order.subtotal", "Subtotal")}
              </div>
              <div className="text-right">{formatMoney(order.subtotal)}</div>
              <div className="text-gray-500">
                {t("order.shipping", "Shipping")}
              </div>
              <div className="text-right">
                {formatMoney(order.shipping_fee)}
              </div>
              <div className="font-medium">{t("order.total", "Total")}</div>
              <div className="text-right font-semibold">
                {formatMoney(order.total_price)}
              </div>
            </div>

            {/* Shipping address */}
            <div>
              <div className="text-sm font-semibold mb-1">
                {t("order.shippingAddress", "Shipping address")}
              </div>
              {order.shipping_address ? (
                <div className="text-sm">
                  {order.shipping_address.first_name}{" "}
                  {order.shipping_address.last_name}
                  <br />
                  {order.shipping_address.address_line1}
                  {order.shipping_address.address_line2
                    ? `, ${order.shipping_address.address_line2}`
                    : ""}
                  <br />
                  {order.shipping_address.postal_code}{" "}
                  {order.shipping_address.city}
                  <br />
                  {order.shipping_address.country ||
                    order.shipping_address.state}{" "}
                  {order.shipping_address.pincode}
                  {order.shipping_address.phone ? (
                    <>
                      <br />
                      {t("order.phone", "Phone")}:{" "}
                      {order.shipping_address.phone}
                    </>
                  ) : null}
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  {t("order.noAddress", "No address on file")}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 flex-wrap">
              {/* Return */}
              {showReturnBtn && (
                <button
                  onClick={() => !returnDisabled && setRetOpen(true)}
                  disabled={returnDisabled}
                  className={`px-4 py-2 rounded border ${
                    returnDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-50"
                  }`}
                  title={
                    returnDisabled
                      ? t("order.returnExpired", "Return window expired")
                      : ""
                  }
                >
                  {t("order.return", "Return")}
                  {!returnDisabled && typeof daysLeft === "number"
                    ? ` (${daysLeft}d left)`
                    : ""}
                </button>
              )}

              {/* Cancel */}
              {showCancelBtn && (
                <button
                  onClick={() => setCancelOpen(true)}
                  className="px-4 py-2 rounded border hover:bg-gray-50"
                >
                  {t("order.cancel", "Cancel")}
                </button>
              )}

              {/* Invoice */}
              {showDownload && (
                <a
                  href={toAbsoluteUrl(order.invoice_pdf)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded bg-black text-white"
                >
                  {t("order.downloadInvoice", "Download invoice")}
                </a>
              )}

              <button
                onClick={onClose}
                className="px-4 py-2 rounded border hover:bg-gray-50"
              >
                {t("common.close", "Close")}
              </button>
            </div>

            {/* Hint if invoice not ready */}
            {isPaidOrLater && !showInvoice && (
              <div className="text-xs text-gray-500">
                {t(
                  "order.invoicePending",
                  "Your invoice will be available shortly and sent by email."
                )}
              </div>
            )}
          </div>
        )}

        {/* Cancel modal */}
        {cancelOpen && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white rounded shadow p-5 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-2">
                {t("order.cancelOrder", "Cancel order")}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {t(
                  "order.cancelExplain",
                  "Tell us why you want to cancel (optional)."
                )}
              </p>
              <textarea
                value={cancelMsg}
                onChange={(e) => setCancelMsg(e.target.value)}
                className="w-full border rounded p-2 h-28"
              />
              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={() => setCancelOpen(false)}
                  className="px-3 py-2 border rounded"
                >
                  {t("common.close", "Close")}
                </button>
                <button
                  onClick={submitCancel}
                  className="px-3 py-2 bg-black text-white rounded"
                >
                  {t("order.submit", "Submit")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Return modal */}
        {retOpen && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white rounded shadow p-5 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-2">
                {t("order.returnOrder", "Return order")}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {t(
                  "order.returnExplain",
                  "Describe the reason and attach photos/videos (optional). upto max 10MB"
                )}
              </p>
              <textarea
                value={retMsg}
                onChange={(e) => setRetMsg(e.target.value)}
                className="w-full border rounded p-2 h-28"
              />
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => setRetFiles(Array.from(e.target.files || []))}
                className="mt-2"
              />
              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={() => setRetOpen(false)}
                  className="px-3 py-2 border rounded"
                >
                  {t("common.close", "Close")}
                </button>
                <button
                  onClick={submitReturn}
                  className="px-3 py-2 bg-black text-white rounded"
                >
                  {t("order.submit", "Submit")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <MessageDialog
        open={msgOpen}
        title={msgTitle}
        message={msgText}
        kind={msgKind}
        onClose={() => setMsgOpen(false)}
      />
    </div>
  );
}
