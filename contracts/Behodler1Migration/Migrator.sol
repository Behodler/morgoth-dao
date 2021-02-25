// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
import "./DummyToken.sol";
import "./ScarcityBridge.sol";
import "./ERC20.sol";

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

abstract contract SecondaryFacade {
    function primary() public view virtual returns (address);

    function transferPrimary(address recipient) public virtual;
}

abstract contract OwnableFacade {
    function owner() public view virtual returns (address);

    function transferOwnership(address newOwner) public virtual;
}

abstract contract Lachesis1 {
    function measure(address token, bool valid) external virtual;

    function cut(address token) external view virtual;
}

abstract contract LiquidityReceiverFacade {
    function registerPyroToken(address baseToken) public virtual;
}

abstract contract Weth1 {
    function withdraw(uint256 value) external virtual;
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

    function whiteListUsers(address user) public view virtual returns (bool);

    function setMigrator(address m) public virtual;

    function Weth() public virtual returns (address);
}

abstract contract Lachesis2 {
    function measure(
        address token,
        bool valid,
        bool burnable
    ) public virtual;

    function updateBehodler(address token) public virtual;
}

abstract contract LoomTokenSwap {
    ERC20 public oldToken;
    ERC20 public newToken;

    /**
     * @notice Swaps all the old LOOM held by the caller to new LOOM.
     *         Emits Swap event if the swap is successful.
     */
    function swap() external virtual;

    function setNewLoomToken(address _newToken) external virtual;
}

