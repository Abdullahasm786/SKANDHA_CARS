import { MessageCircle } from "lucide-react";
import { whatsappUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils/format";

/** Opens a WhatsApp chat with a prefilled message. Opening the chat does not send anything. */
export function WhatsappButton({
  number, message, label = "Chat on WhatsApp", className, size,
}: { number: string | null; message: string; label?: string; className?: string; size?: "sm" }) {
  if (!number) return null;
  return (
    <a
      href={whatsappUrl(number, message)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("btn btn-whatsapp", size === "sm" && "btn-sm", className)}
    >
      <MessageCircle size={18} aria-hidden /> {label}
    </a>
  );
}
