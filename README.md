# Power Stake

![Dependencies](https://img.shields.io/badge/dependencies-up%20to%20date-brightgreen.svg)
[![GitHub issues](https://img.shields.io/github/issues/sgoia/powerstake.svg)](https://GitHub.com/sgoia/powerstake/issues/)
![Contributions welcome](https://img.shields.io/badge/contributions-welcome-orange.svg)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Description

Power Stake, unlock stake deposit and reward right away, liquid staking boost protocol helping users maximize staking investments.
E.g.
- Stake 100 ETH for APR 5% per year, get 105 psETH minted tokens that represent the initial deposit and total profit for immediate use.
- When unlock is allowed (either at the end of the term or before), PowerStake smart contract burns 105 psETH from user wallet (after user approves PowerStake to do so) and send user initial deposit and stake profit in ETH, 100 ETH plus maximum 5 ETH for the APR profit depending on the time of the unlock.

## Deployed smart contracts on Rootstock Testnet

- ERC20 mock for Wrapped ETH token address: 0xD9DCEF6341dd179c520CCF8217981Bb6a3a689b8
- PowerStake Token for WETH tokens address: 0x9E9a1ACe534f257502c78C37F032B06a8c3617c4
- Power Staking smart contract address: 0xe50F765f88E7Cf92cA2f33551A00f017db67eF1C

You can mint some WETH tokens on Rootstock testnet to stake it into Power Staking smart contract and get psWETH.

## Local Development

### Requirements

<details>
  <summary>Node.js 16</summary>

  Install via NVM:
  ```bash
  # Install NVM
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

  # Install recommended Node.js version for bepro-js
  nvm install lts/gallium

  # Set it on the working directory
  nvm alias default lts/gallium

  # Use the settled as default
  nvm use default

  # Confirm the procedure.
  # Must show valid Node-js version on terminal if OK
  node --version
  ```
</details>

<details>
  <summary>Rootstock local node</summary>

  For more information on RSK node development, check [Rootstock](https://rootstock.io/develop/) and [Rootstock local node](https://dev.rootstock.io/rsk/node/install/operating-systems/java/).

  Once we have the rsk node file "rskj-core-6.1.0-ARROWHEAD-all.jar" (the moment this readme file was updated) downloaded in a specific folder we can run the following command in a separate terminal and leave it open to have a local rootstock node:

  ```bash
  # Run rsk local node
  java -classpath rskj-core-6.1.0-ARROWHEAD-all.jar -Drpc.providers.web.cors=* -Drpc.providers.web.ws.enabled=true co.rsk.Start --regtest
  ```
</details>

### Running commands

```bash
# Install and update dependencies
npm i
```

## Local Ethereum Client

For tests, we use [Ganache](https://trufflesuite.com/ganache/).

Once installed, run in a separate terminal and leave it open:

```bash
# run ganache local test blockchain
npm run ganache:start
```

In a different terminal run:

```bash
# Run tests for development
npm run test

# Run tests for possibly other networks
truffle test --network rskTestnet
```

## Rootstock local development network

Once RSK local node is installed and running, compile migrate and test with truffle as usual:

```bash
# compile smart contracts
truffle compile

# migrate smart contracts
truffle migrate --network rskdev

# run tests
truffle test --network rskdev
```

### Deploy on Rootstock test network

For this feature, in the powerstake project root folder we need a file called ".secret" containing the seed phrase for the Rootstock wallet we use to migrate the smart contracts.

The file truffle-config.js is already prepared to handle Rootstock testnet deployment of smart contracts so we can use the following commands:

```bash
# compile smart contracts
truffle compile

# migrate smart contracts
truffle migrate --network rskTestnet
```

## Contribution

Contributions are welcome.

## License

[MIT](https://choosealicense.com/licenses/mit/)
