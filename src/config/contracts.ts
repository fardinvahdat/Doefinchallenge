import { Address } from "viem";

// Contract addresses on Base Sepolia
export const CONTRACTS = {
  ConditionalTokens: "0x3F84bEf67EA2B582a3d0a4f6f6B15776F12342c9" as Address,
  Diamond: "0x75ed83f1fd159050E1ed546C1A584ac2c9deE225" as Address,
  mBTC: "0x324c4A1e28760bCC45cDE980D36A78C971653228" as Address,
  mUSDC: "0xa8401F4983bD79e17CfF0899504E84cebd2dB8ba" as Address,
} as const;

// ERC20 ABI for token approvals and balances
export const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Conditional Tokens ABI
export const CONDITIONAL_TOKENS_ABI = [
  {
    inputs: [
      { name: "oracle", type: "address" },
      { name: "questionId", type: "bytes32" },
      { name: "outcomeSlotCount", type: "uint256" },
    ],
    name: "prepareCondition",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "collateralToken", type: "address" },
      { name: "parentCollectionId", type: "bytes32" },
      { name: "conditionId", type: "bytes32" },
      { name: "partition", type: "uint256[]" },
      { name: "amount", type: "uint256" },
    ],
    name: "splitPosition",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "collateralToken", type: "address" },
      { name: "parentCollectionId", type: "bytes32" },
      { name: "conditionId", type: "bytes32" },
      { name: "partition", type: "uint256[]" },
      { name: "amount", type: "uint256" },
    ],
    name: "mergePositions",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "questionId", type: "bytes32" },
      { name: "payouts", type: "uint256[]" },
    ],
    name: "reportPayouts",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "id", type: "uint256" },
    ],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "conditionId", type: "bytes32" }],
    name: "getOutcomeSlotCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "conditionId", type: "bytes32" },
      { indexed: true, name: "oracle", type: "address" },
      { indexed: true, name: "questionId", type: "bytes32" },
      { indexed: false, name: "outcomeSlotCount", type: "uint256" },
    ],
    name: "ConditionPreparation",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "stakeholder", type: "address" },
      { indexed: false, name: "collateralToken", type: "address" },
      { indexed: true, name: "parentCollectionId", type: "bytes32" },
      { indexed: true, name: "conditionId", type: "bytes32" },
      { indexed: false, name: "partition", type: "uint256[]" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "PositionSplit",
    type: "event",
  },
] as const;

// Diamond ABI for various facets
// Includes: ConditionManagerFacet, PositionFacet, GettersFacet
const DIAMOND_FULL_ABI = [
  // ConditionManagerFacet
  {
    inputs: [
      { name: "questionType", type: "uint8" },
      { name: "metadata", type: "bytes" },
      { name: "outcomeSlotCount", type: "uint8" },
      { name: "metadataURI", type: "string" },
      { name: "salt", type: "bytes32" },
    ],
    name: "createConditionWithMetadata",
    outputs: [{ name: "conditionId", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "oracle", type: "address" },
      { name: "questionId", type: "bytes32" },
      { name: "outcomeSlotCount", type: "uint8" },
    ],
    name: "getConditionId",
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "conditionId",
        type: "bytes32",
      },
    ],
    name: "getCondition",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "oracle",
            type: "address",
          },
          {
            internalType: "bytes32",
            name: "questionId",
            type: "bytes32",
          },
          {
            internalType: "uint8",
            name: "outcomeSlotCount",
            type: "uint8",
          },
          {
            internalType: "string",
            name: "metadataURI",
            type: "string",
          },
          {
            internalType: "bool",
            name: "active",
            type: "bool",
          },
          {
            internalType: "address",
            name: "creator",
            type: "address",
          },
        ],
        internalType: "struct LibDoefinStorage.Condition",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  // getPayoutNumerators function - checks if condition is prepared
  {
    inputs: [{ name: "conditionId", type: "bytes32" }],
    name: "getPayoutNumerators",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  // isAllowedCollateral function - checks if collateral token is allowed
  {
    inputs: [{ name: "token", type: "address" }],
    name: "isAllowedCollateral",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  // getCollateralUnit function - gets the collateral unit for a token
  {
    inputs: [{ name: "token", type: "address" }],
    name: "getCollateralUnit",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // splitPosition function
  {
    inputs: [
      { name: "collateralToken", type: "address" },
      { name: "parentCollectionId", type: "bytes32" },
      { name: "conditionId", type: "bytes32" },
      { name: "partition", type: "uint256[]" },
      { name: "amount", type: "uint256" },
    ],
    name: "splitPosition",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // getCollectionId function
  {
    inputs: [
      { name: "parentCollectionId", type: "bytes32" },
      { name: "conditionId", type: "bytes32" },
      { name: "indexSet", type: "uint256" },
    ],
    name: "getCollectionId",
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  // getPositionId function
  {
    inputs: [
      { name: "collateralToken", type: "address" },
      { name: "collectionId", type: "bytes32" },
    ],
    name: "getPositionId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },
  // ConditionCreated event
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "conditionId", type: "bytes32" },
      { indexed: true, name: "oracle", type: "address" },
      { indexed: true, name: "questionId", type: "bytes32" },
      { indexed: false, name: "outcomeSlotCount", type: "uint8" },
      { indexed: false, name: "metadataURI", type: "string" },
      { indexed: false, name: "creator", type: "address" },
    ],
    name: "ConditionCreated",
    type: "event",
  },
  // PositionSplit event
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "stakeholder", type: "address" },
      { indexed: true, name: "collateralToken", type: "address" },
      { indexed: true, name: "parentCollectionId", type: "bytes32" },
      { indexed: false, name: "conditionId", type: "bytes32" },
      { indexed: false, name: "partition", type: "uint256[]" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "PositionSplit",
    type: "event",
  },
] as const;

// Re-export the full diamond ABI
export { DIAMOND_FULL_ABI as DIAMOND_ABI };
