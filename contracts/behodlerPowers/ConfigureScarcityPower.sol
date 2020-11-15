// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
import "../Powers.sol";

abstract contract Scarcity {
    function configureScarcity(
        uint transferFee,
        uint burnFee,
        address feeDestination
    ) public virtual;
}

contract ConfigureScarcityPower is PowerInvoker {

    uint transferFee;
    uint burnFee;
    address feeDestination;
    constructor (address _power, address _angband) PowerInvoker(_power,_angband) {}

    function parameterize (uint _transferFee,uint _burnFee,address _feeDestination) public {
            transferFee=_transferFee;
            burnFee = _burnFee;
            feeDestination = _feeDestination;
    }

    function orchestrate() internal override returns (bool){
        address scarcity = angband.getAddress(power.domain());
        Scarcity scx = Scarcity(scarcity);
        scx.configureScarcity(transferFee,burnFee,feeDestination);
        return true;
    }
}