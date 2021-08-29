const { expectRevert, ether } = require("@openzeppelin/test-helpers");
const { expect, assert } = require("chai");
const { BNtoBigInt } = require("./helpers/BigIntUtil");
const bigNum = require("./helpers/BigIntUtil");
const Angband = artifacts.require("Angband");
const PowersRegistry = artifacts.require("PowersRegistry");
const Behodler = artifacts.require("BehodlerLite");
const MockLachesis2 = artifacts.require("MockLachesis2");
const BurnableToken = artifacts.require("MockToken");
const Invoker = artifacts.require("LimboAddTokenToBehodler");
const MockWeth = artifacts.require("MockWeth1");
const MockLimbo = artifacts.require("MockLimbo");
const RealLiquidityReceiver = artifacts.require("RealLiquidityReceiver");
const FlanGenesisRegisterFlan = artifacts.require("FlanGenesisRegisterFlan");
const LachesisLite = artifacts.require("LachesisLite");
const AddressBalanceCheckLib = artifacts.require("AddressBalanceCheck");
const RealUniswapV2Factory = artifacts.require("RealUniswapV2Factory");
const FlanGenesisRegisterPyroFlan = artifacts.require(
  "FlanGenesisRegisterPyroFlan"
);

const stringToBytes = (s) => web3.utils.fromAscii(s);
contract("Flangenesis", async function (accounts) {
  const [Melkor, secondary, adder] = accounts;
  before(async function () {
    //wire up angband
    this.powersRegistry = await PowersRegistry.new({ from: Melkor });
    await this.powersRegistry.seed();

    const addressBalanceCheck = await AddressBalanceCheckLib.new();
    await Behodler.link("AddressBalanceCheck", addressBalanceCheck.address);
    this.behodler = await Behodler.new();

    this.mockLimbo = await MockLimbo.new({ from: Melkor });
    this.lachesis = await MockLachesis2.new({ from: Melkor });
    this.realLiquidityReceiver = await RealLiquidityReceiver.new(
      this.lachesis.address,
      {
        from: Melkor,
      }
    );

    await this.lachesis.setBehodler(this.behodler.address, { from: Melkor });
    await this.behodler.setLachesis(this.lachesis.address, { from: Melkor });
    this.angband = await Angband.new(this.powersRegistry.address, {
      from: Melkor,
    });
    this.angband.finalizeSetup({ from: Melkor });

    //add behodler to angband
    await this.behodler.transferOwnership(this.angband.address, {
      from: Melkor,
    });
    await this.lachesis.transferOwnership(this.angband.address, {
      from: Melkor,
    });

    await this.realLiquidityReceiver.transferOwnership(this.angband.address, {
      from: Melkor,
    });

    await this.angband.mapDomain(
      this.realLiquidityReceiver.address,
      stringToBytes("LIQUIDITYRECEIVER")
    );

    await this.powersRegistry.create(
      stringToBytes("POINT_TO_BEHODLER"),
      stringToBytes("ANGBAND"),
      true,
      false,
      { from: Melkor }
    );

    await this.powersRegistry.create(
      stringToBytes("PYROADMIN"),
      stringToBytes("LIQUIDITYRECEIVER"),
      true,
      false,
      { from: Melkor }
    );

    await this.powersRegistry.pour(
      stringToBytes("POINT_TO_BEHODLER"),
      stringToBytes("Melkor"),
      { from: Melkor }
    );

    await this.powersRegistry.pour(
      stringToBytes("PYROADMIN"),
      stringToBytes("Melkor"),
      { from: Melkor }
    );
    await this.angband.setBehodler(
      this.behodler.address,
      this.lachesis.address,
      { from: Melkor }
    );

    //deploy a new token
    this.flan = await BurnableToken.new({ from: Melkor });
    this.dai = await BurnableToken.new({ from: Melkor });
  });

  it("seeds behodler with flan and then creates pyrotokens, gaspayer gets reimbursed", async function () {
    //seed behodler with dai
    await this.dai.mint(this.behodler.address, "1234567891011121314", {
      from: Melkor,
    });
    const realUniswap = await RealUniswapV2Factory.new(Melkor, {
      from: Melkor,
    });
    const realSushiswap = await RealUniswapV2Factory.new(Melkor, {
      from: Melkor,
    });

    this.flanGenesisRegisterPower = await FlanGenesisRegisterFlan.new(
      this.angband.address,
      this.dai.address,
      realUniswap.address,
      realSushiswap.address,
      this.flan.address,
      this.behodler.address,
      this.realLiquidityReceiver.address,
      { from: Melkor }
    );

    await this.angband.authorizeInvoker(
      this.flanGenesisRegisterPower.address,
      true,
      { from: Melkor }
    );
    await this.angband.executePower(this.flanGenesisRegisterPower.address, {
      from: Melkor,
    });

    const flanAddedToBehodler = (
      await this.flan.balanceOf(this.behodler.address)
    ).toString();
    assert.equal(flanAddedToBehodler, "1234567891011121314");

    const flanGenesisRegisterPyroFlan = await FlanGenesisRegisterPyroFlan.new(
      this.angband.address,
      this.realLiquidityReceiver.address,
      this.flan.address,
      Melkor
    );

    await this.angband.authorizeInvoker(
      flanGenesisRegisterPyroFlan.address,
      true,
      { from: Melkor }
    );
    await this.angband.executePower(flanGenesisRegisterPyroFlan.address, {
      from: Melkor,
    });

    const pyroFlanAddress = await this.realLiquidityReceiver.baseTokenMapping(this.flan.address);
    const pyroFlan = await BurnableToken.at(pyroFlanAddress);
    const balance = await pyroFlan.balanceOf(Melkor);
    assert.equal(balance.toString(), "499500000000000000000"); //burn on transfer
  });
});
