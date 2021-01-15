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

const Migrator = contract.fromArtifact('Migrator')
const ScarcityBridge = contract.fromArtifact('ScarcityBridge');

describe('Migration', async function () {
    const [owner, user2, user3] = accounts;
    let initialScarcityGenerated;
    before(async function () {
        //construct
        this.scarcity = await Scarcity1.new({ from: owner })
        this.lachesis1 = await Lachesis1.new({ from: owner })
        this.behodler1 = await Behodler1.new(this.scarcity.address, this.lachesis1.address, { from: owner })
        this.lachesis2 = await Lachesis2.new({ from: owner })
        this.behodler2 = await Behodler2.new({ from: owner })
        await this.lachesis2.setBehodler(this.behodler2.address)
        await this.behodler2.setLachesis(this.lachesis2.address)

        //create tokens to Behodler
        this.token1 = await MockToken.new({ from: owner })
        await this.token1.mint(owner, "10000000000000000000000")

        this.token2 = await MockToken.new({ from: owner })
        await this.token2.mint(user2, "200000000000000000000")

        this.token3 = await MockToken.new({ from: owner })
        await this.token3.mint(user3, "3500000000000000000000")

        this.token4 = await MockToken.new({ from: owner })
        await this.token4.mint(owner, "10000000000000000000")

        this.weidai = await MockToken.new({ from: owner })
        await this.weidai.mint(user2, "1000000000000000000000")

        this.eye = await MockToken.new({ from: owner })
        await this.eye.mint(owner, "100000000000000000000000")


        //add 3 tokens to Behodler 1
        await this.lachesis1.measure(this.token1.address, true)
        await this.lachesis1.measure(this.token2.address, true)
        await this.lachesis1.measure(this.token3.address, true)
        await this.lachesis1.measure(this.weidai.address, true)
        await this.lachesis1.measure(this.eye.address, true)

        await this.token1.approve(this.behodler1.address, '100000000000000000000000', { from: owner })
        await this.token2.approve(this.behodler1.address, '100000000000000000000000', { from: user2 })
        await this.token3.approve(this.behodler1.address, '100000000000000000000000', { from: user3 })
        await this.weidai.approve(this.behodler1.address, '100000000000000000000000', { from: user2 })
        await this.eye.approve(this.behodler1.address, '100000000000000000000000', { from: owner })

        await this.behodler1.buyScarcity(this.token1.address, "3000000000000000000000", 0, { from: owner });
        await this.behodler1.buyScarcity(this.token2.address, '160000000000000000000', 0, { from: user2 });
        await this.behodler1.buyScarcity(this.token3.address, '2000000000000000000000', 0, { from: user3 });
        await this.behodler1.buyScarcity(this.weidai.address, '500000000000000000000', 0, { from: user2 });
        await this.behodler1.buyScarcity(this.eye.address, '90000000000000000000000', 0, { from: owner });

        initialScarcityGenerated = await this.scarcity.totalSupply();

        //set 3 tokens to valid on behodler2
        await this.lachesis2.measure(this.token1.address, true, true);
        await this.lachesis2.measure(this.token3.address, true, true);
        await this.lachesis2.measure(this.token3.address, true, false);
        await this.lachesis2.measure(this.weidai.address, true, true);
        await this.lachesis2.measure(this.eye.address, true, true);

        await this.lachesis2.updateBehodler(this.token1.address);
        await this.lachesis2.updateBehodler(this.token2.address);
        await this.lachesis2.updateBehodler(this.token3.address);
        await this.lachesis2.updateBehodler(this.weidai.address);
        await this.lachesis2.updateBehodler(this.eye.address);

        this.mockAngband = await MockAngband.new({ from: owner })

        this.migrator = await Migrator.new(this.behodler1.address,
            this.scarcity.address,
            this.lachesis1.address,
            this.behodler2.address,
            this.lachesis2.address,
            this.weidai.address,
            this.eye.address,
            this.mockAngband.address)


        await this.migrator.initBridge();
    })

    it('migrates from Behodler1 to Behodler2', async function () {

        //transfer ownership of contracts to migrator
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
    })
})