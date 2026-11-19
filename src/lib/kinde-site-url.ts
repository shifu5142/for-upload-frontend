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

export function kindeUrlEnv(env: NodeJS.ProcessEnv = process.env): Record<string, string> {
  const next: Record<string, string> = {};
  for (const key of kindeUrlKeys) {
    const value = env[key];
    if (!value) continue;
    next[key] = withHttpProtocol(value);
  }
  return next;
}

const normalizedKindeUrls = kindeUrlEnv();
for (const [key, value] of Object.entries(normalizedKindeUrls)) {
  process.env[key] = value;
}
