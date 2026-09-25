"use client";

import { FormEvent, useState } from "react";
import { MessageCircleMore, Send } from "lucide-react";
import { businessInfo, products } from "@/lib/site-data";

type TradeEnquiryFormProps = {
  initialProduct?: string;
};

type EnquiryValues = {
  name: string;
  businessName: string;
  phone: string;
  productInterest: string;
  quantity: string;
  message: string;
};

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-brand-emerald/12 bg-white/88 px-4 py-3 text-sm text-brand-charcoal outline-none placeholder:text-brand-muted/70 focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/10";

export function TradeEnquiryForm({ initialProduct = "" }: TradeEnquiryFormProps) {
  const [values, setValues] = useState<EnquiryValues>({
    name: "",
    businessName: "",
    phone: "",
    productInterest: initialProduct,
    quantity: "",
    message: "",
  });
  const [isSent, setIsSent] = useState(false);

  const updateField = (field: keyof EnquiryValues, value: string) => {
    setIsSent(false);
    setValues((current) => ({ ...current, [field]: value }));
  };

  const submitEnquiry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const message = [
      "Hello Zain Traders, I would like a wholesale enquiry.",
      `Name: ${values.name}`,
      `Business: ${values.businessName}`,
      `Phone: ${values.phone}`,
      `Product interest: ${values.productInterest}`,
      `Quantity required: ${values.quantity}`,
      values.message ? `Message: ${values.message}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    window.open(
      `https://wa.me/${businessInfo.whatsappNumber}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setIsSent(true);
  };

  return (
    <form onSubmit={submitEnquiry} className="surface-card rounded-[34px] p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-emerald text-brand-gold">
          <MessageCircleMore className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-brand-gold">
            Wholesale enquiry
          </p>
          <h2 className="mt-2 font-serif text-3xl text-brand-emerald">Tell us what you need</h2>
          <p className="mt-2 text-sm leading-6 text-brand-muted">
            Your enquiry opens in WhatsApp so the trade desk can respond quickly with availability and rate guidance.
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-brand-charcoal">
          Your name
          <input
            required
            value={values.name}
            onChange={(event) => updateField("name", event.target.value)}
            className={fieldClassName}
            autoComplete="name"
            placeholder="Your full name"
          />
        </label>
        <label className="text-sm font-semibold text-brand-charcoal">
          Business name
          <input
            required
            value={values.businessName}
            onChange={(event) => updateField("businessName", event.target.value)}
            className={fieldClassName}
            autoComplete="organization"
            placeholder="Shop, hotel, or company"
          />
        </label>
        <label className="text-sm font-semibold text-brand-charcoal">
          Phone number
          <input
            required
            type="tel"
            inputMode="tel"
            value={values.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            className={fieldClassName}
            autoComplete="tel"
            placeholder="Your WhatsApp number"
          />
        </label>
        <label className="text-sm font-semibold text-brand-charcoal">
          Product interest
          <select
            required
            value={values.productInterest}
            onChange={(event) => updateField("productInterest", event.target.value)}
            className={fieldClassName}
          >
            <option value="" disabled>
              Select a product or category
            </option>
            <option value="General wholesale enquiry">General wholesale enquiry</option>
            {products.map((product) => (
              <option key={product.slug} value={product.englishName}>
                {product.englishName}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 block text-sm font-semibold text-brand-charcoal">
        Quantity required
        <input
          required
          value={values.quantity}
          onChange={(event) => updateField("quantity", event.target.value)}
          className={fieldClassName}
          placeholder="For example: 25 kg, 5 cartons, monthly supply"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-brand-charcoal">
        Message <span className="font-normal text-brand-muted">(optional)</span>
        <textarea
          value={values.message}
          onChange={(event) => updateField("message", event.target.value)}
          className={`${fieldClassName} min-h-28 resize-y`}
          placeholder="Share grade, packing, delivery, or any other requirement"
        />
      </label>

      <button
        type="submit"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-emerald px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-brand-cream shadow-[0_18px_45px_rgba(15,61,46,0.22)] hover:-translate-y-0.5 hover:bg-[#124a38] sm:w-auto"
      >
        Send enquiry on WhatsApp
        <Send className="h-4 w-4" aria-hidden />
      </button>
      {isSent ? (
        <p className="mt-4 text-sm leading-6 text-brand-emerald" role="status">
          WhatsApp has opened with your enquiry details ready to send.
        </p>
      ) : null}
    </form>
  );
}
