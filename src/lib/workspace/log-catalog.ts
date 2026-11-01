"use server";

import type { SavedCatalog } from "@/lib/workspace/types";

export async function logPublishedCatalog(catalog: SavedCatalog) {
  console.log(JSON.stringify(catalog, null, 2));
}
