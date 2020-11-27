// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
import "../Powers.sol";

abstract contract Lachesis{

    function measure(
        address token,
        bool valid,
        bool burnable
    ) public virtual;

    function updateBehodler(address token) public virtual;
}

contract AddTokenToBehodlerPower is PowerInvoker{
    address token;
    bool burnable;

    constructor (address _token, bool _burnable, bytes32 _power, address _angband) PowerInvoker(_power,_angband) {
        token = _token;
        burnable = _burnable;
    }

    function orchestrate() internal override returns (bool) {
        address _lachesis = angband.getAddress(power.domain);
        Lachesis lachesis = Lachesis(_lachesis);
        lachesis.measure(token,true,burnable);
        lachesis.updateBehodler(token);
        return true;
    }
}