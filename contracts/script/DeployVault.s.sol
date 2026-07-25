// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {Vault} from "../src/Vault.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice A Mock ERC20 token to deploy the contract with.
contract MinimalERC20 is ERC20 {
    constructor() ERC20("Mock USD", "mUSD") {}

    /// @notice Mints an arbitrary amount of mock USD to any address.
    /// @dev Unrestricted on purpose — this is a testnet-only mock asset, not a real token.
    /// @param to The address to receive the minted tokens.
    /// @param amount The amount of tokens to mint (18 decimals, matching standard ERC20).
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/// @title DeployVault
/// @notice Foundry deployment script for the Vault contract and its underlying mock asset.
/// @dev Deploys a fresh MinimalERC20 as the vault's asset, deploys the Vault itself
///      wired to that asset and to an agent address read from the environment, then
///      mints an initial supply of mock USD to the deployer for testing deposits.
contract DeployVault is Script {
    Vault vault;
    MinimalERC20 asset;

    function run() external {
        address agent = vm.envAddress("AGENT_ADDRESS");
        vm.startBroadcast();
        asset = new MinimalERC20();
        vault = new Vault(address(asset), agent);
        asset.mint(msg.sender, 1_000_000 ether);
        vm.stopBroadcast();
    }
}
