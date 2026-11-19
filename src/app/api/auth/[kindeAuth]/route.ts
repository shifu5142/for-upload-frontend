import { handleAuth } from "@kinde-oss/kinde-auth-nextjs/server";

const auth = handleAuth();
const FAILED_TO_PARSE_RESPONSE = "failed to parse response" as const;
const JWKS_PATH = "/.well-known/jwks.json";

type FetchWithNext = typeof fetch & {
  __nextPatched?: boolean;
  __jwksDirect?: boolean;
};

// Next's dev fetch waits for the render stage. Kinde aborts the JWKS download after 5s while that wait is still running.
function installDirectJwksFetch() {
  const current = globalThis.fetch as FetchWithNext;
  if (!current.__nextPatched || current.__jwksDirect) return;
  const wrapped: FetchWithNext = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (url.includes(JWKS_PATH)) {
      const nextInit = init as RequestInit & { next?: { internal?: boolean } };
      return current(input, {
        ...nextInit,
        next: { ...nextInit.next, internal: true },
      } as RequestInit);
    }
    return current(input, init);
  };
  wrapped.__nextPatched = true;
  wrapped.__jwksDirect = true;
  globalThis.fetch = wrapped;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ kindeAuth?: string | string[] }> },
) {
  const params = await context.params;
  const fromParams = Array.isArray(params?.kindeAuth)
    ? params.kindeAuth[0]
    : params?.kindeAuth;
  const endpoint =
    fromParams ||
    new URL(request.url).pathname.split("/").filter(Boolean).pop() ||
    "";
  installDirectJwksFetch();
  const response = await auth(request, {
    params: Promise.resolve({ kindeAuth: endpoint }),
  });
  if (endpoint !== "setup" || response.status !== 401) return response;
  const body = (await response
    .clone()
    .json()
    .catch(() => null)) as {
    message?: typeof FAILED_TO_PARSE_RESPONSE;
  } | null;
  if (body?.message !== FAILED_TO_PARSE_RESPONSE) return response;
  return Response.json(body, { status: 200 });
}
