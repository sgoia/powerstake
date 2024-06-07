//import { assert, expect } from 'chai';
//import moment from 'moment';
//import delay from 'delay';
const { assert, expect } = require('chai');
const moment = require('moment');
const delay = require('delay');
const BigNumber  = require('bignumber.js');
const traveler = require('ganache-time-traveler');
//import { mochaAsync } from './utils';
//import { ERC20Contract, PowerStaking, PSToken } from '../build';

//import Numbers from '../build/utils/Numbers';
const { toSmartContractDecimals, timeToSmartContractTime, 
fromSmartContractTimeToMinutes, fromExponential 
} = require('./utils/Numbers');

const ERC20Mock = artifacts.require('./ERC20Mock.sol');
const PSToken = artifacts.require('./PSToken.sol');
const PowerStaking = artifacts.require('./PowerStaking.sol');

const TEST_CONTRACT_NAME = 'PowerStaking'; // require("./common.js");
const TEST_TAG = `${TEST_CONTRACT_NAME}-tests - `;

const totalMaxAmount = toSmartContractDecimals(100, 18);
const individualMaxAmount = toSmartContractDecimals(30, 18);
const individualMinimumAmount = toSmartContractDecimals(10, 18);
const APR = 5;
let startDate = moment().add(1, 'minutes');
let endDate = moment().add(10, 'minutes');
const timeDiff = timeToSmartContractTime(endDate) - timeToSmartContractTime(startDate);
const year = 365 * 24 * 60 * 60;
//const userDepositNeededAPR = BigNumber((((APR / 365 / 24 / 60) * timeDiff) / 60) * individualMinimumAmount).div(100);
const userDepositNeededAPR = BigNumber(timeDiff * APR * individualMinimumAmount).idiv(year * 100);
const totalNeededAPR = BigNumber(timeDiff * APR * totalMaxAmount).idiv(year * 100);463
const lockedUntilFinalization = false;

let deployed_tokenAddress;

const localtest = true; // ganache local blockchain



// forward blockchain time by x given seconds, for testing purposes
const forwardTime = async delay => {
  await traveler.advanceTimeAndBlock(delay);
};



