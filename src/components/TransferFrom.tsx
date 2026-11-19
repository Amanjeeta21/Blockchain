"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
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
import TokenStyles from "./TokenStyles";

export default function TransferFrom() {
  const [fromAddress, setFromAddress] =
    useState("");

  const [recipient, setRecipient] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const queryClient = useQueryClient();

  const refreshedTransactions =
    useRef<Set<string>>(new Set());

  const { address, isConnected } = useAccount();
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
  }, [
    hash,
    isSuccess,
    receipt?.status,
    queryClient,
  ]);

  const isFromAddressValid =
    isAddress(fromAddress.trim());

  const isRecipientValid =
    isAddress(recipient.trim());

  let parsedAmount: bigint | null = null;

  try {
    if (
      amount.trim() &&
      decimals !== undefined
    ) {
      parsedAmount = parseUnits(
        amount.trim(),
        decimals
      );
    }
  } catch {
    parsedAmount = null;
  }

  const isAmountValid =
    parsedAmount !== null &&
    parsedAmount > 0n;

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
      isFromAddressValid
        ? getAddress(fromAddress.trim())
        : zeroAddress,
      address ?? zeroAddress,
    ],
    chainId: sepolia.id,
    query: {
      enabled:
        isConnected &&
        isSepolia &&
        Boolean(address) &&
        isFromAddressValid,
    },
  });

  const hasEnoughAllowance =
    parsedAmount !== null &&
    allowance !== undefined &&
    parsedAmount <= allowance;

  const isTransactionPending =
    Boolean(hash) && isLoading;

  const canTransferFrom =
    isConnected &&
    isSepolia &&
    decimals !== undefined &&
    !isDecimalsError &&
    isFromAddressValid &&
    isRecipientValid &&
    isAmountValid &&
    hasEnoughAllowance &&
    !isPending &&
    !isTransactionPending;

  const transactionError =
    writeError ?? receiptError;

  const isFailed =
    Boolean(transactionError) ||
    receipt?.status === "reverted";

  function handleTransferFrom(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !canTransferFrom ||
      parsedAmount === null
    ) {
      return;
    }

    reset();

    writeContract({
      address: QUANTEK_TOKEN_ADDRESS,
      abi: QUANTEK_TOKEN_ABI,
      functionName: "transferFrom",
      args: [
        getAddress(fromAddress.trim()),
        getAddress(recipient.trim()),
        parsedAmount,
      ],
      chainId: sepolia.id,
    });
  }

  return (
    <>
      <TokenStyles />

      <section className="send-tokens">
        <div className="send-tokens-heading">
          <p className="send-tokens-eyebrow">
            ALLOWANCE TRANSFER
          </p>

          <h2>TRANSFER FROM</h2>

          <p>
            Pull authorised QTK tokens from an owner's
            wallet using your connected spender account.
          </p>
        </div>

        <div className="send-tokens-info">
          <strong>Important:</strong> your connected
          wallet must be the approved spender. The owner
          must have already approved your wallet before
          you can call transferFrom().
        </div>

        <form
          className="send-tokens-form"
          onSubmit={handleTransferFrom}
        >
          <div className="send-tokens-field">
            <label htmlFor="transfer-from-address">
              OWNER ADDRESS
            </label>

            <input
              id="transfer-from-address"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={fromAddress}
              onChange={(event) =>
                setFromAddress(
                  event.target.value
                )
              }
              placeholder="Wallet that approved you"
              required
            />

            {fromAddress &&
              !isFromAddressValid && (
                <p className="send-tokens-validation">
                  Enter a valid Ethereum address.
                </p>
              )}
          </div>

          <div className="send-tokens-field">
            <label htmlFor="transfer-from-recipient">
              RECIPIENT ADDRESS
            </label>

            <input
              id="transfer-from-recipient"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={recipient}
              onChange={(event) =>
                setRecipient(
                  event.target.value
                )
              }
              placeholder="Where the tokens should go"
              required
            />

            {recipient &&
              !isRecipientValid && (
                <p className="send-tokens-validation">
                  Enter a valid Ethereum address.
                </p>
              )}
          </div>

          <div className="send-tokens-field">
            <label htmlFor="transfer-from-amount">
              AMOUNT
            </label>

            <div className="send-tokens-amount">
              <input
                id="transfer-from-amount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={amount}
                onChange={(event) =>
                  setAmount(
                    event.target.value
                  )
                }
                placeholder="0.0"
                required
              />

              <span>QTK</span>
            </div>

            {amount &&
              !isAmountValid && (
                <p className="send-tokens-validation">
                  Enter a valid amount greater than zero
                  with no more than{" "}
                  {decimals ?? 0} decimal places.
                </p>
              )}

            {isAmountValid &&
              allowance !== undefined &&
              !hasEnoughAllowance && (
                <p className="send-tokens-validation">
                  Amount exceeds the available
                  allowance.
                </p>
              )}
          </div>

          <button
            className="send-tokens-submit"
            type="submit"
            disabled={!canTransferFrom}
          >
            {isPending
              ? "WAITING FOR WALLET..."
              : isTransactionPending
                ? "TRANSFER PENDING..."
                : "TRANSFER FROM"}
          </button>
        </form>

        <div className="send-tokens-allowance">
          <div className="send-tokens-allowance-heading">
            <div>
              <p className="send-tokens-eyebrow">
                SPENDER ALLOWANCE
              </p>

              <h3>AVAILABLE TO PULL</h3>
            </div>

            <button
              type="button"
              className="send-tokens-refresh"
              onClick={() =>
                void refetchAllowance()
              }
              disabled={
                !isConnected ||
                !isSepolia ||
                !isFromAddressValid ||
                isAllowanceLoading
              }
              aria-label="Refresh transferFrom allowance"
              title="Refresh allowance"
            >
              ↻
            </button>
          </div>

          {!isConnected ? (
            <p>
              Connect the spender wallet to check the
              allowance.
            </p>
          ) : !isSepolia ? (
            <p>
              Switch to Sepolia to check the
              allowance.
            </p>
          ) : !isFromAddressValid ? (
            <p>
              Enter the owner's wallet address.
            </p>
          ) : isAllowanceLoading ? (
            <p>
              Checking available allowance...
            </p>
          ) : isAllowanceError ? (
            <p
              className="send-tokens-error"
              role="alert"
            >
              Unable to read the spender allowance.
              {allowanceError && (
                <span>
                  {" "}
                  {getFriendlyErrorMessage(
                    allowanceError
                  )}
                </span>
              )}
            </p>
          ) : allowance !== undefined &&
            decimals !== undefined ? (
            <p className="send-tokens-allowance-value">
              {formatUnits(
                allowance,
                decimals
              )}
              <span> QTK</span>
            </p>
          ) : (
            <p>
              Allowance information is not available.
            </p>
          )}

          <p className="send-tokens-hint">
            This allowance belongs to the connected
            wallet as spender and the entered owner as
            the token owner.
          </p>
        </div>

        <div
          className="send-tokens-status"
          aria-live="polite"
        >
          {isPending && !hash && (
            <p>
              Confirm the transferFrom transaction in
              your wallet.
            </p>
          )}

          {hash && (
            <p>
              <a
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View transferFrom transaction on
                Etherscan ↗
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
                transferFrom confirmed on Sepolia.
                Tokens were pulled from the owner's
                wallet.
              </p>
            )}

          {isFailed && (
            <p
              className="send-tokens-error"
              role="alert"
            >
              {transactionError
                ? getFriendlyErrorMessage(
                    transactionError
                  )
                : "The transferFrom transaction failed. No tokens were transferred."}
            </p>
          )}
        </div>
      </section>
    </>
  );
}