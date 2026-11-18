
function collectErrorDetails(error: unknown): string[] {
  const details: string[] = [];
  const visited = new Set<object>();

  function visit(value: unknown, depth: number) {
    if (depth > 5 || value === null || value === undefined) {
      return;
    }

    if (typeof value === "string") {
      details.push(value);
      return;
    }

    if (typeof value === "number") {
      details.push(String(value));
      return;
    }

    if (typeof value !== "object") {
      return;
    }

    if (visited.has(value)) {
      return;
    }

    visited.add(value);

    const record = value as Record<string, unknown>;

    for (const key of [
      "name",
      "message",
      "shortMessage",
      "details",
      "code",
      "errorName",
    ]) {
      if (record[key] !== undefined) {
        details.push(String(record[key]));
      }
    }

    visit(record.cause, depth + 1);
    visit(record.data, depth + 1);
    visit(record.error, depth + 1);
  }

  visit(error, 0);

  return details;
}

export function getFriendlyErrorMessage(error: unknown): string {
  const details = collectErrorDetails(error);
  const message = details.join(" ").toLowerCase();

  // User rejected the wallet request.
  if (
    message.includes("user rejected") ||
    message.includes("user denied") ||
    message.includes("action_rejected") ||
    message.includes("4001")
  ) {
    return "You rejected the transaction in your wallet. No tip was sent.";
  }

  // Insufficient wallet funds.
  if (
    message.includes("insufficient funds") ||
    message.includes("insufficient balance")
  ) {
    return "You don't have enough ETH to send this tip and cover the gas fee.";
  }

  // TipJar custom contract errors.
  if (message.includes("zerotip")) {
    return "The tip amount must be greater than zero.";
  }

  if (message.includes("emptymessage")) {
    return "Please enter a message before sending your tip.";
  }

  if (message.includes("notowner")) {
    return "Only the contract owner can perform this action.";
  }

  // Other contract reverts.
  if (
    message.includes("contractfunctionreverted") ||
    message.includes("execution reverted") ||
    message.includes("reverted")
  ) {
    return "The smart contract rejected this transaction. Please check your inputs and try again.";
  }

  // Generic fallback. Never expose raw errors or stack traces.
  return "Something went wrong while sending your tip. Please try again.";
}