contract(TEST_CONTRACT_NAME, async accounts => {
  const owner = accounts[0];
  const user0 = accounts[0];
	const user1 = accounts[1];
	const user2 = accounts[2];
  let erc20Contract;
	let erc20psContract;
  let stakingContract;
	let erc20ContractAddress;
  let erc20psContractAddress;
	// required NFT to stake, zero if not needed
	const nftAddress = '0x0000000000000000000000000000000000000000';
	
  let productId;
  let subscriptionId;
  let startDateSubscription;
  let endDateSubscription;
  
	let name = 'Wrapped ETH';
	let symbol = 'WETH';
	let cap = toSmartContractDecimals(100000000, 18);
	
	const psTag = 'ps'; //power stake token symbol prefix
	let psBalanceBeforeWithdraw;
	let psBalanceAfterWithdraw;
	let psTokensBurned;
	
	let snapshotId; //snapshot id for testing on local blockchain ganache
  
	
	
	/**
   * Approve ERC20 Allowance for Transfer for Subscribe Product
   * @function
   * @return {Promise<TransactionObject>}
   */
  const approveERC20Transfer = async () => {
    const totalMaxAmount = await erc20Contract.totalSupply();
		console.log('---approveERC20Transfer.totalMaxAmount: ', totalMaxAmount.toString());
    return erc20Contract.approve(
      stakingContract.address,
      totalMaxAmount,
			{ from: owner },
		);
  };
	
	/**
   * Approve ERC20 power stake Allowance for Transfer for Subscribe Product
   * @function
   * @return {Promise<TransactionObject>}
   */
  const approveERC20PowerStakeTransfer = async () => {
		const totalMaxAmount = BigNumber(1000000000).multipliedBy(1e18).toString(10);
    console.log('---approveERC20PowerStakeTransfer.totalMaxAmount: ', totalMaxAmount.toString());
    return erc20psContract.approve(
      stakingContract.address,
      totalMaxAmount,
			{ from: owner },
		);
  };
	
	/**
   * Transfer Tokens by the Admin to ensure APR Amount
   * @function
   * @param {Object} params
   * @param {number} params.amount
   * @param {Promise<number>} amount
   */
  const depositAPRTokensByAdmin = ( amount ) => {
    return erc20Contract.transfer(
      stakingContract.address,
      amount,
			{ from: owner },
    );
  };
	
	/**
   * Get Total Amount of tokens needed to be deposited by Admin to ensure APR for all available Products
   * @function
   * @return {Promise<number>} Amount
   */
  const getTotalNeededTokensForAPRbyAdmin = async () => {
    const products = await stakingContract.getProductIds(); //getProducts();

    const allProducts = await Promise.all(
      products.map(async product => {
        const productObj1 = await stakingContract.getProduct(
          product, //product_id
        );
				const productObj = parseProduct(productObj1);
        const res = await stakingContract.getAPRAmount(
          productObj.APR,
          timeToSmartContractTime(productObj.startDate),
          timeToSmartContractTime(productObj.endDate),
          productObj.totalMaxAmount,
        );
        return parseFloat(res);
      }),
    );
    return fromExponential(
      allProducts.reduce((a, b) => a + b, 0),
    ).toString();
  };
	
	// given array of product struct fields, return product object
	const parseProduct = (res) => {
		return {
			//_id: product_id,
      createdAt: fromSmartContractTimeToMinutes(res[0]),
      startDate: fromSmartContractTimeToMinutes(res[1]),
      endDate: fromSmartContractTimeToMinutes(res[2]),
      totalMaxAmount: res[3],
      individualMinimumAmount: res[4],
      individualMaxAmount: res[5],
      APR: parseInt(res[6], 10),
      currentAmount: res[7],
      lockedUntilFinalization: res[8],
      subscribers: res[9],
      subscriptionIds: fromExponential(res[10]),
		};
	};
	
	// given array of subscription struct fields, return subscription object
	const parseSubscription = (res) => {
		return {
			_id: fromExponential(res[0]),
      productId: fromExponential(res[1]),
      startDate: fromSmartContractTimeToMinutes(res[2]),
      endDate: fromSmartContractTimeToMinutes(res[3]),
      amount: res[4],
      subscriberAddress: res[5],
      APR: parseInt(res[6], 10),
      finalized: res[7],
      withdrawAmount: res[8],
		};
	};
	
	
	
	
  before('PowerStaking::before_hook', async () => {
		console.log('+++powerStaking.before.hook...');
    //stakingContract = new PowerStaking(testConfig);
    //userAddress = await stakingContract.getUserAddress(); // local test with ganache
		
		/// take blockchain snapshot
		const snapshot = await traveler.takeSnapshot();
		snapshotId = snapshot.result;
		console.log('--- take blockchain snapshot ---');
  });

  /// this function is needed in all contracts working with an ERC20Contract token
  /// NOTE: it deploys a new ERC20Contract token for individual contract functionality testing
  it(TEST_TAG +
    'should deploy a new ERC20 token and PowerStake token',
    async () => {
      // Create Contract
      erc20Contract = await ERC20Mock.new(name, symbol, cap, { from: owner });
      expect(erc20Contract).to.not.equal(null);
			assert.equal(await erc20Contract.name(), name, 'erc20 name mismatch');
			assert.equal(await erc20Contract.symbol(), symbol, 'erc20 symbol mismatch');
			assert.equal(await erc20Contract.balanceOf(owner), cap, 'balance mismatch');
			assert.equal(await erc20Contract.totalSupply(), cap, 'tokens total supply mismatch');
			erc20ContractAddress = erc20Contract.address;
			
			erc20psContract = await PSToken.new(psTag+name, psTag+symbol, { from: owner });
      expect(erc20psContract).to.not.equal(null);
			assert.equal(await erc20psContract.name(), psTag+name, 'erc20 PS name mismatch');
			assert.equal(await erc20psContract.symbol(), psTag+symbol, 'erc20 PS symbol mismatch');
			assert.equal(await erc20psContract.balanceOf(owner), 0, 'balance mismatch');
			// power stake tokens total supply should be zero
			assert.equal(await erc20psContract.totalSupply(), 0, 'power stake tokens total supply should be zero');
			
			erc20psContractAddress = erc20psContract.address;
			console.log('---erc20 address: ', erc20ContractAddress);
			console.log('---erc20 PS address: ', erc20psContractAddress);
    },
  );

  it(TEST_TAG + 
    'should deploy the PowerStaking Contract',
    async () => {
      stakingContract = await PowerStaking.new(erc20ContractAddress, nftAddress, erc20psContractAddress, { from: owner });
      expect(stakingContract).to.not.equal(null);
			assert.equal(await stakingContract.erc20(), erc20ContractAddress, 'erc20 token address mismatch');
			assert.equal(await stakingContract.psToken(), erc20psContractAddress, 'erc20 PS token address mismatch');
			console.log('---stakingContract address: ', stakingContract.address);
			
			// assert staking contract has no erc20 tokens and no Power Stake tokens
			assert.equal(await erc20Contract.balanceOf(stakingContract.address), 0, 'ERC20 token balance mismatch');
			assert.equal(await erc20psContract.balanceOf(stakingContract.address), 0, 'PS token balance mismatch');
			
			// grant stakingContract minter and burner roles
			await erc20psContract.addMinter(stakingContract.address, { from: owner });
			await erc20psContract.addBurner(stakingContract.address, { from: owner });
    },
  );

  
	
  it(TEST_TAG + 
    'should create a Product',
    async () => {
      /* Create Event */
      let startDate1 = timeToSmartContractTime(moment().add(1, 'minutes'));
      let endDate1 = timeToSmartContractTime(moment().add(10, 'minutes'));
      console.log('---startDate1: ', startDate1.toString());
			console.log('---endDate1: ', endDate1.toString());
			
			let res = await stakingContract.createProduct(
        startDate1,
        endDate1,
        totalMaxAmount,
        individualMinimumAmount,
        individualMaxAmount,
        APR,
        lockedUntilFinalization,
				{ from: owner },
      );
			//const productId1 = res;
			//console.log('---productId1: ', JSON.stringify(res.receipt.logs));
			
      //expect(res).to.not.equal(false);
      /* Check if product was created */
      res = await stakingContract.getProductIds();
      expect(res.length).to.equal(1);
      // eslint-disable-next-line prefer-destructuring
      productId = res[0];
			console.log('---productId: ', productId.toString());
    },
  );

  it(TEST_TAG + 
    'should get Product Data',
    async () => {
      /* Create Event */
      const res1 = await stakingContract.getProduct(
        productId, //product_id
      );
			const res = parseProduct(res1);
			console.log('---stakingContract.getProduct ', productId.toString(), ': ');
			console.log(JSON.stringify(res));
      expect(res.createdAt).to.not.equal(false);
      expect(res.startDate).to.not.equal(false);
      expect(res.endDate).to.not.equal(false);
      expect(res.totalMaxAmount).to.not.equal(false);
      expect(res.individualMinimumAmount).to.not.equal(false);
			expect(res.individualMaximumAmount).to.not.equal(false);
      expect(res.APR).to.not.equal(false);
      expect(res.currentAmount).to.not.equal(false);
      expect(res.lockedUntilFinalization).to.equal(false);
      expect(res.subscribers.length).to.equal(0);
      expect(res.subscriptionIds.length).to.equal(0);
    },
  );

  it(TEST_TAG + 
    'should get APR Data',
    async () => {
      let res = await stakingContract.getAPRAmount(
        APR,
        timeToSmartContractTime(startDate),
        timeToSmartContractTime(endDate),
        individualMinimumAmount, //amount
      );
			console.log('---getAPRAmount: ', res.toString());
			console.log('---userDepositNeededAPR: ', userDepositNeededAPR.toString());
			
      //expect(res).to.equal(userDepositNeededAPR.toFixed(18));
			//expect(BigNumber(res)).to.equal(userDepositNeededAPR);
			assert(BigNumber(res).eq(userDepositNeededAPR), 'apr mismatch');
      res = await getTotalNeededTokensForAPRbyAdmin();
      //expect(fromExponential(res).toString()).to.equal(totalNeededAPR.toFixed(18));
			assert(BigNumber(res).eq(totalNeededAPR), 'total needed apr mismatch');
    },
  );

  it(TEST_TAG + 
    'should get Held Tokens == 0',
    async () => {
      /* Create Event */
      const res = await stakingContract.heldTokens();
      expect(fromExponential(res).toString()).to.equal(Number(0).toString());
    },
  );

  it(TEST_TAG + 
    'should get Available Tokens == 0',
    async () => {
      /* Create Event */
      const res = await stakingContract.availableTokens();
      expect(fromExponential(res).toString()).to.equal(Number(0).toString());
    },
  );

  it(TEST_TAG + 
    'should get Future Locked Tokens == 0',
    async () => {
      const res = await stakingContract.futureLockedTokens();
      expect(fromExponential(res).toString()).to.equal(Number(0).toString());
    },
  );

  it(TEST_TAG + 
    'should get tokens needed for APR == totalNeededAPR',
    async () => {
      const tokensNeeded = await getTotalNeededTokensForAPRbyAdmin();
      //expect(fromExponential(totalNeededAPR.toFixed(18)).toString()).to.equal(tokensNeeded);
			expect(totalNeededAPR.eq(tokensNeeded)).to.equal(true);
    },
  );

  it(TEST_TAG + 
    'should fund with tokens needed for APR',
    async () => {
      const neededTokensAmount = await getTotalNeededTokensForAPRbyAdmin();
      const res = await depositAPRTokensByAdmin(
        neededTokensAmount, //amount,
      );
      expect(res).to.not.equal(false);
    },
  );

  it(TEST_TAG + 
    'should get Held Tokens == APR Needed for 1 subscription with min Amount',
    async () => {
      const res = await stakingContract.heldTokens();
      const tokensNeeded = await getTotalNeededTokensForAPRbyAdmin();
      expect(fromExponential(res).toString()).to.equal(tokensNeeded);
    },
  );

  it(TEST_TAG + 
    'should get Available Tokens == APR Needed for 1 subscription with min Amount',
    async () => {
      const res = await stakingContract.availableTokens();
      const tokensNeeded = await getTotalNeededTokensForAPRbyAdmin();
      expect(fromExponential(res).toString()).to.equal(tokensNeeded);
    },
  );

  it(TEST_TAG + 
    'should get subscribe to product Data & APR Right',
    async () => {
      /* Approve Tx */
      let res = await approveERC20Transfer();
			const allowance = await erc20Contract.allowance(owner, stakingContract.address);
			console.log('allowance: ', allowance.toString());
			
			let resPS = await approveERC20PowerStakeTransfer();
			const allowancePS = await erc20psContract.allowance(owner, stakingContract.address);
			console.log('allowancePS: ', allowancePS.toString());
			
			expect(res).to.not.equal(false);
			expect(resPS).to.not.equal(false);
			
			
			// user has ZERO PS tokens initially
			const psBalance1 = BigNumber(await erc20psContract.balanceOf(owner));
			console.log('---psBalance1: ', psBalance1.toString());
			
			res = await stakingContract.subscribeProduct(
        productId, //product_id
        individualMinimumAmount, //amount
				{ from: owner },
      );
			expect(res).to.not.equal(false);

      res = await stakingContract.getMySubscriptions( //getSubscriptionsByAddress(
        owner, //address
      );
      expect(res.length).to.equal(1);
      // eslint-disable-next-line prefer-destructuring
      subscriptionId = res[0];
			console.log('---subscriptionId: ', subscriptionId.toString());
			
			// verify that the PS token minted is correct
			//uint256 futureAPRAmount = await stakingContract.getAPRAmount(products[_product_id].APR, time, products[_product_id].endDate, _amount);
			let futureAPRAmount = await stakingContract.getAPRAmount(
        APR,
        timeToSmartContractTime(startDate),
        timeToSmartContractTime(endDate),
        individualMinimumAmount, //amount
      );
			const psBalance2 = BigNumber(await erc20psContract.balanceOf(owner));
			console.log('---psBalance2: ', psBalance2.toString());
			assert((psBalance2.minus(psBalance1)).eq(BigNumber(individualMinimumAmount).plus(futureAPRAmount)), 'PS token mint mismatch');
    },
  );

  it(TEST_TAG + 
    'should get Subscription Data Right',
    async () => {
      const res1 = await stakingContract.getSubscription(
        subscriptionId, //subscription_id: subscriptionId,
        productId, //product_id: productId,
      );
			const res = parseSubscription(res1);
      startDateSubscription = res.startDate;
      endDateSubscription = res.endDate;
      expect(res.startDate).to.not.equal(false);
      expect(res.endDate).to.not.equal(false);
      //expect(res.amount).to.equal(individualMinimumAmount.toString());
			expect(BigNumber(res.amount).toString()).to.equal(BigNumber(individualMinimumAmount).toString());
      expect(res.subscriberAddress).to.equal(user0);
      expect(res.APR).to.equal(APR);
      expect(res.finalized).to.equal(false);
    },
  );

  it(TEST_TAG + 
    'should get Held Tokens == APR Amount + indivualAmount',
    async () => {
      const res = await stakingContract.heldTokens();
      expect(BigNumber(res).eq(BigNumber(individualMinimumAmount).plus(totalNeededAPR))).to.equal(true);
    },
  );

  it(TEST_TAG + 
    'should get Future Locked Tokens == APR Amount',
    async () => {
      const res = await stakingContract.futureLockedTokens();
			console.log('---futureLockedTokens: ', res.toString());
			const timeDiff = timeToSmartContractTime(endDateSubscription) - timeToSmartContractTime(startDateSubscription);
      //const userAPR = BigNumber(APR * (endDateSubscription - startDateSubscription) * individualMinimumAmount).idiv(year * 100);
			const userAPR = BigNumber(APR * timeDiff * individualMinimumAmount).idiv(year * 100);
      expect(BigNumber(res).eq(BigNumber(individualMinimumAmount).plus(userAPR))).to.equal(true);
    },
  );

  it(TEST_TAG + 
    'should get Available Tokens == 0 (all used)',
    async () => {
      const res = await stakingContract.availableTokens();
			console.log('---availableTokens: ', res.toString());
			const timeDiff = timeToSmartContractTime(endDateSubscription) - timeToSmartContractTime(startDateSubscription);
      //const userAPR = BigNumber(APR * (endDateSubscription - startDateSubscription) * individualMinimumAmount).idiv(year * 100);
			const userAPR = BigNumber(APR * timeDiff * individualMinimumAmount).idiv(year * 100);
      expect(BigNumber(res).eq(BigNumber(totalNeededAPR).minus(userAPR))).to.equal(true);
    },
  );

  it(TEST_TAG + 
    'should withdraw Subscription',
    async () => {
      await forwardTime(60); //partial APR, 60 seconds so we can unlock locked tokens and get max APR
			//await forwardTime(11*60); //full APR, 11 mins * 60 seconds so we can unlock locked tokens and get max APR
			
			console.log('---productId: ', productId.toString());
			console.log('---subscriptionId: ', subscriptionId.toString());
			
			psBalanceBeforeWithdraw = BigNumber(await erc20psContract.balanceOf(owner));
			console.log('---psBalanceBeforeWithdraw: ', psBalanceBeforeWithdraw.toString());
			
      const res = await stakingContract.withdrawSubscription(
        productId, //product_id: productId,
        subscriptionId, //subscription_id: subscriptionId,
      );
      expect(res).to.not.equal(false);
			
			psBalanceAfterWithdraw = BigNumber(await erc20psContract.balanceOf(owner));
			console.log('---psBalanceAfterWithdraw: ', psBalanceAfterWithdraw.toString());
			
			psTokensBurned = psBalanceBeforeWithdraw.minus(psBalanceAfterWithdraw);
			console.log('---psTokensBurned: ', psTokensBurned.toString());
			
			// power stake tokens total supply should be zero
			const psBalance = BigNumber(await erc20psContract.totalSupply());
			console.log('---psBalance: ', psBalance.toString());
			assert(psBalance.eq(0), 'power stake tokens total supply should be zero');
    },
  );

  it(TEST_TAG + 
    'should confirm Subscription Data after Withdraw',
    async () => {
      const res1 = await stakingContract.getSubscription(
        subscriptionId, //subscription_id: subscriptionId,
        productId, //product_id: productId,
      );
			const res = parseSubscription(res1);
      expect(res.endDate).to.not.equal(false);
      expect(res.finalized).to.equal(true);

      const apr = await stakingContract.getAPRAmount(
        APR,
        timeToSmartContractTime(res.startDate), //startDate: res.startDate,
        timeToSmartContractTime(res.endDate), //endDate: res.endDate,
        individualMinimumAmount, //amount: individualMinimumAmount,
      );
			const totalAmountWithAPR = BigNumber(individualMinimumAmount).plus(apr);
      expect(BigNumber(res.withdrawAmount).eq(totalAmountWithAPR)).to.equal(true);
			
			// PS tokens burnt are equivalent to the full APR term to avoid minting free tokens bug
			// verify power stake tokens burned after tokens unlocked
			const fullApr = await stakingContract.getAPRAmount(
        APR,
        timeToSmartContractTime(startDate),
        timeToSmartContractTime(endDate),
        individualMinimumAmount, //amount: individualMinimumAmount,
      );
			const fullAmountWithAPR = BigNumber(individualMinimumAmount).plus(fullApr);
			assert(psTokensBurned.eq(fullAmountWithAPR), 'PS token burn mismatch');
    },
  );
	
	after('PowerStaking::after_hook', async () => {
    if (localtest) {
      await traveler.revertToSnapshot(snapshotId);
      console.log('+++powerStaking.after.hook...');
      console.log('--- revert blockchain to last snapshot ---');
    }
    else {
      // console.log('--- we only revert blockchain to last snapshot for localtest ---');
    }
  });
});
