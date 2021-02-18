// const { contract } = require('@openzeppelin/test-environment');
const { expectEvent, expectRevert, ether } = require('@openzeppelin/test-helpers');
const { expect, assert } = require('chai');
const { BNtoBigInt } = require('./helpers/BigIntUtil');
const bigNum = require('./helpers/BigIntUtil')
const Angband = artifacts.require("Angband")
const PowersRegistry = artifacts.require("PowersRegistry")
const MockScarcity = artifacts.require("MockBehodler2")
const MockLachesis2 = artifacts.require("MockLachesis2")
const SetSilmarilPower = artifacts.require("SetSilmarilPower")
const MockWeth = artifacts.require('MockWeth1')

const ironCrownABI = require('./ABI/IronCrown.json').abi

const stringToBytes = (s) => web3.utils.fromAscii(s)
contract('IronCrown', async function (accounts) {
    const [Melkor, secondary, recipient1, recipient2, recipient3, Saruman, WitchKing] = accounts;

    before(async function () {
        this.powersRegistry = await PowersRegistry.new({ from: Melkor })
        await this.powersRegistry.seed()
        this.mockWeth = await MockWeth.new({ from: Melkor })
        this.scarcity = await MockScarcity.new(this.mockWeth.address, { from: Melkor })
        this.lachesis = await MockLachesis2.new({ from: Melkor })
        this.angband = await Angband.new(this.powersRegistry.address, { from: Melkor })
        this.angband.finalizeSetup({ from: Melkor });

        await this.scarcity.transferOwnership(this.angband.address, { from: Melkor })
        await this.lachesis.transferOwnership(this.angband.address, { from: Melkor })

        await this.powersRegistry.create(stringToBytes('POINT_TO_BEHODLER'), stringToBytes('ANGBAND'), true, false, { from: Melkor })
        await this.powersRegistry.pour(stringToBytes('POINT_TO_BEHODLER'), stringToBytes('Melkor'), { from: Melkor })
        await this.angband.setBehodler(this.scarcity.address, this.lachesis.address, { from: Melkor })

    })

    it('setSilmarils requires INSERT_SILMARIL power', async function () {
        this.badSilmarilPower = await SetSilmarilPower.new(stringToBytes('CONFIGURE_THANGORODRIM'), this.angband.address, { from: Melkor })
        await this.powersRegistry.create(stringToBytes('AUTHORIZE_INVOKER'), stringToBytes('ANGBAND'), true, false, { from: Melkor })
        await this.powersRegistry.pour(stringToBytes('AUTHORIZE_INVOKER'), stringToBytes('Melkor'), { from: Melkor })

        await this.angband.authorizeInvoker(this.badSilmarilPower.address, true, { from: Melkor })
        //Expect revert on setSilmaril by invoker with wrong power
        await expectRevert(this.angband.executePower(this.badSilmarilPower.address), "MORGOTH: forbidden power.", { from: Melkor })

        //Pour out INSERT_SILMARIL power into second
        await this.powersRegistry.create(stringToBytes('INSERT_SILMARIL'), stringToBytes('IRON_CROWN'), true, false, { from: Melkor })
        await this.powersRegistry.pour(stringToBytes('INSERT_SILMARIL'), stringToBytes('Melkor'), { from: Melkor })


        this.goodSilmarilPower = await SetSilmarilPower.new(stringToBytes('INSERT_SILMARIL'), this.angband.address, { from: Melkor })
        await this.angband.authorizeInvoker(this.goodSilmarilPower.address, true, { from: Melkor })
        // Expect revert on setSilmaril by user without power 
        await this.goodSilmarilPower.parameterize(2, 10, this.angband.address, { from: Melkor })
        await expectRevert(this.angband.executePower(this.goodSilmarilPower.address, { from: secondary }), "MORGOTH: forbidden power.", { from: secondary })

        await this.goodSilmarilPower.parameterize(2, 10, this.angband.address, { from: Melkor })

        await this.angband.executePower(this.goodSilmarilPower.address, { from: Melkor })
        const ironCrownAddress = await this.angband.ironCrown.call()//.silmarils.call()

        var ironCrownInstance = (await new web3.eth.Contract(ironCrownABI, ironCrownAddress)).methods

        // await ironCrownInstance.setSilmaril(0, 0, ironCrownAddress).send({ from: Melkor })
        //  console.log(JSON.stringify(ironCrownInstance, null, 4))
        const silmaril1 = await ironCrownInstance.getSilmaril(2).call()
        assert.equal(silmaril1[0].toString(), "10")
        assert.equal(silmaril1[1], this.angband.address)
    })

    it('setSilmarils with too high percentage fails', async function () {
        //Pour out INSERT_SILMARIL power into second
        await this.powersRegistry.create(stringToBytes('INSERT_SILMARIL'), stringToBytes('IRON_CROWN'), true, false, { from: Melkor })
        await this.powersRegistry.pour(stringToBytes('INSERT_SILMARIL'), stringToBytes('Melkor'), { from: Melkor })


        this.goodSilmarilPower = await SetSilmarilPower.new(stringToBytes('INSERT_SILMARIL'), this.angband.address, { from: Melkor })
        await this.angband.authorizeInvoker(this.goodSilmarilPower.address, true, { from: Melkor })
        // Expect revert on setSilmaril by user without power 
        await this.goodSilmarilPower.parameterize(2, 1001, this.angband.address, { from: Melkor })

        await expectRevert(this.angband.executePower(this.goodSilmarilPower.address, { from: Melkor }), "MORGOTH: percentage exceeds 100%")
    })

    it('settlePayments distributes correctly', async function () {
        //bond user to saruman
        await this.powersRegistry.bondUserToMinion(Saruman, stringToBytes("Saruman"), { from: Melkor })

        //Pour out INSERT_SILMARIL power into second
        await this.powersRegistry.create(stringToBytes('INSERT_SILMARIL'), stringToBytes('IRON_CROWN'), true, false, { from: Melkor })
        await this.powersRegistry.pour(stringToBytes('INSERT_SILMARIL'), stringToBytes('Saruman'), { from: Melkor })


        this.inserInvoker1 = await SetSilmarilPower.new(stringToBytes('INSERT_SILMARIL'), this.angband.address, { from: Saruman })
        await this.angband.authorizeInvoker(this.inserInvoker1.address, true, { from: Melkor })
        //Insert all 3 silamrils
        await this.inserInvoker1.parameterize(0, 202, recipient1, { from: Saruman })
        await this.angband.executePower(this.inserInvoker1.address, { from: Saruman })
        await this.inserInvoker1.destruct({ from: Melkor })

        this.inserInvoker2 = await SetSilmarilPower.new(stringToBytes('INSERT_SILMARIL'), this.angband.address, { from: Saruman })
        await this.angband.authorizeInvoker(this.inserInvoker2.address, true, { from: Melkor })
        await this.inserInvoker2.parameterize(1, 147, recipient2, { from: Saruman })
        await this.angband.executePower(this.inserInvoker2.address, { from: Saruman })
        await this.inserInvoker2.destruct({ from: Melkor })

        this.inserInvoker3 = await SetSilmarilPower.new(stringToBytes('INSERT_SILMARIL'), this.angband.address, { from: Saruman })
        await this.angband.authorizeInvoker(this.inserInvoker3.address, true, { from: Melkor })
        await this.inserInvoker3.parameterize(2, 651, recipient3, { from: Saruman })
        await this.angband.executePower(this.inserInvoker3.address, { from: Saruman })
        await this.inserInvoker3.destruct({ from: Melkor })

        // send money to iron crown
        const ironCrownAddress = await this.angband.ironCrown.call()
        await this.scarcity.mint(ironCrownAddress, '10000000000', { from: Melkor })

        var ironCrownInstance = (await new web3.eth.Contract(ironCrownABI, ironCrownAddress)).methods

        const balanceOfRecipient1Before = (await this.scarcity.balanceOf(recipient1)).toString()
        const balanceOfRecipient2Before = (await this.scarcity.balanceOf(recipient2)).toString()
        const balanceOfRecipient3Before = (await this.scarcity.balanceOf(recipient3)).toString()

        assert.equal(balanceOfRecipient1Before, "0")
        assert.equal(balanceOfRecipient2Before, "0")
        assert.equal(balanceOfRecipient3Before, "0")

        await ironCrownInstance.settlePayments().send({ from: Melkor, gas: '0x669000' })

        const expectedRecipient1 = '2020000000'
        const expectedRecipient2 = '1470000000'
        const expectedRecipient3 = '6510000000'

        const balanceOfRecipient1 = (await this.scarcity.balanceOf(recipient1)).toString()
        const balanceOfRecipient2 = (await this.scarcity.balanceOf(recipient2)).toString()
        const balanceOfRecipient3 = (await this.scarcity.balanceOf(recipient3)).toString()

        assert.equal(balanceOfRecipient1, expectedRecipient1)
        assert.equal(balanceOfRecipient2, expectedRecipient2)
        assert.equal(balanceOfRecipient3, expectedRecipient3)
    })

    it('fails when unempowered user tries to withdraw scx from angband', async function () {
        await this.scarcity.mint(this.angband.address, '10000000000', { from: Melkor })

        await expectRevert(this.angband.withdrawSCX('10000000000', { from: WitchKing }), "MORGOTH: forbidden power")
        await this.powersRegistry.bondUserToMinion(WitchKing, stringToBytes("Witchking"), { from: Melkor })

        //Pour out TREASURER power 
        await this.powersRegistry.create(stringToBytes('TREASURER'), stringToBytes('ANGBAND'), true, false, { from: Melkor })
        await this.powersRegistry.pour(stringToBytes('TREASURER'), stringToBytes('Witchking'), { from: Melkor })

        const recipientBalanceBefore = (await this.scarcity.balanceOf(WitchKing)).toString()
        assert.equal(recipientBalanceBefore, "0")

        await this.angband.withdrawSCX('10000000000', { from: WitchKing })

        const recipientBalanceAfter = (await this.scarcity.balanceOf(WitchKing)).toString()
        assert.equal(recipientBalanceAfter, "10000000000")
    })


})