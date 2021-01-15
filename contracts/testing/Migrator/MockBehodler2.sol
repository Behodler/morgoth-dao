// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
import "../../openzeppelin/Ownable.sol";

abstract contract ERC20 {
    function transferFrom(
        address sender,
        address recipient,
        uint256 value
    ) external virtual returns (bool);

    function transfer(address recipient, uint256 value)
        external
        virtual
        returns (bool);
}

contract MockBehodler2 is Ownable {
    address lachesis;
    uint256 public totalSupply;
    mapping(address => uint256) balances;

    function setLachesis(address l) public {
        lachesis = l;
    }

    mapping(address => bool) burnable;
    mapping(address => bool) valid;
    mapping(address => bool) public whiteListUsers;

    function setValidToken(
        address token,
        bool _valid,
        bool _burnable
    ) public {
        require(msg.sender == lachesis, "Only lachesis");
        burnable[token] = _burnable;
        valid[token] = _valid;
    }

    function addLiquidity(address inputToken, uint256 amount) public payable {
        ERC20(inputToken).transferFrom(msg.sender, address(this), amount);
        balances[msg.sender] += amount * 2;
        totalSupply += amount * 2;
    }

    function withdrawLiquidity(address outputToken, uint256 tokensToRelease)
        public
        payable
    {
        require(
            balances[msg.sender] >= tokensToRelease / 2,
            "Scarcity: insufficient funds"
        );
        balances[msg.sender] -= tokensToRelease / 2;
        totalSupply -= tokensToRelease / 2;
        ERC20(outputToken).transfer(msg.sender, tokensToRelease);
    }

    function setWhiteListUsers(address user, bool whitelisted) public {
        whiteListUsers[user] = whitelisted;
    }
}
