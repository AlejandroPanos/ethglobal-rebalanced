import { useState } from "react";

interface WalletButtonProps {
  address: string | null;
  connecting: boolean;
  isCorrectNetwork: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

function truncate(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function WalletButton({
  address,
  connecting,
  isCorrectNetwork,
  onConnect,
  onDisconnect,
}: WalletButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (!address) {
    return (
      <button
        onClick={onConnect}
        disabled={connecting}
        className="text-xs font-mono px-3 py-1.5 rounded-lg bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/20 transition disabled:opacity-50"
      >
        {connecting ? "Connecting..." : "Connect Wallet"}
      </button>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 text-xs font-mono">
        {!isCorrectNetwork && (
          <span className="text-amber-400 border border-amber-400/30 rounded px-2 py-1">
            Wrong network
          </span>
        )}
        <button
          onClick={() => setMenuOpen((open) => !open)}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700 transition"
        >
          {truncate(address)}
        </button>
      </div>

      {menuOpen && (
        <>
          {/* backdrop to close the menu on outside click */}
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 mt-2 w-40 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-20 overflow-hidden">
            <button
              onClick={() => {
                onDisconnect();
                setMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs font-mono text-red-400 hover:bg-slate-800 transition"
            >
              Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  );
}
