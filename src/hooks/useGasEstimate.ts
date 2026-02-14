import { useState, useEffect } from 'react';
import { usePublicClient, useAccount } from 'wagmi';
import { Address, parseEther, formatEther, formatGwei, decodeErrorResult, keccak256, encodePacked } from 'viem';
import { CONTRACTS, CONDITIONAL_TOKENS_ABI } from '../config/contracts';

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

interface UseGasEstimateProps {
  enabled: boolean;
  oracle?: Address;
  questionId?: `0x${string}`;
  outcomeSlotCount?: bigint;
}

export function useGasEstimate({
  enabled,
  oracle,
  questionId,
  outcomeSlotCount,
}: UseGasEstimateProps): GasEstimate {
  const publicClient = usePublicClient();
  const { address } = useAccount();

  const [estimatedGas, setEstimatedGas] = useState<bigint>(0n);
  const [gasPrice, setGasPrice] = useState<bigint>(0n);
  const [isEstimating, setIsEstimating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conditionExists, setConditionExists] = useState(false);

  // Rough ETH/USD rate (you can fetch this from an API)
  const ETH_USD_RATE = 2000;

  useEffect(() => {
    let mounted = true;

    async function estimateGas() {
      if (!enabled || !publicClient || !address || !oracle || !questionId || !outcomeSlotCount) {
        return;
      }

      setIsEstimating(true);
      setError(null);
      setConditionExists(false);

      try {
        // Calculate condition ID (same as generateConditionId in useConditionalTokens)
        const conditionId = keccak256(
          encodePacked(
            ['address', 'bytes32', 'uint256'],
            [oracle, questionId, outcomeSlotCount]
          )
        );

        console.log('⛽ DEBUG: Gas Estimation Starting');
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
          const gasWithBuffer = (gas * 120n) / 100n;
          setEstimatedGas(gasWithBuffer);
          setGasPrice(currentGasPrice);
          setIsEstimating(false);
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
                abi: CONDITIONAL_TOKENS_ABI,
                data: err.data,
              });
              errorMessage = `Contract Error: ${decodedError.errorName || 'Unknown'}`;
            } catch {
              // Couldn't decode, use generic message
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
          setEstimatedGas(200000n); // ~200k gas fallback
          
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
  }, [enabled, publicClient, address, oracle, questionId, outcomeSlotCount]);

  // Calculate costs
  const estimatedCostWei = estimatedGas * gasPrice;
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