import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const VaultAbi = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../abis/Vault.json"), "utf-8"),
);
const deployments = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../deployments.json"), "utf-8"),
);

// Simply a utility script for demostration purposes. The real market will not change suddenly enough for a change
// in strategy to be reflected inside of the app. This script allows us to reset the strategy back to None(0) to at
// least see it changing from None to either conservative or volatile.
async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY!, provider);
  const vault = new ethers.Contract(deployments.vault.address, VaultAbi, wallet);

  // Red the current vault's strategy
  const currentStrategy = Number(await vault.s_currentStrategy());
  console.log(`Current strategy before reset: ${currentStrategy}`);

  // If the strategy is already None(0), do nothing and return.
  if (currentStrategy === 0) {
    console.log("Already at None (0) — nothing to reset.");
    return;
  }

  // Otherwise, change it to None(0) by calling `Vault__rebalance`.
  console.log("Resetting strategy to None (0)...");
  const tx = await vault.rebalance(0, "Manual reset ahead of demo");
  const receipt = await tx.wait();

  console.log("Reset confirmed on-chain:", receipt.hash);
}

// Catch any potential errors.
main().catch(console.error);
