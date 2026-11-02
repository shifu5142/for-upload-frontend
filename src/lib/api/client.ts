import createClient from "openapi-fetch";
import { backendUrl } from "@/lib/backend-url";
import type { paths } from "./schema";

export const apiBaseUrl = backendUrl;

export const apiClient = createClient<paths>({
  baseUrl: apiBaseUrl,
});