//Mainnet Loom 0x42476F744292107e34519F9c357927074Ea3F75D
//Loom Token Swap: 0x7711863244783348Ae78c2BDebb9802b297DCE56
contract Migrator {
    event bailOnMigration(uint8 step);
    event verifyOwnership(
        uint256 step,
        address behodler1,
        address scarcity1,
        address lachesis1,
        address behodler2,
        address lachesis2
    );
    event disableBehodler1(uint256 step);
    event addDummyTokens(uint256 step);
    event drainBehodler1(uint256 step);
    event addTokensToLachesis2(uint256 step);
    event addTokensAsLiquidity(uint256 step, uint256 scxExchangeRate);
    event transferOwnershipToAngband(uint256 step, address angband);

    uint8 public stepCounter = 1;
    ScarcityBridge public bridge;
    struct version {
        address behodler;
        address scarcity;
        address lachesis;
        address weth;
    }

    address weidai;
    address eye;
    address angband;
    address deployer;
    LiquidityReceiverFacade liquidityReceiver;
    LoomTokenSwap loomSwap;

    version public One;
    version public Two;
    address[] dummyTokens;
    address[] baseTokens;
    uint256[] baseBalances;
    uint256 tokenCount;
    uint256 step4Index;
    uint256 step5Index;
    uint256 step6Index;

    receive() external payable {}

    constructor(
        address behodler1,
        address scarcity1,
        address lachesis1,
        address behodler2,
        address lachesis2,
        address _weidai,
        address _eye,
        address _angband,
        address loomTokenSwap,
        address _liquidityReceiver,
        address _behodler1Weth
    ) {
        One.behodler = behodler1;
        One.scarcity = scarcity1;
        One.lachesis = lachesis1;
        One.weth = _behodler1Weth;

        Two.behodler = behodler2;
        Two.lachesis = lachesis2;
        Two.weth = Behodler2(behodler2).Weth();
        weidai = _weidai;
        eye = _eye;
        angband = _angband;
        deployer = msg.sender;
        loomSwap = LoomTokenSwap(loomTokenSwap);
        liquidityReceiver = LiquidityReceiverFacade(_liquidityReceiver);
    }

    function initBridge() public {
        bridge = new ScarcityBridge(One.scarcity, Two.behodler);
    }

    modifier step(uint8 _step) {
        require(stepCounter == _step, "MIGRATION: Incorrect step.");
        _;
    }

    function bail() public {
        require(msg.sender == deployer, "MIGRATOR: only deployer can call");
        require(stepCounter < 7, "MIGRATOR: it's too late to apologize");

        SecondaryFacade(One.behodler).transferPrimary(msg.sender);
        SecondaryFacade(One.scarcity).transferPrimary(msg.sender);
        SecondaryFacade(One.lachesis).transferPrimary(msg.sender);

        OwnableFacade(Two.behodler).transferOwnership(msg.sender);
        OwnableFacade(Two.lachesis).transferOwnership(msg.sender);
        emit bailOnMigration(stepCounter);
    }

    function step1() public step(1) {
        address self = address(this);
        require(
            SecondaryFacade(One.behodler).primary() == self,
            "MIGRATION: behodler1 owner mismatch"
        );
        require(
            SecondaryFacade(One.scarcity).primary() == self,
            "MIGRATION: scarcity1 owner mismatch"
        );
        require(
            SecondaryFacade(One.lachesis).primary() == self,
            "MIGRATION: lachesis1 owner mismatch"
        );

        require(
            OwnableFacade(Two.behodler).owner() == self,
            "MIGRATION: behodler2 owner mismatch"
        );
        require(
            OwnableFacade(Two.lachesis).owner() == self,
            "MIGRATION: lachesis2 owner mismatch"
        );

        require(
            OwnableFacade(address(liquidityReceiver)).owner() == self,
            "MIGRATION: liquidity receiver owner mismatch"
        );

        require(
            Behodler2(Two.behodler).whiteListUsers(address(this)),
            "MIGRATION: Ensure that the migration contract is whitelisted on Behodler"
        );

        Behodler2(Two.behodler).setMigrator(address(bridge));

        emit verifyOwnership(
            stepCounter,
            One.behodler,
            One.scarcity,
            One.lachesis,
            Two.behodler,
            Two.lachesis
        );
        stepCounter++;
    }

    //disable tokens on Behodler1
    function step2(address[] calldata tokens) public step(2) {
        baseTokens = tokens;
        Lachesis1 lachesis = Lachesis1(One.lachesis);
        tokenCount = tokens.length;
        for (uint8 i = 0; i < tokens.length; i++) {
            lachesis.cut(tokens[i]); // checks that valid tokens have been passed in
            lachesis.measure(tokens[i], false);
        }
        emit disableBehodler1(2);
        stepCounter++;
    }

    //add dummy tokens deploy
    function step3() public step(3) {
        for (uint8 i = 0; i < tokenCount; i++) {
            address token = address(new DummyToken());
            dummyTokens.push(token);
        }
        stepCounter++;
        emit addDummyTokens(3);
    }

    //drain behodler1 of tokens
    function step4(uint256 iterations) public step(4) {
        Lachesis1 lachesis = Lachesis1(One.lachesis);
        Behodler1 behodler = Behodler1(One.behodler);
        ERC20(One.scarcity).approve(One.behodler, uint256(-1));

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
           // bridge.collectScarcity1BeforeBurning(scxGenerated);
            lachesis.measure(dummyTokens[step4Index], false);
            lachesis.measure(baseTokens[step4Index], false);
        }

        if (stop == tokenCount) {
            emit drainBehodler1(stepCounter);
            stepCounter++;
        }
    }

    //add tokens to Behodler2
    function step5(uint256 iterations) public step(5) {
        uint256 stop =
            step5Index + iterations > tokenCount
                ? tokenCount
                : step5Index + iterations;

        Lachesis2 lachesis = Lachesis2(Two.lachesis);
        address oldLoomToken = address(0);
        address newLoomToken = address(0);
        if (address(loomSwap) != address(0)) {
            oldLoomToken = address(loomSwap.oldToken());
            newLoomToken = address(loomSwap.newToken());
        }
        for (; step5Index < stop; step5Index++) {
            bool burnable =
                baseTokens[step5Index] == weidai ||
                    baseTokens[step5Index] == eye;
            address token =
                baseTokens[step5Index] == oldLoomToken
                    ? newLoomToken
                    : baseTokens[step5Index];
            if (token == One.weth) token = Two.weth;
            lachesis.measure(token, true, burnable);
            lachesis.updateBehodler(token);
            if (!burnable) {
                liquidityReceiver.registerPyroToken(token);
            }
        }
        if (stop == tokenCount) {
            emit addTokensToLachesis2(stepCounter);
            stepCounter++;
        }
    }

    //add liquidity and calculate scx exchange rate for Behodler2
    function step6(uint256 iterations) public step(6) {
        uint256 stop =
            step6Index + iterations > tokenCount
                ? tokenCount
                : step6Index + iterations;

        Behodler2 behodler2 = Behodler2(Two.behodler);
        address oldLoom = address(loomSwap.oldToken());
        address self = address(this);
        for (; step6Index < stop; step6Index++) {
            address token = baseTokens[step6Index];
            if (token == oldLoom) {
                loomSwap.oldToken().approve(address(loomSwap), uint256(-1));
                loomSwap.swap();
                token = address(loomSwap.newToken());
            }

            uint256 balance = ERC20(token).balanceOf(self);
            if (token == One.weth) {
                Weth1(token).withdraw(balance);
                behodler2.addLiquidity{value: balance}(Two.weth, balance);
            } else {
                ERC20(token).approve(Two.behodler, uint256(-1));
                behodler2.addLiquidity(token, balance);
            }
        }

        if (stop == tokenCount) {
            bridge.recordExchangeRate();
            emit addTokensAsLiquidity(stepCounter, bridge.exchangeRate());
            stepCounter++;
        }
    }

    //transfer to angband
    function step7() public step(7) {
        OwnableFacade(Two.behodler).transferOwnership(angband);
        OwnableFacade(Two.lachesis).transferOwnership(angband);
        emit transferOwnershipToAngband(stepCounter, angband);
        stepCounter++;
    }
}
