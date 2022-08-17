// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

abstract contract TokenProxyRegistryLike {
    struct TokenConfig {
        address limboProxy;
        address behodlerProxy;
    }

    function tokenProxy(address baseToken)
        public
        virtual
        returns (address, address);

    function TransferFromLimboTokenToBehodlerToken(address token)
        public
        virtual
        returns (bool);
}
