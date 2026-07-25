import { StrategyBadge } from "./StrategyBadge";
import { timeAgo } from "../utils/time";

interface Decision {
  timestamp: string;
  fromStrategy: string;
  toStrategy: string;
  reason: string;
  txHash: string;
}

export function DecisionLog({ decisions }: { decisions: Decision[] }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col min-h-0 lg:flex-1">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-xs font-mono uppercase tracking-wide text-slate-400">Rebalance Log</h2>
        <span className="text-[10px] font-mono text-slate-600">{decisions.length} entries</span>
      </div>

      {decisions.length === 0 ? (
        <p className="text-sm text-slate-500">No decisions logged yet.</p>
      ) : (
        <ul className="space-y-2 overflow-y-auto min-h-0 pr-1 lg:flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          {decisions.map((d, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-4 border border-slate-800 rounded-lg px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-slate-600 font-mono text-sm">⟳</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StrategyBadge strategy={d.fromStrategy} />
                    <span className="text-slate-600 text-xs">→</span>
                    <StrategyBadge strategy={d.toStrategy} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1 truncate">{d.reason}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-mono text-slate-500">{timeAgo(d.timestamp)}</p>
                <a
                  href={`https://hashscan.io/testnet/transaction/${d.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] font-mono text-cyan-400 hover:underline"
                >
                  view tx ↗
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
