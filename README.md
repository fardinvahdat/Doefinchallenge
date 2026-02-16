# Doefin V2 — Conditional Token Prediction Market

<p align="center">
  <img src="docs/architecture-diagram.svg" alt="Doefin V2 Architecture" width="800"/>
</p>

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Prerequisites](#3-prerequisites)
4. [Installation](#4-installation)
5. [Environment Configuration](#5-environment-configuration)
6. [Main Functionalities](#6-main-functionalities)
7. [Architecture](#7-architecture)
8. [Smart Contract Interactions](#8-smart-contract-interactions)
9. [Security Considerations](#9-security-considerations)
10. [Contributing](#10-contributing)
11. [License](#11-license)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Project Overview

Doefin V2 is a **conditional token prediction market** built on the **Base Sepolia** testnet. It implements the conditional token protocol—a sophisticated DeFi primitive that enables the creation, trading, and settlement of prediction markets through binary outcome tokens.

### Core Value Proposition

The conditional token protocol represents a significant advancement in prediction market infrastructure. Unlike traditional prediction markets that rely on centralized order books or AMMs, Doefin leverages on-chain conditional tokens that can be split, merged, and traded without requiring liquidity providers or complex pricing mechanisms. Users deposit collateral (such as mUSDC or mBTC) and receive YES/NO outcome tokens representing their position on a specific condition. When the condition resolves, the oracle reports the outcome, and winners can redeem their tokens for the full collateral amount.

### The Conditional Token Protocol

At its core, the conditional token protocol consists of three primary operations:

- **Condition Creation**: Define a prediction market by specifying an oracle, a question ID (derived from on-chain or off-chain metadata), and the number of possible outcomes (typically binary for YES/NO markets).
- **Position Splitting**: Deposit collateral to mint YES and NO tokens at a 1:1 ratio. If you believe Bitcoin difficulty will exceed a threshold, you split your position to acquire more YES tokens.
- **Position Merging**: Combine YES and NO tokens back into the original collateral. This typically occurs after market resolution or when a user wants to exit their position before resolution.

The protocol's elegance lies in its composability—outcome tokens are standard ERC-1155 tokens that can be transferred, traded on secondary markets, or used as collateral in other DeFi applications.

---

## 2. Technology Stack

Doefin V2 leverages a modern, production-grade Web3 stack optimized for developer experience and end-user performance:

### Core Framework

| Technology                                    | Version | Purpose                   |
| --------------------------------------------- | ------- | ------------------------- |
| [React](https://react.dev/)                   | 18.3.1  | UI component library      |
| [Vite](https://vitejs.dev/)                   | 6.3.5   | Build tool and dev server |
| [TypeScript](https://www.typescriptlang.org/) | 5.x     | Type safety               |

### Web3 Integration

| Technology                                                     | Version  | Purpose                   |
| -------------------------------------------------------------- | -------- | ------------------------- |
| [wagmi](https://wagmi.sh/)                                     | ^3.4.3   | React hooks for Ethereum  |
| [viem](https://viem.sh/)                                       | ^2.45.3  | Low-level Ethereum client |
| [@rainbow-me/rainbowkit](https://www.rainbowkit.com/)          | ^2.2.10  | Wallet connection UI      |
| [@tanstack/react-query](https://tanstack.com/query/latest)     | ^5.90.21 | Data fetching and caching |
| [@walletconnect/ethereum-provider](https://walletconnect.com/) | ^2.23.5  | WalletConnect protocol    |

### Styling and UI

| Technology                               | Version | Purpose                         |
| ---------------------------------------- | ------- | ------------------------------- |
| [Tailwind CSS](https://tailwindcss.com/) | 4.1.12  | Utility-first CSS framework     |
| [Radix UI](https://www.radix-ui.com/)    | 1.x     | Accessible component primitives |
| [Lucide React](https://lucide.dev/)      | 0.487.0 | Icon library                    |
| [Sonner](https://sonner.emilkowal.ski/)  | 2.0.3   | Toast notifications             |

### Additional Libraries

| Technology                                        | Version  | Purpose                    |
| ------------------------------------------------- | -------- | -------------------------- |
| [React Router](https://reactrouter.com/)          | 7.13.0   | Client-side routing        |
| [date-fns](https://date-fns.org/)                 | 3.6.0    | Date utilities             |
| [Recharts](https://recharts.org/)                 | 2.15.2   | Charting library           |
| [React Hook Form](https://react-hook-form.com/)   | 7.55.0   | Form handling              |
| [Embla Carousel](https://www.embla-carousel.com/) | 8.6.0    | Touch-friendly carousels   |
| [Motion](https://motion.dev/)                     | 12.23.24 | Animation library          |
| [@emotion/react](https://emotion.sh/)             | 11.14.0  | CSS-in-JS                  |
| [@mui/material](https://mui.com/)                 | 7.3.5    | Material Design components |

---

## 3. Prerequisites

Before running Doefin V2, ensure your development environment meets the following requirements:

### Required Software

| Software | Version | Installation                                     |
| -------- | ------- | ------------------------------------------------ |
| Node.js  | 20+     | [nvm](https://github.com/nvm-sh/nvm) recommended |
| pnpm     | Latest  | `npm install -g pnpm`                            |
| Git      | Latest  | [git-scm.com](https://git-scm.com)               |

### Optional Software

| Software                                           | Purpose                               |
| -------------------------------------------------- | ------------------------------------- |
| [Docker](https://www.docker.com/)                  | Containerized development environment |
| [Docker Compose](https://docs.docker.com/compose/) | Orchestrate multi-container setups    |

### Required API Keys

1. **WalletConnect Project ID**
   - Obtain from [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - Required for wallet connection functionality

2. **Filebase API Key**
   - Obtain from [Filebase](https://filebase.com/)
   - Used for IPFS metadata storage

### Testnet Requirements

- A Web3 wallet (MetaMask, Rainbow, Coinbase Wallet, etc.)
- Base Sepolia testnet configured in your wallet
- Testnet ETH from a [Base Sepolia faucet](https://www.alchemy.com/faucets/ethereum)
- Testnet tokens (mBTC, mUSDC) obtained from the application

---

## 4. Installation

Follow these steps to set up the development environment:

### Clone the Repository

```bash
git clone https://github.com/your-org/doefinchallenge.git
cd doefinchallenge
```

### Install Dependencies

```bash
pnpm install
```

The project uses pnpm's strict peer dependency resolution and frozen lockfile for reproducible builds.

### Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your API keys and contract addresses. See [Environment Configuration](#5-environment-configuration) for details.

### Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`.

### Docker Deployment (Optional)

For containerized development:

```bash
docker-compose up --build
```

This starts the Vite dev server in a Docker container with hot-reload enabled.

---

## 5. Environment Configuration

Doefin V2 requires specific environment variables for blockchain interactions and IPFS storage. Create a `.env` file in the project root with the following variables:

### Required Variables

```bash
# =============================================================================
# WalletConnect Cloud Project ID
# Get your project ID at: https://cloud.walletconnect.com/
# =============================================================================
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here

# =============================================================================
# Filebase IPFS API Key
# Get your API key at: https://filebase.com/
# =============================================================================
VITE_FILEBASE_API_KEY=your_filebase_api_key_here

# =============================================================================
# Contract Addresses (Base Sepolia Testnet)
# =============================================================================

# Conditional Tokens Core Contract
VITE_CONDITIONAL_TOKENS_ADDRESS=0x3F84bEf67EA2B582a3d0a4f6f6B15776F12342c9

# Diamond Proxy Contract (EIP-2535)
VITE_DIAMOND_ADDRESS=0x75ed83f1fd159050E1ed546C1A584ac2c9deE225

# =============================================================================
# Token Addresses (Base Sepolia Testnet)
# =============================================================================

# Mock BTC Token
VITE_MBTC_ADDRESS=0x324c4A1e28760bCC45cDE980D36A78C971653228

# Mock USDC Token
VITE_MUSDC_ADDRESS=0xa8401F4983bD79e17CfF0899504E84cebd2dB8ba
```

### Variable Reference

| Variable                          | Description                         | Example                                      |
| --------------------------------- | ----------------------------------- | -------------------------------------------- |
| `VITE_WALLETCONNECT_PROJECT_ID`   | WalletConnect Cloud Project ID      | `efb47ff3cfb810a78ddeca11318457f9`           |
| `VITE_FILEBASE_API_KEY`           | Filebase S3-compatible IPFS API key | `MzVERkQyMkY0Rjk3MDY4REU2NkY6...`            |
| `VITE_CONDITIONAL_TOKENS_ADDRESS` | Conditional tokens contract         | `0x3F84bEf67EA2B582a3d0a4f6f6B15776F12342c9` |
| `VITE_DIAMOND_ADDRESS`            | Diamond proxy contract              | `0x75ed83f1fd159050E1ed546C1A584ac2c9deE225` |
| `VITE_MBTC_ADDRESS`               | Mock BTC token                      | `0x324c4A1e28760bCC45cDE980D36A78C971653228` |
| `VITE_MUSDC_ADDRESS`              | Mock USDC token                     | `0xa8401F4983bD79e17CfF0899504E84cebd2dB8ba` |

> **Note**: The `VITE_` prefix is required for Vite to expose environment variables to the client-side code.

---

## 6. Main Functionalities

### 6.1 Wallet Connection

Doefin V2 integrates RainbowKit for wallet connection, providing a polished UI for connecting wallets across multiple platforms. The wallet connection system includes:

- **Multi-wallet Support**: MetaMask, Rainbow, Coinbase Wallet, WalletConnect
- **Multi-chain Support**: Base Sepolia, Sepolia, Base Mainnet, Ethereum Mainnet
- **Network Enforcement**: Automatic switching to Base Sepolia for all operations
- **Balance Display**: Real-time ETH and token balance fetching

The wallet connection is implemented in [`src/app/components/WalletConnect.tsx`](src/app/components/WalletConnect.tsx) and configured in [`src/config/wagmi.ts`](src/config/wagmi.ts).

```typescript
// Wagmi configuration with multi-chain support
export const config = getDefaultConfig({
  appName: "Doefin V2",
  projectId,
  chains: [baseSepolia, sepolia, base, mainnet],
  transports: {
    [baseSepolia.id]: http(),
    [sepolia.id]: http(),
    [base.id]: http(),
    [mainnet.id]: http(),
  },
});
```

### 6.2 Condition Creation

Conditions are the fundamental building blocks of prediction markets. The condition creation workflow includes:

1. **Input Collection**: User specifies a difficulty threshold and target Bitcoin block height
2. **Metadata Generation**: ABI-encoded metadata is created combining threshold and block height
3. **Question ID Derivation**: The `questionId` is computed as `keccak256(encodedMetadata)`
4. **IPFS Upload**: Metadata is uploaded to IPFS via Filebase for permanent storage
5. **On-chain Creation**: The Diamond contract's `createConditionWithMetadata` function is invoked

The condition creation is implemented in [`src/app/pages/CreateCondition.tsx`](src/app/pages/CreateCondition.tsx).

```typescript
// Question ID generation from metadata
const encodedMetadata = encodeAbiParameters(
  [{ type: "uint256" }, { type: "uint256" }],
  [BigInt(threshold), BigInt(blockHeight)],
);
const questionId = keccak256(encodedMetadata);
```

### 6.3 Position Splitting

Position splitting converts collateral into YES and NO outcome tokens. The workflow involves:

1. **Approval Check**: Verify the Diamond contract has sufficient allowance to spend collateral
2. **Approval Transaction**: If needed, approve unlimited token spending
3. **Split Transaction**: Call `splitPosition` on the Diamond contract
4. **Position ID Calculation**: Derive YES and NO position IDs from the condition ID and partition

Position splitting is implemented in [`src/hooks/useSplitPosition.ts`](src/hooks/useSplitPosition.ts).

```typescript
// Binary partition for YES/NO outcomes
const BINARY_PARTITION = [1n, 2n] as const;

// Split position call
await writeContract({
  address: CONTRACTS.Diamond,
  abi: DIAMOND_ABI,
  functionName: "splitPosition",
  args: [
    collateralToken,
    zeroHash, // parentCollectionId
    conditionId,
    BINARY_PARTITION,
    amount,
  ],
});
```

### 6.4 Gas Estimation

Doefin V2 provides transparent gas estimation before transaction submission. The system:

- Simulates contract calls to estimate gas consumption
- Adds a 20% buffer to account for network variability
- Enforces a minimum gas price floor of 0.01 Gwei
- Displays estimated costs in ETH and USD
- Validates condition existence before submission

Gas estimation is implemented in [`src/hooks/useGasEstimate.ts`](src/hooks/useGasEstimate.ts).

```typescript
// Gas estimation with 20% buffer
const gas = await publicClient.estimateGas({ ... });
const gasWithBuffer = (gas * 120n) / 100n;
```

### 6.5 Bitcoin Oracle Integration

The application integrates real-time Bitcoin network data through multiple public APIs:

**Block Height**: Fetches current Bitcoin block height from:

- `blockstream.info/api/blocks/tip/height`
- `mempool.space/api/blocks/tip/height`
- `blockchain.info/q/getblockcount`

**Mining Difficulty**: Fetches current Bitcoin mining difficulty for threshold comparison.

These integrations enable users to create conditions based on real-world Bitcoin network state.

Bitcoin data hooks are implemented in:

- [`src/hooks/useBitcoinBlockHeight.ts`](src/hooks/useBitcoinBlockHeight.ts)
- [`src/hooks/useBitcoinDifficulty.ts`](src/hooks/useBitcoinDifficulty.ts)

### 6.6 Transaction Lifecycle Management

The application provides comprehensive transaction lifecycle management:

1. **Pending State**: User signature requested
2. **Confirming State**: Transaction broadcast, awaiting block confirmation
3. **Success State**: Transaction confirmed, event parsing and UI updates
4. **Error State**: Transaction failed, error messaging

Transaction overlay is implemented in [`src/app/components/TransactionOverlay.tsx`](src/app/components/TransactionOverlay.tsx).

---

## 7. Architecture

### System Architecture Overview

Doefin V2 follows a layered architecture that separates concerns and enables maintainability:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Frontend Layer                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   Pages     │  │ Components  │  │   Hooks    │  │   Context   │   │
│  │             │  │             │  │             │  │             │   │
│  │ Home        │  │ WalletConnect│ │useGasEstimate│ │ Web3Context │   │
│  │ CreateCondition│ │Navigation  │  │useSplitPosition│           │   │
│  │ CreateMarket│  │TransactionOverlay│useBitcoinBlockHeight│        │   │
│  │ Markets     │  │GasEstimationModal│                        │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Web3 Integration Layer                             │
│  ┌───────────────────────┐  ┌───────────────────────────────────────┐   │
│  │       Wagmi           │  │        TanStack Query                │   │
│  │                       │  │                                       │   │
│  │ useAccount            │  │ Data fetching, caching               │   │
│  │ useWriteContract      │  │ Automatic refetching                 │   │
│  │ useReadContract       │  │ Optimistic updates                    │   │
│  │ useWaitForTransaction │  │                                       │   │
│  └───────────────────────┘  └───────────────────────────────────────┘   │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │                            Viem                                   │   │
│  │  PublicClient  │  WalletClient  │  Contract ABI  │  Utilities   │   │
│  └───────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Blockchain Layer                                 │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │                    Diamond Proxy (EIP-2535)                       │   │
│  │  ┌──────────────────┐  ┌────────────────┐  ┌──────────────────┐   │   │
│  │  │ConditionManager │  │ PositionFacet │  │  GettersFacet   │   │   │
│  │  │    Facet         │  │                │  │                 │   │   │
│  │  │createCondition  │  │ splitPosition  │  │ getCondition    │   │   │
│  │  │prepareCondition │  │mergePositions  │  │ getPositionId   │   │   │
│  │  │reportPayouts    │  │ redeemPositions│  │ getCollectionId │   │   │
│  │  └──────────────────┘  └────────────────┘  └──────────────────┘   │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│  ┌───────────────────────┐  ┌───────────────────────────────────────┐   │
│  │ ConditionalTokens     │  │          ERC20 Tokens                  │   │
│  │ (ERC-1155)           │  │                                        │   │
│  │                      │  │  mBTC  │  mUSDC  │  ETH                │   │
│  │ Balance tracking     │  │                                        │   │
│  │ Position management  │  │                                        │   │
│  └───────────────────────┘  └───────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      External Services Layer                            │
│  ┌───────────────────────┐  ┌───────────────────────────────────────┐   │
│  │        IPFS          │  │          Bitcoin APIs                 │   │
│  │   (Filebase)         │  │                                        │   │
│  │                      │  │  Blockstream  │  Mempool  │  Blockchain │   │
│  │ Metadata storage     │  │                                        │   │
│  │ Condition metadata   │  │  Block height  │  Difficulty            │   │
│  └───────────────────────┘  └───────────────────────────────────────┘   │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │                      RPC Providers                               │   │
│  │  Base Sepolia  │  Ethereum Mainnet  │  Testnets                  │   │
│  └───────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

The application is organized into distinct layers:

1. **Pages** (`src/app/pages/`): Route-level components handling page layouts
2. **Components** (`src/app/components/`): Reusable UI components
3. **Hooks** (`src/hooks/`): Custom React hooks for business logic
4. **Config** (`src/config/`): Application configuration
5. **Utils** (`src/utils/`): Utility functions
6. **Contexts** (`src/app/contexts/`): React context providers

### Data Flow

```
User Action → Hook → Wagmi → Viem → Blockchain
                ↓
         TanStack Query (caching)
                ↓
         UI Update (receipt/event)
```

---

## 8. Smart Contract Interactions

### Diamond Proxy Pattern (EIP-2535)

Doefin V2 implements the Diamond Proxy Pattern (EIP-2535), which allows for a modular smart contract architecture. The Diamond contract serves as a proxy that delegates calls to specific facets:

```
Diamond (Proxy)
    │
    ├── ConditionManagerFacet ── Condition creation and management
    ├── PositionFacet ────────── Position splitting and merging
    ├── GettersFacet ──────────── Read-only contract queries
    └── Storage ──────────────── Persistent state (DiamondStorage)
```

### Core Facets

#### ConditionManagerFacet

Manages the lifecycle of prediction market conditions:

```solidity
function createConditionWithMetadata(
    uint8 questionType,
    bytes memory metadata,
    uint8 outcomeSlotCount,
    string memory metadataURI,
    bytes32 salt
) external returns (bytes32 conditionId);
```

#### PositionFacet

Handles position operations:

```solidity
function splitPosition(
    IERC20 collateralToken,
    bytes32 parentCollectionId,
    bytes32 conditionId,
    uint256[] calldata partition,
    uint256 amount
) external;

function mergePositions(
    IERC20 collateralToken,
    bytes32 parentCollectionId,
    bytes32 conditionId,
    uint256[] calldata partition,
    uint256 amount
) external;
```

#### GettersFacet

Provides read access to contract state:

```solidity
function getCondition(bytes32 conditionId) external view returns (Condition memory);
function getPositionId(bytes32 collateralToken, bytes32 collectionId) external pure returns (uint256);
function getCollectionId(bytes32 parentCollectionId, bytes32 conditionId, uint256 indexSet) external view returns (bytes32);
```

### Position ID Derivation

Position IDs are computed using a deterministic algorithm:

```typescript
// Get collection ID for YES outcome (indexSet = 1)
const yesCollectionId = await publicClient.readContract({
  address: diamondAddress,
  abi: DIAMOND_ABI,
  functionName: "getCollectionId",
  args: [parentCollectionId, conditionId, PARTITION_YES],
});

// Get position ID
const yesPositionId = await publicClient.readContract({
  address: diamondAddress,
  abi: DIAMOND_ABI,
  functionName: "getPositionId",
  args: [collateralToken, yesCollectionId],
});
```

### ERC20 Approval Pattern

Before splitting positions, users must approve the Diamond contract to spend their collateral tokens:

```typescript
// Check current allowance
const { data: allowance } = useReadContract({
  address: collateralToken,
  abi: ERC20_ABI,
  functionName: "allowance",
  args: [userAddress, CONTRACTS.Diamond],
});

// Approve if needed
await writeContract({
  address: collateralToken,
  abi: ERC20_ABI,
  functionName: "approve",
  args: [CONTRACTS.Diamond, MAX_UINT256],
});
```

---

## 9. Security Considerations

When developing or deploying Doefin V2, consider the following security aspects:

### API Key Management

- **Never commit API keys** to version control
- Use environment variables for all sensitive credentials
- Rotate WalletConnect and Filebase keys regularly
- Consider using a secrets management service for production deployments

### Token Approvals

- The application requests **unlimited token approvals** (`type(uint256).max`)
- Users should only approve trusted contracts
- Review approval transactions before signing
- Consider using limited approvals when possible

### Debug Logging

- The application contains debug logging for development
- **Disable or remove debug logs before production deployment**
- Sensitive data (private keys, API keys) should never be logged

### Production Hardening Recommendations

1. **Environment Variables**: Use production RPC URLs, not public testnet endpoints
2. **API Keys**: Use dedicated production API keys with rate limiting
3. **Monitoring**: Implement error tracking (Sentry, Datadog)
4. **Rate Limiting**: Add client-side rate limiting for API calls
5. **Content Security Policy**: Configure CSP headers for the production build
6. **HTTPS**: Ensure all production traffic uses TLS

---

## 10. Contributing

We welcome contributions to Doefin V2. Please follow these guidelines:

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Install dependencies: `pnpm install`

### Development Workflow

1. Make your changes
2. Run type checking: `pnpm build` (includes TypeScript validation)
3. Test your changes thoroughly
4. Commit with descriptive messages
5. Push to your fork and create a pull request

### Code Style

- Use TypeScript for all new code
- Follow existing code formatting (ESLint/Prettier integrated via Vite)
- Write meaningful commit messages
- Add comments for complex logic

### Pull Request Guidelines

- Reference any related issues
- Include a clear description of changes
- Ensure all tests pass
- Update documentation if needed

---

## 11. License

Doefin V2 is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2024 Doefin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 12. Troubleshooting

### Common Issues and Solutions

#### Wallet Connection Issues

**Problem**: Wallet connection fails or doesn't initiate

**Solutions**:

- Ensure WalletConnect Project ID is configured in `.env`
- Clear wallet connection cache and retry
- Try a different wallet (MetaMask, Rainbow, Coinbase)
- Check browser console for specific error messages

#### Transaction Failures

**Problem**: Transactions fail with "insufficient funds"

**Solutions**:

- Ensure sufficient Base Sepolia ETH for gas
- Obtain testnet ETH from a Base Sepolia faucet
- Check that token balances are sufficient for the position

**Problem**: Transactions fail with "execution reverted"

**Solutions**:

- Verify the condition doesn't already exist
- Ensure collateral token is allowed
- Check that amount is a multiple of collateral unit

#### Gas Estimation Issues

**Problem**: Gas estimation fails or shows unrealistic values

**Solutions**:

- Ensure wallet is connected
- Verify contract addresses are correct in `.env`
- Check network connectivity
- Try refreshing the page

#### IPFS Upload Failures

**Problem**: Metadata upload to IPFS fails

**Solutions**:

- Verify Filebase API key is correct
- Check network connectivity
- Ensure the JSON metadata is valid

#### Bitcoin API Issues

**Problem**: Bitcoin block height or difficulty not loading

**Solutions**:

- The application uses multiple fallback APIs
- Check internet connectivity
- APIs will automatically retry with backup services

### Debug Mode

Enable debug logging by checking the browser console. The application logs:

- Transaction parameters and results
- Gas estimation details
- Condition creation data
- Position splitting events

### Network Configuration

Ensure your wallet is connected to **Base Sepolia** (Chain ID: 84532). The application enforces network switching but manual configuration may be required:

```
Network Name: Base Sepolia
RPC URL: https://sepolia.base.org
Chain ID: 84532
Currency Symbol: ETH
Block Explorer: https://sepolia.basescan.org
```

---

## Support

For questions or issues:

- Open an issue on GitHub
- Review existing documentation
- Check the Architecture page in the application (`/architecture`)

---

<p align="center">
  <strong>Doefin V2 — Conditional Token Prediction Market</strong>
</p>
