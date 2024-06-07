/* global web3 */
const BigNumber = require('bignumber.js');

const ERC20Mock = artifacts.require('./ERC20Mock.sol');
const PSToken = artifacts.require('./PSToken.sol');
const PowerStaking = artifacts.require('./PowerStaking.sol');

const erc20Amount = new BigNumber(100000000).multipliedBy(1e18).toString(10);
const name = "Wrapped ETH";
const symbol = "WETH";
const psTag = "ps";
const nftAddressZERO = '0x0000000000000000000000000000000000000000';

module.exports = async (deployer, network, accounts) => {
  // await deployer.deploy(CTokenManager);

  await deployer.deploy(ERC20Mock, name, symbol, erc20Amount);
  const erc20 = await ERC20Mock.deployed();
	await deployer.deploy(PSToken, psTag+name, psTag+symbol);
  const psToken = await PSToken.deployed();
	console.log('erc20.address: ', erc20.address);
	console.log('psToken.address: ', psToken.address);
	
	await deployer.deploy(PowerStaking, erc20.address, nftAddressZERO, psToken.address);
	const powerStaking = await PowerStaking.deployed();
	console.log('powerStaking.address: ', powerStaking.address);
	
  /*if (network !== 'development') {
    return;
  }*/
	
	//const allowance = new BigNumber(3600).multipliedBy(1e18).toString(10);
	const allowance = erc20Amount;
  //await erc20.mint(accounts[0], allowance);
  await erc20.approve(powerStaking.address, allowance, { from: accounts[0] });
	await psToken.approve(powerStaking.address, allowance, { from: accounts[0] });
	
	// grant staking contract minter and burner roles
	await psToken.addMinter(powerStaking.address, { from: accounts[0] });
	await psToken.addBurner(powerStaking.address, { from: accounts[0] });
	
	//const { timestamp } = await web3.eth.getBlock('latest');
  //const startTime = new BigNumber(timestamp).plus(300);
};
