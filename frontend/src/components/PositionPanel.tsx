import { useState } from "react";
import { ethers } from "ethers";
import { VAULT_ADDRESS, ERC20_ABI } from "../config";
import VaultAbi from "../abis/Vault.json";
import { FaucetButton } from "./FaucetButton";

interface PositionPanelProps {
  address: string | null;
  signer: ethers.Signer | null;
  isCorrectNetwork: boolean;
  shares: string | null;
  assetBalance: string | null;
  allowance: bigint | null;
  onActionComplete: () => void;
}

type TxState =
  | { status: "idle" }
  | { status: "pending"; label: string }
  | { status: "success"; label: string; txHash: string }
  | { status: "error"; message: string };

export function PositionPanel({
  address,
  signer,
  isCorrectNetwork,
  shares,
  assetBalance,
  allowance,
  onActionComplete,
}: PositionPanelProps) {
  const [mode, setMode] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const [tx, setTx] = useState<TxState>({ status: "idle" });

  const available = mode === "deposit" ? assetBalance : shares;
  const parsedAmount = amount ? parseFloat(amount) : 0;
  const availableNum = available ? parseFloat(available) : 0;
  const exceedsBalance = amount !== "" && parsedAmount > availableNum;

  const needsApproval =
    mode === "deposit" &&
    allowance !== null &&
    amount !== "" &&
    !exceedsBalance &&
    allowance < ethers.parseEther(amount || "0");

  function showSuccess(label: string, txHash: string) {
    setTx({ status: "success", label, txHash });
    setTimeout(() => setTx({ status: "idle" }), 5000);
  }

  function handleMax() {
    if (available) setAmount(available);
  }

  async function handleApprove() {
    if (!signer) return;
    try {
      setTx({ status: "pending", label: "Approving..." });
      const assetWithSigner = new ethers.Contract(
        import.meta.env.VITE_ASSET_ADDRESS,
        ERC20_ABI,
        signer,
      );
      const approveTx = await assetWithSigner.approve(VAULT_ADDRESS, ethers.parseEther(amount), {
        gasLimit: 100000,
      });
      await approveTx.wait();
      setTx({ status: "idle" });
      onActionComplete();
    } catch (err) {
      setTx({ status: "error", message: err instanceof Error ? err.message : "Approval failed" });
    }
  }

  async function handleSubmit() {
    if (!signer || !amount) return;
    try {
      setTx({ status: "pending", label: mode === "deposit" ? "Depositing..." : "Withdrawing..." });
      const vaultWithSigner = new ethers.Contract(VAULT_ADDRESS, VaultAbi, signer);
      const parsedWei = ethers.parseEther(amount);

      const txResult =
        mode === "deposit"
          ? await vaultWithSigner.deposit(parsedWei, { gasLimit: 300000 })
          : await vaultWithSigner.withdraw(parsedWei, { gasLimit: 300000 });

      const receipt = await txResult.wait();
      setAmount("");
      onActionComplete();
      showSuccess(
        mode === "deposit" ? `Deposited ${amount} mUSD` : `Withdrew ${amount} mUSD`,
        receipt.hash,
      );
    } catch (err) {
      setTx({
        status: "error",
        message: err instanceof Error ? err.message : "Transaction failed",
      });
    }
  }

  if (!address) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex items-center justify-center text-sm text-slate-500">
        Connect your wallet to deposit or withdraw.
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1 w-fit">
          {(["deposit", "withdraw"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setAmount("");
                setTx({ status: "idle" });
              }}
              className={`px-3 py-1.5 text-xs font-mono uppercase rounded-md transition ${
                mode === m ? "bg-slate-800 text-slate-100" : "text-slate-500"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <FaucetButton
          address={address}
          signer={signer}
          isCorrectNetwork={isCorrectNetwork}
          onMinted={onActionComplete}
        />
      </div>

      <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
        <span>Your shares: {shares ?? "—"}</span>
        <span>Wallet balance: {assetBalance ?? "—"} mUSD</span>
      </div>

      <div className="relative mb-3">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          className={`w-full bg-slate-950 border rounded-lg pl-4 pr-16 py-3 text-lg font-mono text-slate-100 outline-none transition ${
            exceedsBalance
              ? "border-red-500/50 focus:border-red-500/50"
              : "border-slate-800 focus:border-cyan-400/50"
          }`}
        />
        <button
          onClick={handleMax}
          disabled={!available}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono uppercase px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-slate-200 transition disabled:opacity-40"
        >
          Max
        </button>
      </div>

      {exceedsBalance && (
        <p className="text-xs font-mono text-red-400 mb-3">
          Amount exceeds your {mode === "deposit" ? "wallet balance" : "share balance"}.
        </p>
      )}

      {tx.status === "error" && (
        <p className="text-xs font-mono text-red-400 mb-3 wrap-break-word">{tx.message}</p>
      )}

      {tx.status === "success" && (
        <p className="text-xs font-mono text-emerald-400 mb-3">
          ✓ {tx.label} —{" "}
          <a
            href={`https://hashscan.io/testnet/transaction/${tx.txHash}`}
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-emerald-300"
          >
            view tx ↗
          </a>
        </p>
      )}

      {!isCorrectNetwork ? (
        <p className="text-xs font-mono text-amber-400 text-center">
          Switch to Hedera Testnet to continue.
        </p>
      ) : needsApproval ? (
        <button
          onClick={handleApprove}
          disabled={tx.status === "pending" || !amount}
          className="w-full py-3 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-400 text-sm font-mono uppercase hover:bg-amber-400/20 transition disabled:opacity-50"
        >
          {tx.status === "pending" ? tx.label : "Approve mUSD"}
        </button>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={tx.status === "pending" || !amount || exceedsBalance}
          className="w-full py-3 rounded-lg bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 text-sm font-mono uppercase hover:bg-cyan-400/20 transition disabled:opacity-50"
        >
          {tx.status === "pending" ? tx.label : mode === "deposit" ? "Deposit" : "Withdraw"}
        </button>
      )}
    </div>
  );
}
