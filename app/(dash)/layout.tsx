import Sidebar from "@/components/Sidebar";

export default function DashLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100" style={{ fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/3 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>
      <div className="relative flex flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 min-w-0 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
