export const ICON_NAMES = [
  "message",
  "messages",
  "check",
  "graduation",
  "users",
  "briefcase",
  "sparkles",
  "clipboard",
  "shield",
  "clock",
  "alert",
  "file",
  "phone",
  "mic",
  "target",
  "refresh",
  "lightbulb",
  "send",
  "heart",
  "search",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export type Attachment = {
  id: string;
  name: string;
};

export type Playbook = {
  id: string;
  name: string;
  description: string;
  prompt: string;
  icon: IconName;
  active: boolean;
  autoSend: boolean;
  attachments: Attachment[];
};

export type SubcategoryItem = {
  id: string;
  label: string;
  prompt: string;
};

export type CategorySubcategory = {
  id: string;
  name: string;
  description: string;
  aiPrompt: string;
  active: boolean;
  position: number;
  items?: SubcategoryItem[];
};

export type SavedCategory = {
  name: string;
  icon: IconName;
  subcategories: CategorySubcategory[];
};

export type SavedCatalog = {
  categories: SavedCategory[];
};

export type Category = {
  id: string;
  name: string;
  icon: IconName;
  active: boolean;
  playbookIds: string[];
  internalDescription?: string;
  aiDescription?: string;
  subcategories?: CategorySubcategory[];
};

export type WorkspaceData = {
  categories: Category[];
  playbooks: Record<string, Playbook>;
};

export type PlaybookDraft = {
  name: string;
  description: string;
  prompt: string;
  icon: IconName;
  active: boolean;
  autoSend: boolean;
  attachments: Attachment[];
  categoryId: string;
};
