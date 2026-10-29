"use client";
import { Check, Share2 } from "lucide-react";
import { useState } from "react";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch { /* user cancelled */ }
  }
  return (
    <button type="button" className="btn" onClick={share}>
      {copied ? <Check size={16} aria-hidden /> : <Share2 size={16} aria-hidden />} {copied ? "Link copied" : "Share"}
    </button>
  );
}
