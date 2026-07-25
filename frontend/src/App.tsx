import { useCurrentStrategy } from "./hooks/useCurrentStrategy";
import { useDecisionFeed } from "./hooks/useDecisionFeed";
import { StrategyNames } from "./config";
import { Navbar } from "./components/Navbar";
import { StatCard } from "./components/StatCard";
import { DecisionLog } from "./components/DecisionLog";
import { ContractInfoPanel } from "./components/ContractInfoPanel";

function App() {
  const { data: currentStrategy, error: strategyError } = useCurrentStrategy();
  const { data: decisions, error: decisionsError } = useDecisionFeed();

  const currentStrategyName = currentStrategy !== null ? StrategyNames[currentStrategy] : "—";
  const lastDecision = decisions?.[0];

  return (
    <div className="flex flex-col min-h-screen lg:h-screen lg:overflow-hidden bg-slate-950 text-slate-100">
      <Navbar network="Hedera Testnet" />

      <main className="flex-1 min-h-0 lg:overflow-hidden max-w-6xl mx-auto w-full px-4 sm:px-8 py-4 sm:py-6 flex flex-col gap-4 sm:gap-6">
        <div className="shrink-0 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <StatCard
            label="Current Strategy"
            value={currentStrategyName}
            sub={currentStrategyName === "AggressiveLending" ? "High risk" : undefined}
            subColor={currentStrategyName === "AggressiveLending" ? "red" : "slate"}
          />
          <StatCard
            label="Last Rebalance"
            value={lastDecision ? lastDecision.toStrategy : "—"}
            sub={lastDecision?.reason}
          />
        </div>

        {(strategyError || decisionsError) && (
          <div className="shrink-0 text-xs font-mono text-red-400 bg-red-400/5 border border-red-400/20 rounded-lg px-4 py-2">
            {strategyError ?? decisionsError}
          </div>
        )}

        <div className="flex-1 min-h-0 flex flex-col gap-6 lg:overflow-hidden">
          <DecisionLog decisions={decisions ?? []} />
          <div className="shrink-0">
            <ContractInfoPanel
              vaultAddress={import.meta.env.VITE_VAULT_ADDRESS}
              topicId={import.meta.env.VITE_HCS_TOPIC_ID}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
