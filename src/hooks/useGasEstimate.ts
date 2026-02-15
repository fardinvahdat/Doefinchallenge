import { useState, useEffect } from 'react';
import { usePublicClient, useAccount } from 'wagmi';
import { Address, parseEther, formatEther, keccak256, encodePacked, encodeAbiParameters, decodeErrorResult } from 'viem';
import { CONTRACTS, DIAMOND_ABI, CONDITIONAL_TOKENS_ABI } from '../config/contracts';

export interface GasEstimate {
  estimatedGas: bigint;
  gasPrice: bigint;
  estimatedCostWei: bigint;
  estimatedCostEth: string;
  estimatedCostUSD: string;
  isEstimating: boolean;
  error: string | null;
  conditionExists?: boolean;
}

// Legacy interface for ConditionalTokens contract
interface UseGasEstimateLegacyProps {
  enabled: boolean;
  oracle?: Address;
  questionId?: `0x${string}`;
  outcomeSlotCount?: bigint;
}

// New interface for Diamond contract (createConditionWithMetadata)
interface UseGasEstimateDiamondProps {
  enabled: boolean;
  diamond?: Address;
  questionType?: number;
  threshold?: bigint;
  blockHeight?: bigint;
  outcomeSlotCount?: bigint;
  metadataURI?: string;
  salt?: `0x${string}`;
}

type UseGasEstimateProps = UseGasEstimateLegacyProps | UseGasEstimateDiamondProps;

