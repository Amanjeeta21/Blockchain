
"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  formatUnits,
  getAddress,
  isAddress,
  parseUnits,
  zeroAddress,
} from "viem";
import {
  useAccount,
  useChainId,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { sepolia } from "wagmi/chains";

import {
  QUANTEK_TOKEN_ABI,
  QUANTEK_TOKEN_ADDRESS,
} from "@/lib/contracts";
import { getFriendlyErrorMessage } from "@/lib/errors";

export default function SendTokens() {
  // Direct transfer form
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  // Approval form
  const [spender, setSpender] = useState("");
  const [approvalAmount, setApprovalAmount] = useState("");

  const queryClient = useQueryClient();

  const refreshedTransactions = useRef<Set<string>>(new Set());

  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const isSepolia = chainId === sepolia.id;

  // Read token decimals
  const {
    data: decimals,
    error: decimalsError,
    isError: isDecimalsError,
  } = useReadContract({
    address: QUANTEK_TOKEN_ADDRESS,
    abi: QUANTEK_TOKEN_ABI,
    functionName: "decimals",
    chainId: sepolia.id,
  });

  // Direct transfer write
  const {
    data: hash,
    error: writeError,
    isPending,
    writeContract,
    reset,
  } = useWriteContract();

  // Direct transfer receipt
  const {
    data: receipt,
    error: receiptError,
    isLoading,
    isSuccess,
  } = useWaitForTransactionReceipt({
    hash,
    chainId: sepolia.id,
    query: {
      enabled: Boolean(hash),
    },
  });

  // Approval write
  const {
    data: approvalHash,
    error: approvalWriteError,
    isPending: isApprovalPending,
    writeContract: writeApproval,
    reset: resetApproval,
  } = useWriteContract();

  // Approval receipt
  const {
    data: approvalReceipt,
    error: approvalReceiptError,
    isLoading: isApprovalLoading,
    isSuccess: isApprovalSuccess,
  } = useWaitForTransactionReceipt({
    hash: approvalHash,
    chainId: sepolia.id,
    query: {
      enabled: Boolean(approvalHash),
    },
  });

  // Refresh contract reads after either transaction is confirmed
  useEffect(() => {
    if (
      hash &&
      isSuccess &&
      receipt?.status === "success" &&
      !refreshedTransactions.current.has(hash)
    ) {
      refreshedTransactions.current.add(hash);
      void queryClient.invalidateQueries();
    }
  }, [hash, isSuccess, receipt?.status, queryClient]);

  useEffect(() => {
    if (
      approvalHash &&
      isApprovalSuccess &&
      approvalReceipt?.status === "success" &&
      !refreshedTransactions.current.has(approvalHash)
    ) {
      refreshedTransactions.current.add(approvalHash);
      void queryClient.invalidateQueries();
    }
  }, [
    approvalHash,
    isApprovalSuccess,
    approvalReceipt?.status,
    queryClient,
  ]);

  // Validate direct transfer amount
  let parsedAmount: bigint | null = null;

  try {
    if (amount.trim() && decimals !== undefined) {
      parsedAmount = parseUnits(amount.trim(), decimals);
    }
  } catch {
    parsedAmount = null;
  }

  const isRecipientValid = isAddress(recipient.trim());
  const isAmountValid = parsedAmount !== null && parsedAmount > 0n;

  // Validate approval amount
  let parsedApprovalAmount: bigint | null = null;

  try {
    if (approvalAmount.trim() && decimals !== undefined) {
      parsedApprovalAmount = parseUnits(
        approvalAmount.trim(),
        decimals
      );
    }
  } catch {
    parsedApprovalAmount = null;
  }

  const isSpenderValid = isAddress(spender.trim());

  const isApprovalAmountValid =
    parsedApprovalAmount !== null && parsedApprovalAmount > 0n;

  // Read current allowance for connected wallet and entered spender
  const {
    data: allowance,
    error: allowanceError,
    isLoading: isAllowanceLoading,
    isError: isAllowanceError,
    refetch: refetchAllowance,
  } = useReadContract({
    address: QUANTEK_TOKEN_ADDRESS,
    abi: QUANTEK_TOKEN_ABI,
    functionName: "allowance",
    args: [
      address ?? zeroAddress,
      isSpenderValid ? getAddress(spender.trim()) : zeroAddress,
    ],
    chainId: sepolia.id,
    query: {
      enabled:
        isConnected &&
        isSepolia &&
        isSpenderValid &&
        Boolean(address),
    },
  });

  const isTransactionPending = Boolean(hash) && isLoading;
  const isApprovalTransactionPending =
    Boolean(approvalHash) && isApprovalLoading;

  const isAnyTransactionPending =
    isPending ||
    isApprovalPending ||
    isTransactionPending ||
    isApprovalTransactionPending;

  const canSubmit =
    isConnected &&
    isSepolia &&
    decimals !== undefined &&
    !isDecimalsError &&
    isRecipientValid &&
    isAmountValid &&
    !isAnyTransactionPending;

  const canApprove =
    isConnected &&
    isSepolia &&
    decimals !== undefined &&
    !isDecimalsError &&
    isSpenderValid &&
    isApprovalAmountValid &&
    !isAnyTransactionPending;

  const transactionError = writeError ?? receiptError;

  const isFailed =
    Boolean(transactionError) || receipt?.status === "reverted";

  const approvalTransactionError =
    approvalWriteError ?? approvalReceiptError;

  const isApprovalFailed =
    Boolean(approvalTransactionError) ||
    approvalReceipt?.status === "reverted";

  // Submit direct transfer
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit || parsedAmount === null) return;

    reset();

    writeContract({
      address: QUANTEK_TOKEN_ADDRESS,
      abi: QUANTEK_TOKEN_ABI,
      functionName: "transfer",
      args: [getAddress(recipient.trim()), parsedAmount],
      chainId: sepolia.id,
    });
  }

  // Submit token approval
  function handleApprove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canApprove || parsedApprovalAmount === null) return;

    resetApproval();

    writeApproval({
      address: QUANTEK_TOKEN_ADDRESS,
      abi: QUANTEK_TOKEN_ABI,
      functionName: "approve",
      args: [
        getAddress(spender.trim()),
        parsedApprovalAmount,
      ],
      chainId: sepolia.id,
    });
  }

  return (
    <section className="send-tokens" aria-labelledby="send-tokens-heading">
      {/* NETWORK STATUS */}
      {!isConnected && (
        <div className="send-tokens-notice">
          Connect your wallet to use token functions.
        </div>
      )}

      {isConnected && !isSepolia && (
        <div className="send-tokens-notice send-tokens-warning" role="alert">
          Switch your wallet to the Sepolia network to use token functions.
        </div>
      )}

      {isDecimalsError && (
        <div className="send-tokens-error" role="alert">
          Unable to load token decimals.
          {decimalsError && (
            <span> {getFriendlyErrorMessage(decimalsError)}</span>
          )}
        </div>
      )}

      {/* DIRECT TOKEN TRANSFER */}
      <div className="send-tokens-heading">
        <p className="send-tokens-eyebrow">TOKEN TRANSFER</p>
        <h2 id="send-tokens-heading">SEND TOKENS</h2>
        <p>Transfer tokens directly to another Sepolia wallet.</p>
      </div>

      <form className="send-tokens-form" onSubmit={handleSubmit}>
        <div className="send-tokens-field">
          <label htmlFor="token-recipient">RECIPIENT ADDRESS</label>

          <input
            id="token-recipient"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            placeholder="0x..."
            required
          />

          {recipient && !isRecipientValid && (
            <p className="send-tokens-validation">
              Enter a valid Ethereum address.
            </p>
          )}
        </div>

        <div className="send-tokens-field">
          <label htmlFor="token-amount">AMOUNT</label>

          <div className="send-tokens-amount">
            <input
              id="token-amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.0"
              required
            />
            <span>QTK</span>
          </div>

          {amount && !isAmountValid && (
            <p className="send-tokens-validation">
              Enter a valid amount greater than zero with no more than{" "}
              {decimals ?? 0} decimal places.
            </p>
          )}
        </div>

        <button
          className="send-tokens-submit"
          type="submit"
          disabled={!canSubmit}
        >
          {isPending
            ? "WAITING FOR WALLET..."
            : isTransactionPending
              ? "TRANSACTION PENDING..."
              : "SEND TOKENS"}
        </button>
      </form>

      {/* DIRECT TRANSFER STATUS */}
      <div className="send-tokens-status" aria-live="polite">
        {isPending && !hash && (
          <p>Confirm the token transfer in your wallet.</p>
        )}

        {hash && (
          <p>
            <a
              href={`https://sepolia.etherscan.io/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View transfer transaction on Etherscan ↗
            </a>
          </p>
        )}

        {hash && isLoading && (
          <p>Transaction submitted. Waiting for confirmation...</p>
        )}

        {isSuccess && receipt?.status === "success" && (
          <p className="send-tokens-success">
            Token transfer confirmed on Sepolia.
          </p>
        )}

        {isFailed && (
          <p className="send-tokens-error" role="alert">
            {transactionError
              ? getFriendlyErrorMessage(transactionError)
              : "The token transfer failed. No tokens were sent."}
          </p>
        )}
      </div>

      <div className="send-tokens-divider" />

      {/* TOKEN APPROVAL */}
      <div className="send-tokens-heading">
        <p className="send-tokens-eyebrow">TOKEN PERMISSIONS</p>
        <h2>APPROVE TOKENS</h2>
        <p>
          Allow another wallet to spend a specified amount of your QTK tokens.
        </p>
      </div>

      <form className="send-tokens-form" onSubmit={handleApprove}>
        <div className="send-tokens-field">
          <label htmlFor="token-spender">SPENDER ADDRESS</label>

          <input
            id="token-spender"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={spender}
            onChange={(event) => setSpender(event.target.value)}
            placeholder="Enter teammate's wallet address"
            required
          />

          {spender && !isSpenderValid && (
            <p className="send-tokens-validation">
              Enter a valid Ethereum address.
            </p>
          )}
        </div>

        <div className="send-tokens-field">
          <label htmlFor="approval-amount">APPROVAL AMOUNT</label>

          <div className="send-tokens-amount">
            <input
              id="approval-amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={approvalAmount}
              onChange={(event) => setApprovalAmount(event.target.value)}
              placeholder="0.0"
              required
            />
            <span>QTK</span>
          </div>

          {approvalAmount && !isApprovalAmountValid && (
            <p className="send-tokens-validation">
              Enter a valid amount greater than zero with no more than{" "}
              {decimals ?? 0} decimal places.
            </p>
          )}
        </div>

        <button
          className="send-tokens-submit"
          type="submit"
          disabled={!canApprove}
        >
          {isApprovalPending
            ? "WAITING FOR WALLET..."
            : isApprovalTransactionPending
              ? "APPROVAL PENDING..."
              : "APPROVE TOKENS"}
        </button>
      </form>

      {/* APPROVAL STATUS */}
      <div className="send-tokens-status" aria-live="polite">
        {isApprovalPending && !approvalHash && (
          <p>Confirm the approval transaction in your wallet.</p>
        )}

        {approvalHash && (
          <p>
            <a
              href={`https://sepolia.etherscan.io/tx/${approvalHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View approval transaction on Etherscan ↗
            </a>
          </p>
        )}

        {approvalHash && isApprovalLoading && (
          <p>Approval submitted. Waiting for confirmation...</p>
        )}

        {isApprovalSuccess && approvalReceipt?.status === "success" && (
          <p className="send-tokens-success">
            Approval confirmed! The spender can now use the authorised
            allowance.
          </p>
        )}

        {isApprovalFailed && (
          <p className="send-tokens-error" role="alert">
            {approvalTransactionError
              ? getFriendlyErrorMessage(approvalTransactionError)
              : "The approval transaction failed."}
          </p>
        )}
      </div>

      {/* CURRENT ALLOWANCE */}
      <div className="send-tokens-allowance">
        <div className="send-tokens-allowance-heading">
          <div>
            <p className="send-tokens-eyebrow">PERMISSION CHECK</p>
            <h3>CURRENT ALLOWANCE</h3>
          </div>

          <button
            type="button"
            className="send-tokens-refresh"
            onClick={() => void refetchAllowance()}
            disabled={
              !isConnected ||
              !isSepolia ||
              !isSpenderValid ||
              isAllowanceLoading
            }
            aria-label="Refresh allowance"
            title="Refresh allowance"
          >
            ↻
          </button>
        </div>

        {!isConnected ? (
          <p>Connect your wallet to check its allowance.</p>
        ) : !isSepolia ? (
          <p>Switch to Sepolia to check the allowance.</p>
        ) : !isSpenderValid ? (
          <p>Enter a valid spender address to check the allowance.</p>
        ) : isAllowanceLoading ? (
          <p>Checking allowance...</p>
        ) : isAllowanceError ? (
          <p className="send-tokens-error" role="alert">
            Unable to read allowance.
            {allowanceError && (
              <span> {getFriendlyErrorMessage(allowanceError)}</span>
            )}
          </p>
        ) : allowance !== undefined && decimals !== undefined ? (
          <p className="send-tokens-allowance-value">
            {formatUnits(allowance, decimals)}
            <span> QTK</span>
          </p>
        ) : (
          <p>Allowance information is not available.</p>
        )}

        <p className="send-tokens-hint">
          This is the remaining amount the connected wallet has authorised
          the entered spender to use.
        </p>
      </div>

      {/* APPROVAL SECURITY NOTE */}
      <div className="send-tokens-security">
        <strong>Security reminder</strong>
        <p>
          Only approve wallets you trust. Approve the exact amount needed
          instead of granting unlimited spending permission.
        </p>
      </div>

      <style jsx>{`
        .send-tokens {
          width: 100%;
          max-width: 1050px;
          margin: 18px auto;
          padding: 28px;
          border: 1px solid #e4e2e8;
          border-radius: 14px;
          background: #fff;
        }

        .send-tokens-heading {
          margin-bottom: 22px;
        }

        .send-tokens-eyebrow {
          margin: 0 0 7px;
          color: #70569d;
          font-family: "DM Mono", monospace;
          font-size: 9px;
          letter-spacing: 2px;
        }

        .send-tokens-heading h2 {
          margin: 0;
          color: #202024;
          font-size: 19px;
          font-weight: 800;
        }

        .send-tokens-heading > p:last-child {
          margin: 8px 0 0;
          color: #777780;
          font-size: 12px;
          line-height: 1.6;
        }

        .send-tokens-notice,
        .send-tokens-error {
          margin: 14px 0;
          padding: 12px 14px;
          border-radius: 8px;
          background: #f5f4f7;
          color: #55535d;
          font-size: 12px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .send-tokens-warning {
          background: #f7f2ec;
          color: #855b2f;
        }

        .send-tokens-error {
          background: #fbf0f0;
          color: #9c3e3e;
        }

        .send-tokens-form {
          display: grid;
          gap: 17px;
        }

        .send-tokens-field {
          display: grid;
          gap: 8px;
        }

        .send-tokens-field label {
          color: #686570;
          font-family: "DM Mono", monospace;
          font-size: 9px;
          letter-spacing: 1.3px;
        }

        .send-tokens-field input {
          width: 100%;
          min-width: 0;
          padding: 13px 14px;
          border: 1px solid #dedce3;
          border-radius: 8px;
          outline: none;
          background: #fbfafc;
          color: #29272f;
          font-family: "DM Mono", monospace;
          font-size: 12px;
        }

        .send-tokens-field input:focus {
          border-color: #8b75b3;
          box-shadow: 0 0 0 3px rgba(112, 86, 157, 0.12);
        }

        .send-tokens-amount {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-right: 14px;
          border: 1px solid #dedce3;
          border-radius: 8px;
          background: #fbfafc;
        }

        .send-tokens-amount input {
          border: 0;
          background: transparent;
        }

        .send-tokens-amount input:focus {
          box-shadow: none;
        }

        .send-tokens-amount span {
          flex-shrink: 0;
          color: #70569d;
          font-family: "DM Mono", monospace;
          font-size: 10px;
        }

        .send-tokens-validation {
          margin: 0;
          color: #9c3e3e;
          font-size: 11px;
        }

        .send-tokens-submit {
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: center;
          min-height: 45px;
          padding: 12px 16px;
          border: 1px solid #70569d;
          border-radius: 8px;
          background: #70569d;
          color: #fff;
          font-family: "DM Mono", monospace;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 1px;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .send-tokens-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          background: #59427f;
        }

        .send-tokens-submit:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .send-tokens-status {
          color: #55535d;
          font-size: 12px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .send-tokens-status p {
          margin: 13px 0 0;
        }

        .send-tokens-status a {
          color: #70569d;
          font-weight: 600;
        }

        .send-tokens-success {
          color: #477153;
        }

        .send-tokens-divider {
          height: 1px;
          margin: 30px 0;
          background: #e9e6ed;
        }

        .send-tokens-allowance {
          margin-top: 24px;
          padding: 19px;
          border: 1px solid #e4e2e8;
          border-radius: 10px;
          background: #fbfafc;
        }

        .send-tokens-allowance-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .send-tokens-allowance-heading h3 {
          margin: 0;
          color: #202024;
          font-size: 13px;
          font-weight: 800;
        }

        .send-tokens-refresh {
          width: 34px;
          height: 34px;
          border: 1px solid #dedce3;
          border-radius: 50%;
          background: #fff;
          color: #70569d;
          font-size: 21px;
          cursor: pointer;
        }

        .send-tokens-refresh:disabled {
          cursor: not-allowed;
          opacity: 0.45;
        }

        .send-tokens-allowance-value {
          margin: 17px 0 0;
          color: #29272f;
          font-size: clamp(23px, 4vw, 30px);
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .send-tokens-allowance-value span {
          color: #70569d;
          font-size: 13px;
        }

        .send-tokens-allowance > p:not(.send-tokens-allowance-value) {
          color: #686570;
          font-size: 12px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .send-tokens-hint {
          margin-bottom: 0;
        }

        .send-tokens-security {
          margin-top: 16px;
          padding: 14px 16px;
          border-radius: 8px;
          background: #f7f2ec;
          color: #855b2f;
          font-size: 12px;
          line-height: 1.6;
        }

        .send-tokens-security p {
          margin: 5px 0 0;
        }

        @media (max-width: 650px) {
          .send-tokens {
            padding: 22px 18px;
          }
        }
      `}</style>
    </section>
  );
}
