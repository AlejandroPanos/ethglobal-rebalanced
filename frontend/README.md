# RebalanceVault — Frontend

Live dashboard for the RebalanceVault project. Lets any visitor connect a wallet,
mint testnet mUSD, deposit into and withdraw from the vault, and watch the
autonomous agent's current strategy and decision history update in real time.

See the [root README](../README.md) for the full project overview, architecture,
and AI usage disclosure.

## Stack

React, Vite, TypeScript, Tailwind CSS, `ethers.js`.

## How it gets its data

This is a static, read-mostly frontend with no backend of its own:

- **Vault state** (current strategy, a connected user's shares/balance) is read
  directly from the deployed contract via `ethers.js`, over Hedera's public
  JSON-RPC relay.
- **The agent's decision history** is read from Hedera Consensus Service (HCS)
  via the public Mirror Node REST API.
- **Deposits, withdrawals, and the testnet faucet** are real, signed transactions
  sent directly from the connected user's own wallet (MetaMask) — this app never
  holds or spends funds on a user's behalf.

The frontend does not talk to the agent or the signal-service packages directly;
those are independent processes that write to the same public Hedera network this
app reads from.

## Setup

```bash
pnpm install
```

Create `.env` in this folder:

```
VITE_VAULT_ADDRESS=0x...
VITE_ASSET_ADDRESS=0x...
VITE_RPC_URL=https://testnet.hashio.io/api
VITE_MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com
VITE_HCS_TOPIC_ID=0.0.xxxxx
```

Values should match the root-level `../deployments.json` and the HCS topic used
by the `agent/` package.

## Scripts

```bash
pnpm dev        # start the dev server
pnpm run build  # production build, output to dist/
pnpm run preview # serve the production build locally
```

## Project structure

```
src/
├── abis/               Vault contract ABI (copied from ../abis/Vault.json)
├── components/          UI components (Navbar, StatCard, DecisionLog, PositionPanel, etc.)
├── hooks/               Data-fetching hooks (wallet, vault state, decision feed, user position)
├── utils/                Small helpers (time formatting)
├── config.ts             Contract instances, env var wiring, shared constants
└── App.tsx                Top-level layout
```

## Deployment

Deployed to Vercel. Two settings matter beyond the defaults, since this package
lives inside a monorepo and imports files from outside its own folder
(`../abis/Vault.json`, `../deployments.json`):

- **Root directory:** `frontend`
- **Include files outside the root directory:** enabled

All five `VITE_*` environment variables above need to be set in the Vercel
project's environment variable settings (Production and Preview scopes) —
Vite bakes them into the build at build time, so they must be present before
the build runs, not just at runtime.

## Known simplifications

- Deposit/withdraw requires an ERC20 `approve()` step before the first deposit,
  handled as a separate transaction (standard ERC20 pattern).
- Gas limits are set manually on vault/asset transactions rather than relying on
  automatic estimation, since Hedera's public testnet RPC relay (Hashio) has
  occasionally produced unreliable gas estimates during development.
- The mUSD faucet (`mint()`) is intentionally open to any caller — appropriate
  for a testnet demo asset only.
