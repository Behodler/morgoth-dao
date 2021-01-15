// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
import "./MockBehodler2.sol";
import "../../openzeppelin/Ownable.sol";

contract MockLachesis2 is Ownable {
    MockBehodler2 behodler;

    mapping (address=>bool) burnable;
    mapping(address=>bool) valid;

    function measure (address token, bool _valid, bool _burnable) public {
        burnable[token] = _burnable;
        valid[token] = _valid;
    }

    function setBehodler(address _b) public {
        behodler = MockBehodler2(_b);
    }

    function updateBehodler (address token) public {
        behodler.setValidToken(token, valid[token], burnable[token]);
    }
 }