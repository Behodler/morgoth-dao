// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
import "../openzeppelin/Ownable.sol";

contract MockPyroToken {
    address public baseToken;
    address public liquidityReceiver;

    constructor(address _baseToken, address _liquidityReceiver) {
        baseToken = _baseToken;
        liquidityReceiver = _liquidityReceiver;
    }
}

contract MockLiquidityReceiver is Ownable {
    mapping(address => address) public baseTokenMapping;

    function registerPyroToken(address baseToken) public {
        require(
            baseTokenMapping[baseToken] == address(0),
            "BEHODLER: pyrotoken already registered"
        );
        MockPyroToken pyro = new MockPyroToken(baseToken, address(this));
        baseTokenMapping[baseToken] = address(pyro);
    }
}
