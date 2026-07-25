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

  const needsApproval =
    mode === "deposit" &&
    allowance !== null &&
    amount !== "" &&
    allowance < ethers.parseEther(amount || "0");

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
      onActionComplete(); // refreshes allowance, which flips the button to "Deposit"
    } catch (err) {
      setTx({ status: "error", message: err instanceof Error ? err.message : "Approval failed" });
    }
  }

  async function handleSubmit() {
    if (!signer || !amount) return;
    try {
      setTx({ status: "pending", label: mode === "deposit" ? "Depositing..." : "Withdrawing..." });
      const vaultWithSigner = new ethers.Contract(VAULT_ADDRESS, VaultAbi, signer);
      const parsedAmount = ethers.parseEther(amount);

      const txResult =
        mode === "deposit"
          ? await vaultWithSigner.deposit(parsedAmount, { gasLimit: 300000 })
          : await vaultWithSigner.withdraw(parsedAmount, { gasLimit: 300000 });

      await txResult.wait();
      setTx({ status: "idle" });
      setAmount("");
      onActionComplete();
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

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.0"
        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-lg font-mono text-slate-100 mb-3 outline-none focus:border-cyan-400/50"
      />

      {tx.status === "error" && (
        <p className="text-xs font-mono text-red-400 mb-3 wrap-break-word">{tx.message}</p>
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
          disabled={tx.status === "pending" || !amount}
          className="w-full py-3 rounded-lg bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 text-sm font-mono uppercase hover:bg-cyan-400/20 transition disabled:opacity-50"
        >
          {tx.status === "pending" ? tx.label : mode === "deposit" ? "Deposit" : "Withdraw"}
        </button>
      )}
    </div>
  );
}
