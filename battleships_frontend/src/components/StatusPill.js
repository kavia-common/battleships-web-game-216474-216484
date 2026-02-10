import React from "react";

export default function StatusPill({ tone = "neutral", text, compact = false }) {
  return (
    <div className={`pill pill-${tone} ${compact ? "pill-compact" : ""}`}>
      <span className="pillDot" aria-hidden="true" />
      <span className="pillText">{text}</span>
    </div>
  );
}
