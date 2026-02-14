# Troubleshooting Guide

## Common Errors & Solutions

### ✅ FIXED: "@metamask/sdk" not found

**Error:**
```
Could not resolve "@metamask/sdk" imported by "@wagmi/connectors"
```

**Solution:**
```bash
npm install @metamask/sdk
```

**Status:** ✅ **FIXED** - Package installed in dependencies

---

## Potential Issues & Solutions

### 1. WalletConnect Project ID Missing

**Error in Console:**
```
RainbowKit: projectId is not set
```

**Solution:**
1. Visit https://cloud.walletconnect.com/
2. Create account and project
3. Copy Project ID
4. Create `.env` file in root:
```bash
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```
5. Restart dev server

---

### 2. Wallet Modal Doesn't Open

**Symptoms:**
- Click "Connect Wallet" - nothing happens
- No errors in console

**Solutions:**

**A) Check RainbowKit CSS is imported:**
```typescript
// /src/app/App.tsx
import '@rainbow-me/rainbowkit/styles.css';
```

**B) Verify RainbowKitProvider is wrapping app:**
```typescript
<WagmiProvider config={config}>
  <QueryClientProvider client={queryClient}>
    <RainbowKitProvider>
      <RouterProvider router={router} />
    </RainbowKitProvider>
  </QueryClientProvider>
</WagmiProvider>
```

**C) Clear browser cache:**
- Chrome: Ctrl+Shift+Delete → Clear cached images and files
- Or try incognito/private mode

---

### 3. MetaMask Not Connecting

**Symptoms:**
- Select MetaMask in modal
- Extension doesn't open
- Or connection fails

**Solutions:**

**A) Install MetaMask:**
- Visit: https://metamask.io/download/
- Install browser extension
- Refresh page

**B) Update MetaMask:**
- Click MetaMask icon
- Settings → About
- Check for updates

**C) Reset Connection:**
- MetaMask → Settings → Connected Sites
- Find your app → Disconnect
- Try connecting again

---

### 4. Wrong Network Error

**Symptoms:**
- Button shows "Wrong network"
- Can't interact with app

**Solutions:**

**A) Add Base Sepolia to MetaMask:**
```
Network Name: Base Sepolia
RPC URL: https://sepolia.base.org
Chain ID: 84532
Currency Symbol: ETH
Block Explorer: https://sepolia.basescan.org
```

**B) Use Network Switcher:**
1. Click "Wrong network" button
2. Select Base Sepolia from list
3. Approve in MetaMask
4. Connection should succeed

---

### 5. Contract Interaction Fails

**Error:**
```
Contract not deployed at address
```

**Solution:**
Update contract addresses in `/src/config/contracts.ts`:
```typescript
export const CONTRACTS = {
  ConditionalTokens: '0xYOUR_DEPLOYED_ADDRESS',
  mBTC: '0xYOUR_MBTC_ADDRESS',
  mUSDC: '0xYOUR_MUSDC_ADDRESS',
}
```

**How to get addresses:**
1. Deploy contracts to Base Sepolia
2. Copy deployment addresses
3. Update config file
4. Restart app

---

### 6. Transaction Fails

**Common Reasons:**

**A) Insufficient Gas:**
- Need ETH for gas fees
- Get Base Sepolia ETH from faucet:
  - https://www.alchemy.com/faucets/base-sepolia
  - https://docs.base.org/docs/tools/network-faucets

**B) Insufficient Token Balance:**
- Need mBTC or mUSDC to create markets
- Mint test tokens from your contracts

**C) Approval Not Set:**
- Approve tokens before creating market
- Click "Approve" button in Create Market flow

**D) User Rejected:**
- Check MetaMask popup
- Make sure you clicked "Confirm"

---

### 7. Events Not Loading

**Symptoms:**
- Markets page empty
- "No active markets" even after creating

**Solutions:**

**A) Check Block Range:**
```typescript
// /src/hooks/useContractEvents.ts
// Adjust fromBlock if needed
const fromBlock = BigInt(blocknumber - 1000000n);
```

**B) Wait for Confirmation:**
- Transactions need 1-2 blocks
- Wait ~30 seconds
- Refresh page

**C) Check Contract Address:**
- Verify ConditionalTokens address is correct
- Make sure it's deployed on Base Sepolia

---

### 8. Balance Shows 0 or Wrong Amount

**Solutions:**

