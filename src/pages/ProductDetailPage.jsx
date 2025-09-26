import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactPlayer from "react-player";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { productTitle } from "../lib/i18n";
import { useDispatch } from "react-redux";
import { addItem } from "../features/cart/cartSlice";
import {
  useGetProductQuery,
  useListProductsQuery,
  useCreateProductReviewMutation,
} from "../features/products/productsApi";
import StarRating from "../components/StarRating";
import ProductReviews from "../components/ProductReviews";

export default function ProductDetailPage() {
  const { t, i18n } = useTranslation();
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const lang = i18n.language.startsWith("de") ? "de" : "en";

  const { data: product, isLoading } = useGetProductQuery(id);
  const { data: relatedResp } = useListProductsQuery(
    product?.category
      ? { category: product.category, page_size: 8 }
      : undefined,
    { skip: !product?.category }
  );
  const recommend = useMemo(() => {
    const list = relatedResp?.results ?? relatedResp ?? [];
    return list.filter((p) => String(p.id) !== String(id)).slice(0, 8);
  }, [relatedResp, id]);

  const [createReview] = useCreateProductReviewMutation();
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("details");
  const [revRating, setRevRating] = useState(5);
  const [revMessage, setRevMessage] = useState("");
  const fileRef = useRef(null);

  const toNumber = (v) => {
    if (typeof v === "number") return v;
    const s = String(v || "")
      .replace(/[^\d.,-]/g, "")
      .replace(",", ".");
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  };

  useEffect(() => setQty(1), [id]);

  if (isLoading)
    return <div className="py-24 text-center">{t("Loading...")}</div>;
  if (!product)
    return <div className="py-24 text-center">{t("Not found")}</div>;

  const handleAddToCart = () => {
    const unit = product.vat_price ?? product.price;
    dispatch(
      addItem({
        id: product.id,
        name: productTitle(product, lang),
        image: product.image,
        price: toNumber(unit),
        qty,
        category: product.category,
        dimensions: product.dimensions,
        weight: product.weight,
        color: product.color,
      })
    );
    navigate("/cart");
  };

  const submitReview = async () => {
    const fd = new FormData();
    fd.append("rating", String(revRating));
    fd.append("message", revMessage || "");
    if (fileRef.current?.files?.[0])
      fd.append("image", fileRef.current.files[0]);
    await createReview({ id, form: fd }).unwrap();
    setRevRating(5);
    setRevMessage("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-12">
      <div className="flex flex-col lg:flex-row gap-10">
        <div className="w-full lg:w-1/2">
          <Carousel
            showThumbs
            showStatus={false}
            infiniteLoop
            useKeyboardArrows
            dynamicHeight
            className="rounded-xl"
          >
            {product.media?.length
              ? product.media.map((m, i) =>
                  m.media_type === "video" && m.video ? (
                    <div key={i}>
                      <ReactPlayer src={m.video} controls width="100%" />
                    </div>
                  ) : (
                    <div key={i}>
                      <img
                        src={m.image}
                        alt={`${productTitle(product, lang)} – ${i + 1}`}
                      />
                    </div>
                  )
                )
              : [
                  <div key="default">
                    <img
                      src={product.image}
                      alt={productTitle(product, lang)}
                    />
                  </div>,
                ]}
          </Carousel>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <div className="text-xs text-gray-400 mb-2">
            {t("Key")}: {product.key}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">
            {productTitle(product, lang)}
          </h1>
          <div className="text-sm text-gray-500 mb-2">
            {t("categories." + product.category + ".heading")}
          </div>
          <div className="text-xl font-bold">{product.vat_price} €</div>

          <div className="space-y-2">
            <p>{product[`short_description1_${lang}`]}</p>
            <p>{product[`short_description2_${lang}`]}</p>
            <p>{product[`short_description3_${lang}`]}</p>
          </div>

          <div>
            <strong>{t("Dimensions")}:</strong> {product.dimensions}
          </div>
          <div>
            <strong>{t("Weight")}:</strong> {product.weight} kg
          </div>

          <div>
            <label htmlFor="qty">{t("Qty")}:</label>
            <input
              id="qty"
              type="number"
              min={1}
              max={product.quantity || 99}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="ml-2 border rounded px-2 py-1 w-20"
            />
          </div>

          <button
            onClick={handleAddToCart}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded font-bold"
          >
            {t("Add to Cart")}
          </button>
        </div>
      </div>

      <div className="mt-10">
        <div className="flex space-x-4 border-b">
          {["details", "care", "policy"].map((key) => (
            <button
              key={key}
              className={`py-2 px-4 font-semibold ${
                activeTab === key
                  ? "border-b-2 border-black dark:border-white"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab(key)}
            >
              {key === "details"
                ? t("Product Details")
                : key === "care"
                ? t("Care Instructions")
                : t("Delivery & Return Policy")}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {activeTab === "details" && (
            <>
              {[1, 2, 3].map((n) => {
                const v = product[`descriptionpara${n}_${lang}`];
                return typeof v === "string" || typeof v === "number" ? (
                  <p key={n}>{v}</p>
                ) : null;
              })}
            </>
          )}

          {activeTab === "care" && (
            <div className="whitespace-pre-line">
              {product[`carepara_${lang}`]
                ?.split(/\r?\n\r?\n/)
                .map((para, i) => {
                  const ci = para.indexOf(":");
                  if (ci !== -1) {
                    const title = para.slice(0, ci).trim();
                    const content = para.slice(ci + 1).trim();
                    return (
                      <p key={i}>
                        <span className="font-semibold">{title}:</span>{" "}
                        {content}
                      </p>
                    );
                  }
                  return <p key={i}>{para.trim()}</p>;
                })}
            </div>
          )}

          {activeTab === "policy" && (
            <>
              <div className="space-y-2">
                <strong>{t("Delivery")}:</strong>
                {product[`delivery_${lang}`]
                  ?.split(/\r?\n\r?\n/)
                  .map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
              </div>
              <div className="space-y-2">
                <strong>{t("Returns")}:</strong>
                {[1, 2, 3].map((n) =>
                  product[`returnspara${n}_${lang}`]
                    ? product[`returnspara${n}_${lang}`]
                        .split(/\r?\n\r?\n/)
                        .map((p, i) => <p key={`${n}-${i}`}>{p}</p>)
                    : null
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <ProductReviews productId={product.id} />

      <div className="p-4 rounded border bg-white shadow space-y-3">
        <div className="flex items-center gap-3">
          <label className="font-medium">{t("Rating")}:</label>
          <StarRating value={revRating} onChange={setRevRating} />
        </div>
        <div>
          <label className="block font-medium mb-1">{t("Message")}</label>
          <textarea
            value={revMessage}
            onChange={(e) => setRevMessage(e.target.value)}
            className="w-full border rounded px-3 py-2"
            rows={4}
            placeholder={t("Share your thoughts...")}
          />
        </div>
        <input ref={fileRef} type="file" accept="image/*" />
        <button
          onClick={submitReview}
          className="px-4 py-2 bg-black text-white rounded"
        >
          {t("Submit Review")}
        </button>
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-4">{t("You may also like")}</h2>
        {recommend.length === 0 ? (
          <div className="text-gray-500">{t("No suggestions found.")}</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recommend.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/decorative-products/${p.id}`)}
                className="bg-white rounded-xl p-4 shadow hover:shadow-md text-left"
              >
                <img
                  src={p.image}
                  alt={productTitle(p, lang)}
                  className="w-full h-40 object-cover rounded mb-2"
                />
                <div className="font-semibold truncate">
                  {productTitle(p, lang)}
                </div>
                <div className="text-sm text-gray-500">{p.vat_price} €</div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
