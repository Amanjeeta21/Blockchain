# Blockchain

A minimal TypeScript blockchain starter project using Node.js, dotenv, and viem.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment file:
   ```bash
   copy .env.example .env
   ```

3. Update the values in `.env` with your RPC provider and wallet credentials.

4. Run the project:
   ```bash
   npx tsx src/index.ts
   ```

## Project structure

- `src/` - application source code
- `.env.example` - environment variables template
- `.gitignore` - ignores local environment and build artifacts

## Notes

This starter is intentionally lightweight and can be extended with wallet interaction, smart contract calls, or blockchain indexing logic.

## TipJar dApp

A decentralized tipping dApp built with Next.js, TypeScript, Wagmi, Viem, and RainbowKit on the Ethereum Sepolia testnet.

### Features

- MetaMask wallet connection
- Sepolia network support
- ETH tipping with messages
- Tip history
- Transaction status and Etherscan links
- Owner-only withdrawal
- Friendly transaction error handling

### Run the dApp

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment file:
   ```bash
   copy .env.example .env.local
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

Open `http://localhost:3000` and connect MetaMask on the Sepolia network.

### Smart Contract

**TipJar:** `0x93F98CB57A26121d2bd9d3E5960154B31beD634b`

The frontend hides the withdrawal option from non-owners, while the smart contract enforces ownership on-chain.