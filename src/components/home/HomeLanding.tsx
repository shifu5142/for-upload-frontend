"use client";

import { Eye, MessageSquare, Send, Sparkles } from "lucide-react";
import Image from "next/image";
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { useLocale } from "next-intl";
import { ExtensionDemo } from "@/components/home/ExtensionDemo";

const COPY = {
  he: {
    eyebrow: "תוסף Chrome לנציגי מכירות",
    title: "עוזר המכירות שמכין את השיחה מתוך הדפדפן",
    body: "shirSales מרכז קטגוריות, תת-קטגוריות ופרומטים מוכנים, כדי שנציג יוכל לבחור פעולה ולשלוח אותה ל-AI בלי לחפש ניסוח מאפס.",
    open: "לניהול התוסף",
    previewLabel: "תצוגה מקדימה",
    featuresTitle: "מה יש בתוסף",
    featuresBody: "היכולות שכבר קיימות בעבודה היומיומית עם הפלייבוק.",
    features: [
      {
        title: "פעולות לפי קטגוריה",
        body: "כל נושא מכירה יושב בקטגוריה, ובתוכה תת-קטגוריות עם שם, הסבר ופרומט.",
        icon: MessageSquare,
      },
      {
        title: "פרומט מוכן לשליחה",
        body: "אפשר לפתוח את הפרומט של תת-הקטגוריה ולשלוח אותו לצ'אט, בלי לכתוב אותו מחדש.",
        icon: Send,
      },
      {
        title: "מוצג או מוסתר לנציג",
        body: "פעולה יכולה להיות פעילה אצל הנציגים, או מוסתרת עד שמנהל מחליט להציג אותה.",
        icon: Eye,
      },
      {
        title: "הכנה לפני השיחה",
        body: "הנציג בוחר פעולה מוכנה להתנגדות, למעקב או לפתיחה, במקום לאלתר באמצע שיחה.",
        icon: Sparkles,
      },
    ],
  },
  en: {
    eyebrow: "Chrome extension for sales teams",
    title: "The sales assistant that prepares the conversation in the browser",
    body: "shirSales keeps categories, subcategories, and ready prompts together, so a representative can pick an action and send it to the AI without starting from a blank page.",
    open: "Open the workspace",
    previewLabel: "Preview",
    featuresTitle: "What the extension includes",
    featuresBody: "The capabilities already used in the daily playbook.",
    features: [
      {
        title: "Actions by category",
        body: "Each sales topic is a category, with subcategories that hold a name, a note, and a prompt.",
        icon: MessageSquare,
      },
      {
        title: "A prompt ready to send",
        body: "Open a subcategory prompt and send it into the chat without rewriting it.",
        icon: Send,
      },
      {
        title: "Shown or hidden",
        body: "An action can stay active for representatives, or hidden until an admin turns it on.",
        icon: Eye,
      },
      {
        title: "Ready before the call",
        body: "Representatives pick a prepared action for an objection, a follow-up, or an opening.",
        icon: Sparkles,
      },
    ],
  },
} as const;

export function HomeLanding() {
  const locale = useLocale() === "he" ? "he" : "en";
  const text = COPY[locale];

  return (
    <div className="min-h-dvh bg-[#f5f5f6] text-zinc-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Image
            src="/shirsales-icon.png"
            alt=""
            width={32}
            height={32}
            className="size-8 rounded-[9px]"
          />
          <span className="text-sm font-semibold">shirSales</span>
        </div>
        <LoginLink className="rounded-lg bg-[#2563eb] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
          {text.open}
        </LoginLink>
      </div>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:pb-20">
          <div>
            <p className="text-sm font-medium text-[#2563eb]">{text.eyebrow}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              {text.title}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-zinc-600">
              {text.body}
            </p>
          </div>
          <div>
            <p className="mb-3 text-xs font-medium tracking-wide text-zinc-500">
              {text.previewLabel}
            </p>
            <ExtensionDemo locale={locale} />
          </div>
        </section>

        <section className="border-t border-zinc-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight">
              {text.featuresTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
              {text.featuresBody}
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {text.features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article
                    key={feature.title}
                    className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-shadow hover:shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)]"
                  >
                    <span className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb]">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                      {feature.body}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
