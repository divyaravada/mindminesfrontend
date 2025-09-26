// src/components/LegalMarkdownPage.jsx
import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function LegalMarkdownPage({ ns }) {
  const { t } = useTranslation(ns);
  const title = t("title");
  const updated = t("updated", { defaultValue: "" });
  const sections = t("sections", { returnObjects: true }) || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 prose prose-neutral lg:prose-lg dark:prose-invert">
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      {!!updated && <p className="text-sm text-gray-500 mb-6">{updated}</p>}

      <div className="space-y-8">
        {sections.map((s, idx) => (
          <section key={idx}>
            {s?.heading && (
              <h2 className="text-xl font-semibold mb-2">{s.heading}</h2>
            )}
            {(s?.body || []).map((p, i) => (
              <p
                key={i}
                className="text-gray-800 dark:text-gray-200 leading-relaxed"
              >
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

LegalMarkdownPage.propTypes = {
  ns: PropTypes.oneOf(["privacy", "imprint", "terms"]).isRequired,
};
