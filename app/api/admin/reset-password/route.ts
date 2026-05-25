import { NextResponse } from "next/server";
import { supabaseAdmin, verifyAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const v = await verifyAdmin(req);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 403 });

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "email 필요" }, { status: 400 });

  const admin = supabaseAdmin();
  const { error } = await admin.auth.resetPasswordForEmail(email);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
