# 🔍 Debugging Guide: "Condition Already Exists" Mystery

## 🎯 Investigation Steps

You're seeing "Condition Already Exists" for 3 different values. Let's debug this comprehensively.

---

## 📊 Step 1: Open Browser Console

1. **Open Chrome DevTools**
   - Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
   - Or `Cmd+Option+I` (Mac)
   - Go to the **Console** tab

2. **Refresh the page** to start fresh

---

## 🧪 Step 2: Test with Different Values

### Test 1: Enter First Set of Values
```
Threshold: 141000000000000
Block Height: 876000
```

Click "Create Condition" button

**Look for these logs in console:**
```
🔍 DEBUG: Generating questionId
  Threshold: 141000000000000
  Block Height: 876000
  Metadata: { ... }
  Metadata String: { ... }
  QuestionId: 0x...

⛽ DEBUG: Gas Estimation Starting
  Oracle (wallet): 0xYourAddress...
  QuestionId: 0x...
  OutcomeSlotCount: 2
  Calculated ConditionId: 0x...
  Contract OutcomeSlotCount: 0 or 2?
```

**📋 Record the output:**
- QuestionId: `_______________________`
- ConditionId: `_______________________`
- Contract OutcomeSlotCount: `_______`

---

### Test 2: Enter Second Set (Different!)
```
Threshold: 155000000000000
Block Height: 880000
```

Click "Create Condition" button

**📋 Record the output:**
- QuestionId: `_______________________`
- ConditionId: `_______________________`
- Contract OutcomeSlotCount: `_______`

**Compare:** Are the QuestionIds DIFFERENT from Test 1?

---

### Test 3: Enter Third Set (Very Different!)
```
Threshold: 999999999999999
Block Height: 999999
```

Click "Create Condition" button

**📋 Record the output:**
- QuestionId: `_______________________`
- ConditionId: `_______________________`
- Contract OutcomeSlotCount: `_______`

**Compare:** Are ALL THREE QuestionIds different?

---

## 🔎 Possible Scenarios

### Scenario A: Same QuestionId Every Time ❌
```
Test 1 QuestionId: 0xabc123...
Test 2 QuestionId: 0xabc123... (SAME!)
Test 3 QuestionId: 0xabc123... (SAME!)
```

**Problem:** QuestionId generation is broken!

**Cause:** Form inputs aren't updating properly

**Solution:**
```typescript
// Check if React state is working
console.log('Form values:', { threshold, blockHeight });
```

---

### Scenario B: Different QuestionIds, But Same ConditionId ❌
```
Test 1 QuestionId: 0xabc123...
Test 2 QuestionId: 0xdef456... (DIFFERENT!)

BUT

Test 1 ConditionId: 0x111222...
Test 2 ConditionId: 0x111222... (SAME!)
```

**Problem:** Oracle address is changing!

**Cause:** Wallet address is different between tests

**Solution:** Always use the same wallet address

---

### Scenario C: All Different, But Contract Says Exists ❌
```
Test 1:
  QuestionId: 0xabc123... 
  ConditionId: 0x111222...
  Contract OutcomeSlotCount: 2 ← EXISTS!

Test 2:
  QuestionId: 0xdef456... (DIFFERENT!)
  ConditionId: 0x333444... (DIFFERENT!)
  Contract OutcomeSlotCount: 2 ← EXISTS TOO?!
```

**Problem:** Contract is reading wrong data OR many conditions exist

**Possible Causes:**
1. Contract was pre-populated with conditions
2. Someone else created these conditions
3. Contract getOutcomeSlotCount is broken

**Solution:** Check contract directly on BaseScan

---

### Scenario D: Browser Cache Issue ❌
```
Test 1: Error shown
Test 2: Same error (even before API call finishes)
Test 3: Instant error
```

**Problem:** Error is cached in browser

**Solution:**
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear cache
3. Try incognito mode

---

## 🛠️ Root Cause Detection

### Check 1: Are Inputs Actually Changing?

Add this to your console after entering each value:

```javascript
// Copy this into browser console:
document.getElementById('threshold').value
document.getElementById('blockHeight').value
```

If these show the same values even though you typed different ones → **Form state bug**

---

### Check 2: Is the Oracle Address Consistent?

Look at the console logs:

```
Test 1: Oracle (wallet): 0x123...abc
Test 2: Oracle (wallet): 0x123...abc (should be SAME!)
Test 3: Oracle (wallet): 0x123...abc (should be SAME!)
```

If the oracle address changes → **Wallet switching between tests**

---

### Check 3: Check Contract Directly

Go to BaseScan:
https://sepolia.basescan.org/address/0x3F84bEf67EA2B582a3d0a4f6f6B15776F12342c9#readContract

**Read Contract > getOutcomeSlotCount**

Try these ConditionIds (from your logs):
1. First ConditionId: `___________`
2. Second ConditionId: `___________`
3. Third ConditionId: `___________`

If all return `2` → **Conditions really exist!**
If all return `0` → **Bug in our code reading the contract!**

---

## 💡 Quick Diagnostic Commands

