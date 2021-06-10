const { expectRevert, ether } = require('@openzeppelin/test-helpers');
const { expect, assert } = require('chai');
const { BNtoBigInt } = require('./helpers/BigIntUtil');
const bigNum = require('./helpers/BigIntUtil')
const Angband = artifacts.require("Angband")
const PowersRegistry = artifacts.require("PowersRegistry")
const MockBehodler = artifacts.require("MockBehodler3")
const MockLachesis2 = artifacts.require("MockLachesis2")
const BurnableToken = artifacts.require('MockToken')
const ReplaceOnMorgothInvoker = artifacts.require('ReplaceLachesisPower')
const ReplaceOnBehodlerInvoker = artifacts.require('PointBehodlerToNewLachesis')
const MockWeth = artifacts.require('MockWeth1')
const MockLachesis = artifacts.require('MockLachesis2')
const MassLachesis = artifacts.require("MassLachesis")

const stringToBytes = (s) => web3.utils.fromAscii(s)
contract('ChangeLachesis', async function (accounts) {
    const [Melkor, secondary, adder] = accounts;

    before(async function () {
        //wire up angband
        this.powersRegistry = await PowersRegistry.new({ from: Melkor })
        await this.powersRegistry.seed()

        this.mockWeth = await MockWeth.new({ from: Melkor })
        this.behodler = await MockBehodler.new(this.mockWeth.address, { from: Melkor })
        this.lachesis = await MockLachesis2.new({ from: Melkor })
        await this.lachesis.setBehodler(this.behodler.address, { from: Melkor })
        await this.behodler.setLachesis(this.lachesis.address, { from: Melkor })
        this.angband = await Angband.new(this.powersRegistry.address, { from: Melkor })
        this.angband.finalizeSetup({ from: Melkor });

        //add behodler to angband
        await this.behodler.transferOwnership(this.angband.address, { from: Melkor })
        await this.lachesis.transferOwnership(this.angband.address, { from: Melkor })

        await this.powersRegistry.create(stringToBytes('POINT_TO_BEHODLER'), stringToBytes('ANGBAND'), true, false, { from: Melkor })
        await this.powersRegistry.pour(stringToBytes('POINT_TO_BEHODLER'), stringToBytes('Melkor'), { from: Melkor })
        await this.angband.setBehodler(this.behodler.address, this.lachesis.address, { from: Melkor })

        await this.powersRegistry.create(stringToBytes('CONFIGURE_SCARCITY'), stringToBytes('BEHODLER'), true, false, { from: Melkor })
        await this.powersRegistry.pour(stringToBytes('CONFIGURE_SCARCITY'), stringToBytes('Melkor'), { from: Melkor })

        await this.powersRegistry.create(stringToBytes('TREASURER'), stringToBytes('ANGBAND'), true, false, { from: Melkor })
        await this.powersRegistry.pour(stringToBytes('TREASURER'), stringToBytes('Melkor'), { from: Melkor })

        //deploy a new token
        this.burnableToken = await BurnableToken.new({ from: Melkor })
    })

    it("sets lachesis on behodler and then sets it on angband as Melkor", async function () {
        //measure lachesis on each token.
        const newLachesis = await MockLachesis.new({ from: Melkor });
        const newWeth = accounts[3]
        const newFlashLoanArbiter = accounts[2]
        const newPyroTokenLiquidityReceiver = accounts[5]
        const newWeidaiReserve = accounts[6]
        const newDai = accounts[7]
        const newWeiDai = accounts[1]

        let replaceOnMorgothInvokerInstance = await ReplaceOnMorgothInvoker.new(this.angband.address, newLachesis.address, this.behodler.address, { from: Melkor })
        await this.powersRegistry.spread(stringToBytes('POINT_TO_BEHODLER'), stringToBytes('Ungoliant'), { from: Melkor })
        await this.angband.authorizeInvoker(replaceOnMorgothInvokerInstance.address, true, { from: Melkor })

        /*
      address public Weth;
    address public Lachesis;
    address pyroTokenLiquidityReceiver;
    FlashLoanArbiter public arbiter;
        */

        let replaceOnBehodlerInvokerInstance = await ReplaceOnBehodlerInvoker.new(this.angband.address, newWeth, newLachesis.address, newFlashLoanArbiter,
            newPyroTokenLiquidityReceiver, newWeidaiReserve, newDai, newWeiDai, { from: Melkor })
        await this.angband.authorizeInvoker(replaceOnBehodlerInvokerInstance.address, true)



        await this.powersRegistry.bondUserToMinion(replaceOnMorgothInvokerInstance.address, stringToBytes("Ungoliant"), { from: Melkor })

        await newLachesis.transferOwnership(this.angband.address)

        console.log('bytes: ' + stringToBytes('CONFIGURE_SCARCITY'))
        await this.angband.executePower(replaceOnBehodlerInvokerInstance.address, { from: Melkor })
        await this.angband.executePower(replaceOnMorgothInvokerInstance.address, { from: Melkor })

        const weth = await this.behodler.Weth.call()
        const lachesis = await this.behodler.Lachesis.call()
        const arbiter = await this.behodler.arbiter.call()

        expect(weth).to.equal(newWeth)
        expect(lachesis).to.equal(newLachesis.address)
        expect(arbiter).to.equal(newFlashLoanArbiter)

        const newLachesisOwner = await newLachesis.owner.call()
        expect(newLachesisOwner).to.equal(this.angband.address)
    })

    it("measures a batch of tokens on Lachesis", async function () {
        /*
        OXT: 0x4575f41308ec1483f3d399aa9a2826d74da13deb
        PNK: 0x93ed3fbe21207ec2e8f2d3c3de6e058cb73bc04d
        Weth: 0x4f5704D9D2cbCcAf11e70B34048d41A0d572993F,
        Link: 0x514910771af9ca656af840dff83e8264ecf986ca,
        WeiDai:0xaFEf0965576070D1608F374cb14049EefaD218Ec,
        Loom: 0x42476F744292107e34519F9c357927074Ea3F75D,
        Maker: 0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2,
        Dai: 0x6b175474e89094c44da98b954eedeac495271d0f,
        Eye: 0x155ff1A85F440EE0A382eA949f24CE4E0b751c65,
        EYE/DAI UniV2LP: 0x890ff7533ca0c44f33167fdeeeab1ca7e690634f,
        SCX/ETH UniV2LP: 0x319ead06eb01e808c80c7eb9bd77c5d8d163addb,
        SCX/EYE UniV2LP: 0xf047ee812b21050186f86106f6cabdfec35366c6
        */
        const newLachesis = await MockLachesis.new({ from: Melkor });
        const massLachesis = await MassLachesis.new(newLachesis.address, { from: Melkor })

        await newLachesis.transferOwnership(massLachesis.address, { from: Melkor })
        await expectRevert(massLachesis.measureAll({ from: accounts[3] }), "Ownable: caller is not the owner");
        await massLachesis.measureAll({ from: Melkor });

        const owner = await newLachesis.owner()
        expect(owner).to.equal(Melkor)
        const stringify = (object) => JSON.stringify(object)
        expect(stringify(await newLachesis.cut.call('0x4575f41308ec1483f3d399aa9a2826d74da13deb'))).to.equal('{"0":true,"1":false}')
        expect(stringify(await newLachesis.cut.call('0x93ed3fbe21207ec2e8f2d3c3de6e058cb73bc04d'))).to.equal('{"0":true,"1":false}')
        expect(stringify(await newLachesis.cut.call('0x4f5704D9D2cbCcAf11e70B34048d41A0d572993F'))).to.equal('{"0":true,"1":false}')
        expect(stringify(await newLachesis.cut.call('0x514910771af9ca656af840dff83e8264ecf986ca'))).to.equal('{"0":true,"1":false}')
        expect(stringify(await newLachesis.cut.call('0xaFEf0965576070D1608F374cb14049EefaD218Ec'))).to.equal('{"0":true,"1":true}')
        expect(stringify(await newLachesis.cut.call('0x42476F744292107e34519F9c357927074Ea3F75D'))).to.equal('{"0":true,"1":false}')
        expect(stringify(await newLachesis.cut.call('0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2'))).to.equal('{"0":true,"1":true}')
        expect(stringify(await newLachesis.cut.call('0x6b175474e89094c44da98b954eedeac495271d0f'))).to.equal('{"0":true,"1":false}')
        expect(stringify(await newLachesis.cut.call('0x155ff1A85F440EE0A382eA949f24CE4E0b751c65'))).to.equal('{"0":true,"1":true}')
        expect(stringify(await newLachesis.cut.call('0x890ff7533ca0c44f33167fdeeeab1ca7e690634f'))).to.equal('{"0":true,"1":false}')
        expect(stringify(await newLachesis.cut.call('0x319ead06eb01e808c80c7eb9bd77c5d8d163addb'))).to.equal('{"0":true,"1":false}')
        expect(stringify(await newLachesis.cut.call('0xf047ee812b21050186f86106f6cabdfec35366c6'))).to.equal('{"0":true,"1":false}')
    })

    it("prints treasury, configure_scarcity,point_to_behodler", async function () {
       // console.log(`Treasurer: ${stringToBytes('TREASURER')}, Melkor: ${stringToBytes('Melkor')}, Ungoliant: ${stringToBytes('Ungoliant')}, CONFIGURE_SCARCITY:${stringToBytes('CONFIGURE_SCARCITY')}, POINT_TO_BEHODLER:${stringToBytes('POINT_TO_BEHODLER')}`)
        console.log('TREASURER: '+web3.utils.asciiToHex("TREASURER"))
    })
    // it("sets lachesis on behodler and then sets it on angband as Melkor via order 66", async function () {
    //     //measure lachesis on each token.
    //     const newLachesis = await MockLachesis.new({ from: Melkor });
    //     const newWeth = accounts[3]
    //     const newFlashLoanArbiter = accounts[2]
    //     const newPyroTokenLiquidityReceiver = accounts[5]
    //     const newWeidaiReserve = accounts[6]
    //     const newDai = accounts[7]
    //     const newWeiDai = accounts[1]


    //     /*
    //   address public Weth;
    // address public Lachesis;
    // address pyroTokenLiquidityReceiver;
    // FlashLoanArbiter public arbiter;
    //     */
    //     await this.powersRegistry.create(stringToBytes('ORDER66'), stringToBytes('ANGBAND'), true, false, { from: Melkor })
    //     await this.powersRegistry.pour(stringToBytes('ORDER66'), stringToBytes('Melkor'), { from: Melkor })
    //     await this.angband.executeOrder66();

    //     await this.behodler.seed(
    //         newWeth,
    //         newLachesis.address,
    //         newFlashLoanArbiter,
    //         newPyroTokenLiquidityReceiver,
    //         newWeidaiReserve,
    //         newDai,
    //         newWeiDai
    //     );
    //     await this.behodler.transferOwnership(this.angband.address)
    //     await newLachesis.transferOwnership(this.angband.address)
    //     await this.angband.setBehodler(this.behodler.address, newLachesis.address, { from: Melkor })


    //     const weth = await this.behodler.Weth.call()
    //     const lachesis = await this.behodler.Lachesis.call()
    //     const arbiter = await this.behodler.arbiter.call()

    //     expect(weth).to.equal(newWeth)
    //     expect(lachesis).to.equal(newLachesis.address)
    //     expect(arbiter).to.equal(newFlashLoanArbiter)

    //     await this.angband.executeOrder66()
    //     await this.behodler.transferOwnership(this.angband.address)
    //     await newLachesis.transferOwnership(this.angband.address)
    //     await this.angband.setBehodler(this.behodler.address, newLachesis.address, { from: Melkor })

    //     const newOwnerBehodler = await this.behodler.owner.call()
    //     const newOwnerLachesis = await newLachesis.owner.call()

    //     expect(newOwnerBehodler).to.equal(this.angband.address)
    //     expect(newOwnerLachesis).to.equal(this.angband.address)

    // })
})