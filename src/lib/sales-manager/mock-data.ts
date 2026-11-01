import type { SalesCatalog, SalesPlaybook, SalesReferenceFile } from "@/lib/sales-manager/types";

function file(id: string, name: string): SalesReferenceFile {
  return { id, name };
}

function playbook(
  id: string,
  categoryId: string,
  title: string,
  content: string,
  order: number,
  extras: Partial<SalesPlaybook> = {},
): SalesPlaybook {
  return {
    id,
    categoryId,
    subcategoryId: extras.subcategoryId,
    title,
    content,
    order,
    isActive: extras.isActive ?? true,
    files: extras.files ?? [],
  };
}

export const mockCatalog: SalesCatalog = {
  categories: [
    { id: "cat-sales", name: "מכירות", order: 0, isActive: true },
    { id: "cat-objections", name: "התנגדויות", order: 1, isActive: true },
    { id: "cat-follow", name: "פולואפ", order: 2, isActive: true },
    { id: "cat-closing", name: "סגירה", order: 3, isActive: true },
  ],
  subcategories: [
    { id: "sub-price", categoryId: "cat-objections", name: "מחיר", order: 0, isActive: true },
    { id: "sub-timing", categoryId: "cat-objections", name: "תזמון", order: 1, isActive: true },
    {
      id: "sub-competitor",
      categoryId: "cat-objections",
      name: "מתחרים",
      order: 2,
      isActive: true,
    },
    {
      id: "sub-not-interested",
      categoryId: "cat-objections",
      name: "לא מעוניין",
      order: 3,
      isActive: false,
    },
  ],
  playbooks: [
    playbook(
      "pb-expensive",
      "cat-objections",
      "הלקוח אומר שזה יקר מדי",
      "אני מבין שהמחיר הוא שיקול. בוא נחזור למה שחשוב לך להשיג, ואז נבדוק אם יש מסלול שמתאים לתקציב.",
      0,
      {
        subcategoryId: "sub-price",
        files: [file("file-pricing", "pricing.pdf"), file("file-guide", "product-guide.pdf")],
      },
    ),
    playbook(
      "pb-think",
      "cat-objections",
      "צריך לחשוב על זה",
      "כמובן. מה בדיוק חסר לך כדי להחליט, ומה יהיה צעד קטן שנקבע כבר עכשיו?",
      0,
      { subcategoryId: "sub-timing" },
    ),
    playbook(
      "pb-no-time",
      "cat-follow",
      "אין זמן",
      "אפשר לקצר. בוא נקבע חלון של עשר דקות, ואם זה לא רלוונטי נעצור שם.",
      0,
    ),
    playbook(
      "pb-close",
      "cat-closing",
      "סגירת שיחה",
      "לסכם את ההסכמה, את הצעד הבא, ואת מועד החזרה.",
      0,
    ),
  ],
};

export function createSalesId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}
