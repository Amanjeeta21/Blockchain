# TipJar – Ethereum-Based Tipping dApp

A decentralized Ethereum application that enables users to connect their crypto wallets, authenticate using Sign-In with Ethereum (SIWE), send ETH tips with optional messages, view on-chain tip history, and interact with an ERC-20 token.

Built with Next.js, TypeScript, Wagmi, Viem, RainbowKit, SIWE, and Solidity, the application demonstrates practical blockchain integration using the Ethereum Sepolia testnet.

**Live Demo:** https://amanjeeta-tipjar.vercel.app/

**Repository:** https://github.com/Amanjeeta21/Blockchain

---

## Overview

TipJar is a Web3 tipping application that allows users to send cryptocurrency directly between Ethereum wallets without relying on a centralized payment platform.

Users can:

- Connect an Ethereum wallet.
- Authenticate through Sign-In with Ethereum.
- Send ETH tips with optional messages.
- View blockchain-based tip history.
- Interact with an ERC-20 token.
- Check token balances.
- Transfer tokens.
- Approve token spending.
- Check allowances.
- Execute delegated token transfers.
- View transaction details and Sepolia Etherscan links.

The project demonstrates the integration of a modern Web3 frontend, wallet connectivity, smart contract interactions, blockchain event retrieval, and wallet-based authentication.

---

## Key Features

### 1. Wallet Connectivity

- Connect Ethereum wallets using RainbowKit and Wagmi.
- Support MetaMask and other compatible wallets.
- Display connected wallet information.
- Verify the active blockchain network.
- Support Ethereum Sepolia testnet interactions.
- Support WalletConnect-based wallet connections.

### 2. Sign-In with Ethereum

TipJar implements Sign-In with Ethereum (SIWE) for wallet-based authentication.

Features include:

- Server-generated authentication nonces.
- SIWE messages containing the domain, wallet address, chain ID, and nonce.
- Wallet signature requests through Wagmi.
- Server-side signature verification.
- Domain validation.
- Address validation.
- Chain validation.
- Single-use nonce protection against replay attacks.

SIWE proves control of the connected wallet through cryptographic message signing. It does not require an ETH transaction or gas fee.

### 3. ETH Tipping

Users can send ETH tips through the TipJar smart contract.

The tipping flow includes:

1. Connect a wallet.
2. Enter the tip amount.
3. Enter an optional message.
4. Review the transaction.
5. Approve the transaction in the wallet.
6. Submit the transaction to Sepolia.
7. Wait for confirmation.
8. Display the resulting transaction information.

### 4. Tip History

The application retrieves tipping activity from the blockchain.

Tip history includes:

- Sender wallet address.
- Tip amount.
- Optional message.
- Block number.
- Transaction hash.
- Transaction status.
- Sepolia Etherscan reference.

Blockchain events are retrieved through Viem contract event functionality.

### 5. ERC-20 Token Integration

The application also demonstrates interaction with the Quantek Token (QTK) ERC-20 contract.

| Functionality | Description |
|---|---|
| Token Balance | Retrieve the connected wallet's QTK balance |
| Transfer | Send QTK tokens to another wallet |
| Approve | Authorize another address to spend QTK |
| Allowance | Check an approved spending limit |
| TransferFrom | Execute a delegated token transfer |

### 6. Transaction Information

The application provides blockchain transaction information including:

- Transaction hashes.
- Confirmation status.
- Block numbers.
- Transaction status.
- Gas fee information.
- Sepolia Etherscan links.

---

## Technology Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | Application framework and API routes |
| React | Frontend development |
| TypeScript | Type-safe application development |
| Wagmi | React hooks for Ethereum interactions |
| Viem | Ethereum clients and blockchain utilities |
| RainbowKit | Wallet connection interface |
| SIWE | Ethereum wallet authentication |
| Solidity | Smart contract development |
| Ethereum Sepolia | Blockchain test network |
| ESLint | Code quality and linting |
| Vercel | Production deployment |

---

## Application Architecture

The application consists of three primary layers.

### 1. Frontend Layer

- Next.js App Router.
- React components.
- TypeScript.
- Wallet connectivity through RainbowKit and Wagmi.
- Tipping interface.
- Token interaction interface.
- Transaction history interface.

### 2. Blockchain Integration Layer

- Viem public clients for blockchain reads.
- Wallet clients for transaction execution.
- TipJar smart contract interaction.
- ERC-20 token interaction.
- Blockchain event retrieval.
- Transaction monitoring.

### 3. Authentication Layer

- Next.js API route handlers.
- Server-generated authentication nonces.
- SIWE message construction.
- Wallet signature verification.
- Domain validation.
- Address validation.
- Network validation.
- Replay protection through single-use nonces.

