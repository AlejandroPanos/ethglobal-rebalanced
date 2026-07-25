import { useCurrentStrategy } from "./hooks/useCurrentStrategy";
import { useDecisionFeed } from "./hooks/useDecisionFeed";
import { useWallet } from "./hooks/useWallet";
import { useUserPosition } from "./hooks/useUserPosition";
import { StrategyNames } from "./config";
import { Navbar } from "./components/Navbar";
import { StatCard } from "./components/StatCard";
import { DecisionLog } from "./components/DecisionLog";
import { ContractInfoPanel } from "./components/ContractInfoPanel";
import { WalletButton } from "./components/WalletButton";
import { PositionPanel } from "./components/PositionPanel";

function App() {
  const { data: currentStrategy, error: strategyError } = useCurrentStrategy();
  const { data: decisions, error: decisionsError } = useDecisionFeed();
  const wallet = useWallet();
  const position = useUserPosition(wallet.address);

  const currentStrategyName = currentStrategy !== null ? StrategyNames[currentStrategy] : "—";
  const lastDecision = decisions?.[0];

  return (
    <div className="min-h-screen lg:overflow-hidden bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        network="Hedera Testnet"
        walletSlot={
          <WalletButton
            address={wallet.address}
            connecting={wallet.connecting}
            isCorrectNetwork={wallet.isCorrectNetwork}
            onConnect={wallet.connect}
            onDisconnect={wallet.disconnect}
          />
        }
      />

      <main className="flex-1 min-h-0 lg:overflow-hidden max-w-5xl mx-auto w-full px-4 sm:px-8 py-4 sm:py-6 flex flex-col gap-4 sm:gap-6">
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

        <div className="shrink-0">
          <PositionPanel
            address={wallet.address}
            signer={wallet.signer}
            isCorrectNetwork={wallet.isCorrectNetwork}
            shares={position.data?.shares ?? null}
            assetBalance={position.data?.assetBalance ?? null}
            allowance={position.data?.allowance ?? null}
            onActionComplete={position.refresh}
          />
        </div>

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
