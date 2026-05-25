// 서버 전용 Supabase 클라이언트 (Service Role Key 사용)
// 클라이언트 코드에서 import 하지 말 것 — 노출되면 보안 사고
import { createClient } from "@supabase/supabase-js";

export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Supabase 환경변수 누락 (URL 또는 SERVICE_ROLE_KEY)");
  return createClient(url, key, { auth: { persistSession: false } });
}

// 요청자가 admin 인지 검증
export async function verifyAdmin(req: Request): Promise<{ ok: boolean; userId?: string; error?: string }> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return { ok: false, error: "토큰 없음" };
  const token = auth.slice(7);

  const admin = supabaseAdmin();
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) return { ok: false, error: "유효하지 않은 토큰" };

  const { data: profile } = await admin.from("profiles").select("role").eq("id", userData.user.id).maybeSingle();
  if (profile?.role !== "admin") return { ok: false, error: "관리자 권한 없음" };

  return { ok: true, userId: userData.user.id };
}
