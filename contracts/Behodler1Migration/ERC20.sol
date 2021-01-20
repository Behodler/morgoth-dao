// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;

abstract contract ERC20 {
    function balanceOf(address holder) external view virtual returns (uint256);

    function mint(address recipient, uint256 value) public virtual;

    function approve(address spender, uint256 amount) external virtual;
    
         function transferFrom(
        address sender,
        address recipient,
        uint256 value
    ) external virtual returns (bool) ;

    function transfer(address recipient, uint value) external virtual returns (bool);
}
