// SPDX-License-Identifier: MIT
pragma solidity 0.7.1;
import "../../Behodler1Migration/ERC20.sol";

contract MockLoomTokenSwap {
    ERC20 public oldToken;
    ERC20 public newToken;

    constructor(address _old) {
        oldToken = ERC20(_old);
    }

    function setNewLoomToken(address _newToken) external {
        newToken = ERC20(_newToken);
    }

    /**
     * @notice Swaps all the old LOOM held by the caller to new LOOM.
     *         Emits Swap event if the swap is successful.
     */
    function swap() external virtual {
        uint256 balance = oldToken.balanceOf(msg.sender);
        oldToken.transferFrom(msg.sender, address(this), balance);
        newToken.mint(msg.sender, balance);
    }
}
