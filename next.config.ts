import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { kindeUrlEnv } from "./src/lib/kinde-site-url";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  env: {
    BACKEND_URL: process.env.BACKEND_URL,
    ...kindeUrlEnv(),
  },
};

export default withNextIntl(nextConfig);
