/* global web3 */
const BigNumber = require('bignumber.js');
const moment = require('moment');
const ERC20Mock = artifacts.require('./ERC20Mock.sol');
const PSToken = artifacts.require('./PSToken.sol');
const PowerStaking = artifacts.require('./PowerStaking.sol');
const { toSmartContractDecimals, timeToSmartContractTime } = require('../test/utils/Numbers');

const erc20Amount = new BigNumber(100000000).multipliedBy(1e18).toString(10);
const name = "Wrapped ETH";
const symbol = "WETH";
const psTag = "ps";
const nftAddressZERO = '0x0000000000000000000000000000000000000000';

const totalMaxAmount = toSmartContractDecimals(100, 18);
const individualMaxAmount = toSmartContractDecimals(30, 18);
const individualMinimumAmount = toSmartContractDecimals(10, 18);
const APR = 5;
const lockedUntilFinalization = false;

// RSK Testnet deployed smart contracts addresses
let erc20Address = '0xD9DCEF6341dd179c520CCF8217981Bb6a3a689b8';
let psTokenAddress = '0x9E9a1ACe534f257502c78C37F032B06a8c3617c4';
let powerStakingAddress = '0xe50F765f88E7Cf92cA2f33551A00f017db67eF1C';

module.exports = async (deployer, network, accounts) => {
  await deployer.deploy(ERC20Mock, name, symbol, erc20Amount);
  const erc20 = await ERC20Mock.deployed();
	await deployer.deploy(PSToken, psTag+name, psTag+symbol);
  const psToken = await PSToken.deployed();
	console.log('erc20.address: ', erc20.address);
	console.log('psToken.address: ', psToken.address);
	
	await deployer.deploy(PowerStaking, erc20.address, nftAddressZERO, psToken.address);
	const powerStaking = await PowerStaking.deployed();
	console.log('powerStaking.address: ', powerStaking.address);
	
  //if (network !== 'development') {
  //  return;
  //}
	
	const allowance = erc20Amount;
  //await erc20.mint(accounts[0], allowance);
	console.log('---erc20.approve.powerStaking...');
  await erc20.approve(powerStaking.address, allowance, { from: accounts[0] });
	console.log('---psToken.approve.powerStaking...');
	await psToken.approve(powerStaking.address, allowance, { from: accounts[0] });
	
	// grant staking contract minter and burner roles
	console.log('---psToken.addMinter...');
	await psToken.addMinter(powerStaking.address, { from: accounts[0] });
	console.log('---psToken.addBurner...');
	await psToken.addBurner(powerStaking.address, { from: accounts[0] });
	//const { timestamp } = await web3.eth.getBlock('latest');
  //const startTime = new BigNumber(timestamp).plus(300);
	
	let now = moment();
	let startDate = timeToSmartContractTime(now.add(1, 'minutes'));
	let endDate = timeToSmartContractTime(now.add(1, 'months'));
	console.log('---startDate: ', startDate.toString());
	console.log('---endDate: ', endDate.toString());
	
	console.log('---powerStaking.createProduct...');
	let res = await powerStaking.createProduct(
		startDate,
		endDate,
		totalMaxAmount,
		individualMinimumAmount,
		individualMaxAmount,
		APR,
		lockedUntilFinalization,
		{ from: accounts[0] },
	);
	
	console.log('---powerStaking: migration success!');
};
