// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
import "./Secondary.sol";

contract MockScarcity is Secondary {
    uint256 public totalSupply;
    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint256)) approvals;

    function balanceOf(address holder) external view returns (uint256) {
        return balances[holder];
    }

    function mint(address recipient, uint256 value) public {
        balances[recipient] += value;
        totalSupply += value;
    }

    function burn(uint256 value) public {
        balances[msg.sender] -= value;
        totalSupply -= value;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 value
    ) external returns (bool) {
        require(
            approvals[sender][recipient] >= value,
            "ERC20: approval failed"
        );
        require(balances[sender] >= value, "ERC20: insufficient funds.");
        balances[sender] -= value;
        balances[recipient] += value;
        return true;
    }

    function approve(address spender, uint256 amount) external {
        approvals[msg.sender][spender] = amount;
    }
}
