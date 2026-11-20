# TipJar & QuantekToken — Hardhat 3 Project

This project showcases Ethereum smart contract development using **Hardhat 3**, **Solidity**, **TypeScript**, and **Viem**.

It includes two smart contracts:

- **TipJar:** A decentralized ETH tipping contract that allows users to send tips with custom messages.
- **QuantekToken (QTK):** A custom ERC-20 token implemented using OpenZeppelin with a fixed initial supply of 1,000,000 tokens.

Both contracts are deployed on the Ethereum Sepolia test network.

## Project Overview

This project includes:

- Smart contract development using Solidity.
- Hardhat 3 configuration with TypeScript.
- ETH transactions through a custom TipJar contract.
- Custom ERC-20 token creation using OpenZeppelin.
- Contract deployment using Hardhat Ignition.
- Smart contract testing using Hardhat.
- Ethereum interactions using Viem.
- Sepolia testnet deployment and Etherscan exploration.
- Secure configuration management using Hardhat Keystore.

## Technology Stack

| Technology | Purpose |
|---|---|
| Solidity | Smart contract development |
| Hardhat 3 | Development, compilation, and testing |
| TypeScript | Configuration and deployment modules |
| Viem | Ethereum interactions |
| OpenZeppelin | ERC-20 implementation |
| Hardhat Ignition | Smart contract deployment |
| MetaMask | Wallet connection and transactions |
| Etherscan | Contract verification and exploration |
| Sepolia | Ethereum test network |

## Project Structure

```text
tipjar/
├── contracts/
│   ├── TipJar.sol
│   └── QuantekToken.sol
│
├── ignition/
│   ├── modules/
│   │   ├── TipJar.ts
│   │   └── QuantekToken.ts
│   └── deployments/
│
├── test/
│   └── QuantekToken.ts
│
├── hardhat.config.ts
├── package.json
├── package-lock.json
└── README.md
```

## Smart Contracts

### 1. TipJar

TipJar is a smart contract that allows users to send ETH along with a custom message.

**Features:**

- Accepts ETH tips through a payable function.
- Stores tip information, including sender, amount, and message.
- Tracks the total number of tips.
- Emits a `TipSent` event when a tip is received.
- Restricts withdrawals to the contract owner.
- Allows the owner to withdraw accumulated ETH.

**Core concepts demonstrated:**

- `payable` functions
- `msg.sender` and `msg.value`
- Structs and mappings
- Events and transaction logs
- Access control
- ETH transfers and withdrawals

### 2. QuantekToken (QTK)

QuantekToken is a custom ERC-20 fungible token developed using OpenZeppelin's ERC-20 implementation.

| Property | Value |
|---|---|
| Token Name | QuantekToken |
| Token Symbol | QTK |
| Initial Supply | 1,000,000 QTK |
| Decimals | 18 |
| Standard | ERC-20 |
| Network | Sepolia |

**Features:**

- Implements the ERC-20 token standard.
- Mints an initial supply of 1,000,000 tokens to the deployer's wallet.
- Supports standard ERC-20 functionality such as transfers, approvals, and allowance management.
- Uses OpenZeppelin's audited ERC-20 implementation.
- Does not include a public mint function.

## Installation

### Prerequisites

- Node.js
- npm
- Git
- MetaMask wallet
- Sepolia test ETH
- Etherscan account

### Clone the Repository

```bash
git clone https://github.com/Amanjeeta21/Blockchain.git
```

Navigate to the Hardhat project directory:

```bash
cd tipjar
```

Install dependencies:

```bash
npm install
```

## Configuration and Keystore Setup

The project uses Hardhat Configuration Variables to securely manage sensitive information required for Sepolia deployment and contract verification.

Set up the following variables using the Hardhat Keystore:

```bash
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
npx hardhat keystore set SEPOLIA_RPC_URL
npx hardhat keystore set ETHERSCAN_API_KEY
```

Enter the respective values when prompted.

**Important:**

- Never share your private key, API key, or recovery phrase.
- Do not hardcode sensitive credentials in source files.
- Do not commit secret values to GitHub.
- Use a dedicated test wallet for Sepolia development.

The project accesses these values through `configVariable()` in `hardhat.config.ts`.

