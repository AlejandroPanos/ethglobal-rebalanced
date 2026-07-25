export function Navbar({ network }: { network: string }) {
  return (
    <nav className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur shrink-0">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 font-mono text-sm">
            R
          </div>
          <span className="font-mono text-sm tracking-widest text-slate-100 hidden sm:inline">
            REBALANCE<span className="text-cyan-400">VAULT</span>
          </span>
          <span className="text-[10px] font-mono text-slate-600 border border-slate-800 rounded px-1.5 py-0.5">
            v0.1
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="inline">LIVE</span>
          </span>
          <span className="text-slate-600 hidden sm:inline">{network}</span>
        </div>
      </div>
    </nav>
  );
}
