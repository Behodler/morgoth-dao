// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
import "./DummyToken.sol";
import "./ScarcityBridge.sol";

/*
    Each step has to be completed in order. Each step is represented by a public function. 
    A step counter is incremented to prevent out of order step execution
    MIGRATION STEPS:
    1. ASSERT OWNERSHIP
        primary of Behodler1, Scarcity and Lachesis
        owner of Behodler2 and Lachesis
        assert that migrator is whitelisted on Behodler 2
    2. Disable tokens as array. Add token addresses to array
    3. For each token and in 1 transaction:
        3.1 add a new dummy token via lachesis
        3.2 swap in enough dummy to empty behodler of token
    4. For each token, enable on Lachesis2 and update Behodler2
    5. For each token, add liquidity on Behodler2
    6. Record total scx to ScarcityBridge, calculating conversion rate and burn SCX in hand.
    7. Transfer ownership of Behodler2 and Lachesis2 to Angband.
 */

abstract contract Secondary {
    function primary() public view virtual returns (address);
}

abstract contract Ownable {
    function owner() public view virtual returns (address);

    function transferOwnership(address newOwner) public virtual;
}

abstract contract Lachesis1 {
    function measure(address token, bool valid) external virtual;

    function cut(address token) external view virtual;
}

abstract contract Behodler1 {
    function buyScarcity(
        address tokenAddress,
        uint256 value,
        uint256 minPrice
    ) external virtual returns (uint256);

    function sellScarcity(
        address tokenAddress,
        uint256 value,
        uint256 maxPrice
    ) external virtual returns (uint256);
}

abstract contract Behodler2 {
    function addLiquidity(address inputToken, uint256 amount)
        public
        payable
        virtual;

    function withdrawLiquidity(address outputToken, uint256 tokensToRelease)
        public
        payable
        virtual;

    function whiteListUsers(address user) public virtual view returns (bool);
}

abstract contract Lachesis2 {
    function measure(
        address token,
        bool valid,
        bool burnable
    ) public virtual;

    function updateBehodler(address token) public virtual;
}

abstract contract ERC20 {
    function balanceOf(address holder) external view virtual returns (uint256);

    function mint(address recipient, uint256 value) public virtual;

    function approve(address spender, uint256 amount) external virtual;
}

contract Migrator {
    uint256 constant behodler1Factor = 128;
    uint8 stepCounter = 1;
    ScarcityBridge public bridge;
    struct version {
        address behodler;
        address scarcity;
        address lachesis;
    }

    address weidai;
    address eye;
    address angband;

    version public One;
    version public Two;
    address[] dummyTokens;
    address[] baseTokens;
    uint256[] baseBalances;
    uint256 tokenCount;
    uint256 step4Index;
    uint256 step6Index;

    constructor(
        address behodler1,
        address scarcity1,
        address lachesis1,
        address behodler2,
        address lachesis2,
        address _weidai,
        address _eye,
        address _angband
    ) {
        One.behodler = behodler1;
        One.scarcity = scarcity1;
        One.lachesis = lachesis1;

        Two.behodler = behodler2;
        Two.lachesis = lachesis2;

        weidai = _weidai;
        eye = _eye;
        angband = _angband;
    }

    function initBridge() public {
        bridge = new ScarcityBridge(One.scarcity, One.behodler, address(this));
    }

    modifier step(uint8 _step) {
        require(stepCounter == _step, "MIGRATION: Incorrect step.");
        _;
        stepCounter++;
    }

    function step1() public step(1) {
        address self = address(this);
        require(
            Secondary(One.behodler).primary() == self,
            "MIGRATION: behodler1 owner mismatch"
        );
        require(
            Secondary(One.scarcity).primary() == self,
            "MIGRATION: scarcity1 owner mismatch"
        );
        require(
            Secondary(One.lachesis).primary() == self,
            "MIGRATION: lachesis1 owner mismatch"
        );

        require(
            Ownable(Two.behodler).owner() == self,
            "MIGRATION: behodler2 owner mismatch"
        );
        require(
            Ownable(Two.lachesis).owner() == self,
            "MIGRATION: lachesis2 owner mismatch"
        );

        require(Behodler2(Two.behodler).whiteListUsers(address(this)),"MIGRATION: Ensure that the migration contract is whitelisted on Behodler.");
    }

    function step2(address[] calldata tokens) public step(2) {
        baseTokens = tokens;
        Lachesis1 lachesis = Lachesis1(One.lachesis);
        tokenCount = tokens.length;
        for (uint8 i = 0; i < tokens.length; i++) {
            lachesis.cut(tokens[i]); // checks that valid tokens have been passed in
            lachesis.measure(tokens[i], false);
        }
    }

    //add dummy tokens deploy
    function step3() public step(3) {
        for (uint8 i = 0; i < tokenCount; i++) {
            address token = address(new DummyToken());
            dummyTokens.push(token);
        }
    }

    //drain behodler1 of tokens
    function step4(uint256 iterations) public {
        require(stepCounter == 4, "MIGRATION: Incorrect step.");
        Lachesis1 lachesis = Lachesis1(One.lachesis);
        Behodler1 behodler = Behodler1(One.behodler);
        uint256 stop =
            step4Index + iterations > tokenCount
                ? tokenCount
                : step4Index + iterations;

        for (; step4Index < stop; step4Index++) {
            lachesis.measure(dummyTokens[step4Index], true);
            lachesis.measure(baseTokens[step4Index], true);
            uint256 tokenBalance =
                ERC20(baseTokens[step4Index]).balanceOf(One.behodler);
            baseBalances.push(tokenBalance);
            ERC20(dummyTokens[step4Index]).mint(address(this), tokenBalance);
            ERC20(dummyTokens[step4Index]).approve(One.behodler, uint256(-1));
            uint256 scxGenerated =
                behodler.buyScarcity(dummyTokens[step4Index], tokenBalance, 0);
            behodler.sellScarcity(baseTokens[step4Index], scxGenerated, 0);
            lachesis.measure(dummyTokens[step4Index], false);
            lachesis.measure(baseTokens[step4Index], false);
        }

        if (stop == tokenCount) stepCounter++;
    }

    //add tokens to Behodler2
    function step5() public step(5) {
        Lachesis2 lachesis = Lachesis2(Two.lachesis);
        for (uint8 i = 0; i < tokenCount; i++) {
            bool burnable = baseTokens[i] == weidai || baseTokens[i] == eye;
            lachesis.measure(baseTokens[i], true, burnable);
            lachesis.updateBehodler(baseTokens[i]);
        }
    }

    function step6(uint256 iterations) public{
        require(stepCounter == 6, "MIGRATION: Incorrect step.");
        uint256 stop = iterations + step6Index;
        stop = stop > tokenCount ? tokenCount : stop;
        Behodler2 behodler2 = Behodler2(Two.behodler);

        for (; step6Index < stop; step6Index++) {
            uint256 behodler1Balance = baseBalances[step6Index];
            behodler2.addLiquidity(baseTokens[step6Index],behodler1Balance);
        }
        if (step6Index == tokenCount - 1) {
            bridge.recordExchangeRate();
            stepCounter++;
        }
    }

    //transfer to angband
    function step7() public step(7) {
        Ownable(Two.behodler).transferOwnership(angband);
        Ownable(Two.lachesis).transferOwnership(angband);
    }

}
