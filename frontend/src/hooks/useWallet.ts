import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { HEDERA_TESTNET_CHAIN_ID, HEDERA_TESTNET_CHAIN_ID_HEX } from "../config";

function getEthereum(): any {
  return (window as any).ethereum;
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    const ethereum = getEthereum();
    if (!ethereum) {
      setError("No wallet found — install MetaMask to continue.");
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      await ethereum.request({ method: "eth_requestAccounts" });
      const browserProvider = new ethers.BrowserProvider(ethereum);
      const network = await browserProvider.getNetwork();

      if (Number(network.chainId) !== HEDERA_TESTNET_CHAIN_ID) {
        try {
          await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: HEDERA_TESTNET_CHAIN_ID_HEX }],
          });
        } catch (switchErr: any) {
          if (switchErr.code === 4902) {
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: HEDERA_TESTNET_CHAIN_ID_HEX,
                  chainName: "Hedera Testnet",
                  nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 },
                  rpcUrls: ["https://testnet.hashio.io/api"],
                  blockExplorerUrls: ["https://hashscan.io/testnet"],
                },
              ],
            });
          } else {
            throw switchErr;
          }
        }
      }

      const newSigner = await browserProvider.getSigner();
      const newAddress = await newSigner.getAddress();
      const finalNetwork = await browserProvider.getNetwork();

      setSigner(newSigner);
      setAddress(newAddress);
      setChainId(Number(finalNetwork.chainId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setSigner(null);
    setChainId(null);
  }, []);

  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) disconnect();
      else connect();
    };
    const handleChainChanged = () => connect();

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);

    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
      ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [connect, disconnect]);

  return {
    address,
    signer,
    chainId,
    connecting,
    error,
    connect,
    disconnect,
    isCorrectNetwork: chainId === HEDERA_TESTNET_CHAIN_ID,
  };
}
