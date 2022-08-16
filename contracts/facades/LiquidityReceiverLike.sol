// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

abstract contract LiquidityReceiverLike {
    function baseTokenMapping(address baseToken)
        public
        view
        virtual
        returns (address);

    function registerPyroToken(address baseToken) public virtual;
}
