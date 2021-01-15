pragma solidity 0.7.1;

abstract contract ERC20 {
    function balanceOf(address holder) external view virtual returns (uint256);

    function mint(address recipient, uint256 value) public virtual;

    function approve(address spender, uint256 amount) external virtual;

    function transferFrom(
        address sender,
        address recipient,
        uint256 value
    ) external virtual returns (bool);
}

contract MockLoomTokenSwap {
    ERC20 public oldToken;
    ERC20 public newToken;

    constructor(address _old, address _new) {
        oldToken = ERC20(_old);
        newToken = ERC20(_new);
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
