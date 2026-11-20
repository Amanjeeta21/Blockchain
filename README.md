# TipJar – Ethereum-Based Tipping dApp

A decentralized Ethereum application that enables users to connect their crypto wallets, authenticate using Sign-In with Ethereum (SIWE), send ETH tips with messages, and interact with ERC-20 tokens.

Built with Next.js, TypeScript, Wagmi, Viem, RainbowKit, and Solidity, the application demonstrates practical blockchain integration through the Ethereum Sepolia testnet.

**Repository:** https://github.com/Amanjeeta21/Blockchain

---

## Overview

TipJar is a Web3 tipping application that allows users to send cryptocurrency directly between Ethereum wallets without relying on a centralized payment platform.

Users can connect their wallets, authenticate ownership through cryptographic message signing, send ETH tips with optional messages, and explore transaction history.

Beyond ETH tipping, the application incorporates ERC-20 token functionality, allowing users to check token balances, transfer tokens, approve spending allowances, and perform delegated transfers.

The project demonstrates the integration of frontend interfaces, wallet connectivity, smart contract interactions, blockchain event retrieval, and secure wallet-based authentication.

## Key Features

### 1. Wallet Connectivity
- Connect Ethereum wallets using RainbowKit.
- Support MetaMask and other compatible wallets.
- Display connected wallet information.
- Verify the active blockchain network.
- Support Ethereum Sepolia testnet interactions.

### 2. Sign-In with Ethereum (SIWE)
- Authenticate users through their Ethereum wallets.
- Generate random authentication nonces on the server.
- Construct SIWE messages containing the domain, wallet address, chain ID, and nonce.
- Request wallet signatures using Wagmi's `useSignMessage`.
- Verify signatures through Next.js API route handlers.
- Validate message origin, domain, address, and network.
- Use single-use nonces to protect against replay attacks.

SIWE verifies control of a wallet's private key through message signing. Authentication does not require an ETH transaction or gas fee.

### 3. ETH Tipping
- Send ETH to another Ethereum wallet.
- Include an optional message with each tip.
- Request transaction approval through the connected wallet.
- Submit transactions to the Sepolia network.
- Display transaction status and details.
- Track tipping activity through smart contract events.

### 4. Tip History
- Retrieve historical tipping events from the blockchain.
- Display sender addresses, tip amounts, and messages.
- Show associated block numbers.
- Reference transaction hashes.
- Retrieve events using Viem's contract event functionality.

### 5. ERC-20 Token Integration

The application supports common ERC-20 token operations.

| Functionality | Description |
|---|---|
| Token Balance | Retrieve the connected wallet's token balance |
| Transfer | Send tokens to another wallet |
| Approve | Authorize another address to spend tokens |
| Allowance | Check the approved spending limit |
| TransferFrom | Execute delegated token transfers |

### 6. Transaction Information
- Retrieve transaction hashes.
- Monitor transaction confirmations.
- Display block numbers and transaction status.
- Calculate gas fees using transaction receipt information.
- Provide Sepolia Etherscan links for transaction verification.

---

## Technology Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | Application framework and API routes |
| React | Frontend development |
| TypeScript | Type-safe application development |
| Wagmi | React hooks for Ethereum wallet interactions |
| Viem | Ethereum clients and blockchain utilities |
| RainbowKit | Wallet connection interface |
| SIWE | Ethereum wallet authentication |
| Solidity | Smart contract development |
| Ethereum Sepolia | Blockchain test network |
| ESLint | Code quality and linting |
| Vercel | Deployment platform |

## Application Architecture

The application consists of three primary layers:

**1. Frontend Layer**
- Next.js App Router.
- React components and TypeScript.
- Wallet connection through RainbowKit and Wagmi.
- User interfaces for tipping, token operations, and transaction history.

**2. Blockchain Integration Layer**
- Viem public clients for reading blockchain data.
- Viem wallet clients for transaction execution.
- Smart contract interactions.
- Blockchain event retrieval and transaction monitoring.

**3. Authentication Layer**
- Next.js API route handlers.
- Server-generated authentication nonces.
- SIWE message construction and signature verification.
- Domain and network validation.

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
│   │
│   └── send.ts
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

## Getting Started

### Prerequisites

- Node.js
- npm
- Git
- MetaMask browser extension
- Sepolia test ETH

### 1. Clone the Repository

```bash
git clone https://github.com/Amanjeeta21/Blockchain.git
```

Navigate into the project directory:

