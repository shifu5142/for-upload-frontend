import { handleAuth } from "@kinde-oss/kinde-auth-nextjs/server";

const auth = handleAuth();
const FAILED_TO_PARSE_RESPONSE = "failed to parse response" as const;

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
