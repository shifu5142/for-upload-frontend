import {
  ICON_NAMES,
  type Category,
  type CategorySubcategory,
  type IconName,
} from "@/lib/workspace/types";

const BACKEND_ICONS: Record<string, IconName> = {
  "message-circle": "message",
  "messages-square": "messages",
  "clipboard-list": "clipboard",
  "heart-handshake": "heart",
  "phone-call": "phone",
};

function backendIcon(value: unknown): IconName {
  if (typeof value !== "string") return "messages";
  if ((ICON_NAMES as readonly string[]).includes(value))
    return value as IconName;
  return BACKEND_ICONS[value] ?? "messages";
}

function backendPosition(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return Number.MAX_SAFE_INTEGER;
}

function byBackendPosition(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
) {
  return backendPosition(left.position) - backendPosition(right.position);
}

function backendText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function nestedPlaybook(row: Record<string, unknown>) {
  const playbooks = childRows(row.playbooks).sort(byBackendPosition);
  return playbooks[0] ?? null;
}

function mapBackendChild(
  row: Record<string, unknown>,
): CategorySubcategory | null {
  if (typeof row.id !== "string") return null;
  const items = Array.isArray(row.items)
    ? row.items.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const entry = item as Record<string, unknown>;
        if (typeof entry.id !== "string") return [];
        return [
          {
            id: entry.id,
            label: typeof entry.label === "string" ? entry.label : "",
            prompt: typeof entry.prompt === "string" ? entry.prompt : "",
          },
        ];
      })
    : [];
  const first = items[0];
  const playbook = nestedPlaybook(row);
  const name =
    typeof row.name === "string"
      ? row.name
      : typeof row.title === "string"
        ? row.title
        : "";
  return {
    id: row.id,
    name,
    position: backendPosition(row.position),
    description:
      backendText(row.description) ||
      backendText(row.button_label) ||
      backendText(playbook?.button_label) ||
      first?.label ||
      "",
    aiPrompt:
      backendText(row.prompt) ||
      backendText(row.aiPrompt) ||
      backendText(playbook?.prompt) ||
      first?.prompt ||
      "",
    active: row.active !== false,
    items,
  };
}

function childRows(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((child) =>
    child && typeof child === "object" ? [child as Record<string, unknown>] : [],
  );
}

function playbookPositionByCategory(playbooks: Record<string, unknown>[]) {
  const positions = new Map<string, number>();
  for (const playbook of playbooks) {
    if (typeof playbook.category_id !== "string") continue;
    const position = backendPosition(playbook.position);
    const current = positions.get(playbook.category_id);
    if (current === undefined || position < current) {
      positions.set(playbook.category_id, position);
    }
  }
  return positions;
}

function childrenUnderCategory(category: Record<string, unknown>) {
  const subcategories = childRows(category.subcategories);
  const playbooks = childRows(category.playbooks).sort(byBackendPosition);
  if (subcategories.length === 0) {
    return playbooks.flatMap((child) => {
      const mapped = mapBackendChild(child);
      return mapped ? [mapped] : [];
    });
  }

  const positions = playbookPositionByCategory(playbooks);
  const fromSubcategories = subcategories.flatMap((row) => {
    const mapped = mapBackendChild(row);
    if (!mapped || typeof row.id !== "string") return [];
    const playbookPosition = positions.get(row.id);
    if (playbookPosition !== undefined) mapped.position = playbookPosition;
    return [mapped];
  });
  const directPlaybooks = playbooks.flatMap((row) => {
    if (row.category_id !== category.id) return [];
    const mapped = mapBackendChild(row);
    return mapped ? [mapped] : [];
  });
  return [...fromSubcategories, ...directPlaybooks].sort(
    (left, right) => left.position - right.position,
  );
}

export function returnedSubcategory(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const row = payload as Record<string, unknown>;
  if (typeof row.id !== "string" || typeof row.name !== "string") return null;
  return row;
}

export function addSubcategoryToCategory(
  categories: unknown[],
  categoryId: string,
  categoryName: string,
  subcategory: Record<string, unknown>,
) {
  return categories.map((item) => {
    if (!item || typeof item !== "object") return item;
    const category = item as Record<string, unknown>;
    const sameCategory =
      category.id === categoryId ||
      (categoryName.length > 0 && category.name === categoryName);
    if (!sameCategory) return item;
    const current = Array.isArray(category.subcategories)
      ? category.subcategories
      : [];
    const exists = current.some(
      (sub) =>
        sub &&
        typeof sub === "object" &&
        (sub as { id?: unknown }).id === subcategory.id,
    );
    if (exists) {
      return {
        ...category,
        subcategories: current.map((sub) => {
          if (!sub || typeof sub !== "object") return sub;
          if ((sub as { id?: unknown }).id !== subcategory.id) return sub;
          return { ...sub, ...subcategory };
        }),
      };
    }
    return { ...category, subcategories: [...current, subcategory] };
  });
}

export function categoriesFromBackend(data: unknown[]): Category[] {
  const rows = data.flatMap((item) =>
    item && typeof item === "object" ? [item as Record<string, unknown>] : [],
  );
  return rows
    .filter(
      (category) =>
        typeof category.id === "string" &&
        typeof category.name === "string" &&
        (category.parent_category_id === null ||
          category.parent_category_id === undefined ||
          category.parent_category_id === ""),
    )
    .sort(byBackendPosition)
    .map((category) => {
      const seen = new Set<string>();
      const subcategories = [
        ...childrenUnderCategory(category),
        ...rows.flatMap((row) => {
          if (row.parent_category_id !== category.id) return [];
          const mapped = mapBackendChild(row);
          return mapped ? [mapped] : [];
        }),
      ]
        .filter((child) => {
          if (seen.has(child.id)) return false;
          seen.add(child.id);
          return true;
        })
        .sort((left, right) => left.position - right.position);
      return {
        id: category.id as string,
        name: category.name as string,
        icon: backendIcon(category.icon),
        active: category.active !== false,
        playbookIds: [],
        subcategories,
      };
    });
}
