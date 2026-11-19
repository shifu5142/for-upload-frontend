"use client";

import { ChevronDown, LayoutGrid, MessageSquareText, Sparkles } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type DemoSubcategory = {
  id: string;
  name: string;
  prompt: string;
  reply: string;
};

type DemoCategory = {
  id: string;
  name: string;
  items: DemoSubcategory[];
};

type DemoSection = "categories" | "prompt" | "reply";

const DEMO: Record<"he" | "en", { categories: DemoCategory[] }> = {
  he: {
    categories: [
      {
        id: "messages",
        name: "סוגי הודעות",
        items: [
          {
            id: "intro",
            name: "הודעת פתיחה",
            prompt:
              "כתוב הודעת פתיחה קצרה לנציג שפונה ללקוח אחרי הדגמה. הטון ידידותי וענייני, בלי הבטחות מחיר.",
            reply:
              "היי נועה, תודה על הזמן היום. אם נוח לך, אסכם בשלוש נקודות את מה שראינו ואשלח הצעה מסודרת להמשך.",
          },
          {
            id: "follow",
            name: "מעקב עדין",
            prompt:
              "נסח מעקב קצר אחרי יומיים בלי תשובה. בלי לחץ, עם שאלה אחת ברורה.",
            reply:
              "רק בודק שההודעה הקודמת הגיעה. אם עדיין רלוונטי, אשמח לדעת אם נוח לקבוע שיחת המשך קצרה השבוע.",
          },
        ],
      },
      {
        id: "prep",
        name: "הכנה לשיחה",
        items: [
          {
            id: "brief",
            name: "תקציר לפני שיחה",
            prompt:
              "הכן תקציר של ארבע שורות לנציג לפני שיחת היכרות: מטרה, שאלה פותחת, ומה לא להבטיח.",
            reply:
              "מטרה: להבין את תהליך המכירה הנוכחי. פתיחה: איך אתם שולחים הצעות היום? לא להבטיח זמני הטמעה.",
          },
        ],
      },
      {
        id: "objections",
        name: "התנגדויות",
        items: [
          {
            id: "price",
            name: "זה יקר לנו",
            prompt:
              "הצע תשובה רגועה להתנגדות מחיר. תחילה הכר בה, אחר כך שאל מה משווים, בלי הנחה מיידית.",
            reply:
              "מבין שזה מרגיש יקר. לפני שנדבר על מספרים, מה אתם משווים אליו היום: זמן נציג, כלי אחר, או הצעה קודמת?",
          },
        ],
      },
      {
        id: "retain",
        name: "שימור לקוחות",
        items: [
          {
            id: "checkin",
            name: "בדיקת שביעות רצון",
            prompt:
              "כתוב הודעת שימור קצרה ללקוח אחרי חודש שימוש. שאלה אחת על מה שעובד ומה חסר.",
            reply:
              "עבר חודש מאז ההתחלה. מה כבר נכנס לשגרה אצל הצוות, ומה הייתם רוצים שיהיה פשוט יותר?",
          },
        ],
      },
    ],
  },
  en: {
    categories: [
      {
        id: "messages",
        name: "Message types",
        items: [
          {
            id: "intro",
            name: "Opening note",
            prompt:
              "Write a short opening note after a demo. Friendly and concrete, with no price promise.",
            reply:
              "Hi Noa, thanks for the time today. I can recap the three points we covered and send a clear next step.",
          },
          {
            id: "follow",
            name: "Light follow-up",
            prompt:
              "Draft a two-day follow-up with no pressure and one clear question.",
            reply:
              "Checking that my last note arrived. If it is still relevant, is a short follow-up call useful this week?",
          },
        ],
      },
      {
        id: "prep",
        name: "Call prep",
        items: [
          {
            id: "brief",
            name: "Pre-call brief",
            prompt:
              "Prepare a four-line brief: goal, opening question, and what not to promise.",
            reply:
              "Goal: understand the current sales process. Open with how proposals go out today. Do not promise rollout dates.",
          },
        ],
      },
      {
        id: "objections",
        name: "Objections",
        items: [
          {
            id: "price",
            name: "Too expensive",
            prompt:
              "Reply calmly to a price objection. Acknowledge it, then ask what they compare it with. No instant discount.",
            reply:
              "I hear that it feels expensive. Before numbers, what are you comparing it with: rep time, another tool, or an older quote?",
          },
        ],
      },
      {
        id: "retain",
        name: "Customer care",
        items: [
          {
            id: "checkin",
            name: "One-month check-in",
            prompt:
              "Write a short retention note after one month. Ask what works and what is still missing.",
            reply:
              "It has been a month. What is already part of the team routine, and what should be simpler?",
          },
        ],
      },
    ],
  },
};

