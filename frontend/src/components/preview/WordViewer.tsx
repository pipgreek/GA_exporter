"use client";

import DOMPurify from "dompurify";
import { useMemo } from "react";

interface WordViewerProps {
  /** HTML converted from the .docx by the backend (mammoth). */
  html: string;
}

/**
 * Read-only INFO document preview. The HTML comes from the backend, so it is
 * always sanitized with DOMPurify before rendering (XSS protection).
 */
export function WordViewer({ html }: WordViewerProps) {
  const safeHtml = useMemo(
    () => DOMPurify.sanitize(html, { USE_PROFILES: { html: true } }),
    [html],
  );

  return <div className="doc-preview" dangerouslySetInnerHTML={{ __html: safeHtml }} />;
}
