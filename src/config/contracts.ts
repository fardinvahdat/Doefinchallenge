import { Address } from "viem";

// Contract addresses on Base Sepolia
export const CONTRACTS = {
  ConditionalTokens: (import.meta.env.VITE_CONDITIONAL_TOKENS_ADDRESS ||
    "0x3F84bEf67EA2B582a3d0a4f6f6B15776F12342c9") as Address,
  Diamond: (import.meta.env.VITE_DIAMOND_ADDRESS ||
    "0xb05a5f3272F83BB748CcDA59c71Ac197dfA60F17") as Address,
  mBTC: (import.meta.env.VITE_MBTC_ADDRESS ||
    "0x324c4A1e28760bCC45cDE980D36A78C971653228") as Address,
  mUSDC: (import.meta.env.VITE_MUSDC_ADDRESS ||
    "0xa8401F4983bD79e17CfF0899504E84cebd2dB8ba") as Address,
} as const;

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

// Diamond ABI — extracted from doefin-frontend contracts/doefin/v3/generated/diamond.ts
// Covers: ConditionManagerFacet, PositionFacet, GettersFacet
const DIAMOND_FULL_ABI = [
  // ConditionManagerFacet
  {
    inputs: [
      { internalType: "enum LibDoefinStorage.QuestionType", name: "questionType", type: "uint8" },
      { internalType: "bytes", name: "metadata", type: "bytes" },
      { internalType: "uint8", name: "outcomeSlotCount", type: "uint8" },
      { internalType: "string", name: "metadataURI", type: "string" },
      { internalType: "bytes32", name: "salt", type: "bytes32" },
    ],
    name: "createConditionWithMetadata",
    outputs: [
      { internalType: "bytes32", name: "conditionId", type: "bytes32" },
      { internalType: "bytes32", name: "questionId", type: "bytes32" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  // getConditionId overload 1 — by oracle + questionId + outcomeSlotCount
  {
    inputs: [
      { internalType: "address", name: "oracle", type: "address" },
      { internalType: "bytes32", name: "questionId", type: "bytes32" },
      { internalType: "uint8", name: "outcomeSlotCount", type: "uint8" },
    ],
    name: "getConditionId",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "pure",
    type: "function",
  },
  // getConditionId overload 2 — by positionId
  {
    inputs: [{ internalType: "uint256", name: "positionId", type: "uint256" }],
    name: "getConditionId",
    outputs: [{ internalType: "bytes32", name: "conditionId", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  // getCondition — field order: questionId, metadataURI, oracle, outcomeSlotCount, active, creator
  {
    inputs: [{ internalType: "bytes32", name: "conditionId", type: "bytes32" }],
    name: "getCondition",
    outputs: [
      {
        components: [
          { internalType: "bytes32", name: "questionId", type: "bytes32" },
          { internalType: "string", name: "metadataURI", type: "string" },
          { internalType: "address", name: "oracle", type: "address" },
          { internalType: "uint8", name: "outcomeSlotCount", type: "uint8" },
          { internalType: "bool", name: "active", type: "bool" },
          { internalType: "address", name: "creator", type: "address" },
        ],
        internalType: "struct LibDoefinStorage.Condition",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "conditionId", type: "bytes32" }],
    name: "getPayoutNumerators",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "token", type: "address" }],
    name: "isAllowedCollateral",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  // getCollateralUnit overload 1 — by token address
  {
    inputs: [{ internalType: "address", name: "token", type: "address" }],
    name: "getCollateralUnit",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // getCollateralUnit overload 2 — by positionId
  {
    inputs: [{ internalType: "uint256", name: "positionId", type: "uint256" }],
    name: "getCollateralUnit",
    outputs: [{ internalType: "uint256", name: "unit", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // PositionFacet
  {
    inputs: [
      { internalType: "address", name: "collateralToken", type: "address" },
      { internalType: "bytes32", name: "parentCollectionId", type: "bytes32" },
      { internalType: "bytes32", name: "conditionId", type: "bytes32" },
      { internalType: "uint256[]", name: "partition", type: "uint256[]" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "splitPosition",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "collateralToken", type: "address" },
      { internalType: "bytes32", name: "parentCollectionId", type: "bytes32" },
      { internalType: "bytes32", name: "conditionId", type: "bytes32" },
      { internalType: "uint256[]", name: "partition", type: "uint256[]" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "mergePositions",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "collateralToken", type: "address" },
      { internalType: "bytes32", name: "parentCollectionId", type: "bytes32" },
      { internalType: "bytes32", name: "conditionId", type: "bytes32" },
      { internalType: "uint256[]", name: "indexSets", type: "uint256[]" },
    ],
    name: "redeemPositions",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // GettersFacet
  {
    inputs: [
      { internalType: "bytes32", name: "parentCollectionId", type: "bytes32" },
      { internalType: "bytes32", name: "conditionId", type: "bytes32" },
      { internalType: "uint256", name: "indexSet", type: "uint256" },
    ],
    name: "getCollectionId",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "collateralToken", type: "address" },
      { internalType: "bytes32", name: "collectionId", type: "bytes32" },
    ],
    name: "getPositionId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "conditionId", type: "bytes32" },
      { indexed: true, internalType: "address", name: "oracle", type: "address" },
      { indexed: true, internalType: "bytes32", name: "questionId", type: "bytes32" },
      { indexed: false, internalType: "uint8", name: "outcomeSlotCount", type: "uint8" },
      { indexed: false, internalType: "string", name: "metadataURI", type: "string" },
      { indexed: false, internalType: "address", name: "creator", type: "address" },
    ],
    name: "ConditionCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "stakeholder", type: "address" },
      { indexed: true, internalType: "address", name: "collateralToken", type: "address" },
      { indexed: true, internalType: "bytes32", name: "parentCollectionId", type: "bytes32" },
      { indexed: false, internalType: "bytes32", name: "conditionId", type: "bytes32" },
      { indexed: false, internalType: "uint256[]", name: "partition", type: "uint256[]" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "PositionSplit",
    type: "event",
  },
] as const;

export { DIAMOND_FULL_ABI as DIAMOND_ABI };
