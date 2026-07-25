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

    function testWithdrawTransfersCorrectAssetAmountToUser() external {
        vm.prank(user);
        vault.deposit(100 ether);

        uint256 userBalanceBefore = asset.balanceOf(user);

        vm.prank(user);
        uint256 assets = vault.withdraw(40 ether);

        assertEq(assets, 40 ether); // 1:1 ratio so assets should be 40 ether
        assertEq(asset.balanceOf(user), userBalanceBefore + 40 ether);
    }

    function testRevertsIfVaultHasInsufficientAssetBalance() external {
        vm.prank(user);
        vault.deposit(100 ether);

        deal(address(vault), user, 1_000 ether, false);

        vm.prank(user);
        vm.expectRevert(); // Should revert with ERC20InsufficientBalance
        vault.withdraw(1_000 ether);
    }

    function testWithdrawEmitsWithdrawnEvent() external {
        vm.prank(user);
        vault.deposit(100 ether);

        vm.expectEmit(true, true, true, true);
        emit Withdrawn(user, 50 ether, 50 ether);

        vm.prank(user);
        vault.withdraw(50 ether);
    }

    function testWithdrawDoesNotAffectOtherUsersShareBalance() external {
        vm.prank(user);
        vault.deposit(100 ether);

        vm.prank(otherUser);
        vault.deposit(100 ether);

        vm.prank(user);
        vault.withdraw(50 ether);

        assertEq(vault.balanceOf(user), 50 ether);
        assertEq(vault.balanceOf(otherUser), 100 ether);
    }

    function testDepositThenWithdrawFullAmountReturnsOriginalAssets() external {
        uint256 userBalanceBefore = asset.balanceOf(user);

        vm.startPrank(user);
        vault.deposit(100 ether);
        uint256 assets = vault.withdraw(100 ether);
        vm.stopPrank();

        assertEq(assets, 100 ether);
        assertEq(asset.balanceOf(user), userBalanceBefore);
        assertEq(vault.balanceOf(user), 0);
        assertEq(vault.totalSupply(), 0);
    }

    function testRebalanceRevertsIfCallerIsNotAgent() external {
        vm.prank(user);
        vm.expectRevert(Vault.Vault__NotAgent.selector);
        vault.rebalance(uint8(Strategy.AggressiveLending), "Yield oportunity detected");
    }

    function testRebalanceEmitsWhenCalledByAgent() external {
        vm.prank(agent);
        vault.rebalance(uint8(Strategy.ConservativeLending), "Initial allocation");

        uint8 toStrategy = uint8(Strategy.AggressiveLending);
        string memory reason = "Yield opportunity detected";

        vm.expectEmit(true, true, false, true);
        emit Rebalanced(uint8(Strategy.ConservativeLending), toStrategy, vault.totalAssets(), reason);

        vm.prank(agent);
        vault.rebalance(toStrategy, reason);
    }

    function testRebalanceRevertsIfNewStrategyEqualsCurrentStrategy() external {
        vm.prank(agent);
        vault.rebalance(uint8(Strategy.ConservativeLending), "Initial allocation");

        uint8 toStrategy = uint8(Strategy.ConservativeLending);
        string memory reason = "Yield opportunity detected";

        vm.prank(agent);
        vm.expectRevert(Vault.Vault__SameStrategy.selector);
        vault.rebalance(toStrategy, reason);
    }

    function testRebalanceFromZeroStrategyToAnotherUpdatesCorrectly() external {
        uint8 toStrategy = uint8(Strategy.AggressiveLending);
        string memory reason = "Yield opportunity detected";

        assertEq(vault.s_currentStrategy(), uint8(Strategy.None));

        vm.prank(agent);
        vault.rebalance(toStrategy, reason);

        assertEq(vault.s_currentStrategy(), toStrategy);
    }

    function testRebalanceUpdatesCurrentStrategy() external {
        vm.prank(agent);
        vault.rebalance(uint8(Strategy.ConservativeLending), "Initial allocation");

        uint8 toStrategy = uint8(Strategy.AggressiveLending);
        string memory reason = "Yield opportunity detected";

        vm.prank(agent);
        vault.rebalance(toStrategy, reason);

        assertEq(vault.s_currentStrategy(), toStrategy);
    }

    function testRebalanceEventIncludesCorrectTotalAssetsSnapshot() external {
        vm.prank(user);
        vault.deposit(100 ether);

        uint8 fromStrategy = uint8(Strategy.None);
        uint8 toStrategy = uint8(Strategy.ConservativeLending);
        string memory reason = "Yield opportunity detected";

        vm.expectEmit(true, true, false, true);
        emit Rebalanced(fromStrategy, toStrategy, vault.totalAssets(), reason);

        vm.prank(agent);
        vault.rebalance(toStrategy, reason);
    }

    function testRebalanceEventIncludesCorrectReasonString() external {
        uint8 toStrategy = uint8(Strategy.AggressiveLending);
        string memory reason = "Oracle reports better yield elsewhere";

        vm.expectEmit(true, true, false, true);
        emit Rebalanced(uint8(Strategy.None), toStrategy, vault.totalAssets(), reason);

        vm.prank(agent);
        vault.rebalance(toStrategy, reason);
    }

    function testRebalanceDoesNotAffectUserShareBalances() external {
        vm.prank(user);
        vault.deposit(100 ether);

        uint8 toStrategy = uint8(Strategy.ConservativeLending);
        string memory reason = "Yield opportunity detected";

        vm.prank(agent);
        vault.rebalance(toStrategy, reason);

        assertEq(vault.balanceOf(user), 100 ether);
    }

    function testRebalanceDoesNotAffectTotalSupply() external {
        vm.prank(user);
        vault.deposit(100 ether); // Total supply is 100

        uint8 toStrategy = uint8(Strategy.ConservativeLending);
        string memory reason = "Yield opportunity detected";

        vm.prank(agent);
        vault.rebalance(toStrategy, reason);

        assertEq(vault.totalSupply(), 100 ether);
    }

    function testRebalanceDoesNotMoveVaultAssetBalance() external {
        vm.prank(user);
        vault.deposit(100 ether);

        uint8 toStrategy = uint8(Strategy.ConservativeLending);
        string memory reason = "Yield opportunity detected";

        vm.prank(agent);
        vault.rebalance(toStrategy, reason);

        assertEq(asset.balanceOf(address(vault)), 100 ether);
    }

    function testSetAgentRevertsIfNotCalledByOwner() external {
        address newAgent = makeAddr("newAgent");

        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user));
        vault.setAgent(newAgent);
    }

    function testNewAgentGetsSetCorrectly() external {
        address owner = address(this);
        address newAgent = makeAddr("newAgent");

        assertEq(vault.s_agent(), agent);

        vm.prank(owner);
        vault.setAgent(newAgent);

        assertEq(vault.s_agent(), newAgent);
    }

    function testSetAgentEmitsWhenNewAgentIsSet() external {
        address owner = address(this);
        address newAgent = makeAddr("newAgent");

        vm.expectEmit(true, true, false, false);
        emit AgentUpdated(agent, newAgent);

        vm.prank(owner);
        vault.setAgent(newAgent);
    }

    function testSetAgentRevertsIfAddressZero() external {
        address owner = address(this);
        address newAgent = address(0);

        vm.prank(owner);
        vm.expectRevert(Vault.Vault__ZeroAddress.selector);
        vault.setAgent(newAgent);
    }

    function testOldAgentCannotCallRebalanceAfterAgentIsUpdated() external {
        address newAgent = makeAddr("newAgent");

        vm.prank(address(this));
        vault.setAgent(newAgent);

        vm.prank(agent);
        vm.expectRevert(Vault.Vault__NotAgent.selector);
        vault.rebalance(uint8(Strategy.ConservativeLending), "Yield opportunity detected");

        vm.prank(newAgent);
        vault.rebalance(uint8(Strategy.ConservativeLending), "Yield opportunity detected");

        assertEq(vault.s_currentStrategy(), uint8(Strategy.ConservativeLending));
    }
}
