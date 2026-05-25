import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = await req.json();
  const ok = password === process.env.ADMIN_PASSWORD;
  return NextResponse.json({ ok });
}
