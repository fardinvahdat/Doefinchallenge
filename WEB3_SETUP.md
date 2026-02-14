# Doefin V2 - Real Web3 Integration Setup

## Overview

This application now uses **REAL** Web3 integration with wagmi + viem + RainbowKit. Everything is connected to actual blockchain interactions on Base Sepolia testnet.

## What's Real Now

✅ **Real MetaMask Connection** - Uses RainbowKit's beautiful wallet modal  
✅ **Multi-Wallet Support** - MetaMask, WalletConnect, Coinbase Wallet, Rainbow, and more  
✅ **Real Wallet Balances** - Fetches actual ETH, mBTC, and mUSDC balances  
✅ **Real Blockchain Data** - Reads current block number from Base Sepolia  
✅ **Real Smart Contract Interactions** - Calls actual contract functions  
✅ **Real Events** - Listens to blockchain events in real-time  
✅ **Real Transactions** - Submits actual transactions to Base Sepolia  
✅ **Real Token Approvals** - ERC20 approve flow with real allowance checks  

## Setup Instructions

### 1. Get WalletConnect Project ID (Required for RainbowKit)

1. Go to https://cloud.walletconnect.com/
2. Sign up/Login
3. Create a new project
4. Copy your Project ID
5. Create a `.env` file in the root directory:

```bash
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

**Important:** Without this, the wallet connection modal won't work properly!

### 2. Deploy Smart Contracts (or use existing)

Update `/src/config/contracts.ts` with your deployed contract addresses:

```typescript
export const CONTRACTS = {
  ConditionalTokens: '0xYOUR_CONDITIONAL_TOKENS_ADDRESS',
  CTFAdapter: '0xYOUR_CTF_ADAPTER_ADDRESS',
  CTFExchange: '0xYOUR_CTF_EXCHANGE_ADDRESS',
  mBTC: '0xYOUR_MBTC_TOKEN_ADDRESS',
  mUSDC: '0xYOUR_MUSDC_TOKEN_ADDRESS',
}
```

### 3. Get Base Sepolia Testnet Tokens

1. Get Base Sepolia ETH from: https://www.alchemy.com/faucets/base-sepolia
2. Mint mBTC and mUSDC from your deployed token contracts

### 4. Connect MetaMask

1. Install MetaMask: https://metamask.io/
2. Add Base Sepolia network to MetaMask:
   - Network Name: Base Sepolia
   - RPC URL: https://sepolia.base.org
   - Chain ID: 84532
   - Currency Symbol: ETH
   - Block Explorer: https://sepolia.basescan.org

### 5. Run the Application

```bash
npm install
npm run dev
```

## How It Works

### Wallet Connection

```typescript
// Uses real wagmi hooks
const { address, isConnected } = useAccount();
const { connect, connectors } = useConnect();
const { disconnect } = useDisconnect();
```

When you click "Connect Wallet", it opens **real** MetaMask popup.

### Reading Blockchain Data

```typescript
// Real balance fetching
const { data: balance } = useBalance({ address, token: CONTRACTS.mBTC });

// Real block number (live updates)
const { data: currentBlock } = useBlockNumber({ watch: true });

// Real contract reads
const { data: allowance } = useReadContract({
  address: tokenAddress,
  abi: ERC20_ABI,
  functionName: 'allowance',
  args: [owner, spender],
});
```

### Writing to Blockchain

```typescript
// Real contract writes
const { writeContract, hash, isPending } = useWriteContract();

await writeContract({
  address: CONTRACTS.ConditionalTokens,
  abi: CONDITIONAL_TOKENS_ABI,
  functionName: 'prepareCondition',
  args: [oracle, questionId, outcomeSlotCount],
});

// Wait for transaction confirmation
const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });
```

### Listening to Events

```typescript
// Real-time event watching
useWatchContractEvent({
  address: CONTRACTS.ConditionalTokens,
  abi: CONDITIONAL_TOKENS_ABI,
  eventName: 'ConditionPreparation',
  onLogs(logs) {
    // Handle new events as they happen
  },
});

