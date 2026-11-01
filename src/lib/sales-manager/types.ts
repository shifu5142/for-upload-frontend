import type { IconName } from "@/lib/workspace/types";

export type SalesDetails = {
  icon?: IconName;
  internalDescription?: string;
  aiDescription?: string;
};

export type SalesCategory = SalesDetails & {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
  workspaceCategoryId?: string;
};

export type SalesSubcategory = SalesDetails & {
  id: string;
  categoryId: string;
  name: string;
  order: number;
  isActive: boolean;
};

export type SalesReferenceFile = {
  id: string;
  name: string;
};

export type SalesPlaybook = {
  id: string;
  categoryId: string;
  subcategoryId?: string;
  title: string;
  content: string;
  order: number;
  isActive: boolean;
  files: SalesReferenceFile[];
};

export type SalesCatalog = {
  categories: SalesCategory[];
  subcategories: SalesSubcategory[];
  playbooks: SalesPlaybook[];
};
