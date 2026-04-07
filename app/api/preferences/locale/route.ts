import { cookies } from "next/headers";
import { z } from "zod";
import {
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  normalizeLocale,
} from "@/lib/i18n/config";

const bodySchema = z.object({
  locale: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return Response.json({ error: "Invalid locale payload" }, { status: 400 });
  }

  const locale = normalizeLocale(parsed.data.locale);

  if (!locale) {
    return Response.json({ error: "Unsupported locale" }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, locale, {
    maxAge: LOCALE_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });

  return Response.json({ ok: true, locale });
}
