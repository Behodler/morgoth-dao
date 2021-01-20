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
// const web3 = require('web3')
// const eth = require('web3-eth')
// const Contract = require('web3-eth-contract');

const ironCrownABI = require('./ABI/IronCrown.json').abi

const stringToBytes = (s) => web3.utils.fromAscii(s)
contract('IronCrown', async function (accounts) {
    const [Melkor, secondary] = accounts;

    before(async function () {
        this.powersRegistry = await PowersRegistry.new({ from: Melkor })
        await this.powersRegistry.seed()

        this.scarcity = await MockScarcity.new({ from: Melkor })
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
        //Call setSilmaril with too high percentage
    })

    it('settlePayments distributes correctly', async function () {
        //set silmarils correctly
        // send money to iron crown
        //Settlepayments splits between 3 accounts
    })

    it('fails when unempowered user tries to withdraw scx from angband', async function () {
        //ANGBAND is treasury.
        //Settlepayments with angband as treasury
        // expect revert  on try to withdraw
        //Succeed at withdraw 
    })


})