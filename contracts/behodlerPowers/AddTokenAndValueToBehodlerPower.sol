// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
import "../Powers.sol";
import "./LachesisFacade.sol";
import "../openzeppelin/IERC20.sol";

interface BehodlerLike {
        function addLiquidity(address inputToken, uint256 amount)
        external
        virtual
        payable
        returns (uint256 deltaSCX)  ;
}

contract AddTokenAndValueToBehodlerPower is PowerInvoker {
    address token;
    bool burnable;
    address behodler;
    address rewardContract;

    constructor(
        address _token,
        bool _burnable,
        address _angband,
        address _rewardContract,
        address _behodler
    ) PowerInvoker("ADD_TOKEN_TO_BEHODLER", _angband) {
        token = _token;
        burnable = _burnable;
        behodler = _behodler;
        rewardContract = _rewardContract;
    }

    function orchestrate() internal override returns (bool) {
        address _lachesis = angband.getAddress(power.domain);
        LachesisFacade lachesis = LachesisFacade(_lachesis);
        lachesis.measure(token, true, burnable);
        lachesis.updateBehodler(token);
        uint balanceOfToken = IERC20(token).balanceOf(address(this));
        require(balanceOfToken>0, "remember to seed contract");
        BehodlerLike(behodler).addLiquidity(token,balanceOfToken);
        uint scxBal = IERC20(behodler).balanceOf(address(this));
        IERC20(behodler).transfer(rewardContract,scxBal);
        return true;
    }
}
