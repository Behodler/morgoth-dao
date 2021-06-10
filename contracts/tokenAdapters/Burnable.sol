// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;

abstract contract Burnable {
    function burn (uint amount) public virtual;
    function burn (address holder, uint amount) public virtual;
}