## Usage

### Building the Project

Compile and build the smart contracts:

```bash
npx hardhat build
```

### Running Tests

Run all available tests:

```bash
npx hardhat test
```

### Deploying Contracts to Sepolia

The project uses Hardhat Ignition to deploy smart contracts.

**Deploy TipJar:**

```bash
npx hardhat ignition deploy ignition/modules/TipJar.ts --network sepolia
```

**Deploy QuantekToken:**

```bash
npx hardhat ignition deploy ignition/modules/QuantekToken.ts --network sepolia
```

Deployment records are stored in:

```text
ignition/deployments/chain-11155111/
```

Sepolia Chain ID: `11155111`.

### Contract Verification

Verify the deployed contracts on Etherscan using Hardhat Verify.

**Verify TipJar:**

```bash
npx hardhat verify --network sepolia <TIPJAR_CONTRACT_ADDRESS>
```

**Verify QuantekToken:**

```bash
npx hardhat verify --network sepolia <QUANTEK_TOKEN_ADDRESS>
```

The Etherscan API key is retrieved securely from the Hardhat Keystore.

## Deployments

Both contracts have been deployed to the Ethereum Sepolia test network.

### TipJar

| Detail | Value |
|---|---|
| Network | Sepolia |
| Contract Address | `0x93F98CB57A26121d2bd9d3E5960154B31beD634b` |
| Verification Status | Verified — Exact Match |

[View TipJar on Etherscan](https://sepolia.etherscan.io/address/0x93F98CB57A26121d2bd9d3E5960154B31beD634b)

### QuantekToken (QTK)

| Detail | Value |
|---|---|
| Network | Sepolia |
| Contract Address | `0x6F4400A45C7BCAa127F865b2EC86a5bFeD63a23a` |
| Token Symbol | QTK |
| Initial Supply | 1,000,000 QTK |
| Verification Status | Verify on Etherscan |

[View QuantekToken on Etherscan](https://sepolia.etherscan.io/address/0x6F4400A45C7BCAa127F865b2EC86a5bFeD63a23a)

## Interacting with the Contracts

### TipJar Interaction

1. Open the TipJar contract on Etherscan.
2. Navigate to the **Contract** tab.
3. Use **Read Contract** to inspect contract information.
4. Use **Write Contract** to connect MetaMask.
5. Call the `tip()` function with a message and ETH amount.
6. Confirm the transaction through MetaMask.
7. Inspect the transaction details and `TipSent` event in the logs.

### QuantekToken Interaction

1. Open the QuantekToken contract on Etherscan.
2. Navigate to the **Contract** tab.
3. Use **Read Contract** to inspect token information and balances.
4. Use **Write Contract** to interact with ERC-20 functions.
5. Call `transfer()` to send tokens to another wallet.
6. Confirm the transaction through MetaMask.

### Importing QTK into MetaMask

1. Switch MetaMask to the Sepolia network.
2. Select **Import tokens**.
3. Choose **Custom token**.
4. Enter the QuantekToken contract address.
5. Confirm the token symbol (`QTK`) and decimals (`18`).
6. Import the token and check the displayed balance.

## Important Blockchain Concepts Covered

- Ethereum accounts and wallets
- Public and private keys
- Seed phrases
- Gas fees and transaction execution
- Smart contracts and Solidity
- Ethereum test networks
- ERC-20 token standard
- Token minting and transfers
- Contract deployment and verification
- Events and transaction logs
- Access control and ownership
- Hardhat Ignition and Keystore

## Learning Outcomes

Through this project, the following practical concepts were explored:

- Writing and compiling Solidity smart contracts.
- Creating a payable ETH tipping mechanism.
- Implementing ERC-20 tokens using OpenZeppelin.
- Writing and running smart contract tests.
- Deploying contracts using Hardhat Ignition.
- Configuring Sepolia network access.
- Managing credentials securely with Hardhat Keystore.
- Verifying smart contracts on Etherscan.
- Interacting with deployed contracts through Etherscan.
- Connecting MetaMask and transferring testnet tokens.

## Repository

GitHub: [Amanjeeta21/Blockchain](https://github.com/Amanjeeta21/Blockchain)
