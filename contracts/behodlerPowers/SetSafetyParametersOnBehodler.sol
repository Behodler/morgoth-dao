// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
import "../Powers.sol";

abstract contract Behodler {
     function setSafetParameters(
        uint8 swapPrecisionFactor,
        uint8 maxLiquidityExit
    ) external virtual;
}

contract SetSafetyParametersOnBehodler is PowerInvoker {

    constructor(address _angband)
        PowerInvoker("CONFIGURE_SCARCITY", _angband)
    {}

    function orchestrate() internal override returns (bool) {

        address b = angband.getAddress(power.domain);
        Behodler behodler = Behodler(b);
        behodler.setSafetParameters(30,40);
        return true;
    }
}
