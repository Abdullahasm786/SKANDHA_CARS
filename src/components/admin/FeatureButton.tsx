"use client";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toggleFeatured } from "@/actions/vehicles";
import { useToast } from "./Toast";

export function FeatureButton({ id, featured, title }: { id: string; featured: boolean; title: string }) {
  const router = useRouter(); const toast = useToast(); const [busy, start] = useTransition();
  return (
    <button className="btn btn-sm" disabled={busy} aria-label={`${featured ? "Remove from featured" : "Feature"} ${title}`}
      onClick={() => start(async () => { const r = await toggleFeatured(id); toast(r.ok, r.message); if (r.ok) router.refresh(); })}>
      <Star size={14} className={featured ? "fill-warn text-warn" : ""} aria-hidden />{featured ? "Unfeature" : "Feature"}
    </button>
  );
}