---

## Project Structure

```text
Blockchain/
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── siwe/
│   │   │   │   ├── nonce/
│   │   │   │   │   └── route.ts
│   │   │   │   └── verify/
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   └── tip-history/
│   │   │       └── route.ts
│   │   │
│   │   ├── connect/
│   │   ├── tipjar/
│   │   └── page.tsx
│   │
│   ├── components/
│   └── send.ts
│
├── tipjar/
│   ├── contracts/
│   ├── ignition/
│   ├── scripts/
│   ├── test/
│   └── hardhat.config.ts
│
├── public/
├── .env.example
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── package-lock.json
└── tsconfig.json
```

The `tipjar/` directory contains the separate Hardhat smart-contract development environment and is excluded from the Next.js frontend TypeScript build.

---

## Getting Started

### Prerequisites

Install the following:

- Node.js
- npm
- Git
- MetaMask or another compatible Ethereum wallet
- Sepolia test ETH

### 1. Clone the Repository

```bash
git clone https://github.com/Amanjeeta21/Blockchain.git
```

Navigate into the project:

```bash
cd Blockchain
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a local environment file:

```powershell
Copy-Item .env.example .env.local
```

Configure the required variables for the application.

Typical frontend variables include:

```env
NEXT_PUBLIC_WC_PROJECT_ID=YOUR_REOWN_PROJECT_ID
NEXT_PUBLIC_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
NEXT_PUBLIC_TIPJAR_ADDRESS=YOUR_TIPJAR_CONTRACT_ADDRESS
NEXT_PUBLIC_TOKEN_ADDRESS=YOUR_QUANTEK_TOKEN_CONTRACT_ADDRESS
NEXT_PUBLIC_TIPJAR_DEPLOYMENT_BLOCK=YOUR_DEPLOYMENT_BLOCK
```

Never place private keys or secret credentials in variables prefixed with `NEXT_PUBLIC_`.

Do not commit `.env`, `.env.local`, or other files containing private credentials.

### 4. Configure MetaMask

1. Install MetaMask.
2. Create or import an Ethereum wallet.
3. Switch to the Sepolia test network.
4. Obtain Sepolia test ETH from a faucet.
5. Open the application.
6. Connect the wallet.
7. Confirm that the application is using Sepolia.

**Network:** Ethereum Sepolia

**Chain ID:** `11155111`

### 5. Run the Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Authentication – Sign-In with Ethereum

TipJar uses Sign-In with Ethereum to authenticate users through their Ethereum wallets.

### Authentication Workflow

1. On the home page, select **Connect Wallet** and choose a wallet. Switch to Sepolia if prompted.
2. TipJar requests a one-time nonce from the server, which stores it in a short-lived HttpOnly cookie.
3. Sign the SIWE message with the connected wallet. The message includes the domain, wallet address, chain ID, nonce, and issue time.
4. The server verifies the signature and consumes the nonce.
5. The same page displays the verified wallet address and enables the tip and token tools. Disconnecting or changing accounts requires a new signature.

### Security Properties

- Private keys never need to be shared with the application.
- Domain binding helps prevent authentication messages from being reused on unrelated domains.
- Single-use nonces protect against replay attacks.
- Chain validation ensures authentication occurs on the expected network.
- Signing a SIWE message does not create an on-chain transaction.

---

## Smart Contracts

The application uses Solidity smart contracts deployed to the Ethereum Sepolia testnet.

### Deployed Sepolia Contracts

**Network:** Ethereum Sepolia

**Chain ID:** `11155111`

| Contract | Address | Explorer |
|---|---|---|
| TipJar | `0x93F98CB57A26121d2bd9d3E5960154B31beD634b` | [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x93F98CB57A26121d2bd9d3E5960154B31beD634b) |
| QuantekToken (QTK) | `0x6F4400A45C7BCAa127F865b2EC86a5bFeD63a23a` | [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x6F4400A45C7BCAa127F865b2EC86a5bFeD63a23a) |

### TipJar Contract

The TipJar contract handles ETH tipping functionality.

A typical interaction includes:

1. Select the recipient.
2. Enter the ETH amount.
3. Add an optional message.
4. Request transaction approval.
5. Broadcast the transaction to Sepolia.
6. Wait for confirmation.
7. Retrieve the transaction information.
8. Display the tip in the application history.

### QuantekToken Contract

The Quantek Token contract demonstrates standard ERC-20 functionality:

- `balanceOf()`
- `transfer()`
- `approve()`
- `allowance()`
- `transferFrom()`

These functions demonstrate how decentralized applications interact with ERC-20 smart contracts.

---

## Production Deployment

The application is deployed using Vercel.

### Live Application

**https://amanjeeta-tipjar.vercel.app/**

### Deployment Configuration

The production deployment uses:

- GitHub as the source repository.
- `main` as the production branch.
- Vercel for hosting.
- Ethereum Sepolia for blockchain interactions.
- Reown/WalletConnect for wallet connectivity.

### Deployment Workflow

1. Push changes to the GitHub repository.
2. Vercel detects the new commit.
3. Vercel installs project dependencies.
4. Next.js performs the production build.
5. TypeScript validation runs.
6. The application is deployed.
7. The updated production URL becomes available.

Every new push to the production branch can trigger a new Vercel deployment automatically.

### Production Environment Variables

The Vercel deployment requires the appropriate public application variables, including:

```text
NEXT_PUBLIC_WC_PROJECT_ID
NEXT_PUBLIC_RPC_URL
NEXT_PUBLIC_TIPJAR_ADDRESS
NEXT_PUBLIC_TOKEN_ADDRESS
NEXT_PUBLIC_TIPJAR_DEPLOYMENT_BLOCK
```

Private wallet credentials must never be exposed through browser-accessible environment variables.

---

## WalletConnect Configuration

The production domain is configured for wallet connectivity:

```text
amanjeeta-tipjar.vercel.app
```

The domain is allowlisted in the Reown/WalletConnect project used by the application.

WalletConnect can be used to connect supported mobile wallets to the deployed application.

---

## Testing the Deployed Application

The production application can be tested from both desktop and mobile devices.

### Desktop

1. Open:

```text
https://amanjeeta-tipjar.vercel.app/
```

2. Connect a supported wallet.
3. Switch to Sepolia.
4. Sign in using SIWE.
5. Send a small test tip.
6. Verify the transaction.
7. Check Tip History.

### Mobile

The application can be opened through a compatible mobile wallet environment, including MetaMask Mobile.

The user can also connect through WalletConnect by scanning the QR code or using the supported wallet deep-link flow.

### Peer-to-Peer Testing

A second user can:

1. Open the production URL.
2. Connect their own wallet.
3. Switch to Sepolia.
4. Sign in.
5. Enter a small ETH tip.
6. Confirm the transaction.
7. Verify the resulting transaction and Tip History.

Only Sepolia test ETH should be used for testing.

---

## Security Considerations

Security is especially important for blockchain applications.

- Never hardcode wallet private keys in source files.
- Never expose private keys through `NEXT_PUBLIC_` environment variables.
- Keep private credentials in local or server-side environment variables.
- Use server-generated single-use nonces for SIWE.
- Validate signatures, domains, addresses, and chain IDs.
- Restrict RPC provider API keys to approved domains where supported.
- Avoid exposing unrestricted RPC credentials.
- Verify transaction details before signing.
- Keep `.env` and `.env.local` out of version control.
- Use testnet ETH for application testing.

The `src/send.ts` script is intended for local transaction execution and should not be imported into browser-side components.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the development server |
| `npm run build` | Creates an optimized production build |
| `npm run start` | Starts the production server |
| `npm run lint` | Runs ESLint |
| `npx tsc --noEmit` | Performs TypeScript type checking |

---

## Network Information

| Property | Value |
|---|---|
| Blockchain | Ethereum |
| Network | Sepolia Testnet |
| Chain ID | `11155111` |
| Native Currency | Sepolia ETH |
| Block Explorer | [Sepolia Etherscan](https://sepolia.etherscan.io/) |
| Live Application | https://amanjeeta-tipjar.vercel.app/ |

---

## Learning Outcomes

This project provides practical experience with:

- Web3 application development.
- Ethereum wallet integration.
- WalletConnect integration.
- Sign-In with Ethereum authentication.
- Cryptographic message signing and verification.
- Nonce generation and replay protection.
- Solidity smart contract development.
- Smart contract deployment.
- ETH transfers and transaction lifecycle.
- ERC-20 token standards.
- Blockchain event retrieval.
- Next.js API route handlers.
- Viem blockchain clients.
- Wagmi React hooks.
- RPC configuration.
- Environment variable security.
- Production builds.
- Vercel deployment.
- Decentralized application testing.

---

## Project Links

- **Live Demo:** https://amanjeeta-tipjar.vercel.app/
- **GitHub Repository:** https://github.com/Amanjeeta21/Blockchain
- **TipJar Contract:** https://sepolia.etherscan.io/address/0x93F98CB57A26121d2bd9d3E5960154B31beD634b
- **QuantekToken Contract:** https://sepolia.etherscan.io/address/0x6F4400A45C7BCAa127F865b2EC86a5bFeD63a23a
- **Sepolia Explorer:** https://sepolia.etherscan.io/

---

## License

This project is intended for educational and demonstration purposes.
