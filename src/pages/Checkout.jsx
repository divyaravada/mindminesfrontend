// src/pages/Checkout.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectCartItems,
  selectCartCount,
  selectCartSubtotal,
  clearCart,
} from "../features/cart/cartSlice";
import KlarnaWidget from "../features/payments/KlarnaWidget";
import CardFields from "../features/payments/CardFields";
import http from "../services/http";

const fmtEUR = (n) => `${n.toFixed(2)} €`;

export default function Checkout() {
  const items = useSelector(selectCartItems);
  const itemsCount = useSelector(selectCartCount);
  const subtotal = useSelector(selectCartSubtotal);
  const dispatch = useDispatch();

  const navigate = useNavigate();
  const skipCartGuardRef = useRef(false);
  const addressIdRef = useRef(null);

  useEffect(() => {
    if (items.length === 0 && !skipCartGuardRef.current) {
      navigate("/decorative-products");
    }
  }, [items.length, navigate]);

  const shippingFee = subtotal >= 100 || subtotal === 0 ? 0 : 0;
  const total = subtotal + shippingFee;

  const lineItems = items.map((c) => ({ product_id: c.id, qty: c.qty }));

  // Address form
  const [form, setForm] = useState({
    email: "",
    country: "Germany",
    fullName: "",
    street: "",
    houseNumber: "",
    apartment: "",
    postalCode: "",
    city: "",
    telephone: "",
  });
  const onChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const splitName = (full) => {
    const parts = (full || "").trim().split(/\s+/);
    if (parts.length === 1) return { first_name: parts[0], last_name: "" };
    return {
      first_name: parts.slice(0, -1).join(" "),
      last_name: parts.slice(-1).join(" "),
    };
  };
  const splitAddressLine1 = (line) => {
    const m = (line || "").trim().match(/^(.+?)\s+(\d+[a-zA-Z]?)$/);
    return m
      ? { street: m[1], houseNumber: m[2] }
      : { street: line || "", houseNumber: "" };
  };
  const buildAddressPayload = () => {
    const { first_name, last_name } = splitName(form.fullName);
    return {
      address_id: addressIdRef.current ?? undefined,
      first_name,
      last_name,
      address_line1: `${form.street}${
        form.houseNumber ? ` ${form.houseNumber}` : ""
      }`.trim(),
      address_line2: form.apartment || "",
      postal_code: form.postalCode || "",
      city: form.city || "",
      country: form.country || "Germany",
      phone: form.telephone || "",
      is_default: true,
    };
  };

  // Prefill
  useEffect(() => {
    (async () => {
      try {
        const a = await http.get("dashboard/addresses/", {
          params: { page_size: 20 },
        });
        const list = a.data?.results ?? a.data ?? [];
        const main = list.find((x) => x?.is_default) ?? list[0] ?? null;
        if (main) {
          addressIdRef.current = Number(main.id);
          const fullName =
            [main.first_name, main.last_name]
              .filter(Boolean)
              .join(" ")
              .trim() ||
            main.full_name ||
            form.fullName;
          const line1 =
            main.address_line1 ||
            `${main.street_name || ""} ${main.house_number || ""}`.trim();
          const { street, houseNumber } = splitAddressLine1(line1);
          setForm((p) => ({
            ...p,
            fullName,
            country: main.country ?? p.country ?? "Germany",
            street,
            houseNumber,
            apartment: main.address_line2 ?? main.apartment ?? p.apartment,
            postalCode: main.postal_code ?? main.pincode ?? p.postalCode,
            city: main.city ?? main.state ?? p.city,
            telephone: main.phone ?? p.telephone,
          }));
        }
      } catch (err) {
        if (err?.response?.status === 401) {
          navigate("/login?next=/checkout");
          return;
        }
      }

      try {
        const u = await http.get("dashboard/account/");
        setForm((p) => ({ ...p, email: u.data?.email || p.email }));
      } catch (err) {
        if (err?.response?.status === 401) {
          navigate("/login?next=/checkout");
          return;
        }
      }
    })();
  }, [navigate]);

  // Save address
  const [savingAddr, setSavingAddr] = useState(false);
  const [addrSaved, setAddrSaved] = useState(false);
  const saveAddress = async () => {
    setSavingAddr(true);
    try {
      const payload = buildAddressPayload();
      if (addressIdRef.current) {
        await http.put(`dashboard/addresses/${addressIdRef.current}/`, payload);
        setAddrSaved(true);
      } else {
        const r = await http.post("dashboard/addresses/", payload);
        addressIdRef.current = r.data?.id ?? null;
        setAddrSaved(true);
      }
    } catch {
      setAddrSaved(false);
      alert("Failed to save address.");
    } finally {
      setSavingAddr(false);
    }
  };

  // wipe cart after success
  const wipeCart = useCallback(() => {
    skipCartGuardRef.current = true;
    dispatch(clearCart());
    try {
      localStorage.removeItem("cart");
      localStorage.removeItem("mm_cart");
    } catch {}
  }, [dispatch]);

  const onSuccessfulOrder = (id) => {
    wipeCart();
    if (id) navigate(`/checkout/success?order=${id}`);
    else navigate("/dashboard/orders");
  };

  const [payment, setPayment] = useState("paypal");
  const INSTALLMENT_THRESHOLDS = { 3: 100, 6: 200, 12: 500 };
  const availableMonths = useMemo(() => {
    const m = [];
    if (total >= INSTALLMENT_THRESHOLDS["3"]) m.push(3);
    if (total >= INSTALLMENT_THRESHOLDS["6"]) m.push(6);
    if (total >= INSTALLMENT_THRESHOLDS["12"]) m.push(12);
    return m;
  }, [total]);
  const [selectedMonths, setSelectedMonths] = useState(null);
  const monthly = selectedMonths ? (total / selectedMonths).toFixed(2) : null;
  useEffect(() => {
    setSelectedMonths(availableMonths.length ? availableMonths[0] : null);
  }, [availableMonths]);

  const localOrderIdRef = useRef(null);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Contact</h2>
          <input
            name="email"
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={onChange}
            className="w-full border rounded px-3 py-2 mb-4"
          />

          <h2 className="text-lg font-semibold mb-2">Delivery</h2>
          <p className="text-sm text-gray-500 mb-4">
            This will also be used as your billing address for this order.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-sm text-gray-600">Country/Region</label>
              <select
                name="country"
                value={form.country}
                onChange={onChange}
                className="w-full border rounded px-3 py-2"
              >
                <option>Germany</option>
                <option>Austria</option>
                <option>Switzerland</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-gray-600">Full name</label>
              <input
                name="fullName"
                value={form.fullName}
                onChange={onChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-gray-600">Street address</label>
              <input
                name="street"
                value={form.street}
                onChange={onChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">House number</label>
              <input
                name="houseNumber"
                value={form.houseNumber}
                onChange={onChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Apartment, room</label>
              <input
                name="apartment"
                value={form.apartment}
                onChange={onChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Postal code</label>
              <input
                name="postalCode"
                value={form.postalCode}
                onChange={onChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">City</label>
              <input
                name="city"
                value={form.city}
                onChange={onChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-gray-600">Telephone</label>
              <input
                name="telephone"
                value={form.telephone}
                onChange={onChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={saveAddress}
              disabled={savingAddr}
              className="px-4 py-2 rounded bg-gray-900 text-white hover:bg-black disabled:opacity-60"
            >
              {savingAddr ? "Saving…" : "Save address"}
            </button>
            {addrSaved && (
              <span className="text-green-600 self-center">Saved ✓</span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-3">Shipment</h2>
          <div className="flex items-center justify-between border rounded p-3">
            <div className="text-sm">
              Standard shipping (6 – 11 business days)
            </div>
            <div className="text-sm font-semibold">
              {shippingFee === 0 ? "Free" : fmtEUR(shippingFee)}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Payment</h2>
          <p className="text-sm text-gray-500 mb-4">
            The billing address of your payment method must match the shipping
            address. All transactions are secure and encrypted.
          </p>

          <PayPalScriptProvider
            options={{
              clientId: process.env.REACT_APP_PAYPAL_CLIENT_ID || "",
              currency: "EUR",
              intent: "capture",
              components: "buttons,hosted-fields",
              "enable-funding": "card,paypal",
            }}
          >
            <label className="flex items-center gap-3 border rounded p-3 cursor-pointer">
              <input
                type="radio"
                name="payment"
                value="paypal"
                checked={payment === "paypal"}
                onChange={() => setPayment("paypal")}
              />
              <span className="flex-1">PayPal</span>
              <span className="text-xs font-semibold text-[#003087]">
                PayPal
              </span>
            </label>

            {payment === "paypal" && (
              <div className="border rounded p-3">
                <PayPalButtons
                  style={{ layout: "horizontal" }}
                  createOrder={async () => {
                    const res = await http.post(
                      "payments/paypal/create-order/",
                      {
                        items: lineItems,
                        payment_method: "paypal",
                        ...buildAddressPayload(),
                      }
                    );
                    localOrderIdRef.current = res.data.order_id;
                    return res.data.id;
                  }}
                  onApprove={async (data) => {
                    const cap = await http.post(
                      `payments/paypal/capture/${data.orderID}/`
                    );
                    if (cap.data?.status === "COMPLETED") {
                      const id = localOrderIdRef.current;
                      onSuccessfulOrder(id);
                    } else {
                      alert("Payment capture failed.");
                    }
                  }}
                />
              </div>
            )}

            <CardFields
              active={payment === "card"}
              setActive={() => setPayment("card")}
              lineItems={lineItems}
              form={form}
              setLocalOrderId={(id) => (localOrderIdRef.current = id)}
              onSuccess={() => onSuccessfulOrder(localOrderIdRef.current)}
            />
          </PayPalScriptProvider>

          {/* Klarna installments */}
          {availableMonths.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-green-700 bg-green-50 border border-green-100 rounded px-2 py-1">
                  Eligible for 0% financing
                </div>
                <div className="text-sm text-gray-600">
                  Choose term:
                  <span className="ml-2 inline-flex gap-2">
                    {availableMonths.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSelectedMonths(m)}
                        className={`px-2 py-1 rounded border text-sm ${
                          selectedMonths === m
                            ? "bg-pink-600 text-white border-pink-600"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {m} months
                      </button>
                    ))}
                  </span>
                </div>
              </div>

              {selectedMonths && (
                <div className="mb-2 text-sm">
                  Pay{" "}
                  <strong>
                    {selectedMonths} × {(total / selectedMonths).toFixed(2)} €
                  </strong>{" "}
                  (total {total.toFixed(2)} €)
                </div>
              )}

              <KlarnaWidget
                active={payment === "klarna_installments"}
                setActive={() => setPayment("klarna_installments")}
                items={lineItems}
                form={form}
                total={total}
                category="pay_over_time"
                months={selectedMonths || undefined}
                label={
                  selectedMonths && monthly
                    ? `Pay ${selectedMonths} × ${monthly} € with Klarna (0% financing)`
                    : undefined
                }
                onSuccess={(localId) => onSuccessfulOrder(localId)}
                setLocalOrderId={(id) => (localOrderIdRef.current = id)}
                {...buildAddressPayload()}
              />
            </div>
          )}

          {/* Klarna invoice */}
          <KlarnaWidget
            active={payment === "klarna"}
            setActive={() => setPayment("klarna")}
            items={lineItems}
            form={form}
            total={total}
            category="pay_later"
            onSuccess={(localId) => onSuccessfulOrder(localId)}
            setLocalOrderId={(id) => (localOrderIdRef.current = id)}
            {...buildAddressPayload()}
          />

          {/* Direct bank transfer */}
          <label className="flex items-center gap-3 border rounded p-3 cursor-pointer mt-3">
            <input
              type="radio"
              name="payment"
              value="bank"
              checked={payment === "bank"}
              onChange={() => setPayment("bank")}
            />
            <span className="flex-1">Direct Bank Transfer (SEPA)</span>
            <span className="text-xs">IBAN/BIC</span>
          </label>
          {payment === "bank" && (
            <div className="border rounded p-3 space-y-3">
              <p className="text-sm text-gray-600">
                You will receive our bank details and reference. Please transfer
                the amount within 24 hours.
              </p>
              <button
                onClick={async () => {
                  try {
                    const res = await http.post("payments/bank/create/", {
                      items: lineItems,
                      payment_method: "bank",
                      ...buildAddressPayload(),
                    });
                    const id =
                      res.data?.order_id ?? res.data?.order?.id ?? null;

                    sessionStorage.setItem(
                      "bank_checkout_info",
                      JSON.stringify({
                        order_id: id,
                        order_number: res.data?.order_number,
                        amount: res.data?.amount,
                        iban: res.data?.iban,
                        bic: res.data?.bic,
                        beneficiary: res.data?.beneficiary,
                        reference: res.data?.reference,
                        instructions: res.data?.instructions,
                      })
                    );
                    onSuccessfulOrder(id);
                  } catch {
                    alert(
                      "Failed to create bank transfer order. Please log in and try again."
                    );
                  }
                }}
                className="w-full py-3 rounded bg-gray-900 text-white font-semibold hover:bg-black"
              >
                Place order (bank transfer) — {fmtEUR(total)}
              </button>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-700">
            <Badge
              icon={<ShieldCheck className="w-4 h-4" />}
              text="Secure payment"
            />
            <Badge
              icon={<RotateCcw className="w-4 h-4" />}
              text="15 days return policy"
            />
            <Badge
              icon={<Truck className="w-4 h-4" />}
              text="Convenient & easy delivery"
            />
          </div>
        </div>
      </div>

      {/* RIGHT summary */}
      <aside className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow p-6 sticky top-24">
          <h2 className="text-xl font-semibold mb-4">Order Overview</h2>
          <div className="space-y-4">
            {items.map((it) => (
              <div key={it.id} className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={it.image}
                    alt={it.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {it.qty}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{it.name}</div>
                </div>
                <div className="font-medium text-sm">
                  {fmtEUR(it.price * it.qty)}
                </div>
              </div>
            ))}
          </div>

          <hr className="my-4" />
          <Row
            label={`Subtotal (${itemsCount} ${
              itemsCount === 1 ? "item" : "items"
            })`}
            value={fmtEUR(subtotal)}
          />
          <Row
            label="Shipment"
            value={shippingFee === 0 ? "Free" : fmtEUR(shippingFee)}
          />
          <div className="flex items-center justify-between mt-2">
            <div className="text-base font-semibold">In total</div>
            <div className="text-base font-semibold">{fmtEUR(total)}</div>
          </div>
          <div className="text-xs text-gray-500 mt-1">(incl. tax)</div>

          <Link
            to="/cart"
            className="mt-5 inline-block w-full text-center py-2 rounded border hover:bg-gray-50"
          >
            Back to cart
          </Link>
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm mt-1">
      <div className="text-gray-600">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function Badge({ icon, text }) {
  return (
    <div className="flex items-center gap-2">
      <div className="p-1 bg-gray-100 rounded">{icon}</div>
      <span>{text}</span>
    </div>
  );
}
