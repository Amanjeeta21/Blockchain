
"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { parseEther } from "viem";
import {
  useAccount,
  useChainId,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { sepolia } from "wagmi/chains";

import { TIPJAR_ABI, TIPJAR_ADDRESS } from "@/lib/contracts";
import { getFriendlyErrorMessage } from "@/lib/errors";

export default function TipForm() {
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState("");

  const queryClient = useQueryClient();

  const refreshedTransaction = useRef<string | undefined>(undefined);

  const { isConnected } = useAccount();
  const chainId = useChainId();

  const {
    data: hash,
    error: writeError,
    isPending,
    writeContract,
    reset,
  } = useWriteContract();

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

  useEffect(() => {
    if (
      hash &&
      isSuccess &&
      receipt?.status === "success" &&
      refreshedTransaction.current !== hash
    ) {
      refreshedTransaction.current = hash;
      void queryClient.invalidateQueries();
    }
  }, [hash, isSuccess, receipt?.status, queryClient]);

  const isSepolia = chainId === sepolia.id;

  let parsedAmount: bigint | null = null;

  try {
    if (amount.trim() !== "") {
      parsedAmount = parseEther(amount.trim());
    }
  } catch {
    parsedAmount = null;
  }

  const isAmountValid =
    parsedAmount !== null && parsedAmount > 0n;

  const isMessageValid = message.trim().length > 0;

  const isTransactionPending = Boolean(hash) && isLoading;

  const canSubmit =
    isConnected &&
    isSepolia &&
    isAmountValid &&
    isMessageValid &&
    !isPending &&
    !isTransactionPending;

  const transactionError = writeError ?? receiptError;

  const isFailed =
    Boolean(transactionError) ||
    receipt?.status === "reverted";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit || parsedAmount === null) {
      return;
    }

    reset();

    writeContract({
      address: TIPJAR_ADDRESS,
      abi: TIPJAR_ABI,
      functionName: "tip",
      args: [message.trim()],
      value: parsedAmount,
      chainId: sepolia.id,
    });
  }

  return (
    <>
      <section className="tip-form-section">
        <div className="tip-form-heading">
          <p className="tip-form-eyebrow">SHOW YOUR SUPPORT</p>
          <h2>SEND A TIP</h2>
          <p>
            Leave a message and support with a little ETH.
          </p>
        </div>

        {!isConnected && (
          <div className="tip-form-notice">
            Connect your wallet to send a tip.
          </div>
        )}

        {isConnected && !isSepolia && (
          <div className="tip-form-notice tip-form-warning">
            Please switch your wallet to the Sepolia network.
          </div>
        )}

        <form onSubmit={handleSubmit} className="tip-form">
          <div className="tip-form-field">
            <label htmlFor="tip-message">YOUR MESSAGE</label>

            <textarea
              id="tip-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write something nice..."
              rows={4}
              maxLength={280}
              required
            />

            <span className="tip-form-character-count">
              {message.length}/280
            </span>
          </div>

          <div className="tip-form-field">
            <label htmlFor="tip-amount">TIP AMOUNT</label>

            <div className="tip-form-amount-wrapper">
              <input
                id="tip-amount"
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.01"
                required
              />

              <span>ETH</span>
            </div>

            {amount !== "" && !isAmountValid && (
              <p className="tip-form-validation">
                Enter a valid ETH amount greater than zero.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="tip-form-submit"
            disabled={!canSubmit}
          >
            {isPending
              ? "WAITING FOR WALLET..."
              : isTransactionPending
                ? "TRANSACTION PENDING..."
                : "SEND TIP"}
          </button>
        </form>

        <div className="tip-transaction-status" aria-live="polite">
          {isPending && !hash && (
            <div className="tip-status-message">
              <span className="tip-status-dot pending" />
              Waiting for wallet approval. Confirm the transaction in MetaMask.
            </div>
          )}

          {hash && (
            <div className="tip-transaction-link">
              <span>TRANSACTION HASH</span>

              <a
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View transaction on Etherscan ↗
              </a>
            </div>
          )}

          {hash && isLoading && (
            <div className="tip-status-message">
              <span className="tip-status-dot pending" />
              Transaction submitted. Waiting for blockchain confirmation...
            </div>
          )}

          {isSuccess && receipt?.status === "success" && (
            <div className="tip-status-message tip-status-success">
              <span className="tip-status-dot success" />
              Your tip was successfully confirmed on Sepolia!
            </div>
          )}

          {isFailed && (
            <div
              className="tip-status-message tip-status-error"
              role="alert"
            >
              <span className="tip-status-dot error" />
              {transactionError
                ? getFriendlyErrorMessage(transactionError)
                : "The smart contract reverted your transaction. No tip was sent."}
            </div>
          )}
        </div>

        <style jsx>{`
          .tip-form-section {
            width: 100%;
            max-width: 1050px;
            margin: 22px auto;
            padding: 30px;
            background: #ffffff;
            border: 1px solid #d5d3db;
            border-radius: 14px;
          }

          .tip-form-heading {
            margin-bottom: 26px;
          }

          .tip-form-eyebrow {
            margin: 0 0 9px;
            color: #70569d;
            font-family: "DM Mono", monospace;
            font-size: 10px;
            letter-spacing: 1.8px;
            font-weight: 600;
          }

          .tip-form-heading h2 {
            margin: 0;
            color: #242329;
            font-size: 19px;
            font-weight: 800;
            letter-spacing: 0.5px;
          }

          .tip-form-heading > p:last-child {
            margin: 8px 0 0;
            color: #77737e;
            font-size: 13px;
          }

          .tip-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .tip-form-field {
            display: flex;
            flex-direction: column;
            gap: 9px;
          }

          .tip-form-field label {
            color: #55535d;
            font-family: "DM Mono", monospace;
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 1px;
          }

          .tip-form-field textarea,
          .tip-form-field input {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #d5d3db;
            border-radius: 8px;
            background: #faf9fb;
            color: #29272f;
            padding: 13px 14px;
            font-family: "DM Sans", sans-serif;
            font-size: 13px;
            outline: none;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
          }

          .tip-form-field textarea {
            min-height: 105px;
            resize: vertical;
          }

          .tip-form-field textarea:focus,
          .tip-form-field input:focus {
            border-color: #70569d;
            box-shadow: 0 0 0 3px rgba(112, 86, 157, 0.1);
          }

          .tip-form-field textarea::placeholder,
          .tip-form-field input::placeholder {
            color: #aaa6b1;
          }

          .tip-form-character-count {
            align-self: flex-end;
            color: #88838e;
            font-family: "DM Mono", monospace;
            font-size: 10px;
          }

          .tip-form-amount-wrapper {
            display: flex;
            align-items: center;
            border: 1px solid #d5d3db;
            border-radius: 8px;
            background: #faf9fb;
            padding-right: 14px;
            transition: border-color 0.2s ease;
          }

          .tip-form-amount-wrapper:focus-within {
            border-color: #70569d;
            box-shadow: 0 0 0 3px rgba(112, 86, 157, 0.1);
          }

          .tip-form-amount-wrapper input {
            border: none;
            box-shadow: none;
            background: transparent;
          }

          .tip-form-amount-wrapper input:focus {
            box-shadow: none;
          }

          .tip-form-amount-wrapper span {
            color: #59427f;
            font-family: "DM Mono", monospace;
            font-size: 12px;
            font-weight: 700;
          }

          .tip-form-validation {
            margin: 0;
            color: #a63d3d;
            font-size: 11px;
          }

          .tip-form-submit {
            width: 100%;
            min-height: 48px;
            border: 1px solid #59427f;
            border-radius: 8px;
            background: #59427f;
            color: #ffffff;
            font-family: "DM Mono", monospace;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 1px;
            cursor: pointer;
            transition: background 0.2s ease, transform 0.2s ease;
          }

          .tip-form-submit:hover:not(:disabled) {
            background: #463365;
            transform: translateY(-2px);
          }

          .tip-form-submit:disabled {
            opacity: 0.45;
            cursor: not-allowed;
          }

          .tip-form-notice {
            margin-bottom: 18px;
            padding: 12px 14px;
            border-radius: 7px;
            background: #f1eef7;
            color: #59427f;
            font-size: 12px;
          }

          .tip-form-warning {
            background: #fff4e6;
            color: #98601e;
          }

          .tip-transaction-status {
            display: flex;
            flex-direction: column;
            gap: 13px;
            margin-top: 22px;
          }

          .tip-status-message {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            color: #55535d;
            font-size: 12px;
            line-height: 1.6;
          }

          .tip-status-dot {
            width: 8px;
            height: 8px;
            flex-shrink: 0;
            margin-top: 4px;
            border-radius: 50%;
            background: #b18a43;
          }

          .tip-status-dot.success {
            background: #47745b;
          }

          .tip-status-dot.error {
            background: #b44747;
          }

          .tip-status-success {
            color: #47745b;
          }

          .tip-status-error {
            color: #a63d3d;
          }

          .tip-transaction-link {
            display: flex;
            flex-direction: column;
            gap: 6px;
            padding: 13px;
            border: 1px solid #e8e6eb;
            border-radius: 8px;
            background: #faf9fb;
          }

          .tip-transaction-link span {
            color: #88838e;
            font-family: "DM Mono", monospace;
            font-size: 9px;
            letter-spacing: 1px;
          }

          .tip-transaction-link a {
            width: fit-content;
            color: #59427f;
            font-size: 12px;
            font-weight: 700;
            text-decoration: none;
          }

          .tip-transaction-link a:hover {
            text-decoration: underline;
          }

          @media (max-width: 650px) {
            .tip-form-section {
              padding: 22px 19px;
            }
          }
        `}</style>
      </section>

      <WithdrawSection />
    </>
  );
}

/* -------------------------------------------------------
   OWNER-ONLY WITHDRAWAL SECTION
------------------------------------------------------- */

function WithdrawSection() {
  const queryClient = useQueryClient();

  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const isSepolia = chainId === sepolia.id;

  // Read the actual owner address from the deployed contract.
  const {
    data: owner,
    isLoading: isOwnerLoading,
    error: ownerError,
  } = useReadContract({
    address: TIPJAR_ADDRESS,
    abi: TIPJAR_ABI,
    functionName: "owner",
    chainId: sepolia.id,
    query: {
      enabled: isConnected,
    },
  });

  // Compare wallet address and contract owner address.
  const isOwner = Boolean(
    address &&
    owner &&
    address.toLowerCase() === owner.toLowerCase()
  );

  const {
    data: withdrawHash,
    error: withdrawWriteError,
    isPending: isWithdrawPending,
    writeContract: writeWithdraw,
    reset: resetWithdraw,
  } = useWriteContract();

  const {
    data: withdrawReceipt,
    error: withdrawReceiptError,
    isLoading: isWithdrawLoading,
    isSuccess: isWithdrawSuccess,
  } = useWaitForTransactionReceipt({
    hash: withdrawHash,
    chainId: sepolia.id,
    query: {
      enabled: Boolean(withdrawHash),
    },
  });

  const refreshedWithdrawal = useRef<string | undefined>(undefined);

  // Refresh contract data after a successful withdrawal.
  useEffect(() => {
    if (
      withdrawHash &&
      isWithdrawSuccess &&
      withdrawReceipt?.status === "success" &&
      refreshedWithdrawal.current !== withdrawHash
    ) {
      refreshedWithdrawal.current = withdrawHash;
      void queryClient.invalidateQueries();
    }
  }, [
    withdrawHash,
    isWithdrawSuccess,
    withdrawReceipt?.status,
    queryClient,
  ]);

  const isWithdrawTransactionPending =
    Boolean(withdrawHash) && isWithdrawLoading;

  const withdrawError =
    withdrawWriteError ?? withdrawReceiptError;

  const isWithdrawFailed =
    Boolean(withdrawError) ||
    withdrawReceipt?.status === "reverted";

  function handleWithdraw() {
    if (
      !isOwner ||
      !isSepolia ||
      isWithdrawPending ||
      isWithdrawTransactionPending
    ) {
      return;
    }

    resetWithdraw();

    writeWithdraw({
      address: TIPJAR_ADDRESS,
      abi: TIPJAR_ABI,
      functionName: "withdraw",
      args: [],
      chainId: sepolia.id,
    });
  }

  // Do not render the owner controls for other accounts.
  if (!isConnected || !isOwner) {
    return null;
  }

  return (
    <section className="withdraw-section">
      <div className="withdraw-heading">
        <p className="withdraw-eyebrow">CONTRACT MANAGEMENT</p>
        <h2>OWNER WITHDRAWAL</h2>
        <p>
          Withdraw the ETH collected by the TipJar contract.
        </p>
      </div>

      <div className="owner-notice">
        <span className="owner-dot" />
        CONTRACT OWNER VERIFIED
      </div>

      {!isSepolia && (
        <div className="withdraw-warning">
          Please switch your wallet to the Sepolia network before withdrawing.
        </div>
      )}

      {isOwnerLoading && (
        <p className="withdraw-info">
          Verifying contract ownership...
        </p>
      )}

      {ownerError && (
        <p className="withdraw-error" role="alert">
          Unable to verify the contract owner. Please check your network connection.
        </p>
      )}

      <button
        type="button"
        className="withdraw-button"
        onClick={handleWithdraw}
        disabled={
          !isSepolia ||
          isOwnerLoading ||
          Boolean(ownerError) ||
          isWithdrawPending ||
          isWithdrawTransactionPending
        }
      >
        {isWithdrawPending
          ? "WAITING FOR WALLET..."
          : isWithdrawTransactionPending
            ? "WITHDRAWAL PENDING..."
            : "WITHDRAW CONTRACT FUNDS"}
      </button>

      <div className="withdraw-status" aria-live="polite">
        {isWithdrawPending && !withdrawHash && (
          <div className="withdraw-status-message">
            <span className="withdraw-status-dot pending" />
            Waiting for wallet approval. Confirm the withdrawal in MetaMask.
          </div>
        )}

        {withdrawHash && (
          <div className="withdraw-transaction-link">
            <span>WITHDRAWAL TRANSACTION</span>

            <a
              href={`https://sepolia.etherscan.io/tx/${withdrawHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View transaction on Etherscan ↗
            </a>
          </div>
        )}

        {withdrawHash && isWithdrawLoading && (
          <div className="withdraw-status-message">
            <span className="withdraw-status-dot pending" />
            Withdrawal submitted. Waiting for blockchain confirmation...
          </div>
        )}

        {isWithdrawSuccess &&
          withdrawReceipt?.status === "success" && (
            <div className="withdraw-status-message success">
              <span className="withdraw-status-dot success" />
              Contract funds were successfully withdrawn!
            </div>
          )}

        {isWithdrawFailed && (
          <div
            className="withdraw-status-message error"
            role="alert"
          >
            <span className="withdraw-status-dot error" />
            {withdrawError
              ? getFriendlyErrorMessage(withdrawError)
              : "The withdrawal transaction reverted. No funds were withdrawn."}
          </div>
        )}
      </div>

      <div className="withdraw-security-note">
        <strong>SECURITY NOTE</strong>
        <p>
          Only the contract owner can withdraw funds. This is enforced
          by the smart contract, not just by the frontend interface.
        </p>
      </div>

      <style jsx>{`
        .withdraw-section {
          width: 100%;
          max-width: 1050px;
          margin: 22px auto;
          padding: 30px;
          background: #ffffff;
          border: 1px solid #d5d3db;
          border-radius: 14px;
        }

        .withdraw-heading {
          margin-bottom: 20px;
        }

        .withdraw-eyebrow {
          margin: 0 0 9px;
          color: #70569d;
          font-family: "DM Mono", monospace;
          font-size: 10px;
          letter-spacing: 1.8px;
          font-weight: 600;
        }

        .withdraw-heading h2 {
          margin: 0;
          color: #242329;
          font-size: 19px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }

        .withdraw-heading > p:last-child {
          margin: 8px 0 0;
          color: #77737e;
          font-size: 13px;
        }

        .owner-notice {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 18px;
          padding: 12px 14px;
          border-radius: 7px;
          background: #f0f3f0;
          color: #47745b;
          font-family: "DM Mono", monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 1px;
        }

        .owner-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #47745b;
        }

        .withdraw-warning {
          margin-bottom: 15px;
          padding: 12px 14px;
          border-radius: 7px;
          background: #fff4e6;
          color: #98601e;
          font-size: 12px;
        }

        .withdraw-info,
        .withdraw-error {
          font-size: 12px;
          line-height: 1.6;
        }

        .withdraw-error {
          color: #a63d3d;
        }

        .withdraw-button {
          width: 100%;
          min-height: 48px;
          border: 1px solid #59427f;
          border-radius: 8px;
          background: #59427f;
          color: #ffffff;
          font-family: "DM Mono", monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .withdraw-button:hover:not(:disabled) {
          background: #463365;
          transform: translateY(-2px);
        }

        .withdraw-button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .withdraw-status {
          display: flex;
          flex-direction: column;
          gap: 13px;
          margin-top: 20px;
        }

        .withdraw-status-message {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          color: #55535d;
          font-size: 12px;
          line-height: 1.6;
        }

        .withdraw-status-message.success {
          color: #47745b;
        }

        .withdraw-status-message.error {
          color: #a63d3d;
        }

        .withdraw-status-dot {
          width: 8px;
          height: 8px;
          flex-shrink: 0;
          margin-top: 4px;
          border-radius: 50%;
          background: #b18a43;
        }

        .withdraw-status-dot.success {
          background: #47745b;
        }

        .withdraw-status-dot.error {
          background: #b44747;
        }

        .withdraw-transaction-link {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 13px;
          border: 1px solid #e8e6eb;
          border-radius: 8px;
          background: #faf9fb;
        }

        .withdraw-transaction-link span {
          color: #88838e;
          font-family: "DM Mono", monospace;
          font-size: 9px;
          letter-spacing: 1px;
        }

        .withdraw-transaction-link a {
          width: fit-content;
          color: #59427f;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
        }

        .withdraw-transaction-link a:hover {
          text-decoration: underline;
        }

        .withdraw-security-note {
          margin-top: 22px;
          padding: 15px;
          border: 1px solid #e8e6eb;
          border-radius: 8px;
          background: #faf9fb;
        }

        .withdraw-security-note strong {
          color: #59427f;
          font-family: "DM Mono", monospace;
          font-size: 9px;
          letter-spacing: 1px;
        }

        .withdraw-security-note p {
          margin: 7px 0 0;
          color: #77737e;
          font-size: 11px;
          line-height: 1.7;
        }

        @media (max-width: 650px) {
          .withdraw-section {
            padding: 22px 19px;
          }
        }
      `}</style>
    </section>
  );
}
