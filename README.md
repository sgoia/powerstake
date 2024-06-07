# Power Stake

![Dependencies](https://img.shields.io/badge/dependencies-up%20to%20date-brightgreen.svg)
[![GitHub issues](https://img.shields.io/github/issues/sgoia/powerstake.svg)](https://GitHub.com/sgoia/powerstake/issues/)
![Contributions welcome](https://img.shields.io/badge/contributions-welcome-orange.svg)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Introductions

Power Stake, unlock stake deposit and reward right away, profitable liquid staking protocol helping users maximize staking investments.
E.g.
- Stake 100 ETH for APR 5% per year, get 105 psETH minted tokens that represent the initial deposit and total profit for immediate use.
- When unlock is allowed (either at the end of the term or before), PowerStake smart contract burns 105 psETH from user wallet (after user approves PowerStake to do so) and send user initial deposit and stake profit in ETH, 100 ETH plus maximum 5 ETH for the APR profit depending on the time of the unlock.

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

### Running commands

```bash
# Install and update dependencies
npm i

# Build from src
truffle compile
```

## Local Ethereum Client

For tests, we use [Ganache](https://trufflesuite.com/ganache/).

Once installed, run in a separate terminal and leave it open:

```bash
# run ganache local test blockchain
npm run ganache:start
```

```bash
# Run tests for development
npm run test

# Run tests for possibly other networks
truffle test --network rskTestnet
```

## Rootstock local development network

For more information on RSK node development, check [Rootstock](https://rootstock.io/develop/) and [Rootstock local node](https://dev.rootstock.io/rsk/node/install/operating-systems/java/).

Once RSK local node is installed and running, compile migrate and test with truffle as usual:

```bash
# compile smart contracts
truffle compile

# migrate smart contracts
truffle migrate [--network development]

# run tests
truffle test
```

## Contribution

Contributions are welcome but please follow the code guidelines, especially for the code format. Please review [Contributor guidelines][1]

## License

[MIT](https://choosealicense.com/licenses/mit/)
