// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
import "../Powers.sol";

interface IronCrownFacade {
    function setSilmaril(
        uint8 index,
        uint16 percentage,
        address exit
    ) external;
}

contract SetSilmarilPower is PowerInvoker {
    struct Parameters {
        uint8 index;
        uint16 percentage;
        address exit;
    }
    Parameters parameters;

    constructor(bytes32 _power, address _angband)
        PowerInvoker(_power, _angband)
    {}

    function parameterize(
        uint8 index,
        uint16 percentage,
        address exit
    ) public {
        parameters.exit = exit;
        parameters.percentage = percentage;
        parameters.index = index;
    }

    function orchestrate() internal override returns (bool) {
        IronCrownFacade ironCrown =
            IronCrownFacade(angband.getAddress(power.domain));
        ironCrown.setSilmaril(
            parameters.index,
            parameters.percentage,
            parameters.exit
        );
        return true;
    }
}
