import { NextResponse } from "next/server";
import { supabaseAdmin, verifyAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const v = await verifyAdmin(req);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 403 });

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId 필요" }, { status: 400 });
  if (userId === v.userId) return NextResponse.json({ error: "본인 계정은 삭제 불가" }, { status: 400 });

  const admin = supabaseAdmin();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
