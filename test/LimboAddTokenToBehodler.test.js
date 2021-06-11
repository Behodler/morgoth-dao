const { expectRevert, ether } = require("@openzeppelin/test-helpers");
const { expect, assert } = require("chai");
const { BNtoBigInt } = require("./helpers/BigIntUtil");
const bigNum = require("./helpers/BigIntUtil");
const Angband = artifacts.require("Angband");
const PowersRegistry = artifacts.require("PowersRegistry");
const MockBehodler = artifacts.require("MockBehodler2");
const MockLachesis2 = artifacts.require("MockLachesis2");
const BurnableToken = artifacts.require("MockToken");
const Invoker = artifacts.require("LimboAddTokenToBehodler");
const MockWeth = artifacts.require("MockWeth1");
const MockLimbo = artifacts.require("MockLimbo");

const stringToBytes = (s) => web3.utils.fromAscii(s);
contract("LimboAddTokenToBehodler", async function (accounts) {
  const [Melkor, secondary, adder] = accounts;

  before(async function () {
    //wire up angband
    this.powersRegistry = await PowersRegistry.new({ from: Melkor });
    await this.powersRegistry.seed();

    this.mockWeth = await MockWeth.new({ from: Melkor });
    this.behodler = await MockBehodler.new(this.mockWeth.address, {
      from: Melkor,
    });
    this.mockLimbo = await MockLimbo.new({ from: Melkor });
    this.lachesis = await MockLachesis2.new({ from: Melkor });
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

    await this.powersRegistry.create(
      stringToBytes("POINT_TO_BEHODLER"),
      stringToBytes("ANGBAND"),
      true,
      false,
      { from: Melkor }
    );
    await this.powersRegistry.pour(
      stringToBytes("POINT_TO_BEHODLER"),
      stringToBytes("Melkor"),
      { from: Melkor }
    );
    await this.angband.setBehodler(
      this.behodler.address,
      this.lachesis.address,
      { from: Melkor }
    );

    //deploy a new token
    this.burnableToken = await BurnableToken.new({ from: Melkor });
  });

  it("adding burnable and non burnable tokens to behodler succeeds", async function () {
    //bond user to minion
    await this.powersRegistry.bondUserToMinion(
      adder,
      stringToBytes("Glaurung"),
      { from: Melkor }
    );
    //pour power to adder
    await this.powersRegistry.create(
      stringToBytes("ADD_TOKEN_TO_BEHODLER"),
      stringToBytes("LACHESIS"),
      true,
      false,
      { from: Melkor }
    );
    await this.powersRegistry.pour(
      stringToBytes("ADD_TOKEN_TO_BEHODLER"),
      stringToBytes("Glaurung"),
      { from: Melkor }
    );

    await this.powersRegistry.create(
      stringToBytes("WIRE_ANGBAND"),
      stringToBytes("ANGBAND"),
      true,
      false,
      { from: Melkor }
    );
    await this.powersRegistry.pour(
      stringToBytes("WIRE_ANGBAND"),
      stringToBytes("Melkor"),
      { from: Melkor }
    );
    await this.angband.mapDomain(
      this.lachesis.address,
      stringToBytes("LACHESIS"),
      { from: Melkor }
    );
    this.invoker = await Invoker.new(
      this.angband.address,
      this.mockLimbo.address,
      { from: adder }
    );
    await this.mockLimbo.setPower(this.invoker.address, { from: Melkor });
    await this.mockLimbo.parameterizePower(this.burnableToken.address, true, {
      from: Melkor,
    });
    await this.burnableToken.transfer(this.invoker.address, 1000000, {
      from: Melkor,
    });

    await this.powersRegistry.create(
      stringToBytes("AUTHORIZE_INVOKER"),
      stringToBytes("ANGBAND"),
      true,
      false,
      { from: Melkor }
    );

    await this.powersRegistry.pour(
      stringToBytes("AUTHORIZE_INVOKER"),
      stringToBytes("Melkor"),
      { from: Melkor }
    );

    await this.angband.authorizeInvoker(this.invoker.address, true, {
      from: Melkor,
    });

    //assert it isn't on behodler
    const burnableBefore = await this.behodler.tokenBurnable.call(
      this.burnableToken.address
    );

    const validBefore = await this.behodler.validTokens.call(
      this.burnableToken.address
    );
    assert.isFalse(burnableBefore);
    assert.isFalse(validBefore);
    const limboSCXBefore = BigInt(
      (await this.behodler.balanceOf.call(this.mockLimbo.address)).toString()
    );
    //invoke
    await this.angband.executePower(this.invoker.address, { from: adder });
    //assert it is on behodler and is burnable

    const burnableAfter = await this.behodler.tokenBurnable.call(
      this.burnableToken.address
    );

    console.log("burnable address: " + this.burnableToken.address);
    const validAfter = await this.behodler.validTokens.call(
      this.burnableToken.address
    );
    assert.isTrue(burnableAfter);
    assert.isTrue(validAfter);

    // //TODO: assert mocklimbo now has SCX
    const limboSCXAfter = BigInt(
      (await this.behodler.balanceOf.call(this.mockLimbo.address)).toString()
    );
    console.log(`before: ${limboSCXBefore}, after: ${limboSCXAfter}`);
    assert.equal(limboSCXBefore, 0n);
    assert.equal(limboSCXAfter, 2000000n);
  });

  it("parameterizing as non mock limbo fails", async function () {
    //bond user to minion
    // await this.powersRegistry.bondUserToMinion(
    //   adder,
    //   stringToBytes("Glaurung"),
    //   { from: Melkor }
    // );
    //pour power to adder
    await this.powersRegistry.create(
      stringToBytes("ADD_TOKEN_TO_BEHODLER"),
      stringToBytes("LACHESIS"),
      true,
      false,
      { from: Melkor }
    );
    await this.powersRegistry.pour(
      stringToBytes("ADD_TOKEN_TO_BEHODLER"),
      stringToBytes("Glaurung"),
      { from: Melkor }
    );

    await this.powersRegistry.create(
      stringToBytes("WIRE_ANGBAND"),
      stringToBytes("ANGBAND"),
      true,
      false,
      { from: Melkor }
    );
    await this.powersRegistry.pour(
      stringToBytes("WIRE_ANGBAND"),
      stringToBytes("Melkor"),
      { from: Melkor }
    );
    await this.angband.mapDomain(
      this.lachesis.address,
      stringToBytes("LACHESIS"),
      { from: Melkor }
    );
    this.invoker = await Invoker.new(
      this.angband.address,
      this.mockLimbo.address,
      { from: adder }
    );

    this.mockLimbo.setPower(this.invoker.address, { from: Melkor });
    await expectRevert(
      this.invoker.parameterize(this.burnableToken.address, true, {
        from: Melkor,
      }),
      "MORGOTH: Only Limbo can migrate tokens from Limbo."
    );
  });

  it("calling more than once without parameterizing fails", async function () {
    //pour power to adder
    await this.powersRegistry.create(
      stringToBytes("ADD_TOKEN_TO_BEHODLER"),
      stringToBytes("LACHESIS"),
      true,
      false,
      { from: Melkor }
    );
    await this.powersRegistry.pour(
      stringToBytes("ADD_TOKEN_TO_BEHODLER"),
      stringToBytes("Glaurung"),
      { from: Melkor }
    );

    await this.powersRegistry.create(
      stringToBytes("WIRE_ANGBAND"),
      stringToBytes("ANGBAND"),
      true,
      false,
      { from: Melkor }
    );
    await this.powersRegistry.pour(
      stringToBytes("WIRE_ANGBAND"),
      stringToBytes("Melkor"),
      { from: Melkor }
    );
    await this.angband.mapDomain(
      this.lachesis.address,
      stringToBytes("LACHESIS"),
      { from: Melkor }
    );
    this.invoker = await Invoker.new(
      this.angband.address,
      this.mockLimbo.address,
      { from: adder }
    );
    await this.mockLimbo.setPower(this.invoker.address, { from: Melkor });
    await this.mockLimbo.parameterizePower(this.burnableToken.address, true, {
      from: Melkor,
    });
    await this.burnableToken.transfer(this.invoker.address, 1000000, {
      from: Melkor,
    });

    await this.powersRegistry.create(
      stringToBytes("AUTHORIZE_INVOKER"),
      stringToBytes("ANGBAND"),
      true,
      false,
      { from: Melkor }
    );

    await this.powersRegistry.pour(
      stringToBytes("AUTHORIZE_INVOKER"),
      stringToBytes("Melkor"),
      { from: Melkor }
    );

    await this.angband.authorizeInvoker(this.invoker.address, true, {
      from: Melkor,
    });

    //invoke
    await this.angband.executePower(this.invoker.address, { from: adder });
    //assert it is on behodler and is burnable

    await expectRevert(
      this.angband.executePower(this.invoker.address, { from: adder }),
      "MORGOTH: PowerInvoker not parameterized."
    );
  });
});
