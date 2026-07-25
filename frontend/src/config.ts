import { ethers } from "ethers";
import VaultAbi from "./abis/Vault.json";

export const provider = new ethers.JsonRpcProvider(import.meta.env.VITE_RPC_URL);

export const vault = new ethers.Contract(import.meta.env.VITE_VAULT_ADDRESS, VaultAbi, provider);

export const MIRROR_NODE_URL = import.meta.env.VITE_MIRROR_NODE_URL;
export const HCS_TOPIC_ID = import.meta.env.VITE_HCS_TOPIC_ID;

export const StrategyNames = ["None", "ConservativeLending", "AggressiveLending"] as const;
