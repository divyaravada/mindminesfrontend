// src/components/CookieConsent.jsx
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {
  initConsent,
  saveConsent,
  openManager,
  closeManager,
} from "../features/cookies/cookieSlice";

export default function CookieConsent() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const open = useSelector((s) => s.cookies.open);
  const stored = useSelector((s) => s.cookies.consent);

  // local draft switches before “Save”
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    dispatch(initConsent());
  }, [dispatch]);

  useEffect(() => {
    // initialize draft from stored whenever we open
    if (open) {
      setAnalytics(!!stored.analytics);
      setMarketing(!!stored.marketing);
    }
  }, [open, stored.analytics, stored.marketing]);

  // expose a button for reopening from anywhere
  useEffect(() => {
    window.openCookieManager = () => dispatch(openManager());
    return () => {
      if (window.openCookieManager) delete window.openCookieManager;
    };
  }, [dispatch]);

  if (!open) return null;

  const onAcceptAll = () =>
    dispatch(saveConsent({ analytics: true, marketing: true }));

  const onRejectAll = () =>
    dispatch(saveConsent({ analytics: false, marketing: false }));

  const onSave = () => dispatch(saveConsent({ analytics, marketing }));

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="max-w-7xl mx-auto m-4 p-4 rounded-lg shadow-lg bg-white dark:bg-gray-900 border">
        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          {/* left - text */}
          <div className="flex-1">
            <h3 className="font-semibold">{t("cookies.bannerTitle")}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t("cookies.bannerText")}
            </p>
          </div>

          {/* middle - toggles */}
          <div className="flex-1">
            <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 space-y-2">
              <label className="flex items-center justify-between">
                <span>{t("cookies.categories.essential")}</span>
                <input type="checkbox" checked readOnly />
              </label>
              <label className="flex items-center justify-between">
                <span>{t("cookies.categories.analytics")}</span>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                />
              </label>
              <label className="flex items-center justify-between">
                <span>{t("cookies.categories.marketing")}</span>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                />
              </label>
            </div>
          </div>

          {/* right - buttons */}
          <div className="flex flex-col gap-2">
            <button
              className="px-4 py-2 rounded bg-gray-900 text-white"
              onClick={onAcceptAll}
            >
              {t("acceptAll")}
            </button>
            <button className="px-4 py-2 rounded border" onClick={onRejectAll}>
              {t("rejectAll")}
            </button>
            <button className="px-4 py-2 rounded border" onClick={onSave}>
              {t("save")}
            </button>
            <button
              className="px-4 py-2 rounded border opacity-70"
              onClick={() => dispatch(closeManager())}
            >
              {t("close") || "Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
