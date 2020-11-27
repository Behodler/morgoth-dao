// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
import "./Powers.sol";
import "./Thangorodrim.sol";
import "./openzeppelin/Ownable.sol";

contract Angband is Empowered, Thangorodrim {
    event EmergencyShutdownTriggered(address newOwner);
    PowerRegistry powers;
    uint emergencyCoolDownPeriod;
    address deployer; 
    mapping (address=>bool) public authorizedInvokers;
    constructor (address _powers) {
        powers = PowerRegistry (_powers);
        _setAddress("POWERREGISTRY",_powers);
        deployer = msg.sender;
        emergencyCoolDownPeriod = block.timestamp + 66 days;
    }

    modifier ensureOwnershipReturned (address powerInvoker) {
        _;
        (,bytes32 domain,,) =  PowerInvoker(powerInvoker).power();
        address ownable = getAddress(domain);
        require(Ownable(ownable).owner()==address(this), "MORGOTH: power invoker failed to return ownership");
    }

    function authorizeInvoker (address invoker, bool authorized) public requiresPower(powers.AUTHORIZE_INVOKER()){
        authorizedInvokers[invoker] = authorized;
    }

    function setPowerRegistry(address _powers) public requiresPower(powers.WIRE_ANGBAND()) {
         powers = PowerRegistry (_powers);
        _setAddress(POWERREGISTRY,_powers);
    }

    function setBehodler (address behodler, address lachesis) public requiresPower(powers.POINT_TO_BEHODLER()){
        _setAddress(BEHODLER,behodler);
        _setAddress(LACHESIS,lachesis);
    }

    function executePower(address powerInvoker, bytes32 minion) public ensureOwnershipReturned(powerInvoker) requiresPowerOnInvocation(powerInvoker) {
        require(authorizedInvokers[powerInvoker], "MORGOTH: Invoker not whitelisted");
        PowerInvoker(powerInvoker).invoke(minion, msg.sender);
    }

    //temporary function to allow deployer to wrest control back from Angband in case of bugs or vulnerabilities
    function executeOrder66() public {
        require(msg.sender == deployer);
        require(block.timestamp<=emergencyCoolDownPeriod, "Emergency shutdown powers have expired. Angband is forever.");
        address behodler = getAddress(BEHODLER);
        address lachesis = getAddress(LACHESIS);

        Ownable(behodler).transferOwnership(deployer);
        Ownable(lachesis).transferOwnership(deployer);
        emit EmergencyShutdownTriggered(deployer);
    }
}