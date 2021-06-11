// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
interface BehodlerLike {
        function addLiquidity(address inputToken, uint256 amount)
        external
        virtual
        payable
        returns (uint256 deltaSCX)  ;
}