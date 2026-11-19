const productionApiUrl = "https://for-upload-backend-t213.onrender.com/api/v1";

export function resolveBackendUrl(value?: string): string {
  const trimmed = (value ?? "").trim().replace(/\/$/, "");
  const base = trimmed || productionApiUrl;
  if (base.endsWith("/api/v1")) return base;
  return `${base}/api/v1`;
}

export const backendUrl = resolveBackendUrl(
  process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL,
);
