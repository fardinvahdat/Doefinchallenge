# Doefin Challenge — Claude Code Context

## Project Overview

Doefin Challenge is a **prediction market frontend** built on the Gnosis Conditional Tokens Framework (CTF). Users connect their wallet, create prediction market conditions backed by Bitcoin on-chain data (block height / mining difficulty), and split collateral into YES/NO outcome tokens. The target network is **Base Sepolia** testnet.

The app is a frontend-only SPA — no backend. All state lives in the smart contracts, IPFS, or browser localStorage.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18.3.1 + Vite 6.3.5 + TypeScript |
| Web3 Hooks | wagmi ^3.4.3 |
| Low-level ETH | viem ^2.45.3 |
| Wallet UI | RainbowKit ^2.2.10 |
| Data fetching/cache | TanStack Query ^5.90.21 |
| Routing | React Router 7.13.0 |
| Styling | Tailwind CSS 4.1.12 (via `@tailwindcss/vite` — no separate config file) |
| UI Primitives | Radix UI 1.x (full suite) |
| Icons | Lucide React 0.487.0 |
| Toasts | Sonner 2.0.3 |
| Forms | React Hook Form 7.55.0 |
| IPFS Upload | Filebase RPC via `@aws-sdk/client-s3` |
| Charts | Recharts 2.15.2 |
| Animation | Motion 12.23.24 |
| Package manager | pnpm |

---

## Recent Changes (2026-04-30)

- **Diamond migrated** to `0xb05a5f3272F83BB748CcDA59c71Ac197dfA60F17` (shared with doefin-frontend)
- **localStorage removed** — conditions, markets, tokens all sourced from backend API or chain
- **Threshold input changed** to T-notation (e.g. "145.15" = 145.15T = 145,150,000,000,000 raw)
- **StrikePreview component** added — live gauge + warnings on CreateCondition and CreateMarket
- **Dynamic token list** via `GET /v3/tokens/` — no hardcoded collateral array
- **Active-only condition filter** — CreateMarket shows only `active: true` conditions from backend
- **Markets page** sources from `GET /v3/conditions/` with Active/Resolved/All status tabs
- **All `console.log` removed** from src

---

## Dev Commands

```bash
pnpm dev          # start dev server (Vite HMR)
pnpm build        # production build → dist/
docker compose up # containerised dev (Dockerfile + docker-compose.yml)
```

No test runner is configured. TypeScript checking is done through Vite's build step.

---

## Environment Variables

Copy `.env.example` → `.env` (or `.env.local`) before running.

| Variable | Purpose |
|---|---|
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud project ID |
| `VITE_FILEBASE_API_KEY` | Filebase S3-compatible key for IPFS upload |
| `VITE_CONDITIONAL_TOKENS_ADDRESS` | ConditionalTokens ERC-1155 contract |
| `VITE_DIAMOND_ADDRESS` | Diamond proxy contract (EIP-2535) |
| `VITE_MBTC_ADDRESS` | Mock Bitcoin ERC-20 collateral |
| `VITE_MUSDC_ADDRESS` | Mock USDC ERC-20 collateral |

All variables are prefixed `VITE_` and accessed via `import.meta.env`. Fallback hardcoded addresses exist in [src/config/contracts.ts](src/config/contracts.ts) for development convenience.

---

## Directory Structure

```
src/
├── app/
│   ├── pages/              # Route-level components
│   │   ├── Home.tsx        # Landing page with stats
│   │   ├── CreateCondition.tsx  # Main condition creation flow (~763 lines)
│   │   ├── CreateMarket.tsx     # Position splitting (YES/NO tokens)
│   │   ├── Markets.tsx          # Browse conditions & markets
│   │   ├── Architecture.tsx     # Docs/architecture overview page
│   │   └── NotFound.tsx
│   ├── components/
│   │   ├── ui/             # Radix UI wrappers (button, card, dialog, etc.)
│   │   ├── WalletConnect.tsx
│   │   ├── Navigation.tsx
│   │   ├── TransactionOverlay.tsx
│   │   ├── GasEstimationModal.tsx
│   │   ├── NetworkMonitor.tsx
│   │   └── CopyableHash.tsx
│   ├── contexts/
│   │   └── Web3Context.tsx  # Provides current block number app-wide
│   ├── Root.tsx             # Layout wrapper (Navigation + Outlet + Footer)
│   ├── App.tsx              # Provider tree (Wagmi → QueryClient → RainbowKit → Router)
│   └── routes.ts            # React Router v7 route definitions
├── config/
│   ├── wagmi.ts             # Wagmi + RainbowKit multi-chain config
│   └── contracts.ts         # All ABIs + contract addresses
├── hooks/
│   ├── useSplitPosition.ts       # Split collateral into YES/NO tokens
│   ├── useGasEstimate.ts         # Gas estimation with 20% safety buffer
│   ├── useBitcoinBlockHeight.ts  # Live BTC block height (3 API fallbacks)
│   ├── useBitcoinDifficulty.ts   # Live BTC mining difficulty
│   ├── useTokenApproval.ts       # ERC-20 allowance + approval flow
│   └── useContractEvents.ts      # Watch + fetch historical contract events
├── utils/
│   ├── filebase.ts               # Upload metadata JSON to IPFS via Filebase
│   └── conditionEventParser.ts   # Parse ConditionCreated from tx receipts
└── styles/
    ├── index.css            # Global styles + grid-texture background
    ├── tailwind.css         # Tailwind directives
    ├── theme.css            # CSS custom properties (colors, spacing)
    └── fonts.css            # Inter font
```

