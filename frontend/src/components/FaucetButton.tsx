import { useState } from "react";
import { ethers } from "ethers";
import { ERC20_ABI } from "../config";

interface FaucetButtonProps {
  address: string | null;
  signer: ethers.Signer | null;
  isCorrectNetwork: boolean;
  onMinted: () => void;
}

type Status =
  | { state: "idle" }
  | { state: "pending" }
  | { state: "success"; txHash: string }
  | { state: "error" };

const FAUCET_AMOUNT = ethers.parseEther("1000");

export function FaucetButton({ address, signer, isCorrectNetwork, onMinted }: FaucetButtonProps) {
  const [status, setStatus] = useState<Status>({ state: "idle" });

  async function handleClaim() {
    if (!signer || !address) return;
    try {
      setStatus({ state: "pending" });
      const assetWithSigner = new ethers.Contract(
        import.meta.env.VITE_ASSET_ADDRESS,
        ERC20_ABI,
        signer,
      );
      const tx = await assetWithSigner.mint(address, FAUCET_AMOUNT, { gasLimit: 100000 });
      const receipt = await tx.wait();
      onMinted();
      setStatus({ state: "success", txHash: receipt.hash });
      setTimeout(() => setStatus({ state: "idle" }), 5000);
    } catch (err) {
      console.error("Faucet claim failed:", err);
      setStatus({ state: "error" });
    }
  }

  if (!address || !isCorrectNetwork) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClaim}
        disabled={status.state === "pending"}
        className="text-xs font-mono px-3 py-1.5 rounded-lg bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/20 transition disabled:opacity-50"
      >
        {status.state === "pending"
          ? "Minting..."
          : status.state === "error"
            ? "Failed — try again"
            : "Get 1,000 mUSD"}
      </button>
      {status.state === "success" && (
        <a
          href={`https://hashscan.io/testnet/transaction/${status.txHash}`}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] font-mono text-emerald-400 underline hover:text-emerald-300"
        >
          ✓ minted — view tx ↗
        </a>
      )}
    </div>
  );
}
