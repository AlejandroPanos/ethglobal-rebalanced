// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title Vault
/// @author Alejandro Paños Jimenez
/// @notice Holds user deposits and lets an authorized off-chain agent record strategy changes.
contract Vault is ERC20, Ownable {
    using SafeERC20 for ERC20;

    /*//////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////*/

    /// @dev Thrown when a caller other than `s_agent` calls an agent-only function.
    error Vault__NotAgent();
    /// @dev Thrown when `deposit` or `withdraw` is called with a zero amount.
    error Vault__ZeroAmount();
    /// @dev Thrown when `withdraw` is called for more shares than the caller holds.
    error Vault__InsufficientShares();
    /// @dev Thrown when `rebalance` is called with the strategy id already active.
    error Vault__SameStrategy();
    /// @dev Thrown when owner tries to set agent to address(0)
    error Vault__ZeroAddress();

    /*//////////////////////////////////////////////////////////
                              MODIFIERS
    //////////////////////////////////////////////////////////*/

    /// @dev Restricts a function to be called only by the current agent address.
    modifier onlyAgent() {
        if (msg.sender != s_agent) {
            revert Vault__NotAgent();
        }
        _;
    }

    /*//////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////*/

    /// @notice Emitted when a user deposits assets and receives shares.
    /// @param user The depositor.
    /// @param assets The amount of underlying asset deposited.
    /// @param shares The amount of vault shares minted to the user.
    event Deposited(address indexed user, uint256 indexed assets, uint256 indexed shares);

    /// @notice Emitted when a user burns shares and withdraws assets.
    /// @param user The withdrawer.
    /// @param shares The amount of vault shares burned.
    /// @param assets The amount of underlying asset returned to the user.
    event Withdrawn(address indexed user, uint256 indexed shares, uint256 indexed assets);

    /// @notice Emitted when the agent records a strategy change.
    /// @param fromStrategy The strategy id the vault is moving away from.
    /// @param toStrategy The strategy id the vault is moving into.
    /// @param totalAssetsAtRebalance Snapshot of `totalAssets()` at the moment of rebalance.
    /// @param reason Human-readable explanation of why the agent made this decision.
    event Rebalanced(
        uint8 indexed fromStrategy, uint8 indexed toStrategy, uint256 totalAssetsAtRebalance, string reason
    );

    /// @notice Emitted when the owner rotates the authorized agent address.
    /// @param oldAgent The previous agent address.
    /// @param newAgent The new agent address.
    event AgentUpdated(address indexed oldAgent, address indexed newAgent);

    /*//////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////*/

    /// @notice The underlying ERC20 asset held and accounted for by the vault.
    IERC20 public immutable i_asset;

    /// @notice The address authorized to call `rebalance` (the off-chain agent's wallet).
    address public s_agent;

    /// @notice Identifier of the strategy the vault is currently allocated to.
    uint8 public s_currentStrategy;

    /*//////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////*/

    /// @notice Deploys the vault for a given underlying asset and initial agent.
    /// @param asset The ERC20 token this vault will accept deposits in.
    /// @param agent The address initially authorized to call `rebalance`.
    constructor(address asset, address agent) ERC20("Vault Share", "VS") Ownable(msg.sender) {
        i_asset = IERC20(asset);
        s_agent = agent;
    }

    /*//////////////////////////////////////////////////////////
                          EXTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////*/

    /// @notice Deposits the underlying asset and mints vault shares to the caller.
    /// @dev Shares are priced against assets held BEFORE this deposit, matching standard
    ///      vault share accounting (the same approach OpenZeppelin's ERC4626 uses).
    /// @param assets The amount of underlying asset to deposit.
    /// @return shares The amount of vault shares minted to the caller.
    function deposit(uint256 assets) external returns (uint256 shares) {
        if (assets == 0) {
            revert Vault__ZeroAmount();
        }

        shares = _convertToShares(assets);

        i_asset.safeTransferFrom(msg.sender, address(this), assets);
        _mint(msg.sender, shares);

        emit Deposited(msg.sender, assets, shares);
    }

    /// @notice Burns vault shares and returns the underlying asset to the caller.
    /// @param shares The amount of vault shares to burn.
    /// @return assets The amount of underlying asset returned to the caller.
    function withdraw(uint256 shares) external returns (uint256 assets) {
        if (shares == 0) {
            revert Vault__ZeroAmount();
        }

        if (balanceOf(msg.sender) < shares) {
            revert Vault__InsufficientShares();
        }

        assets = _convertToAssets(shares);

        _burn(msg.sender, shares);
        i_asset.safeTransfer(msg.sender, assets);

        emit Withdrawn(msg.sender, shares, assets);
    }
}
