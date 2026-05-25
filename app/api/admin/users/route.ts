import { NextResponse } from "next/server";
import { supabaseAdmin, verifyAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const v = await verifyAdmin(req);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 403 });

  const admin = supabaseAdmin();
  // auth.admin.listUsers로 모든 가입자 정보 (이메일, 로그인 이력, banned 등) 가져오기
  const { data: authData, error: authErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 });

  // profiles 합치기 (이름, role)
  const { data: profiles } = await admin.from("profiles").select("*");
  const pMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const users = authData.users.map((u) => {
    const p = pMap.get(u.id);
    return {
      id: u.id,
      email: u.email,
      name: p?.name || "",
      role: p?.role || "user",
      banned: !!u.banned_until && new Date(u.banned_until) > new Date(),
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      email_confirmed_at: u.email_confirmed_at,
    };
  });

  return NextResponse.json({ users });
}
