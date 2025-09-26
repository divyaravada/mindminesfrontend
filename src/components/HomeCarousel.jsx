// src/components/HomeCarousel.jsx
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import { useState, useRef, useEffect, useMemo } from "react";
import { homeCategories as rawCategories } from "../data/homeCategories";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function HomeCarousel() {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const timer = useRef(null);

  // Safety: ensure it's an array
  const categories = useMemo(
    () => (Array.isArray(rawCategories) ? rawCategories : []),
    []
  );

  const [sliderRef, slider] = useKeenSlider({
    loop: true,
    slideChanged(s) {
      setCurrentSlide(s.track.details.rel);
    },
    slides: { perView: 1 },
    renderMode: "performance",
    dragSpeed: 1.8,
  });

  useEffect(() => {
    if (!slider?.current) return;
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => slider.current?.next(), 3000);
    return () => timer.current && clearInterval(timer.current);
  }, [slider]);

  const pauseAutoplay = () => timer.current && clearInterval(timer.current);
  const resumeAutoplay = () => {
    if (slider?.current) {
      timer.current = setInterval(() => slider.current?.next(), 3000);
    }
  };

  // If categories missing, render a simple fallback instead of crashing
  if (!categories.length) {
    return (
      <div className="relative w-full h-[60vh] flex items-center justify-center bg-gray-200 dark:bg-gray-800">
        <div className="text-center px-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            {t("home.heroFallback.title", "Welcome to MindMines")}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {t("home.heroFallback.subtitle", "Explore our latest collections.")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div
        ref={sliderRef}
        className="keen-slider h-full md:h-full"
        onMouseEnter={pauseAutoplay}
        onMouseLeave={resumeAutoplay}
      >
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="keen-slider__slide relative flex items-end bg-black"
          >
            <img
              src={cat.image}
              alt={t(`categories.${cat.id}.heading`, cat.id)}
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
            <div className="relative z-10 p-8 md:p-12">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight drop-shadow mb-2">
                {t(`categories.${cat.id}.heading`, cat.id)}
              </h2>
              <div className="w-16 border-b-2 border-white mb-4" />
              <p className="text-base md:text-lg text-gray-100 max-w-lg mb-8 drop-shadow">
                {t(`categories.${cat.id}.description`, "")}
              </p>
              <Link
                to={cat.link}
                className="inline-block bg-white/90 hover:bg-white text-marbleblack font-bold px-6 py-2 rounded-xl transition"
              >
                {t(
                  `categories.${cat.id}.button`,
                  t("common.shopNow", "Shop now")
                )}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Dots */}
      <div className="absolute left-1/2 bottom-8 -translate-x-1/2 flex gap-2 z-20">
        {categories.map((_, idx) => (
          <button
            key={idx}
            className={`w-4 h-4 rounded-full border-2 border-white bg-white/40 hover:bg-white transition ${
              currentSlide === idx ? "bg-white shadow-lg" : ""
            }`}
            onClick={() => slider.current?.moveToIdx(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
