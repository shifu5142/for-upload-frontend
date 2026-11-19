import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { backendUrl } from "./src/lib/backend-url";
import { kindeUrlEnv } from "./src/lib/kinde-site-url";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  env: {
    BACKEND_URL: backendUrl,
    NEXT_PUBLIC_BACKEND_URL: backendUrl,
    ...kindeUrlEnv(),
  },
};

export default withNextIntl(nextConfig);
