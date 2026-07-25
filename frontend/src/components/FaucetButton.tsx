import { useState } from "react";
import { ethers } from "ethers";
import { ERC20_ABI } from "../config";

interface FaucetButtonProps {
  address: string | null;
  signer: ethers.Signer | null;
  isCorrectNetwork: boolean;
  onMinted: () => void;
}

const FAUCET_AMOUNT = ethers.parseEther("1000"); // 1,000 mUSD per claim

export function FaucetButton({ address, signer, isCorrectNetwork, onMinted }: FaucetButtonProps) {
  const [status, setStatus] = useState<"idle" | "pending" | "error">("idle");

  async function handleClaim() {
    if (!signer || !address) return;
    try {
      setStatus("pending");
      const assetWithSigner = new ethers.Contract(
        import.meta.env.VITE_ASSET_ADDRESS,
        ERC20_ABI,
        signer,
      );
      const tx = await assetWithSigner.mint(address, FAUCET_AMOUNT, { gasLimit: 100000 });
      await tx.wait();
      setStatus("idle");
      onMinted();
    } catch (err) {
      console.error("Faucet claim failed:", err);
      setStatus("error");
    }
  }

  if (!address || !isCorrectNetwork) return null;

  return (
    <button
      onClick={handleClaim}
      disabled={status === "pending"}
      className="text-xs font-mono px-3 py-1.5 rounded-lg bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/20 transition disabled:opacity-50"
    >
      {status === "pending"
        ? "Minting..."
        : status === "error"
          ? "Failed — try again"
          : "Get 1,000 mUSD"}
    </button>
  );
}
