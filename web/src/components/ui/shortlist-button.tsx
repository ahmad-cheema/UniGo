"use client";

import { useState } from "react";

interface Props {
  universityId: number;
  initialShortlisted: boolean;
  size?: "sm" | "md";
}

export function ShortlistButton({
  universityId,
  initialShortlisted,
  size = "md",
}: Props) {
  const [shortlisted, setShortlisted] = useState(initialShortlisted);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      if (shortlisted) {
        await fetch("/api/shortlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ universityId }),
        });
        setShortlisted(false);
      } else {
        const res = await fetch("/api/shortlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ universityId }),
        });
        if (res.ok || res.status === 409) {
          setShortlisted(true);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  const sizeClasses =
    size === "sm"
      ? "h-8 w-8 text-base"
      : "h-10 w-10 text-lg";

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      disabled={loading}
      title={shortlisted ? "Remove from shortlist" : "Add to shortlist"}
      className={`${sizeClasses} inline-flex items-center justify-center rounded-full border transition-all duration-200 cursor-pointer ${
        shortlisted
          ? "border-amber-300 bg-amber-50 text-amber-500 hover:bg-amber-100"
          : "border-border bg-white text-text-secondary hover:border-amber-300 hover:text-amber-500"
      } ${loading ? "opacity-50" : ""}`}
    >
      {shortlisted ? "★" : "☆"}
    </button>
  );
}
