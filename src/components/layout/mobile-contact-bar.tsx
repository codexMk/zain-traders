import { Phone } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { businessInfo } from "@/lib/site-data";

export function MobileContactBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-brand-emerald/12 bg-brand-cream/96 px-4 py-3 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-xl gap-3">
        <ButtonLink
          href={businessInfo.whatsappHref}
          className="flex-1 justify-center"
          variant="primary"
        >
          WhatsApp
        </ButtonLink>
        <a
          href={businessInfo.primaryPhone.href}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-brand-emerald/20 bg-white/75 px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-brand-emerald shadow-[0_18px_40px_rgba(15,61,46,0.08)]"
        >
          <Phone className="h-4 w-4" aria-hidden />
          Call Now
        </a>
      </div>
    </div>
  );
}
