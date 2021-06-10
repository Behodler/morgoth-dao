// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
import "../../openzeppelin/Ownable.sol";
import "./MockScarcity.sol";
import "../../Behodler1Migration/ERC20.sol";
import "./MockWeth1.sol";

contract MockBehodler3 is Ownable {
    address public Weth;
    address public Lachesis;
    address public arbiter;

    constructor(address _weth) {
        Weth = _weth;
    }
    

    function setLachesis(address l) public {
        Lachesis = l;
    }

    function seed(
        address weth,
        address lachesis,
        address flashLoanArbiter,
        address _pyroTokenLiquidityReceiver,
        address weidaiReserve,
        address dai,
        address weiDai
    ) external onlyOwner {
        Weth = weth;
        Lachesis = lachesis;
        arbiter = flashLoanArbiter;
    }
}