const COPY = {
  he: {
    demo: "תצוגת הדגמה",
    address: "chrome-extension://shirsales/popup",
    categories: "קטגוריות",
    prompt: "פרומט",
    reply: "תשובה",
    empty: "בחרו תת-קטגוריה כדי לראות פרומט לדוגמה.",
    prepare: "הכן תשובה לדוגמה",
    sample: "תשובה לדוגמה",
    assistant: "AI Sales Assistant",
  },
  en: {
    demo: "Demo preview",
    address: "chrome-extension://shirsales/popup",
    categories: "Categories",
    prompt: "Prompt",
    reply: "Reply",
    empty: "Choose a subcategory to see a sample prompt.",
    prepare: "Prepare a sample reply",
    sample: "Sample reply",
    assistant: "AI Sales Assistant",
  },
} as const;

export function ExtensionDemo({ locale }: { locale: "he" | "en" }) {
  const data = DEMO[locale];
  const text = COPY[locale];
  const [openId, setOpenId] = useState(data.categories[0]?.id ?? "");
  const [selectedId, setSelectedId] = useState(data.categories[0]?.items[0]?.id ?? "");
  const [section, setSection] = useState<DemoSection>("categories");

  const selected =
    data.categories
      .flatMap((category) => category.items)
      .find((item) => item.id === selectedId) ?? null;

  function chooseSubcategory(id: string) {
    setSelectedId(id);
    setSection("prompt");
  }

  const tabs: { id: DemoSection; label: string; icon: typeof LayoutGrid }[] = [
    { id: "categories", label: text.categories, icon: LayoutGrid },
    { id: "prompt", label: text.prompt, icon: MessageSquareText },
    { id: "reply", label: text.reply, icon: Sparkles },
  ];

  return (
    <div className="mx-auto w-full max-w-[640px]">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)]">
        <div dir="ltr" className="flex items-center gap-3 border-b border-zinc-200 bg-zinc-100 px-3 py-2.5">
          <div className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex min-w-0 flex-1 items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] text-zinc-500">
            <span className="truncate">{text.address}</span>
          </div>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
            {text.demo}
          </span>
        </div>

        <div className="bg-[#f3f4f6] p-4 sm:p-6">
          <div className="mx-auto flex min-h-[460px] w-full max-w-[360px] flex-col overflow-hidden rounded-2xl border border-[#ececec] bg-[#fafafa] shadow-[0_16px_40px_-24px_rgba(17,24,39,0.45)]">
            <header className="flex items-center gap-2.5 border-b border-[#ececec] px-4 py-3">
              <Image
                src="/shirsales-icon.png"
                alt=""
                width={32}
                height={32}
                className="size-8 rounded-[9px]"
              />
              <div className="leading-tight">
                <div className="text-sm font-semibold text-[#111827]">shirSales</div>
                <div className="text-[11px] text-[#9ca3af]">{text.assistant}</div>
              </div>
            </header>

            <div className="grid grid-cols-3 gap-1 border-b border-[#ececec] p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = section === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSection(tab.id)}
                    className={`flex cursor-pointer items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors ${
                      active
                        ? "bg-[#111827] text-white"
                        : "text-zinc-500 hover:bg-white hover:text-zinc-900"
                    }`}
                  >
                    <Icon className="size-3.5" aria-hidden />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {section === "categories" ? (
                <div className="space-y-2">
                  {data.categories.map((category) => {
                    const open = openId === category.id;
                    return (
                      <section key={category.id} className="rounded-xl border border-[#e5e7eb] bg-white">
                        <button
                          type="button"
                          aria-expanded={open}
                          onClick={() => setOpenId(open ? "" : category.id)}
                          className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium text-[#111827] transition-colors hover:bg-zinc-50"
                        >
                          {category.name}
                          <ChevronDown
                            className={`size-4 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
                            aria-hidden
                          />
                        </button>
                        <div
                          className={`grid transition-[grid-template-rows] duration-200 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                        >
                          <div className="overflow-hidden">
                            <div className="space-y-1 border-t border-[#f3f4f6] p-2">
                              {category.items.map((item) => {
                                const active = item.id === selectedId;
                                return (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => chooseSubcategory(item.id)}
                                    className={`flex w-full cursor-pointer rounded-lg px-2.5 py-2 text-start text-sm transition-colors ${
                                      active
                                        ? "bg-blue-50 font-medium text-blue-800"
                                        : "text-zinc-600 hover:bg-zinc-50"
                                    }`}
                                  >
                                    {item.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </section>
                    );
                  })}
                </div>
              ) : null}

              {section === "prompt" ? (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-zinc-500">
                    {selected?.name ?? text.empty}
                  </p>
                  <p className="rounded-xl border border-[#e5e7eb] bg-white p-3 text-sm leading-6 text-zinc-800">
                    {selected?.prompt ?? text.empty}
                  </p>
                  <button
                    type="button"
                    disabled={!selected}
                    onClick={() => setSection("reply")}
                    className="w-full cursor-pointer rounded-xl bg-[#2563eb] px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
                  >
                    {text.prepare}
                  </button>
                </div>
              ) : null}

              {section === "reply" ? (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-zinc-500">{text.sample}</p>
                  <p className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-zinc-800 transition-opacity">
                    {selected?.reply ?? text.empty}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