// Historical events fetching
const logs = await publicClient.getLogs({
  address: CONTRACTS.ConditionalTokens,
  events: CONDITIONAL_TOKENS_ABI.filter(item => item.type === 'event'),
  fromBlock: 0n,
});
```

## Application Flow

### 1. Create Condition

1. Connect wallet
2. Enter threshold and target block height
3. App generates questionId from metadata hash
4. Click "Create Condition"
5. **MetaMask popup appears** → Confirm transaction
6. Transaction submitted to Base Sepolia
7. Wait for confirmation (watch loading states)
8. Success! Get real conditionId and questionId from blockchain
9. View on Basescan

### 2. Create Market (Split Position)

1. App loads real conditions from blockchain events
2. Select a condition
3. Select collateral (mBTC or mUSDC)
4. App shows your real token balance
5. **Approve Token:**
   - Click "Approve mBTC"
   - MetaMask popup → Confirm approval
   - Wait for confirmation
   - Approval status checked from blockchain
6. **Split Position:**
   - Enter amount
   - Click "Split Position"
   - MetaMask popup → Confirm transaction
   - Wait for confirmation
   - Success! Position tokens minted
7. View transaction on Basescan

### 3. Markets

- Fetches all ConditionPreparation events from blockchain
- Shows real on-chain data
- Click row to see details
- All links to Basescan work

## Hooks Reference

### `/src/hooks/useConditionalTokens.ts`

```typescript
const {
  prepareCondition,    // Create new condition
  splitPosition,       // Split collateral into positions
  generateConditionId, // Generate condition ID
  hash,               // Transaction hash
  isPending,          // Waiting for user confirmation
  isConfirming,       // Transaction submitted, waiting for block
  isSuccess,          // Transaction confirmed
  error,              // Transaction error
} = useConditionalTokens();
```

### `/src/hooks/useTokenApproval.ts`

```typescript
const {
  allowance,        // Current allowance amount
  isApproved,       // Boolean: is approved?
  approve,          // Execute approval
  refetch,          // Refresh allowance
  isPending,        // Waiting for confirmation
  isConfirming,     // Transaction confirming
  isSuccess,        // Approval successful
} = useTokenApproval(tokenAddress, spenderAddress, ownerAddress);
```

### `/src/hooks/useContractEvents.ts`

```typescript
// Real-time events
const { events } = useConditionEvents();

// Historical events
const { events, isLoading } = useHistoricalEvents(fromBlock);
```

## Testing

1. **Connect Wallet**: Should open real MetaMask
2. **View Balances**: Should show actual token balances from Base Sepolia
3. **Create Condition**: 
   - Submit real transaction
   - Check Basescan for confirmation
   - Should see event in Markets page
4. **Approve Token**:
   - Real ERC20 approval transaction
   - Allowance persists on-chain
5. **Split Position**:
   - Real splitPosition transaction
   - Check position token balance in MetaMask

## Troubleshooting

**"Please connect your wallet"**
- Install MetaMask extension
- Make sure you're on Base Sepolia network
- Click "Connect Wallet"

**"Transaction failed"**
- Check you have enough ETH for gas
- Check you have enough tokens
- Check contract addresses are correct

**"No conditions found"**
- Create a condition first
- Wait for transaction confirmation
- Refresh the page

**Balances show 0**
- Get Base Sepolia ETH from faucet
- Mint mBTC/mUSDC from deployed contracts
- Check you're connected to correct network

## Contract ABIs

All ABIs are in `/src/config/contracts.ts`:
- `ERC20_ABI` - Standard ERC20 functions
- `CONDITIONAL_TOKENS_ABI` - Conditional Tokens Framework

## Network Info

- **Network**: Base Sepolia
- **Chain ID**: 84532
- **RPC**: https://sepolia.base.org
- **Explorer**: https://sepolia.basescan.org
- **Faucet**: https://www.alchemy.com/faucets/base-sepolia

## Next Steps

1. Deploy your smart contracts to Base Sepolia
2. Update contract addresses in config
3. Get WalletConnect project ID
4. Test with real MetaMask
5. Create conditions and markets
6. Monitor transactions on Basescan

Everything is now **100% real Web3** - no mocks, no simulations!