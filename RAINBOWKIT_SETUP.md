# RainbowKit Integration Guide

## What is RainbowKit?

RainbowKit is the best way to add wallet connection to your dapp. It provides a beautiful, responsive modal that supports multiple wallets out of the box.

## Features

✅ **Multi-Wallet Support**
- MetaMask
- WalletConnect
- Coinbase Wallet
- Rainbow Wallet
- Trust Wallet
- And many more...

✅ **Network Management**
- Automatic network switching
- Wrong network detection
- Chain selector built-in

✅ **Beautiful UI**
- Responsive design
- Dark theme matching Doefin V2
- Smooth animations
- Mobile optimized

✅ **User-Friendly**
- Recent wallets remembered
- QR code for mobile wallets
- Clear connection status
- Account modal with balance

## Setup Steps

### 1. Install Dependencies (Already Done!)

```bash
npm install @rainbow-me/rainbowkit @metamask/sdk wagmi viem @tanstack/react-query
```

**Installed packages:**
- `@rainbow-me/rainbowkit` - Main RainbowKit library
- `@metamask/sdk` - Required peer dependency for MetaMask connector
- `wagmi` - Ethereum hooks library
- `viem` - TypeScript Ethereum library
- `@tanstack/react-query` - Data fetching library

### 2. Get WalletConnect Project ID

1. Visit: https://cloud.walletconnect.com/
2. Sign up or log in
3. Create a new project
4. Copy your Project ID
5. Create `.env` file in root:

```env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### 3. Configuration (Already Configured!)

**File: `/src/config/wagmi.ts`**
```typescript
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { baseSepolia } from 'wagmi/chains'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID'

export const config = getDefaultConfig({
  appName: 'Doefin V2',
  projectId,
  chains: [baseSepolia],
  ssr: false,
})
```

**File: `/src/app/App.tsx`**
```typescript
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

<RainbowKitProvider
  theme={darkTheme({
    accentColor: '#A855F7',      // Doefin primary color
    accentColorForeground: 'white',
    borderRadius: 'medium',
    fontStack: 'system',
    overlayBlur: 'small',
  })}
  modalSize="compact"
>
  {/* App content */}
</RainbowKitProvider>
```

### 4. Using the Connect Button

**File: `/src/app/components/WalletConnect.tsx`**

We use RainbowKit's `ConnectButton.Custom` to create a custom-styled button that matches Doefin's design:

```typescript
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function WalletConnect() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, openAccountModal }) => {
        // Custom UI using Doefin's design system
      }}
    </ConnectButton.Custom>
  );
}
```

## Custom Styling

We've customized RainbowKit to match Doefin V2's cyber-neon dark theme:

**File: `/src/styles/theme.css`**

```css
/* RainbowKit modal background */
[data-rk] .iekbcc0 {
  background: var(--elevated) !important;
  border: 1px solid var(--border) !important;
}

/* Modal backdrop with blur */
[data-rk] .ju367v9a {
  background: rgba(10, 10, 10, 0.8) !important;
  backdrop-filter: blur(8px) !important;
}

/* Wallet buttons with hover glow */
[data-rk] .iekbcc0 button:hover {
  background: var(--elevated) !important;
  border-color: var(--primary) !important;
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.2) !important;
}
```

## How It Works

### 1. Connect Wallet Flow

```
User clicks "Connect Wallet"
    ↓
RainbowKit modal opens
    ↓
User selects wallet (MetaMask, WalletConnect, etc.)
    ↓
Wallet extension opens
    ↓
User approves connection
    ↓
Connected! Button shows address + balance
```

### 2. Network Switching

```
User on wrong network
    ↓
Button shows "Wrong network"
    ↓
User clicks button
    ↓
RainbowKit opens chain selector
    ↓
User switches to Base Sepolia
    ↓
Connected to correct network!
```

### 3. Account Management

```
User clicks connected button
    ↓
RainbowKit account modal opens
    ↓
Shows:
- Full address (copyable)
- ETH balance
- Option to disconnect
- Link to block explorer
```

## Benefits Over Basic wagmi

| Feature | Basic wagmi | RainbowKit |
|---------|-------------|------------|
| Wallet Options | 1-2 wallets | 10+ wallets |
| Mobile Support | Manual QR codes | Built-in WalletConnect |
| UI/UX | Build yourself | Beautiful out-of-box |
| Network Switching | Manual implementation | Built-in |
| Recent Wallets | No | Yes |
| Animations | DIY | Smooth transitions |
| Dark Mode | DIY | Theme system |

## Testing

### Local Development

1. **Create `.env` file:**
```bash
VITE_WALLETCONNECT_PROJECT_ID=abc123...
```

2. **Start dev server:**
```bash
npm run dev
```

3. **Click "Connect Wallet"**
   - Modal should open with wallet options
   - Select MetaMask
   - Approve in extension
   - Button shows address + balance

4. **Test Network Switching**
   - Switch to different network in MetaMask
   - Button shows "Wrong network"
   - Click button
   - Switch back to Base Sepolia

5. **Test Mobile (Optional)**
   - Open on mobile browser
   - Click "Connect Wallet"
   - Scan QR code with mobile wallet app
   - Approve connection

## Troubleshooting

### Modal doesn't open
- Check WalletConnect Project ID is set in `.env`
- Make sure RainbowKit CSS is imported in App.tsx
- Check browser console for errors

### Wallet doesn't connect
- Make sure MetaMask is installed
- Check you're on supported browser (Chrome, Brave, Firefox)
- Try refreshing the page

### Styles look wrong
- Check `/src/styles/theme.css` has RainbowKit overrides
- Verify dark theme is configured in App.tsx
- Clear browser cache

### Network switching doesn't work
- Update MetaMask to latest version
- Make sure Base Sepolia is added to MetaMask
- Try manual network switch first

## Customization Options

### Change Accent Color

```typescript
<RainbowKitProvider
  theme={darkTheme({
    accentColor: '#22D3EE',  // Change to cyan
  })}
>
```

### Change Modal Size

```typescript
<RainbowKitProvider
  modalSize="wide"  // Options: compact | wide
>
```

### Show Recent Transactions

```typescript
<RainbowKitProvider
  showRecentTransactions={true}
>
```

### Custom Chains

```typescript
import { mainnet, polygon } from 'wagmi/chains'

export const config = getDefaultConfig({
  chains: [mainnet, polygon, baseSepolia],
  // ...
})
```

## Resources

- **RainbowKit Docs**: https://www.rainbowkit.com/docs
- **wagmi Docs**: https://wagmi.sh
- **WalletConnect Cloud**: https://cloud.walletconnect.com/
- **Viem Docs**: https://viem.sh

## Next Steps

1. ✅ Get WalletConnect Project ID
2. ✅ Add to `.env` file
3. ✅ Test wallet connection
4. ✅ Test on mobile (optional)
5. ✅ Deploy and share!

---

**RainbowKit makes wallet connection a breeze! 🌈**