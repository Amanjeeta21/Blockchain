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