---

## Smart Contracts (Base Sepolia)

### Diamond Proxy — `0x75ed83f1fd159050E1ed546C1A584ac2c9deE225`

EIP-2535 Diamond with three relevant facets. ABI in [src/config/contracts.ts](src/config/contracts.ts) as `DIAMOND_ABI`.

| Facet | Key Functions |
|---|---|
| ConditionManagerFacet | `createConditionWithMetadata`, `getConditionId`, `getCondition`, `isAllowedCollateral`, `getCollateralUnit` |
| PositionFacet | `splitPosition`, `mergePositions`, `redeemPositions` |
| GettersFacet | `getCollectionId`, `getPositionId` |

**`createConditionWithMetadata` signature:**
```solidity
function createConditionWithMetadata(
  uint8  questionType,   // 0 = block height, 1 = difficulty
  bytes  metadata,       // ABI-encoded: (uint256[] thresholds, uint256 blockHeight)
  uint8  outcomeSlotCount,  // always 2 (YES/NO)
  string metadataURI,    // IPFS CID
  bytes32 salt
) returns (bytes32 conditionId)
```

### ConditionalTokens — `0x3F84bEf67EA2B582a3d0a4f6f6B15776F12342c9`

Standard Gnosis CTF ERC-1155 contract. ABI in [src/config/contracts.ts](src/config/contracts.ts) as `CONDITIONAL_TOKENS_ABI`. Used for legacy `prepareCondition` and emits `ConditionPreparation` / `PositionSplit` events.

### ERC-20 Collateral Tokens

| Symbol | Address |
|---|---|
| mBTC | `0x324c4A1e28760bCC45cDE980D36A78C971653228` |
| mUSDC | `0xa8401F4983bD79e17CfF0899504E84cebd2dB8ba` |

Standard ERC-20. ABI in [src/config/contracts.ts](src/config/contracts.ts) as `ERC20_ABI`.

---

## Key Patterns & Architecture

### Provider Tree (App.tsx)

```
WagmiProvider
  └─ QueryClientProvider
       └─ RainbowKitProvider (dark, accentColor #A855F7)
            └─ RouterProvider
```

RainbowKit is configured with `darkTheme` and `modalSize="compact"`. RainbowKit styles must be imported before use.

### Wagmi Configuration

Multi-chain: `[baseSepolia, sepolia, base, mainnet]` using public HTTP transports. Primary network is **Base Sepolia**. `ssr: false` because this is a pure client-side app. Config lives in [src/config/wagmi.ts](src/config/wagmi.ts).

### Path Aliases

`@/` resolves to `src/`. Always use `@/` imports instead of relative paths that go up more than one level.

### Tailwind CSS v4

No `tailwind.config.js` — Tailwind is configured entirely through `@tailwindcss/vite`. CSS custom properties for theme variables live in [src/styles/theme.css](src/styles/theme.css).

### State Persistence

- **Wallet/transaction state** — wagmi hooks + TanStack Query
- **Created conditions** — `localStorage` (key: `doefin_conditions`) as JSON array; used when event parsing fails to recover conditionId
- **Global block number** — `Web3Context` via `useBlockNumber` wagmi hook, polled every 12s

### Transaction Lifecycle (TransactionOverlay)

Six states managed as a discriminated union:

`idle` → `awaiting_signature` → `pending` → `broadcasting` → `confirming` → `confirmed | failed`

Use `TransactionOverlay` for any write that needs user feedback. Never show inline transaction states in page components.

### Gas Estimation Pattern

`useGasEstimate` in [src/hooks/useGasEstimate.ts](src/hooks/useGasEstimate.ts) wraps wagmi's `estimateGas` with:
- 20% safety buffer on top of estimated gas
- Minimum gas price floor: 0.01 Gwei
- Fallback estimates when simulation fails
- Supports both Diamond (`createConditionWithMetadata`) and legacy ConditionalTokens contracts
- USD conversion at $2,000/ETH (hardcoded — update if ETH price matters)

Always show gas estimate via `GasEstimationModal` before submitting any write transaction.

### ERC-20 Approval Flow

1. `useTokenApproval` reads current allowance via `readContract`
2. If `allowance < amount`, call `approve(diamondAddress, amount)` on the token
3. Wait for approval tx confirmation
4. Then proceed with `splitPosition`

