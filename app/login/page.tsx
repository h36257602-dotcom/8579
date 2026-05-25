"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // 이미 로그인된 상태면 홈으로
  useEffect(() => {
    if (!userLoading && user) router.push("/");
  }, [user, userLoading, router]);

  const submit = async () => {
    if (!email || !password) { setErr("이메일과 비밀번호를 입력하세요."); return; }
    setBusy(true); setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setErr(error.message === "Invalid login credentials" ? "이메일 또는 비밀번호가 틀렸습니다." : error.message);
      return;
    }
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 flex items-center justify-center px-4" style={{ fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center text-zinc-950 font-bold">M</div>
          <div className="text-xl font-semibold">My Life</div>
        </Link>

        <div className="p-7 rounded-2xl bg-zinc-800/60 border border-zinc-700">
          <h1 className="text-xl font-bold mb-1">로그인</h1>
          <p className="text-sm text-zinc-400 mb-6">이메일과 비밀번호를 입력하세요</p>

          <div className="space-y-3">
            <div>
              <label className="text-sm text-zinc-300">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="you@example.com"
                className="w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500/60"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm text-zinc-300">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="••••••••"
                className="w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500/60"
              />
            </div>
            {err && <div className="text-sm text-rose-300">{err}</div>}
            <button onClick={submit} disabled={busy}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-emerald-500 text-zinc-950 font-semibold hover:opacity-90 disabled:opacity-50">
              {busy ? "로그인 중…" : "로그인"}
            </button>
          </div>

          <div className="mt-5 pt-5 border-t border-zinc-700 text-center text-sm text-zinc-400">
            계정이 없으세요?{" "}
            <Link href="/signup" className="text-violet-300 hover:text-violet-200 font-semibold">회원가입</Link>
          </div>
        </div>

        <Link href="/" className="block text-center text-sm text-zinc-500 mt-5 hover:text-zinc-300">← 홈으로</Link>
      </div>
    </div>
  );
}
