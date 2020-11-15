// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;

interface BurnableERC20 {
    function transfer (address recipient, uint value) external returns (bool);
    function balanceOf(address holder) external returns (uint);
    function burn (uint amount) external;
}

import "../contracts/Powers.sol";
contract IronCrown is Empowered {   
    Powers powers;
    BurnableERC20 scx;
    struct Silmaril {
        uint16 percentage; //0-1000
        address exit;
    }

    uint8 public constant perpetualMining = 0;
    uint8 public constant burn = 1;
    uint8 public constant dev = 2;
    uint8 public constant treasury = 3;
    
    Silmaril[4] silmarils; 

    constructor (address _powers, address _scx) {
        powers = Powers(_powers);
        scx = BurnableERC20(_scx);
    }

    function settlePayments () public {
        uint balance = scx.balanceOf(address(this));
        if(balance ==0) return;
        for(uint8 i =0;i<4;i++){
            Silmaril memory silmaril = silmarils[i];
            uint share = (balance*silmaril.percentage)/1000;
            transferOrBurn(i,share);
        }
    }

    function setSilmaril (uint8 index, uint8 percentage, address exit) external requiresPower(powers.INSERT_SILMARIL()) {
        require(index<3, "MORGOTH: index out of bounds");
        settlePayments();
        silmarils[index].percentage = percentage;
        silmarils[index].exit = exit;
    }

    function transferOrBurn(uint8 index, uint amount) internal {
        if(index == burn)
        scx.burn(amount);
        else 
        scx.transfer(silmarils[index].exit,amount);
    }
}