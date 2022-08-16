// File: contracts/openzeppelin/IERC20.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "../../openzeppelin/Ownable.sol";
import "../../facades/BehodlerLike.sol";
import "./LachesisLite.sol";
import "../../openzeppelin/IERC20.sol";

/**
 * @dev Wrappers over Solidity's arithmetic operations with added overflow
 * checks.
 *
 * Arithmetic operations in Solidity wrap on overflow. This can easily result
 * in bugs, because programmers usually assume that an overflow raises an
 * error, which is the standard behavior in high level programming languages.
 * `SafeMath` restores this intuition by reverting the transaction when an
 * operation overflows.
 *
 * Using this library instead of the unchecked operations eliminates an entire
 * class of bugs, so it's recommended to use it always.
 */
library SafeMath {
    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     *
     * - Addition cannot overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return sub(a, b, "SafeMath: subtraction overflow");
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;

        return c;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `*` operator.
     *
     * Requirements:
     *
     * - Multiplication cannot overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return div(a, b, "SafeMath: division by zero");
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts with custom message on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        require(b > 0, errorMessage);
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return mod(a, b, "SafeMath: modulo by zero");
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts with custom message when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        require(b != 0, errorMessage);
        return a % b;
    }
}

abstract contract ERC20MetaData {
    function symbol() public virtual returns (string memory);

    function name() public virtual returns (string memory);
}

contract Pyrotoken is IERC20 {
    event Mint(
        address minter,
        address baseToken,
        address pyroToken,
        uint256 redeemRate
    );
    event Redeem(
        address redeemer,
        address baseToken,
        address pyroToken,
        uint256 redeemRate
    );

    using SafeMath for uint256;
    uint256 _totalSupply;
    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint256)) allowances;
    address public baseToken;
    uint256 constant ONE = 1e18;
    RealLiquidityReceiver liquidityReceiver;

    constructor(address _baseToken, address _liquidityReceiver) {
        baseToken = _baseToken;
        name = string(
            abi.encodePacked("Pyro", ERC20MetaData(baseToken).name())
        );
        symbol = string(
            abi.encodePacked("p", ERC20MetaData(baseToken).symbol())
        );
        decimals = 18;
        liquidityReceiver = RealLiquidityReceiver(_liquidityReceiver);
    }

    string public name;
    string public symbol;
    uint8 public override decimals;

    modifier updateReserve() {
        liquidityReceiver.drain(address(this));
        _;
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
        return true;
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
        return true;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external override returns (bool) {
        require(
            allowances[sender][recipient] >= amount,
            "ERC20: not approved to send"
        );
        _transfer(sender, recipient, amount);
        return true;
    }

    function mint(uint256 baseTokenAmount)
        external
        updateReserve
        returns (uint256)
    {
        uint256 rate = redeemRate();
        uint256 pyroTokensToMint = baseTokenAmount.mul(ONE).div(rate);
        require(
            IERC20(baseToken).transferFrom(
                msg.sender,
                address(this),
                baseTokenAmount
            ),
            "PYROTOKEN: baseToken transfer failed."
        );
        mint(msg.sender, pyroTokensToMint);
        emit Mint(msg.sender, baseToken, address(this), rate);
        return pyroTokensToMint;
    }

    function redeem(uint256 pyroTokenAmount)
        external
        updateReserve
        returns (uint256)
    {
        //no approval necessary
        balances[msg.sender] = balances[msg.sender].sub(
            pyroTokenAmount,
            "PYROTOKEN: insufficient balance"
        );
        uint256 rate = redeemRate();
        _totalSupply = _totalSupply.sub(pyroTokenAmount);
        uint256 exitFee = pyroTokenAmount.mul(2).div(100); //2% burn on exit pushes up price for remaining hodlers
        uint256 net = pyroTokenAmount.sub(exitFee);
        uint256 baseTokensToRelease = rate.mul(net).div(ONE);
        IERC20(baseToken).transfer(msg.sender, baseTokensToRelease);
        emit Redeem(msg.sender, baseToken, address(this), rate);
        return baseTokensToRelease;
    }

    function redeemRate() public view returns (uint256) {
        uint256 balanceOfBase = IERC20(baseToken).balanceOf(address(this));
        if (_totalSupply == 0 || balanceOfBase == 0) return ONE;

        return balanceOfBase.mul(ONE).div(_totalSupply);
    }

    function mint(address recipient, uint256 amount) internal {
        balances[recipient] = balances[recipient].add(amount);
        _totalSupply = _totalSupply.add(amount);
    }

    function burn(uint256 amount) public {
        balances[msg.sender] = balances[msg.sender].sub(amount);
        _totalSupply = _totalSupply.sub(amount);
    }

    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal {
        uint256 burnFee = amount.div(1000); //0.1%
        balances[recipient] = balances[recipient].add(amount - burnFee);
        balances[sender] = balances[sender].sub(amount);
        _totalSupply = _totalSupply.sub(burnFee);
        emit Transfer(sender, recipient, amount);
    }
}

contract RealLiquidityReceiver is Ownable {
    LachesisLite lachesis;
    mapping(address => address) public baseTokenMapping;

    constructor(address _lachesis) {
        lachesis = LachesisLite(_lachesis);
    }

    function setLachesis(address _lachesis) public onlyOwner {
        lachesis = LachesisLite(_lachesis);
    }

    function registerPyroToken(address baseToken) public {
        require(
            baseTokenMapping[baseToken] == address(0),
            "BEHODLER: pyrotoken already registered"
        );
        (bool valid, bool burnable) = lachesis.cut(baseToken);
        require(valid && !burnable, "invalid pyrotoken registration.");
        Pyrotoken pyro = new Pyrotoken(baseToken, address(this));
        baseTokenMapping[baseToken] = address(pyro);
    }

    function drain(address pyroToken) public {
        address baseToken = Pyrotoken(pyroToken).baseToken();
        require(
            baseTokenMapping[baseToken] == pyroToken,
            "BEHODLER: pyrotoken not registered."
        );
        address self = address(this);
        uint256 balance = IERC20(baseToken).balanceOf(self);
        IERC20(baseToken).transfer(pyroToken, balance);
    }
}
