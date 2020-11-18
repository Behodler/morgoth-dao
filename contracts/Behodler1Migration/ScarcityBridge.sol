// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;

abstract contract IERC20 {
    function totalSupply() external virtual returns(uint);
    function transferFrom(address sender, address recipient, uint value) external virtual returns (bool);
}

abstract contract SCX {
    function burn(uint256 value) external virtual returns (bool);
    function migrateMint(address recipient, uint value) public  virtual;
}

contract ScarcityBridge{
    struct ScarcityTotals{
        uint total_v1;
        uint total_v2;
        uint blockRecorded;
        address scarcity1;
        address scarcity2;
    }
    uint public exchangeRate; //also represents the minimum old SCX required to get 1 unit of new SCX 
    ScarcityTotals public totals;
    address migrator;

    constructor(address scarcity1, address scarcity2, address _migrator) {
        totals.scarcity1 = scarcity1;
        totals.scarcity2 = scarcity2;
        migrator = _migrator;
    }
    
    function recordExchangeRate() public {
        require(msg.sender == migrator);
        totals.total_v1 = IERC20(totals.scarcity1).totalSupply();
        totals.total_v2 = IERC20(totals.scarcity2).totalSupply();
        exchangeRate = totals.total_v1/totals.total_v2;
        totals.blockRecorded = block.number;
    }

    function swap(uint v1SCX) public {
        require(IERC20(totals.scarcity1).transferFrom(msg.sender, address(this),v1SCX), "SCX BRIDGE: transfer failed.");
        uint newSCX = v1SCX/exchangeRate;
        require(newSCX>0, "SCX BRIDGE: insufficient SCX sent.");
        SCX(totals.scarcity1).burn(v1SCX);
        SCX(totals.scarcity2).migrateMint(msg.sender,newSCX);
    }
    
}