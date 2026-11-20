"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getAddress,
  isAddress,
  parseUnits,
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
import TokenStyles from "./TokenStyles";

export default function SendTokens() {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const queryClient = useQueryClient();
  const refreshedTransactions = useRef<Set<string>>(new Set());

  const { isConnected } = useAccount();
  const chainId = useChainId();

  const isSepolia = chainId === sepolia.id;

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
      !refreshedTransactions.current.has(hash)
    ) {
      refreshedTransactions.current.add(hash);
      void queryClient.invalidateQueries();
    }
  }, [hash, isSuccess, receipt?.status, queryClient]);

  let parsedAmount: bigint | null = null;

  try {
    if (amount.trim() && decimals !== undefined) {
      parsedAmount = parseUnits(amount.trim(), decimals);
    }
  } catch {
    parsedAmount = null;
  }

  const isRecipientValid = isAddress(recipient.trim());
  const isAmountValid =
    parsedAmount !== null && parsedAmount > 0n;

  const isTransactionPending =
    Boolean(hash) && isLoading;

  const canSubmit =
    isConnected &&
    isSepolia &&
    decimals !== undefined &&
    !isDecimalsError &&
    isRecipientValid &&
    isAmountValid &&
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
      address: QUANTEK_TOKEN_ADDRESS,
      abi: QUANTEK_TOKEN_ABI,
      functionName: "transfer",
      args: [
        getAddress(recipient.trim()),
        parsedAmount,
      ],
      chainId: sepolia.id,
    });
  }

  return (
    <>
      <TokenStyles />

      <section
        className="send-tokens"
        aria-labelledby="send-tokens-heading"
      >
        {!isConnected && (
          <div className="send-tokens-notice">
            Connect your wallet to use token functions.
          </div>
        )}

        {isConnected && !isSepolia && (
          <div
            className="send-tokens-notice send-tokens-warning"
            role="alert"
          >
            Switch your wallet to the Sepolia network to use
            token functions.
          </div>
        )}

        {isDecimalsError && (
          <div className="send-tokens-error" role="alert">
            Unable to load token decimals.
            {decimalsError && (
              <span>
                {" "}
                {getFriendlyErrorMessage(decimalsError)}
              </span>
            )}
          </div>
        )}

        <div className="send-tokens-heading">
          <p className="send-tokens-eyebrow">
            TOKEN TRANSFER
          </p>

          <h2 id="send-tokens-heading">
            SEND TOKENS
          </h2>

          <p>
            Transfer tokens directly to another Sepolia
            wallet.
          </p>
        </div>

        <form
          className="send-tokens-form"
          onSubmit={handleSubmit}
        >
          <div className="send-tokens-field">
            <label htmlFor="token-recipient">
              RECIPIENT ADDRESS
            </label>

            <input
              id="token-recipient"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={recipient}
              onChange={(event) =>
                setRecipient(event.target.value)
              }
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
            <label htmlFor="token-amount">
              AMOUNT
            </label>

            <div className="send-tokens-amount">
              <input
                id="token-amount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value)
                }
                placeholder="0.0"
                required
              />

              <span>QTK</span>
            </div>

            {amount && !isAmountValid && (
              <p className="send-tokens-validation">
                Enter a valid amount greater than zero with
                no more than {decimals ?? 0} decimal places.
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

        <div
          className="send-tokens-status"
          aria-live="polite"
        >
          {isPending && !hash && (
            <p>
              Confirm the token transfer in your wallet.
            </p>
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
            <p>
              Transaction submitted. Waiting for
              confirmation...
            </p>
          )}

          {isSuccess &&
            receipt?.status === "success" && (
              <p className="send-tokens-success">
                Token transfer confirmed on Sepolia.
              </p>
            )}

          {isFailed && (
            <p
              className="send-tokens-error"
              role="alert"
            >
              {transactionError
                ? getFriendlyErrorMessage(transactionError)
                : "The token transfer failed. No tokens were sent."}
            </p>
          )}
        </div>
      </section>
    </>
  );
}