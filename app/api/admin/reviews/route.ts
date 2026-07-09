import { NextRequest, NextResponse } from "next/server";

// 🔒 Bezpieczny proxy moderacji. Token mod_... i hasło żyją TYLKO na serwerze
// (bez NEXT_PUBLIC_), więc nigdy nie trafiają do przeglądarki. Panel /admin/opinie
// woła TEN route, a on dopiero uderza w Medusę z sekretnym tokenem.

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://panel.centrumrolnictwa.com";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";
const REVIEW_TOKEN = process.env.REVIEW_ADMIN_TOKEN || "";
const PANEL_PASSWORD = process.env.REVIEW_ADMIN_PASSWORD || "";

// Prosta bramka hasłem — panel wysyła hasło w nagłówku x-panel-password.
function checkPassword(req: NextRequest): boolean {
  const pass = req.headers.get("x-panel-password");
  return Boolean(PANEL_PASSWORD) && pass === PANEL_PASSWORD;
}

function medusaHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-publishable-api-key": PUBLISHABLE_KEY,
    "x-review-token": REVIEW_TOKEN,
  };
}

// GET /api/admin/reviews?status=pending → lista opinii wg statusu (do moderacji)
export async function GET(req: NextRequest) {
  if (!checkPassword(req)) {
    return NextResponse.json({ message: "Nieprawidłowe hasło." }, { status: 401 });
  }
  const status = req.nextUrl.searchParams.get("status") || "pending";
  try {
    const res = await fetch(
      `${MEDUSA_URL}/store/reviews-admin?status=${encodeURIComponent(status)}`,
      { headers: medusaHeaders(), cache: "no-store" }
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ message: "Błąd połączenia z Medusą.", error: e?.message }, { status: 502 });
  }
}

// POST /api/admin/reviews  { id, action: "approve" | "reject" }
export async function POST(req: NextRequest) {
  if (!checkPassword(req)) {
    return NextResponse.json({ message: "Nieprawidłowe hasło." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  try {
    const res = await fetch(`${MEDUSA_URL}/store/reviews-admin`, {
      method: "POST",
      headers: medusaHeaders(),
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ message: "Błąd połączenia z Medusą.", error: e?.message }, { status: 502 });
  }
}