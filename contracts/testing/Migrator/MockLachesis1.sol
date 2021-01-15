// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
import "./Secondary.sol";

contract MockLachesis1{
mapping (address => bool) public tokens;

	function measure (address token, bool valid) external {
		tokens[token] = valid;
	}

	function cut(address token) external view {
		require(tokens[token],"invalid token.");
	}
}