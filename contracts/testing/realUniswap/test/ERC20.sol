// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.7.1;
import '../UniswapV2ERC20.sol';

contract ERC20 is UniswapV2ERC20 {
    constructor(uint _totalSupply) public {
        _mint(msg.sender, _totalSupply);
    }
}
