import type { Category, SavedCatalog } from "@/lib/workspace/types";

const SEED_CATEGORY_IDS = new Set([
  "cat-summary",
  "cat-prep",
  "cat-during",
  "cat-after",
]);

export function toSavedCatalog(categories: Category[]): SavedCatalog {
  return {
    categories: categories.map((category) => ({
      name: category.name,
      icon: category.icon,
      subcategories: (category.subcategories ?? []).map((subcategory) => ({
        id: subcategory.id,
        name: subcategory.name,
        description: subcategory.description,
        aiPrompt: subcategory.aiPrompt,
        active: subcategory.active,
        position: subcategory.position,
      })),
    })),
  };
}

export function toUserCatalog(
  categories: Category[],
  userCategoryIds: string[],
  userSubcategoryIds: string[],
): SavedCatalog {
  const categoryIds = new Set(userCategoryIds);
  const subcategoryIds = new Set(userSubcategoryIds);
  return {
    categories: categories.flatMap((category) => {
      const createdByUser = categoryIds.has(category.id);
      const subcategories = (category.subcategories ?? []).filter(
        (subcategory) => createdByUser || subcategoryIds.has(subcategory.id),
      );
      if (!createdByUser && subcategories.length === 0) return [];
      return [
        {
          name: category.name,
          icon: category.icon,
          subcategories: subcategories.map((subcategory) => ({
            id: subcategory.id,
            name: subcategory.name,
            description: subcategory.description,
            aiPrompt: subcategory.aiPrompt,
            active: subcategory.active,
            position: subcategory.position,
          })),
        },
      ];
    }),
  };
}

export function isSeedCategoryId(id: string) {
  return SEED_CATEGORY_IDS.has(id);
}

export function inferUserCategoryIds(categories: Category[]) {
  return categories
    .filter((category) => !SEED_CATEGORY_IDS.has(category.id))
    .map((category) => category.id);
}

export function inferUserSubcategoryIds(categories: Category[]) {
  return categories.flatMap((category) =>
    (category.subcategories ?? []).map((subcategory) => subcategory.id),
  );
}
