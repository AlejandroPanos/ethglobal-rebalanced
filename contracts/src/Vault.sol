// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Vault is ERC20, Ownable {
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
