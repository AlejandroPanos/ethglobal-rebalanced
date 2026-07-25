// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

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
}
