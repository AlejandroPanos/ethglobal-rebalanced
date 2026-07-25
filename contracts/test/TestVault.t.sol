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

    function setUp() external {
        asset = new MockAsset();
        vault = new Vault(address(asset), agent);

        asset.mint(user, 1_000 ether);
        asset.mint(otherUser, 1_000 ether);

        vm.prank(user);
        asset.approve(address(vault), type(uint256).max);

        vm.prank(otherUser);
        asset.approve(address(vault), type(uint256).max);
    }

    function testDepositRevertsIfAssetsIsZero() external {
        uint256 assets = 0;
        vm.prank(user);
        vm.expectRevert(Vault.Vault__ZeroAmount.selector);
        vault.deposit(assets);
    }

    function testFirstDepositSharesAreEqualToAssets() external {
        vm.prank(user);
        uint256 shares = vault.deposit(100 ether);

        assertEq(shares, 100 ether);
        assertEq(vault.balanceOf(user), 100 ether);
        assertEq(vault.totalSupply(), 100 ether);
    }

    function testUsesCorrectShareRadioWhenVaultValueIncreases() external {
        vm.prank(user);
        vault.deposit(100 ether);

        asset.mint(address(vault), 100 ether);

        vm.prank(otherUser);
        uint256 shares = vault.deposit(50 ether);

        assertEq(shares, 25 ether);
        assertEq(vault.balanceOf(user), 100 ether);
        assertEq(vault.balanceOf(otherUser), 25 ether);
    }

    function testUsesCorrectRatioWhenVaultValueUnchanged() external {
        vm.prank(user);
        vault.deposit(100 ether);

        vm.prank(otherUser);
        uint256 shares = vault.deposit(100 ether);

        assertEq(shares, 100 ether);
        assertEq(vault.balanceOf(user), 100 ether);
        assertEq(vault.balanceOf(otherUser), 100 ether);
    }

    function testDepositTransfersAssetsFromUserToVault() external {
        uint256 userBalanceBefore = asset.balanceOf(user);
        uint256 vaultBalanceBefore = asset.balanceOf(address(vault));

        vm.prank(user);
        vault.deposit(100 ether);

        assertEq(asset.balanceOf(user), userBalanceBefore - 100 ether);
        assertEq(asset.balanceOf(address(vault)), vaultBalanceBefore + 100 ether);
    }

    function testRevertWhenUserIsNotApproved() external {
        address notApproved = makeAddr("notApproved");
        asset.mint(notApproved, 1_000 ether);

        vm.prank(notApproved);
        vm.expectRevert();
        vault.deposit(100 ether);
    }

    function testDepositMintsCorrectShareBalance() external {
        vm.prank(user);
        vault.deposit(100 ether);

        assertEq(vault.balanceOf(user), 100 ether);
        assertEq(vault.totalSupply(), 100 ether);
    }

    function testEmitsAfterDeposit() external {
        vm.expectEmit(true, true, true, true);
        emit Vault.Deposited(user, 100 ether, 100 ether);

        vm.prank(user);
        vault.deposit(100 ether);
    }

    function testWithdrawRevertsIfSharesIsZero() external {
        vm.prank(user);
        vm.expectRevert(Vault.Vault__ZeroAmount.selector);
        vault.withdraw(0);
    }

    function testWithdrawRevertsIfBalanceBelowShares() external {
        vm.prank(user);
        vault.deposit(100 ether);

        vm.prank(user);
        vm.expectRevert(Vault.Vault__InsufficientShares.selector);
        vault.withdraw(200 ether);
    }

    function testWithdrawAllSharesReturnsAllAssets() external {
        vm.prank(user);
        uint256 shares = vault.deposit(100 ether);

        vm.prank(user);
        uint256 assets = vault.withdraw(shares);

        assertEq(assets, 100 ether);
    }

    function testUsesCorrectAssetRatioWhenVaultValueIncreased() external {
        vm.prank(user);
        vault.deposit(100 ether);

        asset.mint(address(vault), 100 ether);

        vm.prank(otherUser);
        uint256 shares = vault.deposit(50 ether); // Supply is 100 -> Ratio for this user = 25 shares

        vm.prank(otherUser);
        uint256 assets = vault.withdraw(shares);
        assertEq(assets, 50 ether);
        assertEq(vault.balanceOf(user), 100 ether);
        assertEq(vault.balanceOf(otherUser), 0 ether);
    }

    function testUsesCorrectAssetRatioWhenVaultValueUnchanged() external {
        vm.prank(user);
        vault.deposit(100 ether);

        vm.prank(otherUser);
        uint256 shares = vault.deposit(100 ether); // Supply is 100 -> Ratio for this user = 100 shares

        vm.prank(otherUser);
        uint256 assets = vault.withdraw(shares);
        assertEq(assets, 100 ether);
    }

    function testPartialWithdrawReturnsProportionalAssets() external {
        vm.prank(user);
        vault.deposit(100 ether);

        vm.prank(otherUser);
        vault.deposit(100 ether);

        vm.prank(otherUser);
        uint256 assets = vault.withdraw(50 ether); // Assets should be = 50
        assertEq(assets, 50 ether);
    }

    function testWithdrawBurnsCorrectShareAmount() external {
        vm.prank(user);
        vault.deposit(100 ether);

        vm.prank(user);
        vault.withdraw(50 ether);

        assertEq(vault.balanceOf(user), 50 ether);
        assertEq(vault.totalSupply(), 50 ether);
    }

    function testWithdrawUpdatesTotalSupplyCorrectly() external {
        vm.prank(user);
        vault.deposit(100 ether);

        assertEq(vault.totalSupply(), 100 ether);

        vm.prank(user);
        vault.withdraw(40 ether);

        assertEq(vault.totalSupply(), 60 ether);
    }
}