**A) Switch to Correct Network:**
- Must be on Base Sepolia (Chain ID: 84532)

**B) Wait for Sync:**
- Sometimes takes 10-20 seconds to load
- Check if loading indicator appears

**C) Check RPC Connection:**
- Base Sepolia RPC might be slow
- Try refreshing page

---

### 9. Styling Issues

**Symptoms:**
- RainbowKit modal looks broken
- Colors are wrong
- Layout is off

**Solutions:**

**A) Check CSS Import Order:**
```typescript
// /src/app/App.tsx - must be BEFORE other imports
import '@rainbow-me/rainbowkit/styles.css';
```

**B) Verify Theme Overrides:**
```css
/* /src/styles/theme.css */
[data-rk] .iekbcc0 {
  background: var(--elevated) !important;
}
```

**C) Clear Cache:**
- Hard refresh: Ctrl+Shift+R
- Or clear browser cache completely

---

### 10. Build Errors

**Error:**
```
Module not found
```

**Solution:**
```bash
# Clear node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Try build again
npm run build
```

**Error:**
```
TypeScript errors
```

**Solution:**
Check file imports match actual file locations:
```typescript
// Correct path from /src/app/App.tsx
import { config } from "../config/wagmi";  // ✅

// Wrong path
import { config } from "./config/wagmi";   // ❌
```

---

## Environment Issues

### .env Not Loading

**Symptoms:**
- WalletConnect ID not recognized
- Using fallback placeholder

**Solutions:**

**A) File Location:**
```
project-root/
├── .env          ← Here (same level as package.json)
├── package.json
└── src/
```

**B) File Format:**
```bash
# No quotes, no spaces around =
VITE_WALLETCONNECT_PROJECT_ID=abc123xyz
```

**C) Restart Dev Server:**
```bash
# Stop server (Ctrl+C)
# Start again
npm run dev
```

---

## Network/RPC Issues

### Slow Transaction Confirmation

**Normal:** 2-10 seconds on Base Sepolia  
**If longer:**
- Check Base Sepolia status: https://status.base.org/
- Try different RPC endpoint
- Wait and refresh

### RPC Rate Limiting

**Error:**
```
429 Too Many Requests
```

**Solution:**
- Use your own RPC endpoint
- Get free RPC from:
  - Alchemy: https://www.alchemy.com/
  - Infura: https://infura.io/
  
Update in `/src/config/wagmi.ts`

---

## Browser Compatibility

### Supported Browsers
✅ Chrome/Chromium (Recommended)  
✅ Brave  
✅ Firefox  
✅ Edge  
❌ Safari (Limited Web3 support)  

### Mobile Browsers
✅ Chrome Mobile  
✅ Firefox Mobile  
✅ Brave Mobile  
✅ In-app browsers (Trust, MetaMask)  

---

## Getting Help

### 1. Check Browser Console
```
Right-click → Inspect → Console tab
```
Look for red error messages

### 2. Check Network Tab
```
Right-click → Inspect → Network tab
```
Look for failed requests (red)

### 3. Check MetaMask Activity
```
MetaMask → Activity tab
```
See pending/failed transactions

### 4. Documentation
- RainbowKit: https://www.rainbowkit.com/docs/troubleshooting
- wagmi: https://wagmi.sh/react/guides/error-handling
- Viem: https://viem.sh/docs/error-handling

### 5. Community
- RainbowKit Discord: https://discord.gg/rainbowkit
- Base Discord: https://discord.gg/base

---

## Quick Diagnostic

Run through this checklist:

```
✅ MetaMask installed and updated
✅ Connected to Base Sepolia (Chain ID: 84532)
✅ Have Base Sepolia ETH (for gas)
✅ .env file exists with WalletConnect ID
✅ npm install completed successfully
✅ No errors in browser console
✅ Contract addresses updated in config
✅ RainbowKit modal opens when clicking button
```

If all ✅, your setup is correct!

---

## Still Having Issues?

1. **Check this file first** - Most issues covered here
2. **Read error message carefully** - Often tells you exactly what's wrong
3. **Google the error** - Someone likely had same issue
4. **Check documentation** - Links provided above
5. **Ask in Discord** - RainbowKit/Base communities are helpful

**Remember:** 90% of issues are:
- Missing .env file
- Wrong network
- Insufficient gas/balance
- Need to refresh page

Good luck! 🚀
