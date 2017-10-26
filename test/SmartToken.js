'use strict';

const assertJump = require('./helpers/assertJump');
const expectThrow = require('./helpers/expectThrow');
var Message = artifacts.require('./helpers/Message.sol');
var SmartTokenMock = artifacts.require('./helpers/SmartTokenMock.sol');

var BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('SmartToken', function(accounts) {

  let token;

  beforeEach(async function() {
    token = await SmartTokenMock.new(accounts[0], 100);
  });

  it('should return the correct totalSupply after construction', async function() {
    let totalSupply = await token.totalSupply();

    assert.equal(totalSupply, 100);
  });

  it('should return the correct allowance amount after approval', async function() {
    let token = await SmartTokenMock.new();
    await token.approve(accounts[1], 100);
    let allowance = await token.allowance(accounts[0], accounts[1]);

    assert.equal(allowance, 100);
  });

  it('should return correct balances after transfer', async function() {
    await token.transfer(accounts[1], 100);
    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);

    let balance1 = await token.balanceOf(accounts[1]);
    assert.equal(balance1, 100);
  });

  it('should throw an error when trying to transfer more than balance', async function() {
    try {
      await token.transfer(accounts[1], 101);
      assert.fail('should have thrown before');
    } catch(error) {
      assertJump(error);
    }
  });

  it('should return correct balances after transfering from another account', async function() {
    await token.approve(accounts[1], 100);
    await token.transferFrom(accounts[0], accounts[2], 100, {from: accounts[1]});

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);

    let balance1 = await token.balanceOf(accounts[2]);
    assert.equal(balance1, 100);

    let balance2 = await token.balanceOf(accounts[1]);
    assert.equal(balance2, 0);
  });

  it('should throw an error when trying to transfer more than allowed', async function() {
    await token.approve(accounts[1], 99);
    try {
      await token.transferFrom(accounts[0], accounts[2], 100, {from: accounts[1]});
      assert.fail('should have thrown before');
    } catch (error) {
      assertJump(error);
    }
  });

  it('should throw an error when trying to transferFrom more than _from has', async function() {
    let balance0 = await token.balanceOf(accounts[0]);
    await token.approve(accounts[1], 99);
    try {
      await token.transferFrom(accounts[0], accounts[2], balance0+1, {from: accounts[1]});
      assert.fail('should have thrown before');
    } catch (error) {
      assertJump(error);
    }
  });

  describe('validating allowance updates to spender', function() {
    let preApproved;

    it('should start with zero', async function() {
      preApproved = await token.allowance(accounts[0], accounts[1]);
      assert.equal(preApproved, 0);
    })

    it('should increase by 50 then decrease by 10', async function() {
      await token.increaseApproval(accounts[1], 50);
      let postIncrease = await token.allowance(accounts[0], accounts[1]);
      preApproved.plus(50).should.be.bignumber.equal(postIncrease);
      await token.decreaseApproval(accounts[1], 10);
      let postDecrease = await token.allowance(accounts[0], accounts[1]);
      postIncrease.minus(10).should.be.bignumber.equal(postDecrease);
    })
  });

  it('should increase by 50 then set to 0 when decreasing by more than 50', async function() {
    await token.approve(accounts[1], 50);
    await token.decreaseApproval(accounts[1], 60);
    let postDecrease = await token.allowance(accounts[0], accounts[1]);
    postDecrease.should.be.bignumber.equal(0);
  });

  it('should throw an error when trying to transfer to 0x0', async function() {
    try {
      let transfer = await token.transfer(0x0, 100);
      assert.fail('should have thrown before');
    } catch(error) {
      assertJump(error);
    }
  });

  it('should throw an error when trying to transferFrom to 0x0', async function() {
    await token.approve(accounts[1], 100);
    try {
      let transfer = await token.transferFrom(accounts[0], 0x0, 100, {from: accounts[1]});
      assert.fail('should have thrown before');
    } catch(error) {
      assertJump(error);
    }
  });

  it('should return correct balances after approve and show the event on receiver contract', async function() {
    let message = await Message.new();

    let data = message.contract.showMessage.getData(
      web3.toHex(123456), 666, 'Transfer Done'
    );

    let transaction = await token.approveData(
      message.contract.address, 100, data, {from: accounts[0]}
    );

    assert.equal(2, transaction.receipt.logs.length);

    new BigNumber(100).should.be.bignumber.equal(
      await token.allowance(accounts[0], message.contract.address)
    );

  });

  it('should return correct balances after transferData and show the event on receiver contract', async function() {
    let message = await Message.new();

    let data = message.contract.showMessage.getData(
      web3.toHex(123456), 666, 'Transfer Done'
    );

    let transaction = await token.transferData(
      message.contract.address, 100, data, {from: accounts[0]}
    );

    assert.equal(2, transaction.receipt.logs.length);

    new BigNumber(100).should.be.bignumber.equal(
      await token.balanceOf(message.contract.address)
    );

  });

  it('should return correct allowance after approveData and show the event on receiver contract', async function() {
    let message = await Message.new();

    let data = message.contract.showMessage.getData(
      web3.toHex(123456), 666, 'Transfer Done'
    );

    let transaction = await token.approveData(
      message.contract.address, 100, data, {from: accounts[0]}
    );

    assert.equal(2, transaction.receipt.logs.length);

    new BigNumber(100).should.be.bignumber.equal(
      await token.allowance(accounts[0], message.contract.address)
    );

  });

  it('should return correct balances after transferFrom and show the event on receiver contract', async function() {
    let message = await Message.new();

    let data = message.contract.showMessage.getData(
      web3.toHex(123456), 666, 'Transfer Done'
    );

    await token.approve(accounts[1], 100, {from: accounts[0]});

    new BigNumber(100).should.be.bignumber.equal(
      await token.allowance(accounts[0], accounts[1])
    );

    let transaction = await token.transferDataFrom(
      accounts[0], message.contract.address, 100, data, {from: accounts[1]}
    );

    assert.equal(2, transaction.receipt.logs.length);

    new BigNumber(100).should.be.bignumber.equal(
      await token.balanceOf(message.contract.address)
    );

  });

  it('should fail inside approveData', async function() {
    let message = await Message.new();

    let data = message.contract.fail.getData();

    try {
      await token.approveData(
        message.contract.address, 10, data,
        {from: accounts[1]}
      );
      assert(false, 'approveData should have raised');
    } catch(error) {
      assertJump(error);
    }

    // approval should not have gone through so allowance is still 0
    new BigNumber(0).should.be.bignumber
      .equal(await token.allowance(accounts[1], message.contract.address));

  });

  it('should fail inside transferData', async function() {
    let message = await Message.new();

    let data = message.contract.fail.getData();

    try {
      await token.transferData(
        message.contract.address, 10, data,
        {from: accounts[0]}
      );
      assert(false, 'transferData should have failed');
    } catch(error) {
      assertJump(error);
    }

    // transfer should not have gone through, so balance is still 0
    new BigNumber(0).should.be.bignumber
      .equal(await token.balanceOf(message.contract.address));

  });

  it('should fail inside transferDataFrom', async function() {
    let message = await Message.new();

    let data = message.contract.fail.getData();

    await token.approve(accounts[1], 10, {from: accounts[2]});

    try {
      await token.transferDataFrom(
        accounts[2], message.contract.address, 10, data,
        {from: accounts[1]}
      );
      assert(false, 'transferDataFrom should have thrown');
    } catch(error) {
      assertJump(error);
    }

    // transferDataFrom should have failed so balance is still 0 but allowance is 10
    new BigNumber(10).should.be.bignumber
      .equal(await token.allowance(accounts[2], accounts[1]));
    new BigNumber(0).should.be.bignumber
      .equal(await token.balanceOf(message.contract.address));

  });

  it('should fail approveData when using token contract address as receiver', async function() {
    let data = token.contract.approve.getData(accounts[5], 66);

    try {
      await token.approveData(token.contract.address, 100, data, {from: accounts[0]});
      assert(false, 'approveData should have thrown because the spender cannot be the token itself');
    } catch(error) {
      assertJump(error);
    }

  });

  it('should fail transferData when using token contract address as receiver', async function() {

    try {
      await token.transferData(
        token.contract.address, 100, web3.toHex(0), {from: accounts[0]}
      );
      assert(false, 'transferData should have thrown because the spender cannot be the token itself');
    } catch(error) {
      assertJump(error);
    }

  });

  it('should fail transferDataFrom when using token contract address as receiver', async function() {

    await token.approve(accounts[1], 1, {from: accounts[0]});

    try {
      await token.transferDataFrom(
        accounts[0], token.contract.address, 1, web3.toHex(0), {from: accounts[1]}
      );
      assert(false, 'transferDataFrom should have thrown because the spender cannot be the token itself');
    } catch(error) {
      assertJump(error);
    }

  });

});