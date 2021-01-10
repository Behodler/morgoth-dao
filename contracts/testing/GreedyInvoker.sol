// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
import "../Powers.sol";
import "../openzeppelin/Ownable.sol";

contract fakeOwner {
    function owner() public view returns (address){
        return address(this);
    }

    function transferOwnership (address newOwner) public  {

    }
}

abstract contract PowerInvokerNoReturn is fakeOwner {
    event PowerInvoked (address user, bytes32 minion, bytes32 domain);
    
    Power public power;
    PowersRegistry public registry;
    Angband public angband;
    bool invoked;

    constructor (bytes32 _power, address _angband) {
        angband = Angband(_angband);
        address _registry = angband.getAddress(angband.POWERREGISTRY());
        registry = PowersRegistry(_registry);
        (bytes32 name, bytes32 domain,bool transferrable, bool unique) = registry.powers(_power);
        power = Power(name,domain,transferrable,unique);
    }

    function destruct () public{
        require(invoked, "awaiting invocation");
        selfdestruct(msg.sender);
    }

    function orchestrate() internal virtual returns (bool);

    function invoke(bytes32 minion, address sender) public{
        // require(msg.sender == address(angband),"MORGOTH: angband only");
        // require(registry.isUserMinion(sender, minion), "MORGOTH: Invocation by minions only.");
        // require(!invoked, "MORGOTH: Power cannot be invoked.");
        // require(orchestrate(), "MORGOTH: Power invocation");
        // invoked = true;
        // emit PowerInvoked(sender, minion, power.domain);
    }
}

contract ThirdParty is Ownable{

}

contract GreedyInvoker is PowerInvokerNoReturn{
    constructor (bytes32 _power, address _angband) PowerInvokerNoReturn(_power,_angband) {
    }

    function orchestrate() internal override returns (bool) {
      return true;
    }
}