import { ethers } from "ethers";
import { Client, PrivateKey, TopicMessageSubmitTransaction } from "@hiero-ledger/sdk";
import { x402Client } from "@x402/core/client";
import { createClientHederaSigner } from "@x402/hedera";
import { ExactHederaScheme } from "@x402/hedera/exact/client";
import { wrapFetchWithPayment } from "@x402/fetch";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// __dirname is not available in ESM, so it must be reconstructed using import.meta.url
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the Vault's ABI and the deployment data directly from the files.
const VaultAbi = JSON.parse(fs.readFileSync(path.join(__dirname, "../abis/Vault.json"), "utf-8"));
const deployments = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../deployments.json"), "utf-8"),
);

// How often the agent runs its decision loop in miliseconds.
const CYCLE_INTERVAL_MS = Number(process.env.CYCLE_INTERVAL_MS ?? 60000);

// Object that mimics the Strategy enum in the Vault's contract. Node's native TS type-stripping prevents from reading
// enums correctly. This is the workaround.
const Strategy = {
  None: 0,
  ConservativeLending: 1,
  AggressiveLending: 2,
} as const;

// The names given to the strategies.
const StrategyNames = ["None", "ConservativeLending", "AggressiveLending"] as const;
