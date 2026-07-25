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
