// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
import "./Powers.sol";
import "./Thangorodrim.sol";
import "./openzeppelin/Ownable.sol";

contract Angband is Empowered, Thangorodrim {
    Powers powers;

    constructor (address _powers) {
        powers = Powers (_powers);
        _setAddress("POWERS",_powers);
    }

    modifier ensureOwnershipReturned (address powerInvoker) {
        _;
        address ownable = getAddress(PowerInvoker(powerInvoker).power().domain());
        require(Ownable(ownable).owner()==address(this), "MORGOTH: power invoker failed to return ownership");
    }

    function setPowers(address _powers) public requiresPower(powers.WIRE_ANGBAND()) {
         powers = Powers (_powers);
        _setAddress(POWERS,_powers);
    }

    function setBehodler (address behodler, address lachesis) public requiresPower(powers.POINT_TO_BEHODLER()){
        _setAddress(BEHODLER,behodler);
        _setAddress(LACHESIS,lachesis);
    }

    function executePower(address powerInvoker, bytes32 minion) public ensureOwnershipReturned(powerInvoker) {
        PowerInvoker(powerInvoker).invoke(minion, msg.sender);
    }
}