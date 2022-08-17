// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "./IdempotentPowerInvoker.sol";
import "./TokenProxyRegistryLike.sol";

//TODO: this needs to be tested properly
contract LimboAddTokenToBehodler is IdempotentPowerInvoker {
    struct Parameters {
        address soul;
        bool burnable;
        address limbo;
        address tokenProxyRegistry;
    }

    Parameters public params;

    constructor(
        address _angband,
        address limbo,
        address proxyRegistry
    ) IdempotentPowerInvoker("ADD_TOKEN_TO_BEHODLER", _angband) {
        params.limbo = limbo;
        params.tokenProxyRegistry = proxyRegistry;
    }

    function parameterize(address soul, bool burnable) public {
        require(
            msg.sender == params.limbo,
            "MORGOTH: Only Limbo can migrate tokens from Limbo."
        );
        params.soul = soul;
        params.burnable = burnable;
    }

    function orchestrate() internal override returns (bool) {
        Parameters memory localParams;
        address _lachesis = angband.getAddress(power.domain);
        address Scarcity = angband.getAddress("BEHODLER");
        require(
            localParams.soul != address(0),
            "MORGOTH: PowerInvoker not parameterized."
        );
        TokenProxyRegistryLike proxyRegistry = TokenProxyRegistryLike(
            localParams.tokenProxyRegistry
        );

        (, address behodlerProxy) = proxyRegistry.tokenProxy(localParams.soul);
        address tokenToRegister = behodlerProxy == address(0)
            ? localParams.soul
            : behodlerProxy;
        LachesisLike lachesis = LachesisLike(_lachesis);
        lachesis.measure(tokenToRegister, true, localParams.burnable);
        lachesis.updateBehodler(tokenToRegister);
        uint256 balanceOfToken = IERC20(localParams.soul).balanceOf(
            address(this)
        );
        require(balanceOfToken > 0, "MORGOTH: remember to seed contract");
        IERC20(localParams.soul).transfer(
            address(localParams.tokenProxyRegistry),
            balanceOfToken
        );
        proxyRegistry.TransferFromLimboTokenToBehodlerToken(localParams.soul);

        uint256 scxBal = IERC20(Scarcity).balanceOf(address(this));
        IERC20(Scarcity).transfer(localParams.limbo, scxBal);
        localParams.soul = address(0); // prevent non limbo from executing.
        params = localParams;
        return true;
    }
}
