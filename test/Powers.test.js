const { accounts, contract } = require('@openzeppelin/test-environment');
const { expectEvent, expectRevert, ether } = require('@openzeppelin/test-helpers');
const { expect, assert } = require('chai');
const { BNtoBigInt } = require('./helpers/BigIntUtil');
const bigNum = require('./helpers/BigIntUtil')

describe('Powers', async function () {
    const [owner, secondary] = accounts;

    beforeEach(async function () {
        
    })

    it('Melkor has correct powers, deployer is Melkor',async function (){
        
    })

    it('Melkor creates new power and seizes it',async function (){
        
    })

    it('New bonded user creates new power, fails',async function (){
        
    })

    it('Pouring non transferrable power fails',async function (){
        
    })

    it('Pouring transferrable power succeeds',async function (){
        
    })

    it('Spreading unique power fails',async function (){
        
    })

    it('Spreading non unique power fails',async function (){
        
    })

    it('dummy empowered contract tests each modifier',async function (){
        
    })  

    it(`dummy empowered anyone can change power registry if unset, 
    only empowered can change if set`,async function (){
        
    })  
})