import { Address } from 'viem'

// Contract addresses on Base Sepolia
export const CONTRACTS = {
  ConditionalTokens: '0x3F84bEf67EA2B582a3d0a4f6f6B15776F12342c9' as Address,
  mBTC: '0x324c4A1e28760bCC45cDE980D36A78C971653228' as Address,
  mUSDC: '0xa8401F4983bD79e17CfF0899504E84cebd2dB8ba' as Address,
} as const

// ERC20 ABI for token approvals and balances
export const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// Conditional Tokens ABI
export const CONDITIONAL_TOKENS_ABI = [
  {
    inputs: [
      { name: 'oracle', type: 'address' },
      { name: 'questionId', type: 'bytes32' },
      { name: 'outcomeSlotCount', type: 'uint256' },
    ],
    name: 'prepareCondition',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'collateralToken', type: 'address' },
      { name: 'parentCollectionId', type: 'bytes32' },
      { name: 'conditionId', type: 'bytes32' },
      { name: 'partition', type: 'uint256[]' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'splitPosition',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'collateralToken', type: 'address' },
      { name: 'parentCollectionId', type: 'bytes32' },
      { name: 'conditionId', type: 'bytes32' },
      { name: 'partition', type: 'uint256[]' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'mergePositions',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'questionId', type: 'bytes32' },
      { name: 'payouts', type: 'uint256[]' },
    ],
    name: 'reportPayouts',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'conditionId', type: 'bytes32' }],
    name: 'getOutcomeSlotCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'conditionId', type: 'bytes32' },
      { indexed: true, name: 'oracle', type: 'address' },
      { indexed: true, name: 'questionId', type: 'bytes32' },
      { indexed: false, name: 'outcomeSlotCount', type: 'uint256' },
    ],
    name: 'ConditionPreparation',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'stakeholder', type: 'address' },
      { indexed: false, name: 'collateralToken', type: 'address' },
      { indexed: true, name: 'parentCollectionId', type: 'bytes32' },
      { indexed: true, name: 'conditionId', type: 'bytes32' },
      { indexed: false, name: 'partition', type: 'uint256[]' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'PositionSplit',
    type: 'event',
  },
] as const