```bash
cd Blockchain
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a local environment file using the example:

```powershell
Copy-Item .env.example .env.local
```

Configure the required environment variables according to the application's configuration.

Typical configuration may include:

- Sepolia RPC endpoint.
- WalletConnect project ID, if required.
- Deployed smart contract addresses.
- Other application-specific settings.

Never place private keys or secret credentials in variables prefixed with `NEXT_PUBLIC_`.

Do not commit `.env` or `.env.local` to Git.

### 4. Configure MetaMask

1. Install the MetaMask browser extension.
2. Create or import an Ethereum wallet.
3. Select the Sepolia test network.
4. Obtain test ETH from a Sepolia faucet.
5. Ensure the application is configured to use the same network.

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

TipJar uses Sign-In with Ethereum (SIWE) to authenticate users through their wallets.

### Authentication Workflow

1. The user selects Sign In.
2. The user connects their wallet through the wallet connection interface.
3. The frontend requests an authentication nonce from the server.
4. The server generates a random nonce and stores it in a short-lived HttpOnly cookie.
5. The frontend constructs a SIWE message containing the domain, wallet address, chain ID, nonce, and issued-at information.
6. The user signs the message through MetaMask.
7. The signed message and signature are sent to the verification API.
8. The server validates the signature and SIWE message details.
9. The nonce is checked to prevent replay attacks.
10. Successful verification allows the user to proceed.

### Security Properties

- **Private key protection:** The private key never needs to be shared with the application.
- **Domain binding:** Prevents authentication messages from being reused on unrelated domains.
- **Nonce validation:** Prevents replay attacks.
- **Network validation:** Ensures authentication is associated with the expected blockchain network.
- **Gas-free authentication:** Signing a message does not create an on-chain transaction.

---

## Smart Contract Interactions

The application uses Wagmi and Viem to communicate with Ethereum smart contracts.

## Deployed Sepolia Contracts

The application is configured to use these Ethereum Sepolia deployments
(chain ID `11155111`):

| Contract | Address | Explorer |
|---|---|---|
| TipJar | `0x93F98CB57A26121d2bd9d3E5960154B31beD634b` | [Etherscan](https://sepolia.etherscan.io/address/0x93F98CB57A26121d2bd9d3E5960154B31beD634b) |
| QuantekToken (QTK) | `0x6F4400A45C7BCAa127F865b2EC86a5bFeD63a23a` | [Etherscan](https://sepolia.etherscan.io/address/0x6F4400A45C7BCAa127F865b2EC86a5bFeD63a23a) |

### ETH Tipping

A typical tipping transaction involves:

1. Selecting the recipient.
2. Entering the ETH amount.
3. Adding an optional message.
4. Requesting transaction approval through the connected wallet.
5. Broadcasting the transaction to Sepolia.
6. Waiting for transaction confirmation.
7. Displaying transaction information.

### ERC-20 Operations

The application demonstrates important ERC-20 functions:

- `balanceOf()` – Retrieves the token balance.
- `transfer()` – Transfers tokens to another address.
- `approve()` – Authorizes token spending.
- `allowance()` – Retrieves the approved spending allowance.
- `transferFrom()` – Transfers tokens using an existing allowance.

These operations demonstrate how decentralized applications interact with token smart contracts.

---

## Security Considerations

Security is essential when developing and deploying blockchain applications.

- Never hardcode wallet private keys in source files.
- Never expose private keys through frontend environment variables.
- Keep private credentials in local or server-side environment variables.
- Use server-generated, single-use nonces for SIWE authentication.
- Validate signatures, domains, addresses, and chain IDs.
- Restrict RPC provider API keys to approved domains where supported.
- Avoid exposing unrestricted RPC credentials.
- Verify transaction details before signing.
- Keep `.env` and `.env.local` out of version control.

The `src/send.ts` script is intended for local transaction execution. It reads wallet configuration from environment variables and should never be imported into browser-side components.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the development server |
| `npm run build` | Creates an optimized production build |
| `npm run start` | Starts the production server |
| `npm run lint` | Runs ESLint |
| `npx tsc --noEmit` | Performs TypeScript type checking |

## Deployment

The Next.js application can be deployed using Vercel.

### Deployment Steps

1. Push the repository to GitHub.
2. Import the repository into Vercel.
3. Configure the required environment variables.
4. Configure the RPC provider's domain restrictions.
5. Verify the deployed smart contract addresses.
6. Deploy the application.
7. Test wallet connection, SIWE authentication, ETH tipping, token operations, and transaction history on Sepolia.

Never expose private keys or unrestricted provider credentials in browser-accessible environment variables.

## Network Information

| Property | Value |
|---|---|
| Blockchain | Ethereum |
| Network | Sepolia Testnet |
| Chain ID | `11155111` |
| Native Currency | Sepolia ETH |
| Block Explorer | [Sepolia Etherscan](https://sepolia.etherscan.io/) |

## Learning Outcomes

This project provides practical experience with:

- Web3 application development.
- Ethereum wallet integration.
- Sign-In with Ethereum authentication.
- Cryptographic message signing and verification.
- Nonce generation and replay protection.
- Solidity smart contract interaction.
- ETH transfers and transaction lifecycle.
- ERC-20 token standards.
- Blockchain event retrieval.
- Next.js API route handlers.
- RPC configuration and environment variable security.
- Production builds and deployment preparation.
