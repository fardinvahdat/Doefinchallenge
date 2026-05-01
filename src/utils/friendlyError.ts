export function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();

  if (msg.includes("user rejected") || msg.includes("user denied")) {
    return "You cancelled the transaction in your wallet.";
  }
  if (msg.includes("notmarketmaker") || msg.includes("not market maker")) {
    return "Your address is not registered as a market maker on this contract. Contact the Doefin team to get access.";
  }
  if (
    msg.includes("conditionalreadyprepared") ||
    msg.includes("condition already exists") ||
    msg.includes("alreadyexists") ||
    msg.includes("questionalreadyexists")
  ) {
    return "This prediction already exists. Try a different threshold or block height.";
  }
  if (msg.includes("conditiondoesnotexist")) {
    return "Condition not found on this contract. It may have been created on a different network.";
  }
  if (msg.includes("conditionnotactive")) {
    return "This condition is no longer active and cannot be modified.";
  }
  if (msg.includes("invalidoracleaddress") || msg.includes("invalid oracle")) {
    return "Invalid oracle address. Check the contract configuration.";
  }
  if (msg.includes("invalidoutcomeslotcount") || msg.includes("toomanyoutcomeslots")) {
    return "Invalid number of outcome slots. This is a configuration error.";
  }
  if (msg.includes("zeroaddress")) {
    return "A required address is missing. Check the contract configuration.";
  }
  if (msg.includes("zeroamount") || msg.includes("valueoutofrange")) {
    return "Invalid amount or value. Check your inputs and try again.";
  }
  if (msg.includes("insufficient funds")) {
    return "Not enough ETH for network fees. Get Base Sepolia ETH from a faucet first.";
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
  if (msg.includes("gs013")) {
    return "Transaction reverted inside the Safe — the inner call failed. Check inputs or contract permissions.";
  }
  if (msg.includes("gs010")) {
    return "Safe transaction ran out of gas. Try again.";
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
