const { accounts, contract } = require('@openzeppelin/test-environment');
const { expectEvent, expectRevert, ether } = require('@openzeppelin/test-helpers');
const web3 = require('web3')
const { expect, assert } = require('chai');
const { BNtoBigInt } = require('./helpers/BigIntUtil');
const bigNum = require('./helpers/BigIntUtil')

const PowersRegistry = contract.fromArtifact('PowersRegistry')
describe('Powers', async function () {
    const [owner, secondary, Melkor] = accounts;
    const stringToBytes = (s) => web3.utils.fromAscii(s)
    beforeEach(async function () {
        this.powersRegistry = await PowersRegistry.new({ from: Melkor })
        await this.powersRegistry.seed()
    })

    it('Melkor has correct powers, deployer is Melkor', async function () {
        const melkorHasCreateNewPower = await this.powersRegistry.userHasPower.call(stringToBytes('CREATE_NEW_POWER'), Melkor)
        assert.isTrue(melkorHasCreateNewPower)

        const MelkorHasSeizePower = await this.powersRegistry.userHasPower.call(stringToBytes('SEIZE_POWER'), Melkor)
        assert.isTrue(melkorHasCreateNewPower)

        const MelkorHasSetUserPower = await this.powersRegistry.userHasPower.call(stringToBytes('SET_USER_AS_MINION'), Melkor)
        assert.isTrue(MelkorHasSetUserPower)
    })

    it('Melkor creates new power and seizes it', async function () {
        let melkorHasFakePower = await this.powersRegistry.userHasPower.call(stringToBytes('FAKE_POWER'), Melkor)
        assert.isFalse(melkorHasFakePower)

        await this.powersRegistry.create(stringToBytes('FAKE_POWER'), stringToBytes('POWERREGISTRY'), true, false, { from: Melkor })
        melkorHasFakePower = await this.powersRegistry.userHasPower.call(stringToBytes('FAKE_POWER'), Melkor)
        assert.isFalse(melkorHasFakePower)
        await this.powersRegistry.pour(stringToBytes('FAKE_POWER'), stringToBytes('Melkor'), { from: Melkor })

        melkorHasFakePower = await this.powersRegistry.userHasPower.call(stringToBytes('FAKE_POWER'), Melkor)
        assert.isTrue(melkorHasFakePower)
    })

    it('New bonded user creates new power, fails', async function () {

    })

    it('Pouring non transferrable power fails', async function () {

    })

    it('Pouring transferrable power succeeds', async function () {

    })

    it('Spreading unique power fails', async function () {

    })

    it('Spreading non unique power fails', async function () {

    })

    it('dummy empowered contract tests each modifier', async function () {

    })

    it(`dummy empowered anyone can change power registry if unset, 
    only empowered can change if set`, async function () {

    })
})