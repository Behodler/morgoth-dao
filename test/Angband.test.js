const { accounts, contract } = require('@openzeppelin/test-environment');
const { expectEvent, expectRevert, ether } = require('@openzeppelin/test-helpers');
const { expect, assert } = require('chai');
const { BNtoBigInt } = require('./helpers/BigIntUtil');
const bigNum = require('./helpers/BigIntUtil')
const web3 = require('web3')
const DummyInvoker = contract.fromArtifact('DummyInvoker')
const PowersRegistry = contract.fromArtifact('PowersRegistry')
const Angband = contract.fromArtifact('Angband')
const MockBehodler = contract.fromArtifact('MockBehodler')
const MockLachesis = contract.fromArtifact('MockLachesis')
const ThirdParty = contract.fromArtifact('ThirdParty')
const GreedyInvoker = contract.fromArtifact('GreedyInvoker')

const stringToBytes = (s) => web3.utils.fromAscii(s)

describe('Angband', async function () {
    const [owner, secondary, Melkor] = accounts;

    beforeEach(async function () {
        this.powersRegistry = await PowersRegistry.new({ from: Melkor })
        await this.powersRegistry.seed()
        this.behodler = await MockBehodler.new()
        this.lachesis = await MockLachesis.new()
        this.angband = await Angband.new(this.powersRegistry.address, this.behodler.address, this.lachesis.address, { from: Melkor })

        await this.angband.finalizeSetup()
        await this.powersRegistry.transferOwnership(this.angband.address, { from: Melkor })
    })

    // it('only minion with WIRE_ANGBAND can set registry and point to Behodler', async function () {
    //     await this.powersRegistry.create(stringToBytes('WIRE_ANGBAND'), stringToBytes('ANGBAND'), true, false, { from: Melkor })
    //     await this.powersRegistry.pour(stringToBytes('WIRE_ANGBAND'), stringToBytes('Melkor'), { from: Melkor })

    //     await this.angband.setPowersRegistry(this.powersRegistry.address, { from: Melkor })
    //     await expectRevert(this.angband.setPowersRegistry(this.powersRegistry.address, { from: secondary }), "MORGOTH: forbidden power.")
    // })

    // it('only minion with POINT_TO_BEHODLER can set behodler', async function () {
    //     await this.powersRegistry.create(stringToBytes('POINT_TO_BEHODLER'), stringToBytes('ANGBAND'), true, false, { from: Melkor })
    //     await this.powersRegistry.pour(stringToBytes('POINT_TO_BEHODLER'), stringToBytes('Melkor'), { from: Melkor })

    //     await this.angband.setBehodler(this.behodler.address, this.lachesis.address, { from: Melkor })
    //     await expectRevert(this.angband.setBehodler(this.behodler.address, this.lachesis.address, { from: secondary }), "MORGOTH: forbidden power.")
    // })

    // it('dummy invoker not authorized cannot be invoked', async function () {
    //     //create power
    //     const power = stringToBytes('UNAUTH')
    //     await this.powersRegistry.create(power, stringToBytes('ANGBAND'), true, false, { from: Melkor })
    //     //instantiate dummy invoker
    //     this.dummyInvoker = await DummyInvoker.new(power, this.angband.address)

    //     //  assert power forbidden
    //     await expectRevert(this.angband.executePower(this.dummyInvoker.address, { from: Melkor }), 'MORGOTH: forbidden power.')

    //     //grant power
    //     await this.powersRegistry.pour(power, stringToBytes('Melkor'), { from: Melkor })

    //     //assert not authorized
    //     await expectRevert(this.angband.executePower(this.dummyInvoker.address, { from: Melkor }), 'MORGOTH: Invoker not whitelisted')

    //     //attempt self destruct
    //     await expectRevert(this.dummyInvoker.destruct(), "MORGOTH: awaiting invocation");

    //     //create and seize Invoker Authorization power
    //     const authPower = stringToBytes('AUTHORIZE_INVOKER')
    //     await this.powersRegistry.create(authPower, stringToBytes('ANGBAND'), true, false, { from: Melkor })
    //     await this.powersRegistry.pour(authPower, stringToBytes('Melkor'), { from: Melkor })

    //     //authorize dummyInvoker
    //     await this.angband.authorizeInvoker(this.dummyInvoker.address, true, { from: Melkor })

    //     //invoke successfully
    //     await this.angband.executePower(this.dummyInvoker.address, { from: Melkor })
    //     // self destruct successfully
    //     this.dummyInvoker.destruct({ from: Melkor })
    // })

    it(`powerInvoker which does not return ownership fails in execute power,
    same invoker which does return ownership succeeds`, async function () {
        //use greedyInvoker
        await this.powersRegistry.create(stringToBytes('WIRE_ANGBAND'), stringToBytes('ANGBAND'), true, false, { from: Melkor })
        await this.powersRegistry.pour(stringToBytes('WIRE_ANGBAND'), stringToBytes('Melkor'), { from: Melkor })

        this.thirdParty = await ThirdParty.new({ from: Melkor })
        await this.thirdParty.transferOwnership(this.angband.address, { from: Melkor })

        const domain = stringToBytes('THIRD')
        const power = stringToBytes('DOTHIRD')
        await this.angband.mapDomain(this.thirdParty.address, power, { from: Melkor })
        await this.powersRegistry.create(power, domain, true, false, { from: Melkor })
        await this.powersRegistry.pour(power, stringToBytes('Melkor'), { from: Melkor })

        const greedDomain = stringToBytes('GREED')
        const greedPower = stringToBytes('DOGREED')
        await this.powersRegistry.create(greedPower, greedDomain, true, false, { from: Melkor })
        await this.powersRegistry.pour(greedPower, stringToBytes('Melkor'), { from: Melkor })

        this.greedyInvoker = await GreedyInvoker.new(greedPower, this.angband.address, { from: Melkor })
       
        await this.angband.mapDomain(this.greedyInvoker.address, greedDomain, { from: Melkor })
      
        //create and seize Invoker Authorization power
        const authPower = stringToBytes('AUTHORIZE_INVOKER')
        await this.powersRegistry.create(authPower, stringToBytes('ANGBAND'), true, false, { from: Melkor })
        await this.powersRegistry.pour(authPower, stringToBytes('Melkor'), { from: Melkor })

        //authorize dummyInvoker
        await this.angband.authorizeInvoker(this.greedyInvoker.address, true, { from: Melkor })
      
        //invoke should fail to return ownership
        await expectRevert(this.angband.executePower(this.greedyInvoker.address, { from: Melkor }),
            "MORGOTH: power invoker failed to return ownership")
    })


    it(`ownership of behodler and lachesis returned after execute order66`, async function () {

    })

    it(`executeORder66 fails after cooldown period`, async function () {

    })

    it('dummy invoker requires user have power on invocation', async function () {
        //  this.dummyInvoker = await DummyInvoker.new()
        //  await this.ang
    })
})