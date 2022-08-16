// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "../openzeppelin/IERC20.sol";

abstract contract PyrotokenLike is IERC20 {
    function mint(uint256 baseTokenAmount) external virtual returns (uint256);

    function baseToken() public virtual returns (address);
}
