import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { vault, asset, VAULT_ADDRESS } from "../config";

interface UserPosition {
  shares: string;
  assetBalance: string;
  allowance: bigint;
}

export function useUserPosition(address: string | null) {
  const [data, setData] = useState<UserPosition | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!address) {
      setData(null);
      return;
    }

    try {
      const [shares, assetBalance, allowance] = await Promise.all([
        vault.balanceOf(address),
        asset.balanceOf(address),
        asset.allowance(address, VAULT_ADDRESS),
      ]);

      setData({
        shares: ethers.formatEther(shares),
        assetBalance: ethers.formatEther(assetBalance),
        allowance,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load position");
    }
  }, [address]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  return { data, error, refresh };
}
