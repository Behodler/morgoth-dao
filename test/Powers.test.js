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

        const MelkorHasSetUserPower = await this.powersRegistry.userHasPower.call(stringToBytes('BOND_USER_TO_MINION'), Melkor)
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
        await this.powersRegistry.bondUserToMinion(secondary, stringToBytes('orc'), { from: Melkor })
        await expectRevert(this.powersRegistry.create(stringToBytes('FAKE_POWER'), stringToBytes('POWERREGISTRY'), true, false, { from: secondary })
            , "MORGOTH: forbidden power")
    })

    it('non melkor tries to bond a user and fails', async function () {
        await this.powersRegistry.bondUserToMinion(secondary, stringToBytes('Sauron'), { from: Melkor })
        await expectRevert(this.powersRegistry.bondUserToMinion(owner, stringToBytes('Sauron'), { from: secondary }),
            "MORGOTH: forbidden power")
    })

    it('Pouring non transferrable power fails', async function () {
        await this.powersRegistry.create(stringToBytes('FAKE_POWER'), stringToBytes('POWERREGISTRY'), false, false, { from: Melkor })
        await expectRevert(this.powersRegistry.pour(stringToBytes('FAKE_POWER'), stringToBytes('Melkor'), { from: Melkor }),
            "MORGOTH: power not transferrable");

    })

    it('Pouring transferrable power succeeds', async function () {
        await this.powersRegistry.create(stringToBytes('FAKE_POWER'), stringToBytes('POWERREGISTRY'), false, false, { from: Melkor })
        await expectRevert(this.powersRegistry.pour(stringToBytes('FAKE_POWER'), stringToBytes('Melkor'), { from: Melkor }),
            "MORGOTH: power not transferrable");
    })

    it('Spreading unique power fails', async function () {

        await this.powersRegistry.create(stringToBytes('FAKE_POWER'), stringToBytes('POWERREGISTRY'), true, true, { from: Melkor })
        await this.powersRegistry.pour(stringToBytes('FAKE_POWER'), stringToBytes('Melkor'), { from: Melkor })

        await this.powersRegistry.bondUserToMinion(secondary, stringToBytes('Glaurung'), { from: Melkor })
        await expectRevert(this.powersRegistry.spread(stringToBytes('FAKE_POWER'), stringToBytes('Glaurung'), { from: Melkor }), "MORGOTH: power not divisible.")
    })

    it('Spreading non unique power succeeds', async function () {
        await this.powersRegistry.create(stringToBytes('FAKE_POWER'), stringToBytes('POWERREGISTRY'), true, false, { from: Melkor })
        await this.powersRegistry.pour(stringToBytes('FAKE_POWER'), stringToBytes('Melkor'), { from: Melkor })

        const melkorhasPower = await this.powersRegistry.userHasPower.call(stringToBytes('FAKE_POWER'), Melkor)
        assert.isTrue(melkorhasPower)

        await this.powersRegistry.bondUserToMinion(secondary, stringToBytes('Glaurung'), { from: Melkor })
        await this.powersRegistry.spread(stringToBytes('FAKE_POWER'), stringToBytes('Glaurung'), { from: Melkor })
        const secondaryhasFakePower = await this.powersRegistry.userHasPower.call(stringToBytes('FAKE_POWER'), secondary)
        assert.isTrue(secondaryhasFakePower)

        const melkorStillhasPower = await this.powersRegistry.userHasPower.call(stringToBytes('FAKE_POWER'), Melkor)
        assert.isTrue(melkorStillhasPower)
    })
})