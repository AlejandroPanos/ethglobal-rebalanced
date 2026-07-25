const STYLES: Record<string, string> = {
  None: "bg-slate-800 text-slate-400 border-slate-700",
  ConservativeLending: "bg-cyan-400/10 text-cyan-400 border-cyan-400/30",
  AggressiveLending: "bg-amber-400/10 text-amber-400 border-amber-400/30",
};

export function StrategyBadge({ strategy }: { strategy: string }) {
  const style = STYLES[strategy] ?? STYLES.None;
  return (
    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${style}`}>
      {strategy}
    </span>
  );
}
