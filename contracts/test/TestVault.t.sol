// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {Vault} from "../src/Vault.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice A mock ERC20 token to be deployed with the vault
contract MockAsset is ERC20 {
    constructor() ERC20("Mock USD", "mUSD") {}

    /// @notice Mints an arbitrary amount of mock USD to any address.
    /// @dev Unrestricted on purpose — this is a testnet-only mock asset, not a real token.
    /// @param to The address to receive the minted tokens.
    /// @param amount The amount of tokens to mint (18 decimals, matching standard ERC20).
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/// @notice A Vault that serves as a testing ground to test the functionality
/// of the protocol.
contract TestVault is Test {
    /// @notice The Vault contract to be deployed.
    Vault public vault;

    /// @notice The mock ERC20 token to deploy with the vault.
    MockAsset public asset;

    /// @notice The three different types of strategy available in the vault.
    /// @dev Default strategy is going to be None.
    /// @dev The agent changes strategy based on market signals.
    enum Strategy {
        None,
        ConservativeLending,
        AggressiveLending
    }

    address agent = makeAddr("agent");
    address user = makeAddr("user");
    address otherUser = makeAddr("otherUser");

    /// @notice Same events from the Vault contract
    event Deposited(address indexed user, uint256 indexed assets, uint256 indexed shares);
    event Withdrawn(address indexed user, uint256 indexed shares, uint256 indexed assets);
    event Rebalanced(
        uint8 indexed fromStrategy, uint8 indexed toStrategy, uint256 totalAssetsAtRebalance, string reason
    );
    event AgentUpdated(address indexed oldAgent, address indexed newAgent);
}
