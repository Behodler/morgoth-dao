// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "../../openzeppelin/Ownable.sol";
import "../../facades/LachesisLike.sol";
import "../../facades/BehodlerLike.sol";

abstract contract FactoryFacade {
    mapping(address => mapping(address => address)) public getPair;
}

contract LachesisLite is Ownable, LachesisLike {
    struct tokenConfig {
        bool valid;
        bool burnable;
    }
    address public behodler;
    mapping(address => tokenConfig) private config;

    constructor(address _behodler) public {
        behodler = _behodler;
    }

    function cut(address token) public view returns (bool, bool) {
        tokenConfig memory parameters = config[token];
        return (parameters.valid, parameters.burnable);
    }

    function setBehodler(address b) public override {
        behodler = b;
    }

    function measure(
        address token,
        bool valid,
        bool burnable
    ) public override onlyOwner {
        _measure(token, valid, burnable);
    }

    function _measure(
        address token,
        bool valid,
        bool burnable
    ) internal {
        config[token] = tokenConfig({valid: valid, burnable: burnable});
    }

    function updateBehodler(address token) public override onlyOwner {
        (bool valid, bool burnable) = cut(token);
        BehodlerLike(behodler).setValidToken(token, valid, burnable);
    }
}
