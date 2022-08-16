// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

abstract contract LimboAddTokenToBehodlerLike {
    function parameterize(address soul, bool burnable) public virtual;
}

contract MockLimbo {
    LimboAddTokenToBehodlerLike power;

    function setPower(address p) public {
        power = LimboAddTokenToBehodlerLike(p);
    }

    function parameterizePower(address soul, bool burnable) public {
        power.parameterize(soul, burnable);
    }
}