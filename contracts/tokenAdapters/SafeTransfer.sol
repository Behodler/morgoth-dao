// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
import "./IAdapter.sol";
import "./Burnable.sol";
import "../openzeppelin/IERC20.sol";
import "../openzeppelin/SafeMath.sol";

/*
    For tokens that either imlement an older form of ERC20 or do not implement it correctly.
    For instance, BAT does not revert on faild transfer, opening Behodler up to fake transfers.
*/

contract SafeTransfer is IAdapter {
    using SafeMath for uint256;

    enum BurnType {
        trueBurnSingular, //burn(amount)
        trueBurnDelegate, //burn(holder,amount)
        blackHoleBurn, //for a token which violates the Pyrotoken contract but has no burn functionality
        pyroToken
    }
    BurnType burnType;

    constructor(
        address token,
        address _behodler,
        address _liquidityReceiver,
        BurnType _burntype,
        string memory _name,
        string memory _symbol
    ) {
        baseToken = token;
        liquidityReceiver = _liquidityReceiver;
        burnType = _burntype;
        behodler = _behodler;
        name = _name;
        symbol = _symbol;
    }

    address liquidityReceiver;
    address behodler;
    address public override baseToken;

    uint256 _totalSupply;
    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint256)) allowances;

    string public name;
    string public symbol;

    function setSupply(uint256 supply) public {
        _totalSupply = supply;
    }

    function decimals() public override returns (uint8) {
        return 18;
    }

    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account)
        external
        view
        override
        returns (uint256)
    {
        return balances[account];
    }

    function transfer(address recipient, uint256 amount)
        external
        override
        returns (bool)
    {
        _transfer(msg.sender, recipient, amount);
    }

    function allowance(address owner, address spender)
        external
        view
        override
        returns (uint256)
    {
        return allowances[owner][spender];
    }

    function approve(address spender, uint256 amount)
        external
        override
        returns (bool)
    {
        allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external override returns (bool) {
        require(
            sender == behodler || allowances[sender][recipient] >= amount,
            "ERC20: not approved to send"
        );
        _transfer(sender, recipient, amount);
        return true;
    }

    function mint(address recipient, uint256 amount) public {
        balances[recipient] = balances[recipient].add(amount);
        _totalSupply = _totalSupply.add(amount);
    }

    function burn(uint256 amount) external override {
        if (burnType == BurnType.trueBurnSingular) {
            Burnable(baseToken).burn(amount);
        } else if (burnType == BurnType.trueBurnDelegate) {
            Burnable(baseToken).burn(msg.sender, amount);
        } else if (burnType == BurnType.blackHoleBurn) {
            // MinERC20(baseToken).transfer()
        }
    }

    // function burn(uint256 amount) public {
    //     balances[msg.sender] = balances[msg.sender].sub(amount);
    //     _totalSupply = _totalSupply.sub(amount);
    // }

    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal returns (bool) {
        balances[recipient] = balances[recipient].add(amount);
        balances[sender] = balances[sender].sub(amount);
        emit Transfer(sender, recipient, amount);
    }
}
