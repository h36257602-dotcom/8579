"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { Shield, Search, Ban, CircleCheck, Trash2, KeyRound } from "lucide-react";

type AdminUser = {
  id: string;
  email: string | null;
  name: string;
  role: "user" | "admin";
  banned: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
};

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, loading: userLoading } = useUser();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.push("/login"); return; }
    if (profile?.role !== "admin") { router.push("/"); return; }
    load();
  }, [user, profile, userLoading]);

  const load = async () => {
    setLoading(true);
    setErr("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }

    const res = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const json = await res.json();
    if (!res.ok) {
      setErr(json.error || "조회 실패");
      setLoading(false);
      return;
    }
    setUsers(json.users || []);
    setLoading(false);
  };

  const callApi = async (path: string, body: object) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { ok: false, error: "로그인 필요" };
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    return { ok: res.ok, ...json };
  };

  const toggleBan = async (u: AdminUser) => {
    if (!confirm(u.banned ? `${u.email} 정지를 해제할까요?` : `${u.email} 계정을 정지할까요?`)) return;
    const r = await callApi("/api/admin/ban", { userId: u.id, banned: !u.banned });
    if (!r.ok) { alert("실패: " + r.error); return; }
    load();
  };

  const removeUser = async (u: AdminUser) => {
    if (u.role === "admin") { alert("관리자 계정은 삭제할 수 없습니다."); return; }
    if (!confirm(`정말 ${u.email} 계정을 영구 삭제할까요?\n\n이 작업은 되돌릴 수 없습니다.`)) return;
    const r = await callApi("/api/admin/delete", { userId: u.id });
    if (!r.ok) { alert("실패: " + r.error); return; }
    load();
  };

  const sendReset = async (u: AdminUser) => {
    if (!u.email) return;
    if (!confirm(`${u.email}로 비밀번호 재설정 메일을 보낼까요?`)) return;
    const r = await callApi("/api/admin/reset-password", { email: u.email });
    if (!r.ok) { alert("실패: " + r.error); return; }
    alert("재설정 메일을 발송했습니다.");
  };

  const filtered = users.filter((u) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (u.email || "").toLowerCase().includes(s) || (u.name || "").toLowerCase().includes(s);
  });

  if (userLoading || loading) {
    return <div className="text-zinc-400 text-sm py-20 text-center">불러오는 중…</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <header className="flex items-center gap-3">
        <Shield className="text-amber-400" size={28} />
        <div>
          <div className="text-xs text-amber-400/80 tracking-[0.2em] font-semibold">▸ ADMIN</div>
          <h1 className="text-3xl font-bold tracking-tight">관리자 패널</h1>
          <div className="text-sm text-zinc-400 mt-1">총 {users.length}명 가입</div>
        </div>
      </header>

      {err && <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm">{err}</div>}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이메일 또는 이름으로 검색"
          className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-violet-500/60" />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-700 bg-zinc-800/50">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-zinc-900/70 text-xs uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="text-left px-4 py-3">이름</th>
              <th className="text-left px-4 py-3">이메일</th>
              <th className="text-center px-4 py-3">권한</th>
              <th className="text-left px-4 py-3">가입일</th>
              <th className="text-left px-4 py-3">최근 로그인</th>
              <th className="text-center px-4 py-3">상태</th>
              <th className="text-center px-4 py-3">조작</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-zinc-400 py-10">결과 없음</td></tr>
            ) : filtered.map((u) => (
              <tr key={u.id} className="border-t border-zinc-700/60 hover:bg-zinc-900/30">
                <td className="px-4 py-3 font-medium">{u.name || <span className="text-zinc-500">—</span>}</td>
                <td className="px-4 py-3 text-zinc-300">{u.email}</td>
                <td className="px-4 py-3 text-center">
                  {u.role === "admin" ? (
                    <span className="text-xs px-2 py-0.5 rounded-md border bg-amber-500/20 text-amber-200 border-amber-500/40">ADMIN</span>
                  ) : (
                    <span className="text-xs text-zinc-500">user</span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{new Date(u.created_at).toLocaleDateString("ko-KR")}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString("ko-KR") : "—"}</td>
                <td className="px-4 py-3 text-center">
                  {u.banned ? (
                    <span className="text-xs px-2 py-0.5 rounded-md border bg-rose-500/20 text-rose-200 border-rose-500/40">정지됨</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-md border bg-emerald-500/20 text-emerald-200 border-emerald-500/40">활성</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => sendReset(u)} title="비밀번호 재설정 메일"
                    className="p-1.5 hover:bg-zinc-700 rounded text-sky-300"><KeyRound size={14} /></button>
                  <button onClick={() => toggleBan(u)} title={u.banned ? "정지 해제" : "계정 정지"}
                    className={`p-1.5 hover:bg-zinc-700 rounded ${u.banned ? "text-emerald-300" : "text-amber-300"}`}>
                    {u.banned ? <CircleCheck size={14} /> : <Ban size={14} />}
                  </button>
                  {u.role !== "admin" && (
                    <button onClick={() => removeUser(u)} title="계정 삭제"
                      className="p-1.5 hover:bg-zinc-700 rounded text-rose-400"><Trash2 size={14} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-zinc-500 text-center">
        🔒 비밀번호는 암호화되어 저장되어 관리자도 평문으로 볼 수 없습니다. 필요 시 "재설정 메일"을 발송하세요.
      </div>
    </div>
  );
}
