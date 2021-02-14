const { accounts, contract } = require('@openzeppelin/test-environment');
const { expectEvent, expectRevert, ether } = require('@openzeppelin/test-helpers');
const { expect, assert } = require('chai');
const { BNtoBigInt } = require('./helpers/BigIntUtil');
const bigNum = require('./helpers/BigIntUtil')

const Behodler1 = contract.fromArtifact('MockBehodler1')
const Lachesis1 = contract.fromArtifact('MockLachesis1')
const Scarcity1 = contract.fromArtifact('MockScarcity')
const Behodler2 = contract.fromArtifact('MockBehodler2')
const Lachesis2 = contract.fromArtifact('MockLachesis2')
const MockToken = contract.fromArtifact('MockToken')
const MockAngband = contract.fromArtifact('MockAngband')
const MockWeth = contract.fromArtifact('MockWeth1')

const Migrator = contract.fromArtifact('Migrator')
const MockLoomTokenSwap = contract.fromArtifact('MockLoomTokenSwap')
const MockLiquidityReceiver = contract.fromArtifact('MockLiquidityReceiver')

describe('Migration', async function () {
    const [owner, user2, user3, feeDestination] = accounts;
    let initialScarcityGenerated;

    beforeEach(async function () {
        //construct
        this.scarcity = await Scarcity1.new({ from: owner })
        this.lachesis1 = await Lachesis1.new({ from: owner })
        this.behodler1 = await Behodler1.new(this.scarcity.address, this.lachesis1.address, { from: owner })
        this.lachesis2 = await Lachesis2.new({ from: owner })
        this.mockWeth = await MockWeth.new({ from: owner })
        this.behodler2 = await Behodler2.new(this.mockWeth.address, { from: owner })
        await this.lachesis2.setBehodler(this.behodler2.address)
        await this.behodler2.setLachesis(this.lachesis2.address)
        await this.behodler2.configureScarcity(10, 25, feeDestination, { from: owner })

        //create tokens to Behodler
        this.token1 = await MockToken.new({ from: owner })
        await this.token1.mint(owner, "10000000000000000000000")

        this.oldLoom = await MockToken.new({ from: owner })
        await this.oldLoom.mint(user2, "200000000000000000000")

        this.newLoom = await MockToken.new({ from: owner });

        this.loomSwap = await MockLoomTokenSwap.new(this.oldLoom.address, { from: owner })
        await this.loomSwap.setNewLoomToken(this.newLoom.address, { from: owner })
        this.token3 = await MockToken.new({ from: owner })
        await this.token3.mint(user3, "3500000000000000000000")

        this.token4 = await MockToken.new({ from: owner })
        await this.token4.mint(owner, "10000000000000000000")

        this.weidai = await MockToken.new({ from: owner })
        await this.weidai.mint(user2, "1000000000000000000000")

        this.eye = await MockToken.new({ from: owner })
        await this.eye.mint(owner, "100000000000000000000000")

        await this.mockWeth.deposit({ from: owner, value: '10000000000000000000' })


        //add 3 tokens to Behodler 1
        await this.lachesis1.measure(this.token1.address, true)
        await this.lachesis1.measure(this.oldLoom.address, true)
        await this.lachesis1.measure(this.token3.address, true)
        await this.lachesis1.measure(this.weidai.address, true)
        await this.lachesis1.measure(this.eye.address, true)
        await this.lachesis1.measure(this.mockWeth.address, true)

        await this.token1.approve(this.behodler1.address, '100000000000000000000000', { from: owner })
        await this.oldLoom.approve(this.behodler1.address, '100000000000000000000000', { from: user2 })
        await this.token3.approve(this.behodler1.address, '100000000000000000000000', { from: user3 })
        await this.weidai.approve(this.behodler1.address, '100000000000000000000000', { from: user2 })
        await this.eye.approve(this.behodler1.address, '100000000000000000000000', { from: owner })
        await this.mockWeth.approve(this.behodler1.address, '10000000000000000000', { from: owner })

        await this.behodler1.buyScarcity(this.token1.address, "3000000000000000000000", 0, { from: owner });
        await this.behodler1.buyScarcity(this.oldLoom.address, '160000000000000000000', 0, { from: user2 });
        await this.behodler1.buyScarcity(this.token3.address, '2000000000000000000000', 0, { from: user3 });
        await this.behodler1.buyScarcity(this.weidai.address, '500000000000000000000', 0, { from: user2 });
        await this.behodler1.buyScarcity(this.eye.address, '90000000000000000000000', 0, { from: owner });
        await this.behodler1.buyScarcity(this.mockWeth.address, '10000000000000000000', 0, { from: owner });
        initialScarcityGenerated = await this.scarcity.totalSupply();

        this.mockAngband = await MockAngband.new({ from: owner })
        this.liquidityReceiver = await MockLiquidityReceiver.new({ from: owner })
        this.migrator = await Migrator.new(this.behodler1.address,
            this.scarcity.address,
            this.lachesis1.address,
            this.behodler2.address,
            this.lachesis2.address,
            this.weidai.address,
            this.eye.address,
            this.mockAngband.address,
            this.loomSwap.address,
            this.liquidityReceiver.address,
            this.mockWeth.address,
            { from: owner })


        await this.migrator.initBridge();
    })

    it('migrates from Behodler1 to Behodler2', async function () {

        //STEP1
        await expectRevert(this.migrator.step1(), "MIGRATION: behodler1 owner mismatch")
        await this.behodler1.transferPrimary(this.migrator.address, { from: owner })

        await expectRevert(this.migrator.step1(), "MIGRATION: scarcity1 owner mismatch")
        await this.scarcity.transferPrimary(this.migrator.address, { from: owner })

        await expectRevert(this.migrator.step1(), "MIGRATION: lachesis1 owner mismatch")
        await this.lachesis1.transferPrimary(this.migrator.address, { from: owner })

        await expectRevert(this.migrator.step1(), "MIGRATION: behodler2 owner mismatch")
        await this.behodler2.transferOwnership(this.migrator.address, { from: owner })

        await expectRevert(this.migrator.step1(), "MIGRATION: lachesis2 owner mismatch")
        await this.lachesis2.transferOwnership(this.migrator.address, { from: owner })

        await expectRevert(this.migrator.step1(), "Ensure that the migration contract is whitelisted on Behodler")
        await this.behodler2.setWhiteListUsers(this.migrator.address, true)

        await this.migrator.step1()

        let currentStep = (await this.migrator.stepCounter()).toNumber()
        assert.equal(currentStep, 2)

        //STEP2
        const tokens = [this.token1.address, this.oldLoom.address, this.token3.address, this.weidai.address, this.eye.address, this.mockWeth.address]
        await this.migrator.step2(tokens)
        currentStep = (await this.migrator.stepCounter()).toNumber()
        assert.equal(currentStep, 3)

        //assert behodler 1 is invalid for those tokens
        await expectRevert(this.lachesis1.cut(this.token1.address), 'invalid token.')
        await expectRevert(this.lachesis1.cut(this.oldLoom.address), 'invalid token.')
        await expectRevert(this.lachesis1.cut(this.token3.address), 'invalid token.')
        await expectRevert(this.lachesis1.cut(this.token4.address), 'invalid token.')
        await expectRevert(this.lachesis1.cut(this.weidai.address), 'invalid token.')
        await expectRevert(this.lachesis1.cut(this.eye.address), 'invalid token.')
        await expectRevert(this.lachesis1.cut(this.mockWeth.address), 'invalid token.')

        await this.migrator.step3();

        //assert positive token balances on behodler 1
        let token1BalanceOnBehodler1 = (await this.token1.balanceOf(this.behodler1.address)).toString()
        assert.equal(token1BalanceOnBehodler1, '3000000000000000000000')

        let oldLoomBalanceOnBehodler1 = (await this.oldLoom.balanceOf(this.behodler1.address)).toString()
        assert.equal(oldLoomBalanceOnBehodler1, '160000000000000000000')

        let token3BalanceOnBehodler1 = (await this.token3.balanceOf(this.behodler1.address)).toString()
        assert.equal(token3BalanceOnBehodler1, '2000000000000000000000')

        let weiDaiBalanceOnBehodler1 = (await this.weidai.balanceOf(this.behodler1.address)).toString()
        assert.equal(weiDaiBalanceOnBehodler1, '500000000000000000000')

        let eyeBalanceOnBehodler1 = (await this.eye.balanceOf(this.behodler1.address)).toString()
        assert.equal(eyeBalanceOnBehodler1, '90000000000000000000000')

        let wethBalanceOnBehodler1 = (await this.mockWeth.balanceOf(this.behodler1.address)).toString()
        assert.equal(wethBalanceOnBehodler1, '10000000000000000000')

        await this.migrator.step4(2);
        await this.migrator.step4(2);
        await this.migrator.step4(4);

        //assert tokens still invalid on behodler1
        await expectRevert(this.lachesis1.cut(this.token1.address), 'invalid token.')
        await expectRevert(this.lachesis1.cut(this.oldLoom.address), 'invalid token.')
        await expectRevert(this.lachesis1.cut(this.token3.address), 'invalid token.')
        await expectRevert(this.lachesis1.cut(this.token4.address), 'invalid token.')
        await expectRevert(this.lachesis1.cut(this.weidai.address), 'invalid token.')
        await expectRevert(this.lachesis1.cut(this.eye.address), 'invalid token.')
        await expectRevert(this.lachesis1.cut(this.mockWeth.address), 'invalid token.')

        //assert zero token balances on behodler1
        token1BalanceOnBehodler1 = (await this.token1.balanceOf(this.behodler1.address)).toString()
        assert.equal(token1BalanceOnBehodler1, '0')

        oldLoomBalanceOnBehodler1 = (await this.oldLoom.balanceOf(this.behodler1.address)).toString()
        assert.equal(oldLoomBalanceOnBehodler1, '0')

        token3BalanceOnBehodler1 = (await this.token3.balanceOf(this.behodler1.address)).toString()
        assert.equal(token3BalanceOnBehodler1, '0')

        weiDaiBalanceOnBehodler1 = (await this.weidai.balanceOf(this.behodler1.address)).toString()
        assert.equal(weiDaiBalanceOnBehodler1, '0')

        eyeBalanceOnBehodler1 = (await this.eye.balanceOf(this.behodler1.address)).toString()
        assert.equal(eyeBalanceOnBehodler1, '0')

        wethBalanceOnBehodler1 = (await this.mockWeth.balanceOf(this.behodler1.address)).toString()
        assert.equal(wethBalanceOnBehodler1, '0')


        const pyroToken1Before = await this.liquidityReceiver.baseTokenMapping(this.token1.address)
        const pyroLoom1Before = await this.liquidityReceiver.baseTokenMapping(this.oldLoom.address)
        const pyroToken3Before = await this.liquidityReceiver.baseTokenMapping(this.token3.address)
        const pyroWeiDaiBefore = await this.liquidityReceiver.baseTokenMapping(this.weidai.address)
        const pyroEyeBefore = await this.liquidityReceiver.baseTokenMapping(this.eye.address)

        assert.equal(pyroToken1Before, '0x0000000000000000000000000000000000000000')
        assert.equal(pyroLoom1Before, '0x0000000000000000000000000000000000000000')
        assert.equal(pyroToken3Before, '0x0000000000000000000000000000000000000000')
        assert.equal(pyroWeiDaiBefore, '0x0000000000000000000000000000000000000000')
        assert.equal(pyroEyeBefore, '0x0000000000000000000000000000000000000000')

        await this.migrator.step5()

        const pyroToken1After = await this.liquidityReceiver.baseTokenMapping(this.token1.address)
        const pyroLoom1After = await this.liquidityReceiver.baseTokenMapping(this.oldLoom.address)
        const pyroToken3After = await this.liquidityReceiver.baseTokenMapping(this.token3.address)
        const pyroWeiDaiAfter = await this.liquidityReceiver.baseTokenMapping(this.weidai.address)
        const pyroEyeAfter = await this.liquidityReceiver.baseTokenMapping(this.eye.address)

        assert.notEqual(pyroToken1After, '0x0000000000000000000000000000000000000000')
        assert.notEqual(pyroLoom1After, '0x0000000000000000000000000000000000000000')
        assert.notEqual(pyroToken3After, '0x0000000000000000000000000000000000000000')

        assert.equal(pyroWeiDaiAfter, '0x0000000000000000000000000000000000000000')
        assert.equal(pyroEyeAfter, '0x0000000000000000000000000000000000000000')

        currentStep = (await this.migrator.stepCounter()).toNumber()
        assert.equal(currentStep, 6)

        const token1ValidOnBehodler2 = await this.behodler2.validTokens(this.token1.address)
        const token1BurnableOnBehodler2 = await this.behodler2.tokenBurnable(this.token1.address)

        const oldLoomValidOnBehodler2 = await this.behodler2.validTokens(this.oldLoom.address)
        const oldLoomBurnableOnBehodler2 = await this.behodler2.tokenBurnable(this.oldLoom.address)

        const newLoomValidOnBehodler2 = await this.behodler2.validTokens(this.newLoom.address)
        const newLoomBurnableOnBehodler2 = await this.behodler2.tokenBurnable(this.newLoom.address)


        const token3ValidOnBehodler2 = await this.behodler2.validTokens(this.token3.address)
        const token3BurnableOnBehodler2 = await this.behodler2.tokenBurnable(this.token3.address)

        const token4ValidOnBehodler2 = await this.behodler2.validTokens(this.token4.address)
        const token4BurnableOnBehodler2 = await this.behodler2.tokenBurnable(this.token4.address)

        const weiDaiValidOnBehodler2 = await this.behodler2.validTokens(this.weidai.address)
        const weiDaiBurnableOnBehodler2 = await this.behodler2.tokenBurnable(this.weidai.address)

        const eyeValidOnBehodler2 = await this.behodler2.validTokens(this.eye.address)
        const eyeBurnableOnBehodler2 = await this.behodler2.tokenBurnable(this.eye.address)


        const weth10 = await this.behodler2.Weth();
        const wethValidOnBehodler2 = await this.behodler2.validTokens(weth10)
        const wethBurnableOnBehodler2 = await this.behodler2.tokenBurnable(weth10)

        //assert validity and burnability of tokens on behodler2
        assert.isTrue(token1ValidOnBehodler2)
        assert.isFalse(oldLoomValidOnBehodler2)
        assert.isTrue(newLoomValidOnBehodler2)
        assert.isTrue(token3ValidOnBehodler2)
        assert.isFalse(token4ValidOnBehodler2)
        assert.isTrue(weiDaiValidOnBehodler2)
        assert.isTrue(eyeValidOnBehodler2)
        assert.isTrue(wethValidOnBehodler2)


        assert.isFalse(token1BurnableOnBehodler2)
        assert.isFalse(oldLoomBurnableOnBehodler2)
        assert.isFalse(token3BurnableOnBehodler2)
        assert.isFalse(token4BurnableOnBehodler2)
        assert.isFalse(wethBurnableOnBehodler2)
        assert.isTrue(weiDaiBurnableOnBehodler2)
        assert.isTrue(eyeBurnableOnBehodler2)


        await this.migrator.step6(2)
        await this.migrator.step6(2)
        await this.migrator.step6(4)

        currentStep = (await this.migrator.stepCounter()).toNumber()
        assert.equal(currentStep, 7)

        let token1BalanceOnBehodler2 = (await this.token1.balanceOf(this.behodler2.address)).toString()
        assert.equal(token1BalanceOnBehodler2, '3000000000000000000000')

        let oldLoomBalanceOnBehodler2 = (await this.oldLoom.balanceOf(this.behodler2.address)).toString()
        assert.equal(oldLoomBalanceOnBehodler2, '0')

        let newLoomBalanceOnBehodler2 = (await this.newLoom.balanceOf(this.behodler2.address)).toString()
        assert.equal(newLoomBalanceOnBehodler2, '160000000000000000000')

        let token3BalanceOnBehodler2 = (await this.token3.balanceOf(this.behodler2.address)).toString()
        assert.equal(token3BalanceOnBehodler2, '2000000000000000000000')

        let weiDaiBalanceOnBehodler2 = (await this.weidai.balanceOf(this.behodler2.address)).toString()
        assert.equal(weiDaiBalanceOnBehodler2, '500000000000000000000')

        let eyeBalanceOnBehodler2 = (await this.eye.balanceOf(this.behodler2.address)).toString()
        assert.equal(eyeBalanceOnBehodler2, '90000000000000000000000')


        const bridgeAddress = await this.migrator.bridge()
        const bridge = contract.fromArtifact('ScarcityBridge', bridgeAddress)
        const exchangeRate = (await bridge.exchangeRate()).toString()
        assert.equal(exchangeRate, "5000")

        await this.migrator.step7()
        currentStep = (await this.migrator.stepCounter()).toNumber()
        assert.equal(currentStep, 8)

        await expectRevert(this.migrator.bail({ from: owner }), "MIGRATOR: it's too late to apologize");

        const ownerOfBehodler2 = await this.behodler2.owner()
        const ownerOfLachesis2 = await this.behodler2.owner()

        assert.equal(ownerOfBehodler2, this.mockAngband.address)
        assert.equal(ownerOfLachesis2, this.mockAngband.address)

        const scarcityV1 = (await this.scarcity.balanceOf(owner)).toString()
        this.behodler2.setMigrator(bridgeAddress, { from: owner })
        await this.scarcity.approve(bridgeAddress, '115792089237316000000000000000000000000000000000000000000000000000000000000000', { from: owner })
        await bridge.swap({ from: owner })
        const scarcityV2 = (await this.behodler2.balanceOf(owner)).toString()
        const bnSCX1 = BigInt(scarcityV1)
        const bnSCX2 = BigInt(scarcityV2)
        assert.equal(bnSCX1 / 5000n, bnSCX2)
    })

    it('allows bail before step 7', async function () {
        //STEP1
        await expectRevert(this.migrator.step1(), "MIGRATION: behodler1 owner mismatch")
        await this.behodler1.transferPrimary(this.migrator.address, { from: owner })

        await expectRevert(this.migrator.step1(), "MIGRATION: scarcity1 owner mismatch")
        await this.scarcity.transferPrimary(this.migrator.address, { from: owner })

        await expectRevert(this.migrator.step1(), "MIGRATION: lachesis1 owner mismatch")
        await this.lachesis1.transferPrimary(this.migrator.address, { from: owner })

        await expectRevert(this.migrator.step1(), "MIGRATION: behodler2 owner mismatch")
        await this.behodler2.transferOwnership(this.migrator.address, { from: owner })

        await expectRevert(this.migrator.step1(), "MIGRATION: lachesis2 owner mismatch")
        await this.lachesis2.transferOwnership(this.migrator.address, { from: owner })

        await expectRevert(this.migrator.step1(), "Ensure that the migration contract is whitelisted on Behodler")
        await this.behodler2.setWhiteListUsers(this.migrator.address, true)

        await this.migrator.step1()

        let currentStep = (await this.migrator.stepCounter()).toNumber()
        assert.equal(currentStep, 2)

        //bail
        await expectRevert(this.migrator.bail({ from: user2 }), "MIGRATOR: only deployer can call")
        await this.migrator.bail({ from: owner });
        const primaryOfBehodler1 = await this.behodler1.primary()
        const primaryOfLachesis1 = await this.lachesis1.primary()
        const primaryOfScarcity1 = await this.scarcity.primary()

        const ownerOfBehodler2 = await this.behodler2.owner()
        const ownerOfLachesis2 = await this.behodler2.owner()

        assert.equal(primaryOfBehodler1, owner)
        assert.equal(primaryOfLachesis1, owner)
        assert.equal(primaryOfScarcity1, owner)
        assert.equal(ownerOfBehodler2, owner)
        assert.equal(ownerOfLachesis2, owner)
    })
})