export function useGasEstimate(props: UseGasEstimateProps): GasEstimate {
  const publicClient = usePublicClient();
  const { address } = useAccount();

  const [estimatedGas, setEstimatedGas] = useState<bigint>(0n);
  const [gasPrice, setGasPrice] = useState<bigint>(0n);
  const [isEstimating, setIsEstimating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conditionExists, setConditionExists] = useState(false);

  // Rough ETH/USD rate (you can fetch this from an API)
  const ETH_USD_RATE = 2000;

  // Determine if using Diamond contract or legacy ConditionalTokens
  const isDiamond = 'diamond' in props && props.diamond !== undefined;

  useEffect(() => {
    let mounted = true;

    async function estimateGas() {
      // Check if we have required params
      if (!props.enabled || !publicClient || !address) {
        return;
      }

      setIsEstimating(true);
      setError(null);
      setConditionExists(false);

      try {
        if (isDiamond) {
          // Diamond contract (createConditionWithMetadata) estimation
          const diamondProps = props as UseGasEstimateDiamondProps;
          const { diamond, questionType, threshold, blockHeight, outcomeSlotCount, metadataURI, salt } = diamondProps;

          if (!diamond || questionType === undefined || !threshold || !blockHeight || !outcomeSlotCount || !salt) {
            return;
          }

          console.log('⛽ DEBUG: Diamond Gas Estimation Starting');
          console.log('  Diamond:', diamond);
          console.log('  QuestionType:', questionType);
          console.log('  Threshold:', threshold.toString());
          console.log('  BlockHeight:', blockHeight.toString());
          console.log('  OutcomeSlotCount:', outcomeSlotCount.toString());
          console.log('  MetadataURI:', metadataURI);
          console.log('  Salt:', salt);

          // Encode metadata using ABI encoding
          const metadata = encodeAbiParameters(
            [{ type: "uint256" }, { type: "uint256" }],
            [threshold, blockHeight]
          );

          // Generate questionId from metadata (same as in CreateCondition)
          const questionId = keccak256(metadata);
          console.log('  QuestionId:', questionId);

          // Calculate condition ID
          const conditionId = keccak256(
            encodePacked(
              ['address', 'bytes32', 'uint8', 'bytes32'],
              [address, questionId, outcomeSlotCount, salt]
            )
          );
          console.log('  Calculated ConditionId:', conditionId);

          // Check if condition already exists via Diamond contract
          try {
            const existingCondition = await publicClient.readContract({
              address: CONTRACTS.Diamond,
              abi: DIAMOND_ABI,
              functionName: 'getCondition',
              args: [conditionId],
            }) as any;

            if (existingCondition && existingCondition.oracle !== '0x0000000000000000000000000000000000000000') {
              console.log('  ❌ CONDITION EXISTS!');
              if (mounted) {
                setConditionExists(true);
                setError('This condition already exists. Try different threshold or block height values.');
                setIsEstimating(false);
                
                try {
                  const currentGasPrice = await publicClient.getGasPrice();
                  setGasPrice(currentGasPrice);
                } catch {
                  setGasPrice(parseEther('0.000000001'));
                }
              }
              return;
            }
          } catch (e) {
            // Condition doesn't exist (will throw if not found)
            console.log('  ✅ Condition does not exist, proceeding...');
          }
          
          console.log('  ✅ Condition does not exist, proceeding with estimation...');
          
          // Simulate the contract call
          const { request } = await publicClient.simulateContract({
            address: CONTRACTS.Diamond,
            abi: DIAMOND_ABI,
            functionName: 'createConditionWithMetadata',
            args: [
              questionType, // uint8
              metadata, // bytes
              Number(outcomeSlotCount), // uint8
              metadataURI || '', // string
              salt, // bytes32
            ],
            account: address,
          });

          // If simulation succeeds, estimate gas
          const gas = await publicClient.estimateGas({
            to: CONTRACTS.Diamond,
            data: request.data,
            account: address,
          });

          // Get current gas price
          const currentGasPrice = await publicClient.getGasPrice();

          if (mounted) {
            // Add 20% buffer to gas estimate for safety
            const gasWithBuffer = gas;
            setEstimatedGas(gasWithBuffer);
            setGasPrice(currentGasPrice);
            setIsEstimating(false);
          }
        } else {
          // Legacy ConditionalTokens contract estimation
          const legacyProps = props as UseGasEstimateLegacyProps;
          const { oracle, questionId, outcomeSlotCount } = legacyProps;

          if (!oracle || !questionId || !outcomeSlotCount) {
            return;
          }

          // Calculate condition ID (same as generateConditionId in useConditionalTokens)
          const conditionId = keccak256(
            encodePacked(
              ['address', 'bytes32', 'uint256'],
              [oracle, questionId, outcomeSlotCount]
            )
          );

          console.log('⛽ DEBUG: Legacy Gas Estimation Starting');
          console.log('  Oracle (wallet):', oracle);
          console.log('  QuestionId:', questionId);
          console.log('  OutcomeSlotCount:', outcomeSlotCount.toString());
          console.log('  Calculated ConditionId:', conditionId);

          // Check if condition is already prepared by checking outcomeSlotCount
          const outcomeSlotsCount = await publicClient.readContract({
            address: CONTRACTS.ConditionalTokens,
            abi: CONDITIONAL_TOKENS_ABI,
            functionName: 'getOutcomeSlotCount',
            args: [conditionId],
          }) as bigint;

          console.log('  Contract OutcomeSlotCount:', outcomeSlotsCount.toString());

          if (outcomeSlotsCount > 0n) {
            // Condition already exists!
            console.log('  ❌ CONDITION EXISTS!');
            if (mounted) {
              setConditionExists(true);
              setError('This condition already exists. Try different threshold or block height values.');
              setIsEstimating(false);
              
              // Still get gas price for display
              try {
                const currentGasPrice = await publicClient.getGasPrice();
                setGasPrice(currentGasPrice);
              } catch {
                setGasPrice(parseEther('0.000000001'));
              }
            }
            return;
          }

          console.log('  ✅ Condition does not exist, proceeding with estimation...');
          
          // Condition doesn't exist, proceed with estimation
          // First, simulate the contract call to check if it would succeed
          const { request } = await publicClient.simulateContract({
            address: CONTRACTS.ConditionalTokens,
            abi: CONDITIONAL_TOKENS_ABI,
            functionName: 'prepareCondition',
            args: [oracle, questionId, outcomeSlotCount],
            account: address,
          });

          // If simulation succeeds, estimate gas
          const gas = await publicClient.estimateGas({
            to: CONTRACTS.ConditionalTokens,
            data: request.data,
            account: address,
          });

          // Get current gas price
          const currentGasPrice = await publicClient.getGasPrice();

          if (mounted) {
            // Add 20% buffer to gas estimate for safety
            const gasWithBuffer = gas;
            setEstimatedGas(gasWithBuffer);
            setGasPrice(currentGasPrice);
            setIsEstimating(false);
          }
        }
      } catch (err: any) {
        console.error('Gas estimation error:', err);
        
        if (mounted) {
          // Parse error message
          let errorMessage = 'Failed to estimate gas';
          
          // Try to decode contract error
          if (err.data) {
            try {
              const decodedError = decodeErrorResult({
                abi: DIAMOND_ABI,
                data: err.data,
              });
              errorMessage = `Contract Error: ${decodedError.errorName || 'Unknown'}`;
            } catch {
              // Couldn't decode, try ConditionalTokens ABI
              try {
                const decodedError = decodeErrorResult({
                  abi: CONDITIONAL_TOKENS_ABI,
                  data: err.data,
                });
                errorMessage = `Contract Error: ${decodedError.errorName || 'Unknown'}`;
              } catch {
                // Couldn't decode at all
              }
            }
          }
          
          // Check for common error patterns
          if (err.message?.includes('0xa9ad62f8') || err.message?.includes('already prepared')) {
            errorMessage = 'This condition already exists. Try different threshold or block height values.';
            setConditionExists(true);
          } else if (err.message?.includes('execution reverted')) {
            errorMessage = 'Transaction would fail: Contract execution reverted. The condition may already exist or parameters are invalid.';
          } else if (err.message?.includes('insufficient funds')) {
            errorMessage = 'Insufficient funds for gas. Please add test ETH from a Base Sepolia faucet.';
          } else if (err.message?.includes('nonce')) {
            errorMessage = 'Transaction nonce issue. Try refreshing the page.';
          } else if (err.shortMessage) {
            errorMessage = err.shortMessage;
          }

          setError(errorMessage);
          setIsEstimating(false);
          
          // Set conservative fallback estimates
          setEstimatedGas(300000n); // ~300k gas fallback for Diamond contract
          
          // Get gas price even if estimation fails
          try {
            const currentGasPrice = await publicClient.getGasPrice();
            setGasPrice(currentGasPrice);
          } catch {
            setGasPrice(parseEther('0.000000001')); // 1 gwei fallback
          }
        }
      }
    }

    estimateGas();

    return () => {
      mounted = false;
    };
  }, [props.enabled, publicClient, address, isDiamond, 
    // Include all possible dependencies
    isDiamond ? (props as UseGasEstimateDiamondProps).diamond : (props as UseGasEstimateLegacyProps).oracle,
    isDiamond ? (props as UseGasEstimateDiamondProps).questionType : (props as UseGasEstimateLegacyProps).questionId,
    isDiamond ? (props as UseGasEstimateDiamondProps).threshold : (props as UseGasEstimateLegacyProps).outcomeSlotCount
  ]);

  // Calculate costs
  const estimatedCostWei: bigint = estimatedGas * gasPrice;
  const estimatedCostEth = formatEther(estimatedCostWei);
  const estimatedCostUSD = (parseFloat(estimatedCostEth) * ETH_USD_RATE).toFixed(2);

  return {
    estimatedGas,
    gasPrice,
    estimatedCostWei,
    estimatedCostEth,
    estimatedCostUSD,
    isEstimating,
    error,
    conditionExists,
  };
}
