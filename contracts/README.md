# RebalanceVault — Contracts

The Solidity vault contract at the core of the RebalanceVault project, built and
tested with Foundry.

See the [root README](../README.md) for the full project overview, architecture,
and AI usage disclosure.

## Stack

Solidity, Foundry, OpenZeppelin.

## Contracts

- **`Vault.sol`** — an ERC20-share vault. Users deposit an underlying ERC20 asset
  and receive shares priced against the vault's current asset-to-share ratio
  (the same accounting approach as OpenZeppelin's ERC4626). An authorized agent
  address can call `rebalance()` to record a strategy change, which is logged
  on-chain via the `Rebalanced` event and, separately, immutably to Hedera
  Consensus Service by the `agent/` package.
- **`MinimalERC20`** (in the deploy script) — a mock ERC20 ("mUSD") used as the
  vault's underlying asset for testnet demonstration. Its `mint()` function is
  intentionally unrestricted, so any address can mint test tokens for itself —
  this is a deliberate testnet-only simplification, not a pattern that would
  carry over to a production asset.

## Setup

```bash
forge install
```

Create `.env`:

```
AGENT_ADDRESS=0xyouragentaddress
```

Deployment uses a Foundry keystore for the deployer account rather than a
plaintext private key:

```bash
cast wallet import deployer --interactive
```

## Testing

```bash
forge test
```

The test suite covers:

- Deposit/withdraw share-price accounting, including dilution protection when
  the vault's value changes between deposits
- Access control (`onlyAgent`, `onlyOwner`) and correct error reverts
- Event emissions and their argument correctness
- Edge cases such as zero-amount calls, insufficient balances, and a
  deliberately desynced-accounting scenario constructed via `deal()` to verify
  the withdrawal math cannot be pushed into an unsafe state

## Deployment

Deploys to Hedera Testnet. Hedera's public JSON-RPC relay has shown some
node-to-node inconsistency around transaction ordering and EIP-1559-style
transactions during development — `--legacy` and `--slow` are used to avoid
nonce-ordering failures across a multi-transaction deployment script:

```bash
forge script script/DeployVault.s.sol \
  --rpc-url https://testnet.hashio.io/api \
  --account deployer \
  --tc DeployVault \
  --broadcast --legacy --slow
```

After a successful deploy, export the ABI and update the shared root-level
files so the `agent/` and `frontend/` packages stay in sync:

```bash
cat out/Vault.sol/Vault.json | jq '.abi' > ../abis/Vault.json
```

Then update `../deployments.json` with the new `vault` and `asset` addresses.

## Known limitations

- `rebalance()` currently only records a strategy change on-chain (via state
  and an event); it does not yet move deposited funds between distinct
  strategy allocations. See the root README for the full reasoning behind this
  scoping decision.
- The vault's share token is a standard OpenZeppelin ERC20, not a native HTS
  token minted via Hedera's Token Service system contract.
