// src/components/StoneGallery.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function StoneGallery({ images = [], stoneType = "Stone" }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [bgPos, setBgPos] = useState("center");

  const active = images[activeIndex] ?? "";
  const { t } = useTranslation();

  const onMove = (e) => {
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setBgPos(`${x}% ${y}%`);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full">
      {/* Thumbnails */}
      <div className="flex md:flex-col gap-2 overflow-y-auto max-h-[600px] pr-2">
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            onClick={() => setActiveIndex(i)}
            className={`w-20 h-20 object-cover rounded cursor-pointer border transition ${
              i === activeIndex
                ? "border-blue-500 ring-2 ring-blue-300"
                : "border-gray-300"
            }`}
            alt=""
          />
        ))}
      </div>

      {/* Main image with simple zoom on hover */}
      <div className="flex-1 grid md:grid-cols-[600px_1fr] gap-6">
        <div
          className="w-full h-[597px] border rounded bg-no-repeat bg-contain md:bg-cover"
          style={{
            backgroundImage: `url(${active})`,
            backgroundPosition: bgPos,
          }}
          onMouseMove={onMove}
          onMouseLeave={() => setBgPos("center")}
        >
          {/* also render the image for accessibility / fallback */}
          <img
            src={active}
            alt="Stone"
            className="w-full h-full object-contain opacity-0"
          />
        </div>

        {/* Right-side details (keep your existing content or translations here) */}
        <div className="flex flex-col gap-4 text-sm text-gray-800">
          <h2 className="text-2xl font-semibold capitalize">{stoneType}</h2>

          {/* Colors */}
          <div>
            <p className="font-semibold mb-2">
              {t("naturalStone.stone1.availableColors")}
            </p>
            <div className="flex gap-2">
              {["white", "black", "gray", "beige", "green", "maroon"].map(
                (color) => (
                  <div
                    key={color}
                    className="w-6 h-6 rounded-full border shadow cursor-pointer"
                    style={{ backgroundColor: color }}
                    title={color}
                  ></div>
                )
              )}
            </div>
          </div>

          {/* Features */}
          <div>
            <p className="font-semibold mb-2">
              {t("naturalStone.stone1.features")}
            </p>
            <ul className="list-disc ml-5 text-gray-600 text-sm">
              {t("naturalStone.stone1.featureList", {
                returnObjects: true,
              }).map((feature, i) => (
                <li key={i}>{feature}</li>
              ))}
            </ul>
          </div>

          {/* Usage */}
          <div>
            <p className="font-semibold mb-2">
              {t("naturalStone.stone1.usedFor")}
            </p>
            <p className="text-gray-600">{t("naturalStone.stone1.usage")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
