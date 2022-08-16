// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "../Powers.sol";

contract DummyInvoker is PowerInvoker{
    constructor (bytes32 _power, address _angband) PowerInvoker(_power,_angband) {
    }

    function orchestrate() internal override returns (bool) {
      return true;
    }
}