// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
import "../testing/Migrator/MockLachesis2.sol";
import "../openzeppelin/Ownable.sol";

contract MassLachesis is Ownable {
    MockLachesis2 lachesis;
    constructor(address _lachesis){
        lachesis = MockLachesis2(_lachesis);
    }

    function measureAll() public onlyOwner {
        lachesis.measure(address(0x4575f41308EC1483f3d399aa9a2826d74Da13Deb),true, false);
        lachesis.measure(address(0x93ED3FBe21207Ec2E8f2d3c3de6e058Cb73Bc04d),true, false);
        lachesis.measure(address(0x4f5704D9D2cbCcAf11e70B34048d41A0d572993F),true, false);
        lachesis.measure(address(0x514910771AF9Ca656af840dff83E8264EcF986CA),true, false);
        lachesis.measure(address(0xaFEf0965576070D1608F374cb14049EefaD218Ec),true, true);
        lachesis.measure(address(0x42476F744292107e34519F9c357927074Ea3F75D),true, false);
        lachesis.measure(address(0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2),true, true);
        lachesis.measure(address(0x6B175474E89094C44Da98b954EedeAC495271d0F),true, false);
        lachesis.measure(address(0x155ff1A85F440EE0A382eA949f24CE4E0b751c65),true, true);
        lachesis.measure(address(0x890ff7533Ca0C44F33167FdEEeaB1cA7E690634F),true, false);
        lachesis.measure(address(0x319eAd06eb01E808C80c7eb9bd77C5d8d163AddB),true, false);
        lachesis.measure(address(0xF047ee812b21050186f86106f6cABDfEc35366c6),true, false);    
        Ownable(address(lachesis)).transferOwnership(msg.sender);
    }
}