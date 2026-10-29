import { ImageOff } from "lucide-react";
import Image from "next/image";
import { vehicleImageUrl } from "@/lib/storage/urls";
import type { VehicleImage } from "@/lib/types";
import { cn } from "@/lib/utils/format";

export function VehicleThumb({ images, alt = "", className }: { images: Array<Pick<VehicleImage, "storage_path" | "is_primary">> | undefined; alt?: string; className?: string }) {
  const img = images?.find((i) => i.is_primary) ?? images?.[0];
  return (
    <span className={cn("relative block h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-2", className)}>
      {img ? <Image src={vehicleImageUrl(img.storage_path, "thumb")} alt={alt} fill sizes="96px" className="object-cover" />
        : <span className="grid h-full w-full place-items-center text-muted"><ImageOff size={16} aria-label="No photo" /></span>}
    </span>
  );
}
