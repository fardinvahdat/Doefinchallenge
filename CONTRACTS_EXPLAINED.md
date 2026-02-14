# 📋 Contract Addresses - Explanation & Configuration

## ✅ Your Deployed Contracts (Updated!)

```typescript
// /src/config/contracts.ts

export const CONTRACTS = {
  ConditionalTokens: '0x3F84bEf67EA2B582a3d0a4f6f6B15776F12342c9',
  mBTC: '0x324c4A1e28760bCC45cDE980D36A78C971653228',
  mUSDC: '0xa8401F4983bD79e17CfF0899504E84cebd2dB8ba',
}
```

**Status:** ✅ **All required contracts configured!**

---

## 🎯 Required Contracts (You Have These!)

### 1. **ConditionalTokens** ✅
```
Address: 0x3F84bEf67EA2B582a3d0a4f6f6B15776F12342c9
Network: Base Sepolia
```

**Purpose:** Core prediction market contract  
**What it does:**
- ✅ Create binary conditions (YES/NO outcomes)
- ✅ Split positions (convert collateral → outcome tokens)
- ✅ Merge positions (redeem outcome tokens)
- ✅ Report outcomes (oracle reports results)
- ✅ Track balances of conditional tokens

**Functions you use:**
```typescript
prepareCondition(oracle, questionId, outcomeSlotCount)
splitPosition(collateral, parentCollection, conditionId, partition, amount)
mergePositions(collateral, parentCollection, conditionId, partition, amount)
reportPayouts(questionId, payouts)
```

**Used in:**
- ✅ Create Condition page
- ✅ Create Market page (splitPosition)
- ✅ Market detail page (positions)
- ✅ Oracle reporting (future)

---

### 2. **mBTC (Mock Bitcoin)** ✅
```
Address: 0x324c4A1e28760bCC45cDE980D36A78C971653228
Network: Base Sepolia
```

**Purpose:** Collateral token for BTC-denominated markets  
**What it does:**
- ✅ ERC20 token representing Bitcoin on testnet
- ✅ Users deposit mBTC to create positions
- ✅ Used as collateral for splitting positions

**Functions you use:**
```typescript
approve(spender, amount)  // Approve ConditionalTokens to spend
balanceOf(account)        // Check user balance
decimals()                // Get token decimals (usually 8 for BTC)
```

**Used in:**
- ✅ Create Market page (user deposits mBTC)
- ✅ Market overview (show balances)
- ✅ Position management

---

### 3. **mUSDC (Mock USD Coin)** ✅
```
Address: 0xa8401F4983bD79e17CfF0899504E84cebd2dB8ba
Network: Base Sepolia
```

**Purpose:** Collateral token for USD-denominated markets  
**What it does:**
- ✅ ERC20 token representing USDC on testnet
- ✅ Alternative collateral option
- ✅ Used for USD-based predictions

**Functions you use:**
```typescript
approve(spender, amount)  // Approve ConditionalTokens to spend
balanceOf(account)        // Check user balance
decimals()                // Get token decimals (usually 6 for USDC)
```

**Used in:**
- ✅ Create Market page (user deposits mUSDC)
- ✅ Market overview (show balances)
- ✅ Position management

---

## ❌ Contracts You DON'T Need

### CTFAdapter (Conditional Token Framework Adapter)

**What it is:**
A helper contract that provides user-friendly functions for interacting with ConditionalTokens. It wraps complex multi-step operations into single transactions.

**What it does:**
```typescript
// Example: One-step market creation
mintOutcomeTokens(condition, collateral, amount)
// Instead of:
// 1. approve(collateral)
// 2. splitPosition(...)
```

**Why you don't need it:**
- ❌ Your app directly calls ConditionalTokens
- ❌ You handle approve + splitPosition separately (better UX)
- ❌ More control over transaction flow
- ❌ Simpler architecture
- ❌ No trading interface = don't need adapter patterns

**Not used anywhere in your codebase!**

---

### CTFExchange (Conditional Token Framework Exchange)

**What it is:**
An orderbook-based exchange contract for trading conditional tokens (YES/NO tokens) between users.

**What it does:**
```typescript
// Trading functions
createOrder(tokenId, price, amount)
fillOrder(orderId, amount)
cancelOrder(orderId)
matchOrders(buyOrder, sellOrder)
```

