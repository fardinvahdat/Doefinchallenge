export function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();

  if (msg.includes("user rejected") || msg.includes("user denied")) {
    return "You cancelled the transaction in your wallet.";
  }
  if (msg.includes("conditionalpexists") || msg.includes("condition already exists") || msg.includes("alreadyexists")) {
    return "This prediction already exists. Try a different threshold or block height.";
  }
  if (msg.includes("insufficient funds")) {
    return "Not enough ETH for network fees. Add ETH to your wallet first.";
  }
  if (msg.includes("insufficient balance") || msg.includes("insufficient collateral")) {
    return "Not enough tokens in your wallet. Check your balance and try again.";
  }
  if (msg.includes("network") || msg.includes("rpc") || msg.includes("fetch")) {
    return "Network error. Check your internet connection and try again.";
  }
  if (msg.includes("nonce") || msg.includes("replacement fee")) {
    return "Transaction conflict detected. Please wait a moment and try again.";
  }
  if (msg.includes("gas") || msg.includes("out of gas")) {
    return "Transaction ran out of gas. Try again — the estimate will adjust.";
  }
  if (msg.includes("execution reverted")) {
    return "The smart contract rejected the transaction. Check your inputs and try again.";
  }
  if (msg.includes("timeout") || msg.includes("timed out")) {
    return "The request timed out. Check your connection and try again.";
  }

  return "Something went wrong. Please try again.";
}
