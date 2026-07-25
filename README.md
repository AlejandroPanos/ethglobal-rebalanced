# RebalanceVault

**An autonomous DeFi agent on Hedera that pays for real market data via x402 micropayments, rebalances a vault based on live yield conditions, and logs every decision immutably to Hedera Consensus Service (HCS) for full auditability.**

Built for ETHGlobal — Hedera track.

🔗 **Live app:** _add your Vercel URL here_
🔗 **Vault contract:** [`0x103c8c4f1d136403FebE89a60d6896CE491eB593`](https://hashscan.io/testnet/contract/0x103c8c4f1d136403FebE89a60d6896CE491eB593) (Hedera Testnet)

---

## What it does

1. **Anyone can deposit** a mock ERC20 asset (mUSD) into a vault smart contract and receive vault shares in return — a real, working DeFi primitive with standard vault share-price accounting.
2. **An autonomous agent runs continuously**, checking a paid "yield signal" service every cycle to decide whether the vault should shift strategy. The signal is grounded in **real, live market data** — it compares the current APY of a stablecoin pool (USDC-USDT) against a volatile pool (USDC-WETH) on Uniswap V3, sourced from DefiLlama's public yields API.
3. **The agent pays for that data with real HBAR**, using the **x402 payment protocol**, settled through the **Blocky402** facilitator on Hedera testnet. This is genuine machine-to-machine payment — real testnet HBAR moves on every request, verified and settled by a live third-party facilitator, not simulated.
4. **When the signal favors a different strategy, the agent calls `rebalance()`** on the vault — a real, signed, autonomous on-chain action.
5. **Every rebalance decision is logged immutably to Hedera Consensus Service (HCS)**, giving depositors and auditors a transparent, tamper-proof record of _why_ the agent moved funds and when.
6. **A live dashboard** lets anyone connect a wallet, mint testnet mUSD from a faucet, deposit, withdraw, and watch the agent's real decision history and current strategy update in real time.

---

## Architecture

```
rebalanced_vault/
├── contracts/           Solidity vault (Foundry)
├── agent/                Autonomous decision-making agent (Node.js/TypeScript)
├── signal-service/        Paid yield-signal API (Express + x402 + Blocky402)
├── frontend/             Live dashboard (React + Vite + Tailwind)
├── abis/                 Shared contract ABI
└── deployments.json       Shared deployed contract addresses
```

**Data flow:** the agent reads vault state directly via `ethers.js` over Hedera's JSON-RPC relay, pays and queries the signal service via x402, calls `rebalance()` directly on the vault, and logs its reasoning to HCS. The frontend independently reads the same vault contract (JSON-RPC) and the same HCS topic (Mirror Node REST API) to render a live view of vault state and the agent's decision history — and additionally lets a connected user deposit and withdraw directly against the same live contract.

---

## Features

- **Real DeFi vault mechanics** — deposit/withdraw with correct share-price accounting, dilution protection, and full access control, covered by an extensive Foundry test suite.
- **Autonomous agent** — runs on a configurable interval (default 60s), makes its own decisions, and recovers gracefully from transient failures without crashing.
- **Real x402 payments on Hedera** — implemented against the actual `@x402/core`, `@x402/hedera`, `@x402/express`, and `@x402/fetch` packages, settled through the live Blocky402 facilitator, not a hand-rolled approximation.
- **Real market data** — yield decisions are based on live Uniswap V3 pool APYs, sourced from DefiLlama's public API.
- **Immutable audit trail** — every rebalance is logged to HCS, queryable by anyone via the Mirror Node.
- **Full user-facing product, not just a demo** — wallet connect, a testnet faucet, deposit/withdraw with approval handling, live transaction feedback, and balance validation, all against the real live contract.

---

## Tech stack

| Component      | Stack                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Vault contract | Solidity, Foundry, OpenZeppelin                                                                               |
| Agent          | Node.js, TypeScript, `ethers.js`, `@hiero-ledger/sdk`                                                         |
| Payments       | `@x402/core`, `@x402/hedera`, `@x402/fetch`, `@x402/express` — settled via [Blocky402](https://blocky402.com) |
| Market data    | [DefiLlama](https://defillama.com) public yields API                                                          |
| Frontend       | React, Vite, TypeScript, Tailwind CSS, `ethers.js`                                                            |
| Network        | Hedera Testnet (chain ID 296)                                                                                 |
| Deployment     | Vercel (frontend)                                                                                             |

---

## Why Hedera

- **EVM-compatible smart contracts** — the vault is plain, auditable Solidity, deployed and tested with a standard Foundry workflow.
- **Hedera Consensus Service (HCS)** — used as an immutable, ordered log of every agent decision, giving depositors real transparency into _why_ funds moved, not just _that_ they did.
- **x402 on Hedera** — the agent pays for market data using Hedera's native `exact` payment scheme, settled through a live, independent facilitator. This is genuine agent-to-agent commerce, running on real infrastructure.

---

## Project setup

Each package is independent — install and run separately from its own folder.

### 1. Contracts

```bash
cd contracts
forge install
```

Create `contracts/.env`:

```
AGENT_ADDRESS=0xyouragentaddress
```

(deployment uses a Foundry keystore for the deployer account — see `cast wallet import`)

Deploy to Hedera testnet:

```bash
forge script script/DeployVault.s.sol \
  --rpc-url https://testnet.hashio.io/api \
  --account deployer \
  --tc DeployVault \
  --broadcast --legacy --slow
```

Export the ABI and update the root `deployments.json`:

```bash
cat out/Vault.sol/Vault.json | jq '.abi' > ../abis/Vault.json
```

### 2. Signal service

```bash
cd signal-service
pnpm install
```

Create `signal-service/.env`:

```
PORT=8000
PAY_TO_ACCOUNT_ID=0.0.xxxxx
PRICE_TINYBARS=1000000
```

```bash
pnpm exec ts-node index.ts
```

### 3. Agent

```bash
cd agent
pnpm install
```

Create `agent/.env`:

```
AGENT_PRIVATE_KEY=0xyouragentprivatekey
AGENT_ACCOUNT_ID=0.0.xxxxx
RPC_URL=https://testnet.hashio.io/api
HCS_TOPIC_ID=0.0.xxxxx
CYCLE_INTERVAL_MS=60000
SIGNAL_SERVICE_URL=http://localhost:8000/yield-signal
```

Create the HCS topic once (first-time setup only):

```bash
pnpm exec ts-node scripts/createTopic.ts
```

Run the agent — it executes one cycle immediately, then continues automatically every `CYCLE_INTERVAL_MS`:

```bash
pnpm exec ts-node index.ts
```

A failed cycle (e.g. a brief RPC or network hiccup) is caught and logged; it does not stop the loop. Press `Ctrl+C` to shut down cleanly.

To manually reset the vault's strategy back to `None` (useful before a live demo):

```bash
pnpm exec ts-node scripts/resetStrategy.ts
```

### 4. Frontend

```bash
cd frontend
pnpm install
```

Create `frontend/.env`:

```
VITE_VAULT_ADDRESS=0x...
VITE_ASSET_ADDRESS=0x...
VITE_RPC_URL=https://testnet.hashio.io/api
VITE_MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com
VITE_HCS_TOPIC_ID=0.0.xxxxx
```

```bash
pnpm dev
```

---

## Testing

The vault contract has an extensive Foundry test suite covering share/asset conversion math, access control, event emissions, and edge cases such as dilution protection and desynced accounting.

```bash
cd contracts
forge test
```

---

## Deployment

The frontend is deployed to Vercel as a static site, reading live data directly from Hedera's public JSON-RPC relay and the public Mirror Node REST API — no backend of its own required for read access or for deposit/withdraw, which are signed directly by the connected user's wallet.

The agent and signal service are run locally rather than deployed as always-on services. This is a deliberate choice: the agent holds a real signing key that authorizes on-chain actions, and running it under direct control during demonstration avoids exposing an unattended signer on third-party infrastructure. Every transaction the agent produces while running locally is written to Hedera's public network and is immediately visible on the deployed frontend for anyone, regardless of where the agent happens to be running.

---

## Use of AI

AI assistance (Claude) was used during development of this project, specifically for:

- **Frontend development** — scaffolding and iterating on React components and Tailwind styling to speed up implementation.
- **Documentation** — drafting and refining this README.
- **Test suite development** — assistance writing portions of the Foundry test suite for the Vault contract.
- **Debugging and enhancement** — diagnosing errors (tooling/version issues, transaction failures, RPC relay quirks) and helping scope and implement feature enhancements throughout the build.

All architectural decisions, the core contract logic, the x402/Hedera integration design, and the overall project direction were driven by the author. AI was used as a development accelerant and pair-programming aid, not as an autonomous author of the project.

---

## Known limitations / next steps

- **`rebalance()` currently records the strategy change on-chain but does not yet move deposited funds between distinct yield strategies.** Deposited mUSD represents the capital the agent would manage; in this version, strategy allocation is tracked and decided in real time, but funds are not yet physically split or routed between separate strategy contracts. This was a deliberate scoping decision to prioritize a fully working, real payment and audit-trail loop within the hackathon timeline.
- **The vault's share token is a standard ERC20**, not a native HTS token. Swapping this for a native HTS mint via the Hedera Token Service system contract is a natural next step.
- **The yield signal compares two fixed reference pools** (a stablecoin pair and a volatile pair on Uniswap V3, via DefiLlama) rather than surveying the broader market. The data itself is real and live; the comparison logic is a deliberately simple heuristic for demo purposes, not a production strategy engine.
- **The mUSD faucet is intentionally unrestricted** (anyone can mint) — appropriate for a testnet demo asset, not a pattern that would carry over to a real deployment.