**Why you don't need it:**
- ❌ Your requirements: **"no trading interface"**
- ❌ You're focused on condition creation & position splitting
- ❌ No peer-to-peer trading
- ❌ No orderbook needed
- ❌ Users create positions but don't trade them

**Your workflow is:**
1. Create condition (ConditionalTokens)
2. Split positions (ConditionalTokens)
3. Wait for resolution
4. Redeem winnings (ConditionalTokens)

**No trading step = No CTFExchange needed!**

---

## 📊 Contract Comparison

| Contract | Required? | Purpose | Used In App? |
|----------|-----------|---------|-------------|
| **ConditionalTokens** | ✅ YES | Core market logic | ✅ Create Condition, Create Market |
| **mBTC** | ✅ YES | Collateral token | ✅ Market creation, balances |
| **mUSDC** | ✅ YES | Collateral token | ✅ Market creation, balances |
| **CTFAdapter** | ❌ NO | Helper wrapper | ❌ Not used anywhere |
| **CTFExchange** | ❌ NO | Trading/orderbook | ❌ No trading interface |

---

## 🔄 Your App's Workflow (Simplified)

### Without CTFAdapter & CTFExchange:

```
1. User creates condition
   └─> ConditionalTokens.prepareCondition()

2. User creates market (splits position)
   ├─> mBTC.approve(ConditionalTokens, amount)
   └─> ConditionalTokens.splitPosition(mBTC, ...)
   
3. User receives outcome tokens
   ├─> YES tokens (if outcome = YES)
   └─> NO tokens (if outcome = NO)
   
4. Oracle reports result
   └─> ConditionalTokens.reportPayouts([1, 0])  // YES wins
   
5. Winner redeems tokens
   └─> ConditionalTokens.mergePositions(...)
```

**Clean, simple, direct!** ✅

---

### If you used CTFAdapter & CTFExchange:

```
1. User creates condition
   └─> ConditionalTokens.prepareCondition()

2. User creates market via adapter
   └─> CTFAdapter.mintOutcomeTokens()  // Wraps approve + split

3. User lists tokens on exchange
   └─> CTFExchange.createOrder(yesToken, price, amount)

4. Other user buys tokens
   └─> CTFExchange.fillOrder(orderId)

5. Trading happens continuously
   └─> CTFExchange.matchOrders()

6. Oracle reports result
   └─> ConditionalTokens.reportPayouts()

7. Winners redeem
   └─> ConditionalTokens.mergePositions()
```

**More complex, not needed for your use case!** ❌

---

## 🎯 What You're Building

### Your Platform: Doefin V2
**Type:** Bitcoin mining difficulty prediction market  
**Focus:** Condition creation & position splitting  
**NOT a trading platform:** Users don't trade positions

### Core Features:
✅ **Create Conditions** (Binary: YES/NO)
- Will Bitcoin difficulty exceed X at block Y?
- Uses ConditionalTokens ✅

✅ **Create Markets** (Split Positions)
- User deposits mBTC or mUSDC
- Receives YES + NO outcome tokens
- Uses ConditionalTokens + token contracts ✅

✅ **View Markets** (Overview & Details)
- See active conditions
- View position balances
- Track predictions

✅ **Oracle Resolution** (Future)
- Oracle reads Bitcoin difficulty
- Reports result to ConditionalTokens
- Winners redeem positions

### Features NOT in Scope:
❌ Trading between users
❌ Orderbook
❌ Limit orders
❌ Market making
❌ Price discovery

**Therefore: CTFExchange NOT needed!**

---

## 🛠️ How to Get These Contracts (For Reference)

### If you ever needed them in the future:

#### **CTFAdapter**
```bash
# Option 1: Deploy from Gnosis Conditional Tokens repo
git clone https://github.com/gnosis/conditional-tokens-contracts
cd conditional-tokens-contracts
npm install
npx hardhat deploy --network baseSepolia --tags CTFAdapter

# Option 2: Use existing deployed versions
# Check: https://docs.gnosis.io/conditionaltokens/docs/devguide04
```

#### **CTFExchange**
```bash
# Option 1: Deploy your own orderbook
# Implement IExchange interface

# Option 2: Use existing DEX protocols
# - Integrate with Polymarket CTF Exchange
# - Fork from: https://github.com/Polymarket/ctf-exchange

# Option 3: Build custom trading logic
# Your own implementation
```

