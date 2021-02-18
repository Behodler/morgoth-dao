// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;

contract MockToken {
    string public constant name = "NEW LOOM";
    string public constant symbol = "LOOMY";
    uint256 _totalSupply;
    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint256)) allowances;

    function setSupply(uint256 supply) public {
        _totalSupply = supply;
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }

    function transfer(address recipient, uint256 amount)
        external
        returns (bool)
    {
        _transfer(msg.sender, recipient, amount);
    }

    function allowance(address owner, address spender)
        external
        view
        returns (uint256)
    {
        return allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowances[msg.sender][spender] = amount;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool) {
        require(
            allowances[sender][recipient] >= amount,
            "ERC20: not approved to send"
        );
        _transfer(sender, recipient, amount);
    }

    function mint(address recipient, uint256 amount) public {
        balances[recipient] = add(balances[recipient], amount);
        _totalSupply = add(_totalSupply, amount);
    }

    function burn(uint256 amount) public {
        balances[msg.sender] = sub(balances[msg.sender], amount);
        _totalSupply = sub(_totalSupply, amount);
    }

    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal returns (bool) {
        balances[recipient] = add(balances[recipient], amount);
        balances[sender] = sub(balances[sender], amount);
    }

    function sub(uint256 LHS, uint256 RHS) internal pure returns (uint256) {
        require(LHS >= RHS, "DummyToken: subtraction underflow");
        return LHS - RHS;
    }

    function add(uint256 LHS, uint256 RHS) internal pure returns (uint256) {
        require(LHS + RHS >= LHS, "DummyToken: addition overflow");
        return LHS + RHS;
    }
}
