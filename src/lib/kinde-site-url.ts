const kindeUrlKeys = [
  "KINDE_SITE_URL",
  "KINDE_POST_LOGIN_REDIRECT_URL",
  "KINDE_POST_LOGOUT_REDIRECT_URL",
] as const;

export function withHttpProtocol(value: string): string {
  const trimmed = value.trim();
  if (/^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

const homePaths = new Set(["/", "/he", "/en", "/dashboard"]);

function toDashboardUrl(value: string, site: string): string {
  const base = site || "http://localhost:3000";
  const url = new URL(value, base);
  const path = url.pathname.replace(/\/$/, "") || "/";
  if (homePaths.has(path)) url.pathname = "/he/dashboard";
  return url.toString();
}

export function kindeUrlEnv(env: NodeJS.ProcessEnv = process.env): Record<string, string> {
  const next: Record<string, string> = {};
  for (const key of kindeUrlKeys) {
    const value = env[key];
    if (!value) continue;
    next[key] = withHttpProtocol(value);
  }
  const site = (next.KINDE_SITE_URL || "").replace(/\/$/, "");
  if (next.KINDE_POST_LOGIN_REDIRECT_URL) {
    next.KINDE_POST_LOGIN_REDIRECT_URL = toDashboardUrl(next.KINDE_POST_LOGIN_REDIRECT_URL, site);
  } else if (site) {
    next.KINDE_POST_LOGIN_REDIRECT_URL = `${site}/he/dashboard`;
  }
  return next;
}

const normalizedKindeUrls = kindeUrlEnv();
for (const [key, value] of Object.entries(normalizedKindeUrls)) {
  process.env[key] = value;
}
