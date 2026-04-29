import { NextResponse } from "next/server";

/**
 * GET /api/credential/download — deprecated.
 *
 * Old behavior: authenticated GET that redirected to
 * `/api/credential/image?token=<credential_token>`. Redirect leaked the
 * token to access logs / browser history (SEC-HIGH).
 *
 * New flow: callers (e.g. /my-profile) POST `{ token }` directly to
 * `/api/credential/image`, `/api/credential/pdf`, or
 * `/api/credential/google-wallet` and consume the response as a blob.
 */
export async function GET() {
  return NextResponse.json(
    { error: "Endpoint deprecado. Usá POST /api/credential/image con el token en el body." },
    {
      status: 410,
      headers: {
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      },
    },
  );
}
