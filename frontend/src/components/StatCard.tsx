interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  subColor?: "emerald" | "red" | "slate";
}

export function StatCard({ label, value, sub, subColor = "slate" }: StatCardProps) {
  const subColorClass = {
    emerald: "text-emerald-400",
    red: "text-red-400",
    slate: "text-slate-500",
  }[subColor];
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
      <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2">{label}</p>
      <p className="text-xl font-semibold text-slate-100">{value}</p>
      {sub && <p className={`text-xs font-mono mt-1 ${subColorClass}`}>{sub}</p>}
    </div>
  );
}
