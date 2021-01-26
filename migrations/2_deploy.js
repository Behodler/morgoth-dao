const PowersRegistry = artifacts.require('PowersRegistry')
const Angband = artifacts.require('Angband')
const Migrator = artifacts.require('Migrator')
const SetSilmarilPower = artifacts.require('SetSilmarilPower')
const MockLiquidityReceiver = artifacts.require('MockLiquidityReceiver')
const redis = require('redis')
const client = redis.createClient();
client.on('error', console.log)
const { promisify } = require("util");
const get = promisify(client.get).bind(client);
const web3 = require('web3')
const stringToBytes = (s) => web3.utils.fromAscii(s)

module.exports = async function (deployer, network, accounts) {
    const [Melkor, miningContract, devWallet] = accounts
    const behodler1 = await get('behodler1')
    const lachesis1 = await get('lachesis1')
    const scarcity1 = await get('scarcity1')
    const behodler2 = await get('behodler2')
    const lachesis2 = await get('behodler2')
    //load addresses for lachesis1, Scarcity1, Behodler1, Behodler2, Scarcity2

    const melkorOption = { from: Melkor }
    await deployer.deploy(MockLiquidityReceiver)
    const mockeLiquidityReceiverInstance = await MockLiquidityReceiver.deployed()
    //create and seed powers
    await deployer.deploy(PowersRegistry, melkorOption)
    const powersRegistryInstance = await PowersRegistry.deployed()
    await powersRegistryInstance.seed()

    //create angband
    await deployer.deploy(Angband, powersRegistryInstance.address, melkorOption)
    const angbandInstance = await Angband.deployed(powersRegistryInstance.address, melkorOption)
    console.log('FINALIZE ANGBAND')
    await angbandInstance.finalizeSetup(melkorOption)
    console.log('Creating power')
    //empower melkor to wire angband and add tokens to behodler and map appropriate domains
    await powersRegistryInstance.create(stringToBytes('ADD_TOKEN_TO_BEHODLER'), stringToBytes('LACHESIS'), true, false, { from: Melkor })
    await powersRegistryInstance.pour(stringToBytes('ADD_TOKEN_TO_BEHODLER'), stringToBytes('Melkor'), { from: Melkor })
    console.log('Creating power')
    await powersRegistryInstance.create(stringToBytes('WIRE_ANGBAND'), stringToBytes('LACHESIS'), true, false, { from: Melkor })
    await powersRegistryInstance.pour(stringToBytes('WIRE_ANGBAND'), stringToBytes('Melkor'), { from: Melkor })
    console.log('Creating power')
    await powersRegistryInstance.create(stringToBytes('POINT_TO_BEHODLER'), stringToBytes('ANGBAND'), true, false, { from: Melkor })
    await powersRegistryInstance.pour(stringToBytes('POINT_TO_BEHODLER'), stringToBytes('Melkor'), { from: Melkor })
    console.log('Creating power')
    //empower melkor to INSERT_SILMARIL
    await powersRegistryInstance.create(stringToBytes('INSERT_SILMARIL'), stringToBytes('IRON_CROWN'), true, false, { from: Melkor })
    await powersRegistryInstance.pour(stringToBytes('INSERT_SILMARIL'), stringToBytes('Melkor'), { from: Melkor })
    console.log('Creating power')
    await powersRegistryInstance.create(stringToBytes('AUTHORIZE_INVOKER'), stringToBytes('ANGBAND'), true, false, { from: Melkor })
    await powersRegistryInstance.pour(stringToBytes('AUTHORIZE_INVOKER'), stringToBytes('Melkor'), { from: Melkor })

    //INSERT_SILMARILS: can't insert until after migration.
    /* const [mining, dev, treasury] = [0, 1, 2]
 
     await deployer.deploy(SetSilmarilPower, stringToBytes('INSERT_SILMARIL'), angbandInstance.address, melkorOption)
     const setSilmarilPowerInstance1 = await SetSilmarilPower.deployed()
     await angbandInstance.authorizeInvoker(setSilmarilPowerInstance1.address, true, { from: Melkor })
     await setSilmarilPowerInstance1.parameterize(mining, 500, miningContract, melkorOption)
     await angbandInstance.executePower(setSilmarilPowerInstance1.address, melkorOption)
     await setSilmarilPowerInstance1.destruct({ from: Melkor })
 
 
     await deployer.deploy(SetSilmarilPower, stringToBytes('INSERT_SILMARIL'), angbandInstance.address, melkorOption)
     const setSilmarilPowerInstance2 = await SetSilmarilPower.deployed()
     await angbandInstance.authorizeInvoker(setSilmarilPowerInstance2.address, true, { from: Melkor })
     await setSilmarilPowerInstance2.parameterize(dev, 250, devWallet, melkorOption)
     await angbandInstance.executePower(setSilmarilPowerInstance2.address, melkorOption)
     await setSilmarilPowerInstance2.destruct({ from: Melkor })
 
     await deployer.deploy(SetSilmarilPower, stringToBytes('INSERT_SILMARIL'), angbandInstance.address, melkorOption)
     const setSilmarilPowerInstance3 = await SetSilmarilPower.deployed()
     await angbandInstance.authorizeInvoker(setSilmarilPowerInstance3.address, true, { from: Melkor })
     await setSilmarilPowerInstance3.parameterize(treasury, 250, angbandInstance.address, melkorOption)
     await angbandInstance.executePower(setSilmarilPowerInstance3.address, melkorOption)
     await setSilmarilPowerInstance3.destruct({ from: Melkor })
 */
    //instantiate Migrator
    console.log('getting weidai')
    const weidai = await get('weidai')
    console.log('getting dai')
    const dai = await get('dai')
    console.log('getting eye')
    const eye = await get('eye')
    console.log(`weidai ${weidai} dai ${dai} eye ${eye}`)
    console.log(`behodler1 ${behodler1} scarcity1 ${scarcity1} lachesis1 ${lachesis1} behodler2 ${behodler2} lachesis2 ${lachesis2}`)
    //Migrator
    await deployer.deploy(Migrator, behodler1, scarcity1, lachesis1, behodler2, lachesis2, weidai, eye, angbandInstance.address, this.mockeLiquidityReceiverInstance.address, "0x0000000000000000000000000000000000000000")
    console.log('quitting')
    client.quit()
}