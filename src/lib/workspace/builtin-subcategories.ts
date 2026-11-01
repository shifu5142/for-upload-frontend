import catalog from "@/lib/workspace/builtin-subcategories.json";
import type { Category, CategorySubcategory } from "@/lib/workspace/types";

type CatalogItem = {
  id: string;
  label: string;
  prompt: string;
};

type CatalogSubcategory = {
  id: string;
  name: string;
  items?: CatalogItem[];
};

type CatalogCategory = {
  id: string;
  name: string;
  subcategories: CatalogSubcategory[];
};

const catalogByName = new Map(
  (catalog as CatalogCategory[]).map((category) => [category.name, category]),
);

const hebrewCategoryNameAliases: Record<string, string> = {
  "הצילו, הלקוח מתרחק": "הצלת שיחה",
  "אחרי שיחה": "אחרי השיחה",
};

const englishCategoryNameAliases: Record<string, string> = {
  "Help, the customer is pulling away": "Help, the customer is pulling away",
  "After the call": "After the call",
};

function categoryNameAliases() {
  const english =
    typeof document !== "undefined" && document.documentElement.lang === "en";
  return english
    ? { ...hebrewCategoryNameAliases, ...englishCategoryNameAliases }
    : hebrewCategoryNameAliases;
}

function builtinSubcategories(categoryName: string): CategorySubcategory[] {
  const aliases = categoryNameAliases();
  const source =
    catalogByName.get(categoryName) ??
    catalogByName.get(aliases[categoryName] ?? "");
  if (!source) return [];
  return source.subcategories.map((subcategory, index) => {
    const first = subcategory.items?.[0];
    return {
      id: subcategory.id,
      name: subcategory.name,
      description: first?.label ?? "",
      aiPrompt: first?.prompt ?? "",
      active: true,
      position: index,
    };
  });
}

export function withBuiltinSubcategories(categories: Category[]) {
  return categories.map((category) => {
    if ((category.subcategories?.length ?? 0) > 0) return category;
    const subcategories = builtinSubcategories(category.name);
    if (subcategories.length === 0) return category;
    return { ...category, subcategories };
  });
}
