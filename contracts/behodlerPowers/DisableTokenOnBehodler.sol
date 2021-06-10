// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
import "../Powers.sol";
import "./LachesisFacade.sol";

abstract contract Lachesis {
    function measure(
        address token,
        bool valid,
        bool burnable
    ) public virtual;

    function updateBehodler(address token) public virtual;
}

contract DisableTokenOnBehodler is PowerInvoker {
    address token;

    constructor(
        address _token,
        address _angband
    ) PowerInvoker("ADD_TOKEN_TO_BEHODLER", _angband) {
        token = _token;
    }

    function orchestrate() internal override returns (bool) {
        address _lachesis = angband.getAddress(power.domain);
        LachesisFacade lachesis = LachesisFacade(_lachesis);
        lachesis.measure(token, false, false);
        lachesis.updateBehodler(token);
        return true;
    }
}
