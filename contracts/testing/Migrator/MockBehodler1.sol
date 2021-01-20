// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
import "./Secondary.sol";
import "./MockScarcity.sol";
import "./MockLachesis1.sol";
import "../../Behodler1Migration/ERC20.sol";

contract MockBehodler1 is Secondary{
    MockScarcity scarcity;
    MockLachesis1 lachesis;
    constructor (address scx, address _lachesis) {
        scarcity = MockScarcity(scx);
        lachesis = MockLachesis1(_lachesis);
    }

    function buyScarcity(address tokenAddress, uint value, uint minPrice) external returns (uint){
		lachesis.cut(tokenAddress);
        ERC20(tokenAddress).transferFrom(msg.sender,address(this),value);
        scarcity.mint(msg.sender,value*10000);
        return value*10000;
	}

	function sellScarcity(address tokenAddress, uint value, uint maxPrice) external returns (uint){
		ERC20(tokenAddress).transfer(msg.sender,value/10000);
        scarcity.transferFrom(msg.sender, address(this), value);
	}
}