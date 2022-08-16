// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "../openzeppelin/IERC20.sol";

abstract contract FlanLike is IERC20 {
    function mint(address _to, uint256 _amount)
        public
        virtual
        returns (bool success);

    function burn(uint256 _amount) public virtual returns (bool success);
}
