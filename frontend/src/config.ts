import { ethers } from "ethers";
import VaultAbi from "./abis/Vault.json";

export const HEDERA_TESTNET_CHAIN_ID = 296;
export const HEDERA_TESTNET_CHAIN_ID_HEX = "0x128";

export const VAULT_ADDRESS = import.meta.env.VITE_VAULT_ADDRESS;
export const ASSET_ADDRESS = import.meta.env.VITE_ASSET_ADDRESS;

export const provider = new ethers.JsonRpcProvider(import.meta.env.VITE_RPC_URL);

export const vault = new ethers.Contract(VAULT_ADDRESS, VaultAbi, provider);

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function symbol() view returns (string)",
  "function mint(address to, uint256 amount)",
];

export const asset = new ethers.Contract(ASSET_ADDRESS, ERC20_ABI, provider);

export const MIRROR_NODE_URL = import.meta.env.VITE_MIRROR_NODE_URL;
export const HCS_TOPIC_ID = import.meta.env.VITE_HCS_TOPIC_ID;

export const StrategyNames = ["None", "ConservativeLending", "AggressiveLending"] as const;