The Diamond contract is the spender for all collateral tokens.

### Position ID Derivation

YES/NO position IDs are calculated using binary partition `[1n, 2n]`:

```
collectionId(YES) = keccak256(parentCollectionId || conditionId || indexSet=1)
collectionId(NO)  = keccak256(parentCollectionId || conditionId || indexSet=2)
positionId = keccak256(collateralToken || collectionId)
```

Use `getCollectionId` and `getPositionId` view functions on the Diamond contract via `readContract`. See [src/hooks/useSplitPosition.ts](src/hooks/useSplitPosition.ts).

### IPFS Metadata Upload

`uploadToIPFS()` in [src/utils/filebase.ts](src/utils/filebase.ts) uses the Filebase S3-compatible API (`@aws-sdk/client-s3`) with bucket `doefin-metadata`. Returns `{ cid, url }`. The `metadataURI` passed to `createConditionWithMetadata` is the resulting IPFS CID URL.

Metadata shape:
```json
{
  "questionType": 0,
  "thresholds": [number],
  "targetBlockHeight": number,
  "description": "string",
  "createdAt": "ISO date"
}
```

### Bitcoin Oracle Hooks

`useBitcoinBlockHeight` and `useBitcoinDifficulty` in [src/hooks/](src/hooks/) fetch live Bitcoin data with:
- 3 API fallbacks in order: Blockstream → Mempool.space → Blockchain.info
- 5-second fetch timeout per attempt
- 60-second TanStack Query refetch interval
- Difficulty formatted as human-readable (T/B/M/K notation)

### Event Watching

`useContractEvents` in [src/hooks/useContractEvents.ts](src/hooks/useContractEvents.ts):
- `useConditionEvents()` — watches new `ConditionPreparation` and `PositionSplit` events in real time via wagmi `useWatchContractEvent`
- `useHistoricalEvents()` — fetches past events in 10,000-block batches (public RPC limit) via `getLogs`

### ConditionId Recovery

`parseConditionEventFromReceipt()` in [src/utils/conditionEventParser.ts](src/utils/conditionEventParser.ts) extracts the `conditionId` from a `ConditionCreated` event log. Falls back to reading from `localStorage` if the event is not found in the receipt.

---

## Routing

Defined in [src/app/routes.ts](src/app/routes.ts) using React Router v7 `createBrowserRouter`. All routes are wrapped by `Root.tsx` (layout with Navigation + Footer).

| Path | Component |
|---|---|
| `/` | Home |
| `/create-condition` | CreateCondition |
| `/create-market` | CreateMarket |
| `/markets` | Markets |
| `/architecture` | Architecture |
| `*` | NotFound |

---

## UI Component Conventions

- **Radix UI wrappers** live in [src/app/components/ui/](src/app/components/ui/). Never use Radix primitives directly in pages — always go through these wrappers.
- **`cn()`** utility (clsx + tailwind-merge) used for all conditional className composition.
- **Sonner** `toast()` for all user-facing success/error feedback. Import from `sonner`.
- **Forms** use React Hook Form. No uncontrolled inputs in complex forms.
- **No MUI** usage in new code — MUI is present as a dependency but Radix + Tailwind is the intended stack.

---

## Security Notes

- The `.env` file is committed to this repo with real API keys. Before any production deployment, rotate the Filebase API key and WalletConnect project ID, then add `.env` to `.gitignore`.
- `splitPosition` uses unlimited approval (`MaxUint256`) by default in some paths. Scope approvals to the exact amount if this is going to production.
- All `console.log` debug statements are intentional for this challenge but should be stripped before production.

---

## Common Gotchas

1. **wagmi v3 API** — wagmi v3 has breaking changes vs v2. Hooks like `useWriteContract`, `useWaitForTransactionReceipt`, `useReadContract` are the v3 names. Do not use v2 patterns (`useContractWrite`, `useWaitForTransaction`).

2. **viem BigInt** — On-chain amounts are always `bigint`. Never mix with JS `number`. Use `parseUnits` / `formatUnits` from viem for display.

3. **Tailwind v4 syntax** — Tailwind v4 uses CSS-first config. Arbitrary values and custom CSS variables work differently. Do not add a `tailwind.config.js`; extend the theme via CSS custom properties in [src/styles/theme.css](src/styles/theme.css).

4. **Salt for condition creation** — `createConditionWithMetadata` requires a `bytes32` salt. It is derived from `keccak256(abi.encode(address, timestamp))` on the frontend. Duplicate salt + same args will revert.

5. **Block batch size** — Historical event queries batch at 10,000 blocks max (Base Sepolia public RPC limit). Do not increase this limit.

6. **RainbowKit dark theme** — The RainbowKit modal accent color is `#A855F7` (purple-500). Maintain this for brand consistency.

7. **No TypeScript config file** — `tsconfig.json` is absent; TypeScript is handled entirely by Vite's defaults. Do not add a tsconfig unless the build breaks.
