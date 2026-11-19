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

export default function ApproveTokens() {
  const [spender, setSpender] = useState("");
  const [approvalAmount, setApprovalAmount] =
    useState("");

  const queryClient = useQueryClient();
  const refreshedTransactions = useRef<Set<string>>(
    new Set()
  );

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
    data: approvalHash,
    error: approvalWriteError,
    isPending: isApprovalPending,
    writeContract: writeApproval,
    reset: resetApproval,
  } = useWriteContract();

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

  useEffect(() => {
    if (
      approvalHash &&
      isApprovalSuccess &&
      approvalReceipt?.status === "success" &&
      !refreshedTransactions.current.has(
        approvalHash
      )
    ) {
      refreshedTransactions.current.add(
        approvalHash
      );

      void queryClient.invalidateQueries();
    }
  }, [
    approvalHash,
    isApprovalSuccess,
    approvalReceipt?.status,
    queryClient,
  ]);

  let parsedApprovalAmount: bigint | null = null;

  try {
    if (
      approvalAmount.trim() &&
      decimals !== undefined
    ) {
      parsedApprovalAmount = parseUnits(
        approvalAmount.trim(),
        decimals
      );
    }
  } catch {
    parsedApprovalAmount = null;
  }

  const isSpenderValid =
    isAddress(spender.trim());

  const isApprovalAmountValid =
    parsedApprovalAmount !== null &&
    parsedApprovalAmount > 0n;

  const isApprovalTransactionPending =
    Boolean(approvalHash) &&
    isApprovalLoading;

  const canApprove =
    isConnected &&
    isSepolia &&
    decimals !== undefined &&
    !isDecimalsError &&
    isSpenderValid &&
    isApprovalAmountValid &&
    !isApprovalPending &&
    !isApprovalTransactionPending;

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
      isSpenderValid
        ? getAddress(spender.trim())
        : zeroAddress,
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

  const approvalTransactionError =
    approvalWriteError ?? approvalReceiptError;

  const isApprovalFailed =
    Boolean(approvalTransactionError) ||
    approvalReceipt?.status === "reverted";

  function handleApprove(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !canApprove ||
      parsedApprovalAmount === null
    ) {
      return;
    }

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
    <>
      <TokenStyles />

      <section className="send-tokens">
        <div className="send-tokens-heading">
          <p className="send-tokens-eyebrow">
            TOKEN PERMISSIONS
          </p>

          <h2>APPROVE TOKENS</h2>

          <p>
            Allow another wallet to spend a specified
            amount of your QTK tokens.
          </p>
        </div>

        <form
          className="send-tokens-form"
          onSubmit={handleApprove}
        >
          <div className="send-tokens-field">
            <label htmlFor="token-spender">
              SPENDER ADDRESS
            </label>

            <input
              id="token-spender"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={spender}
              onChange={(event) =>
                setSpender(event.target.value)
              }
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
            <label htmlFor="approval-amount">
              APPROVAL AMOUNT
            </label>

            <div className="send-tokens-amount">
              <input
                id="approval-amount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={approvalAmount}
                onChange={(event) =>
                  setApprovalAmount(
                    event.target.value
                  )
                }
                placeholder="0.0"
                required
              />

              <span>QTK</span>
            </div>

            {approvalAmount &&
              !isApprovalAmountValid && (
                <p className="send-tokens-validation">
                  Enter a valid amount greater than zero
                  with no more than{" "}
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

        <div
          className="send-tokens-status"
          aria-live="polite"
        >
          {isApprovalPending &&
            !approvalHash && (
              <p>
                Confirm the approval transaction in
                your wallet.
              </p>
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

          {approvalHash &&
            isApprovalLoading && (
              <p>
                Approval submitted. Waiting for
                confirmation...
              </p>
            )}

          {isApprovalSuccess &&
            approvalReceipt?.status ===
              "success" && (
              <p className="send-tokens-success">
                Approval confirmed! The spender can
                now use the authorised allowance.
              </p>
            )}

          {isApprovalFailed && (
            <p
              className="send-tokens-error"
              role="alert"
            >
              {approvalTransactionError
                ? getFriendlyErrorMessage(
                    approvalTransactionError
                  )
                : "The approval transaction failed."}
            </p>
          )}
        </div>

        <div className="send-tokens-allowance">
          <div className="send-tokens-allowance-heading">
            <div>
              <p className="send-tokens-eyebrow">
                PERMISSION CHECK
              </p>

              <h3>CURRENT ALLOWANCE</h3>
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
            <p>
              Connect your wallet to check its
              allowance.
            </p>
          ) : !isSepolia ? (
            <p>
              Switch to Sepolia to check the
              allowance.
            </p>
          ) : !isSpenderValid ? (
            <p>
              Enter a valid spender address to check
              the allowance.
            </p>
          ) : isAllowanceLoading ? (
            <p>Checking allowance...</p>
          ) : isAllowanceError ? (
            <p
              className="send-tokens-error"
              role="alert"
            >
              Unable to read allowance.
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
            This is the remaining amount the connected
            wallet has authorised the entered spender to
            use.
          </p>
        </div>

        <div className="send-tokens-security">
          <strong>Security reminder</strong>

          <p>
            Only approve wallets you trust. Approve the
            exact amount needed instead of granting
            unlimited spending permission.
          </p>
        </div>
      </section>
    </>
  );
}