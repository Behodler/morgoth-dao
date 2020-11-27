const { accounts, contract } = require('@openzeppelin/test-environment');
const { expectEvent, expectRevert, ether } = require('@openzeppelin/test-helpers');
const { expect, assert } = require('chai');
const { BNtoBigInt } = require('./helpers/BigIntUtil');
const bigNum = require('./helpers/BigIntUtil')

describe('IronCrown', async function () {
    const [owner, secondary] = accounts;

    beforeEach(async function () {})

    it('setSilmarils requires INSERT_SILMARIL power',async function (){
        
    })

    it('setSilmarils with too high percentage fails',async function (){
        
    })

    it('settlePayments distributes correctly and burns SCX', async function (){
        
    })
})