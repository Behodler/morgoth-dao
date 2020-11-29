const { accounts, contract } = require('@openzeppelin/test-environment');
const { expectEvent, expectRevert, ether } = require('@openzeppelin/test-helpers');
const { expect, assert } = require('chai');
const { BNtoBigInt } = require('./helpers/BigIntUtil');
const bigNum = require('./helpers/BigIntUtil')
const DummyInvoker = contract.fromArtifact('DummyInvoker')

describe('Angband', async function () {
    const [owner, secondary] = accounts;

    beforeEach(async function () {})

    it('only minion with WIRE_ANGBAND can set registry',async function (){
        
    })

    it('only minion with POINT_TO_BEHODLER can set behodler',async function (){
        
    })
    
    it('dummy invoker not authorized cannot be invoked', async function(){
        
    })

    it('only invocable user can executePower for dummy powerInvoker',async function (){
        
    })

    it(`powerInvoker which does not return ownership fails in execute power,
    same invoker which does return ownership succeeds`,async function (){
        
    })

    it(`ownership of behodler and lachesis returned after execute order66`,async function (){
        
    })

    it(`executeORder66 fails after cooldown period`,async function (){
        
    })

    it('dummy invoker requires user have power on invocation', async function () {
        this.dummyInvoker = await DummyInvoker.new()
      //  await this.ang
    })
})