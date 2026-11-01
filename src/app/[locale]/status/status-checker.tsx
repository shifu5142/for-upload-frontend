"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiBaseUrl, apiClient } from "@/lib/api/client";

type ApiState =
  | { kind: "loading" }
  | { kind: "connected"; timestamp: string }
  | { kind: "unavailable" };

export function StatusChecker() {
  const t = useTranslations("Status");
  const [state, setState] = useState<ApiState>({ kind: "loading" });

  const checkApi = useCallback(async (signal?: AbortSignal) => {
    setState({ kind: "loading" });

    try {
      const { data, response } = await apiClient.GET("/api/v1/health", {
        signal,
      });

      if (!response.ok || data?.status !== "ok") {
        throw new Error("API health check failed");
      }

      setState({ kind: "connected", timestamp: data.timestamp });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setState({ kind: "unavailable" });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void checkApi(controller.signal);

    return () => controller.abort();
  }, [checkApi]);

  const badgeVariant =
    state.kind === "connected"
      ? "default"
      : state.kind === "unavailable"
        ? "destructive"
        : "secondary";

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">{t("title")}</span>
          <Badge variant={badgeVariant}>{t(state.kind)}</Badge>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">API URL</p>
          <code className="block overflow-x-auto rounded-md bg-muted px-3 py-2 text-xs">
            {apiBaseUrl}
          </code>
        </div>
        {state.kind === "connected" && (
          <p className="text-xs text-muted-foreground">
            {new Date(state.timestamp).toLocaleString()}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button disabled={state.kind === "loading"} onClick={() => void checkApi()}>
          {t("check")}
        </Button>
      </CardFooter>
    </Card>
  );
}
