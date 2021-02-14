// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;

contract MockWeth1 {
    uint256 _totalSupply;
    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint256)) allowances;

    function deposit() external payable {
        _mint(msg.sender, msg.value);
    }

    function withdraw(uint256 value) external {
        _burn(msg.sender, value);
        address payable sender = msg.sender;
        (bool success, ) = sender.call{value: value}("");
        require(success, "Unwrapping failed.");
    }

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

    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: mint to the zero address");

        _totalSupply = _totalSupply + (amount);
        balances[account] = balances[account] + (amount);
    }

    /**
     * @dev Destoys `amount` tokens from `account`, reducing the
     * total supply.
     *
     * Emits a `Transfer` event with `to` set to the zero address.
     *
     * Requirements
     *
     * - `account` cannot be the zero address.
     * - `account` must have at least `amount` tokens.
     */
    function _burn(address account, uint256 value) internal {
        require(account != address(0), "ERC20: burn from the zero address");

        _totalSupply = _totalSupply - (value);
        balances[account] = balances[account] - (value);
    }
}
