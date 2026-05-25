import { NextResponse } from "next/server";
import { supabaseAdmin, verifyAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const v = await verifyAdmin(req);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 403 });

  const { userId, banned } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId 필요" }, { status: 400 });

  const admin = supabaseAdmin();
  // banned=true → 100년 정지 / banned=false → 정지 해제
  const banDuration = banned ? "876000h" : "none";
  const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: banDuration });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