**But again: You don't need these for your current requirements!**

---

## ✅ Configuration Complete!

### Your `/src/config/contracts.ts` now has:

```typescript
✅ ConditionalTokens: 0x3F84bEf67EA2B582a3d0a4f6f6B15776F12342c9
✅ mBTC:             0x324c4A1e28760bCC45cDE980D36A78C971653228
✅ mUSDC:            0xa8401F4983bD79e17CfF0899504E84cebd2dB8ba

❌ CTFAdapter:       REMOVED (not needed)
❌ CTFExchange:      REMOVED (not needed)
```

### What works now:

✅ **Create Condition Page**
- No more "Unknown address 0x000...000"
- MetaMask shows real contract address
- Transaction can be approved

✅ **Create Market Page**
- Will use real ConditionalTokens contract
- Will approve real mBTC/mUSDC tokens
- Will split positions correctly

✅ **Market Overview**
- Will fetch real conditions
- Will show real balances
- Will display actual positions

---

## 🧪 Testing Your Setup

### 1. Create Condition Test

```typescript
// Go to: /create-condition

Input:
- Threshold: 50000000000
- Block Height: 875000

Expected:
✅ Warning banner is gone
✅ MetaMask opens with address: 0x3F84bEf67EA2B582a3d0a4f6f6B15776F12342c9
✅ Transaction succeeds
✅ Condition ID generated
✅ Success modal appears
```

### 2. Create Market Test

```typescript
// Go to: /create-market

Input:
- Select condition
- Amount: 100 mBTC
- Collateral: mBTC

Expected:
✅ Approve mBTC: 0x324c4A1e28760bCC45cDE980D36A78C971653228
✅ SplitPosition on: 0x3F84bEf67EA2B582a3d0a4f6f6B15776F12342c9
✅ Receive YES + NO tokens
✅ Balances update
```

### 3. View Basescan

```bash
# ConditionalTokens contract
https://sepolia.basescan.org/address/0x3F84bEf67EA2B582a3d0a4f6f6B15776F12342c9

# mBTC token
https://sepolia.basescan.org/address/0x324c4A1e28760bCC45cDE980D36A78C971653228

# mUSDC token
https://sepolia.basescan.org/address/0xa8401F4983bD79e17CfF0899504E84cebd2dB8ba

# Check:
✅ Contract verified
✅ Recent transactions
✅ Events emitted (ConditionPreparation, PositionSplit)
```

---

## 📚 Further Reading

### ConditionalTokens Documentation
- [Gnosis Conditional Tokens Docs](https://docs.gnosis.io/conditionaltokens/)
- [CTF Tutorial](https://docs.gnosis.io/conditionaltokens/docs/tutorial/)

### Why Polymarket Uses CTFExchange
- Polymarket is a **trading platform** with orderbooks
- Users actively trade YES/NO positions
- Price discovery through market dynamics
- **Your app is different!**

### When You Would Need CTFExchange
- Adding peer-to-peer trading
- Implementing orderbook
- Market makers providing liquidity
- Dynamic pricing based on trades
- **Not in your current scope!**

---

## 🎉 Summary

### ✅ **What You Have (All You Need!)**

1. **ConditionalTokens** - Core contract for conditions & positions
2. **mBTC** - Collateral token for markets
3. **mUSDC** - Alternative collateral token

### ✅ **What You Removed (Unnecessary!)**

1. **CTFAdapter** - Helper wrapper (you call directly)
2. **CTFExchange** - Trading exchange (no trading interface)

### ✅ **Current Status**

```
Configuration:    ✅ Complete
Contracts:        ✅ All required addresses added
Validation:       ✅ Passes (no more zero address)
Ready to test:    ✅ Yes!
```

---

## 🚀 Next Steps

1. ✅ **Contracts configured** - You just did this!
2. 🔜 **Test create condition** - Try creating your first condition
3. 🔜 **Test create market** - Try splitting a position
4. 🔜 **View on Basescan** - Verify transactions on explorer
5. 🔜 **Set up oracle** - For condition resolution

**You're ready to start testing!** 🎊

No CTFAdapter or CTFExchange needed for your Bitcoin mining difficulty prediction market platform! 🚀
