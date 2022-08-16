// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

abstract contract LachesisLike {
    function measure(
        address token,
        bool valid,
        bool burnable
    ) public virtual;

    function updateBehodler(address token) public virtual;

    function setBehodler(address b) public virtual;
}
