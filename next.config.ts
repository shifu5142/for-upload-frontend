import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const kindeSiteUrl = "https://for-upload-frontend.vercel.app";
const kindeProductionEnv =
  process.env.VERCEL_ENV === "production"
    ? {
        KINDE_SITE_URL: kindeSiteUrl,
        KINDE_POST_LOGIN_REDIRECT_URL: `${kindeSiteUrl}/`,
        KINDE_POST_LOGOUT_REDIRECT_URL: `${kindeSiteUrl}/`,
      }
    : {};

const nextConfig: NextConfig = {
  env: {
    BACKEND_URL: process.env.BACKEND_URL,
    ...kindeProductionEnv,
  },
};

export default withNextIntl(nextConfig);
