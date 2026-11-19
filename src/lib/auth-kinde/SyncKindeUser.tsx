"use client";

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useEffect, useRef } from "react";
import { backendUrl } from "@/lib/backend-url";

export default function SyncKindeUser() {
  const { user, isAuthenticated, isLoading, getAccessTokenRaw } = useKindeBrowserClient();

  const syncedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (
      isLoading ||
      !isAuthenticated ||
      !user?.id ||
      !user?.email ||
      syncedUserId.current === user.id
    ) {
      return;
    }

    syncedUserId.current = user.id;

    const syncUser = async () => {
      try {
        const token = await getAccessTokenRaw();

        if (!token) {
          syncedUserId.current = null;
          console.error("Kinde access token not available");
          return;
        }
        if (!backendUrl) {
          throw new Error(
            "Backend URL is missing. Set NEXT_PUBLIC_BACKEND_URL to the API, including /api/v1.",
          );
        }
        const response = await fetch(`${backendUrl}/auth/sync-kinde-user`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const body = await response.text();
        if (!response.ok) {
          syncedUserId.current = null;
          throw new Error(`Failed to sync user: ${response.status} ${response.statusText}`);
        }
        if (body.trimStart().startsWith("<")) {
          throw new Error(
            `Sync request returned a web page instead of JSON. NEXT_PUBLIC_BACKEND_URL is ${backendUrl}.`,
          );
        }
        JSON.parse(body);
      } catch (error) {
        syncedUserId.current = null;
        console.error("Error syncing Kinde user:", error);
      }
    };

    void syncUser();
  }, [user?.id, user?.email, isAuthenticated, isLoading, getAccessTokenRaw]);

  return null;
}