### 1. Check Current Form State
```javascript
// In browser console:
window.localStorage
// Look for cached data
```

### 2. Test Hash Generation Manually
```javascript
// In browser console:
const test1 = JSON.stringify({
  question: "Will Bitcoin mining difficulty exceed 141,000,000,000,000 at block 876000?",
  threshold: "141000000000000",
  blockHeight: "876000",
  type: "DifficultyThreshold"
});

const test2 = JSON.stringify({
  question: "Will Bitcoin mining difficulty exceed 155,000,000,000,000 at block 880000?",
  threshold: "155000000000000",
  blockHeight: "880000",
  type: "DifficultyThreshold"
});

console.log('Test 1:', test1);
console.log('Test 2:', test2);
console.log('Are they different?', test1 !== test2);
```

If `test1 === test2` → **Hashing bug!**
If `test1 !== test2` → **Should generate different questionIds**

---

## 🎯 Most Likely Causes (Ranked)

### 1. **You're Using a Different Wallet Each Time** (50% probability)
- ConditionId = hash(oracle + questionId + outcomeSlotCount)
- If you created these conditions with Wallet A
- But now testing with Wallet B
- You'll get "exists" errors because those conditions ARE created (by Wallet A)

**Solution:** Always use the SAME wallet address

---

### 2. **Browser Is Caching the Error** (30% probability)
- React Query or browser cache is showing old error
- Not actually calling the contract

**Solution:** Hard refresh or try incognito

---

### 3. **QuestionId Isn't Updating** (15% probability)
- React state not updating when form changes
- `useEffect` dependencies wrong

**Solution:** Check console logs - if questionId is same, this is it

---

### 4. **Contract Has Many Pre-existing Conditions** (5% probability)
- Someone created tons of conditions for testing
- Every combination you try already exists

**Solution:** Use very unusual values like `threshold: 424242424242424`

---

## 🔧 Immediate Actions

### Action 1: Clear Everything
```bash
1. Close all browser tabs
2. Open new incognito window
3. Go to app
4. Connect wallet
5. Try VERY unusual values:
   - Threshold: 424242424242424
   - Block Height: 999999
```

---

### Action 2: Check What You Created Before

Look at your transaction history on BaseScan:
https://sepolia.basescan.org/address/YOUR_WALLET_ADDRESS

**Look for:**
- `prepareCondition` transactions
- What questionIds did you use?
- Match against current attempts

---

### Action 3: Use Completely Random Values

Try this exact combination (very unlikely to exist):

```
Threshold: 987654321098765
Block Height: 999123
```

If this ALSO shows "exists" → Something is fundamentally wrong

If this WORKS → Previous combinations really do exist

---

## 📝 Report Back With This Info

After following the debugging steps, report:

### 1. Console Logs
```
Test 1 (141T @ 876000):
  QuestionId: 0x...
  ConditionId: 0x...
  OutcomeSlotCount: ?

Test 2 (155T @ 880000):
  QuestionId: 0x...
  ConditionId: 0x...
  OutcomeSlotCount: ?

Test 3 (999T @ 999999):
  QuestionId: 0x...
  ConditionId: 0x...
  OutcomeSlotCount: ?
```

### 2. Are QuestionIds Different?
- [ ] Yes, all three are different
- [ ] No, they're all the same
- [ ] Some are same, some different

### 3. Are ConditionIds Different?
- [ ] Yes, all three are different
- [ ] No, they're all the same
- [ ] Some are same, some different

### 4. Wallet Address Used
```
Oracle: 0x...
```

### 5. Browser Info
- Browser: Chrome/Firefox/Safari/etc
- Cache cleared? Yes/No
- Tried incognito? Yes/No

---

## 🎯 Expected Outcome

**If everything is working correctly:**

```
Test 1 (141T @ 876000):
  ✅ QuestionId: 0xabc123... (unique)
  ✅ ConditionId: 0x111222... (unique)
  ✅ OutcomeSlotCount: 0 (does NOT exist)
  ✅ Gas estimation succeeds!

Test 2 (155T @ 880000):
  ✅ QuestionId: 0xdef456... (DIFFERENT from Test 1)
  ✅ ConditionId: 0x333444... (DIFFERENT from Test 1)
  ✅ OutcomeSlotCount: 0 (does NOT exist)
  ✅ Gas estimation succeeds!
```

---

## 🚨 Emergency Workaround

If nothing else works, add a random nonce to force uniqueness:

```typescript
// In CreateCondition.tsx
const metadata = {
  question: `Will Bitcoin mining difficulty exceed ${threshold} at block ${blockHeight}?`,
  threshold: threshold,
  blockHeight: blockHeight,
  type: "DifficultyThreshold",
  nonce: Math.random().toString(), // ← Forces unique questionId
};
```

**⚠️ Warning:** Only use this for testing! Don't use in production!

---

## 📞 Next Steps

1. **Open browser console** (F12)
2. **Try 3 very different values**
3. **Copy ALL the console output**
4. **Paste it here** so we can diagnose

The console logs will reveal EXACTLY what's happening! 🔍
