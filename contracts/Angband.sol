// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
import "./Powers.sol";
import "./Thangorodrim.sol";
import "./openzeppelin/Ownable.sol";

contract Angband is Empowered, Thangorodrim {
    event EmergencyShutdownTriggered(address newOwner);
    uint256 emergencyCoolDownPeriod;
    address deployer;
    mapping(address => bool) public authorizedInvokers;

    constructor(
        address _powers,
        address behodler,
        address lachesis
    ) {
        powersRegistry = PowersRegistry(_powers);
        _setAddress("POWERREGISTRY", _powers);
        deployer = msg.sender;
        emergencyCoolDownPeriod = block.timestamp + 66 days;
        _setAddress(BEHODLER, behodler);
        _setAddress(LACHESIS, lachesis);
        initialized = true;
    }

    function finalizeSetup() public {
        _setAddress(ANGBAND, address(this));
    }

    modifier ensureOwnershipReturned(address powerInvoker) {
        _;
        (, bytes32 domain, , ) = PowerInvoker(powerInvoker).power();
        address ownable = getAddress(domain);

        require(
            ownable == address(this) ||
                Ownable(ownable).owner() == address(this),
            "MORGOTH: power invoker failed to return ownership"
        );
    }

    function authorizeInvoker(address invoker, bool authorized)
        public
        requiresPower(powersRegistry.AUTHORIZE_INVOKER())
    {
        authorizedInvokers[invoker] = authorized;
    }

    function setPowersRegistry(address _powers)
        public
        requiresPower(powersRegistry.WIRE_ANGBAND())
    {
        powersRegistry = PowersRegistry(_powers);
        _setAddress(POWERREGISTRY, _powers);
    }

    function mapDomain(address location, bytes32 domain)
        public
        requiresPower(powersRegistry.WIRE_ANGBAND())
    {
        _setAddress(domain, location);
    }

    function setBehodler(address behodler, address lachesis)
        public
        requiresPower(powersRegistry.POINT_TO_BEHODLER())
    {
        _setAddress(BEHODLER, behodler);
        _setAddress(LACHESIS, lachesis);
    }

    function executePower(address powerInvoker)
        public
        ensureOwnershipReturned(powerInvoker)
        requiresPowerOnInvocation(powerInvoker)
    {
        require(
            authorizedInvokers[powerInvoker],
            "MORGOTH: Invoker not whitelisted"
        );
        PowerInvoker invoker = PowerInvoker(powerInvoker);
        (, bytes32 domain, , ) = invoker.power();
        address domainContract = getAddress(domain);
        Ownable ownable = Ownable(domainContract);
        address self = address(this);
        require(
            domainContract == address(this) || ownable.owner() == address(this),
            "MORGOTH: Transfer domain to Angband before using it"
        );
        if (domainContract != self) ownable.transferOwnership(powerInvoker);
        bytes32 minion = powersRegistry.userMinion(msg.sender);
        PowerInvoker(powerInvoker).invoke(minion, msg.sender);
    }

    //temporary function to allow deployer to wrest control back from Angband in case of bugs or vulnerabilities
    function executeOrder66() public {
        require(msg.sender == deployer);
        require(
            block.timestamp <= emergencyCoolDownPeriod,
            "Emergency shutdown powers have expired. Angband is forever."
        );
        address behodler = getAddress(BEHODLER);
        address lachesis = getAddress(LACHESIS);

        Ownable(behodler).transferOwnership(deployer);
        Ownable(lachesis).transferOwnership(deployer);
        emit EmergencyShutdownTriggered(deployer);
    }
}
