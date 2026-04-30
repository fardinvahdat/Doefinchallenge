import { useState, useEffect } from "react";
import { usePublicClient, useAccount } from "wagmi";
import {
  Address,
  parseEther,
  parseGwei,
  formatEther,
  keccak256,
  encodePacked,
  encodeAbiParameters,
  decodeErrorResult,
  zeroHash,
} from "viem";
import {
  CONTRACTS,
  DIAMOND_ABI,
  CONDITIONAL_TOKENS_ABI,
} from "../config/contracts";

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

// Interface for splitPosition on Diamond contract
interface UseGasEstimateSplitPositionProps {
  enabled: boolean;
  splitPosition?: {
    collateralToken?: Address;
    conditionId?: Address;
    amount?: bigint;
  };
}

type UseGasEstimateProps =
  | UseGasEstimateLegacyProps
  | UseGasEstimateDiamondProps
  | UseGasEstimateSplitPositionProps;

export function useGasEstimate(props: UseGasEstimateProps): GasEstimate {
  const publicClient = usePublicClient();
  const { address } = useAccount();

  const [estimatedGas, setEstimatedGas] = useState<bigint>(0n);
  const [gasPrice, setGasPrice] = useState<bigint>(0n);
  const [isEstimating, setIsEstimating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conditionExists, setConditionExists] = useState(false);

  // Minimum gas price floor (0.01 Gwei) to ensure accurate estimates
  // Base Sepolia can have very low gas prices, but we want to show realistic estimates
  const MIN_GAS_PRICE = parseGwei("0.01"); // 0.01 Gwei minimum

  // Rough ETH/USD rate (you can fetch this from an API)
  const ETH_USD_RATE = 2000;

  // Determine if using Diamond contract, splitPosition, or legacy ConditionalTokens
  const isDiamond = "diamond" in props && props.diamond !== undefined;
  const isSplitPosition =
    "splitPosition" in props && props.splitPosition !== undefined;

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
        if (isSplitPosition) {
          // splitPosition on Diamond contract
          const splitProps = props as UseGasEstimateSplitPositionProps;
          const { collateralToken, conditionId, amount } =
            splitProps.splitPosition || {};

          if (!collateralToken || !conditionId || !amount) {
            return;
          }

          // BINARY_PARTITION for splitPosition (from useSplitPosition)
          const BINARY_PARTITION = [1n, 2n] as const;

          // Simulate the splitPosition contract call
          const { request } = await publicClient.simulateContract({
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
            account: address,
          });

          // If simulation succeeds, estimate gas
          const gas = await publicClient.estimateGas({
            to: CONTRACTS.Diamond,
            data: (request as any).data,
            account: address,
          });

          // Get current gas price
          const currentGasPrice = await publicClient.getGasPrice();

          if (mounted) {
            // Add 20% buffer to gas estimate for safety
            const gasWithBuffer = (gas * 120n) / 100n;
            setEstimatedGas(gasWithBuffer);
            // Use network gas price but ensure it's above minimum floor
            const adjustedGasPrice =
              currentGasPrice < MIN_GAS_PRICE ? MIN_GAS_PRICE : currentGasPrice;
            setGasPrice(adjustedGasPrice);
            setIsEstimating(false);
          }
        } else if (isDiamond) {
          // Diamond contract (createConditionWithMetadata) estimation
          const diamondProps = props as UseGasEstimateDiamondProps;
          const {
            diamond,
            questionType,
            threshold,
            blockHeight,
            outcomeSlotCount,
            metadataURI,
            salt,
          } = diamondProps;

          if (
            !diamond ||
            questionType === undefined ||
            !threshold ||
            !blockHeight ||
            !outcomeSlotCount ||
            !salt
          ) {
            return;
          }

          // Encode metadata using ABI encoding
          const metadata = encodeAbiParameters(
            [{ type: "uint256" }, { type: "uint256" }],
            [threshold, blockHeight],
          );

          // Generate questionId from metadata (same as in CreateCondition)
          const questionId = keccak256(metadata);

          // Calculate condition ID
          const conditionId = keccak256(
            encodePacked(
              ["address", "bytes32", "uint8", "bytes32"],
              [address, questionId, Number(outcomeSlotCount), salt],
            ),
          );

          // Check if condition already exists via Diamond contract
          try {
            const existingCondition = (await publicClient.readContract({
              address: CONTRACTS.Diamond,
              abi: DIAMOND_ABI,
              functionName: "getCondition",
              args: [conditionId],
            })) as any;

            if (
              existingCondition &&
              existingCondition.oracle !==
                "0x0000000000000000000000000000000000000000"
            ) {
              if (mounted) {
                setConditionExists(true);
                setError(
                  "This condition already exists. Try different threshold or block height values.",
                );
                setIsEstimating(false);

                try {
                  const currentGasPrice = await publicClient.getGasPrice();
                  // Use network gas price but ensure it's above minimum floor
                  const adjustedGasPrice =
                    currentGasPrice < MIN_GAS_PRICE
                      ? MIN_GAS_PRICE
                      : currentGasPrice;
                  setGasPrice(adjustedGasPrice);
                } catch {
                  setGasPrice(parseGwei("1")); // 1 Gwei fallback
                }
              }
              return;
            }
          } catch (e) {
            // Condition doesn't exist (will throw if not found)
          }

          // Simulate the contract call
          const { request } = await publicClient.simulateContract({
            address: CONTRACTS.Diamond,
            abi: DIAMOND_ABI,
            functionName: "createConditionWithMetadata",
            args: [
              questionType, // uint8
              metadata, // bytes
              Number(outcomeSlotCount), // uint8
              metadataURI || "", // string
              salt, // bytes32
            ],
            account: address,
          });

          // If simulation succeeds, estimate gas
          const gas = await publicClient.estimateGas({
            to: CONTRACTS.Diamond,
            data: (request as any).data,
            account: address,
          });

          // Get current gas price
          const currentGasPrice = await publicClient.getGasPrice();

          if (mounted) {
            // Add 20% buffer to gas estimate for safety
            const gasWithBuffer = (gas * 120n) / 100n;
            setEstimatedGas(gasWithBuffer);
            // Use network gas price but ensure it's above minimum floor
            const adjustedGasPrice =
              currentGasPrice < MIN_GAS_PRICE ? MIN_GAS_PRICE : currentGasPrice;
            setGasPrice(adjustedGasPrice);
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
              ["address", "bytes32", "uint256"],
              [oracle, questionId, outcomeSlotCount],
            ),
          );

          // Check if condition is already prepared by checking outcomeSlotCount
          const outcomeSlotsCount = (await publicClient.readContract({
            address: CONTRACTS.ConditionalTokens,
            abi: CONDITIONAL_TOKENS_ABI,
            functionName: "getOutcomeSlotCount",
            args: [conditionId],
          })) as bigint;

          if (outcomeSlotsCount > 0n) {
            // Condition already exists!
            if (mounted) {
              setConditionExists(true);
              setError(
                "This condition already exists. Try different threshold or block height values.",
              );
              setIsEstimating(false);

              // Still get gas price for display
              try {
                const currentGasPrice = await publicClient.getGasPrice();
                // Use network gas price but ensure it's above minimum floor
                const adjustedGasPrice =
                  currentGasPrice < MIN_GAS_PRICE
                    ? MIN_GAS_PRICE
                    : currentGasPrice;
                setGasPrice(adjustedGasPrice);
              } catch {
                setGasPrice(parseGwei("1")); // 1 Gwei fallback
              }
            }
            return;
          }

          // Condition doesn't exist, proceed with estimation
          // First, simulate the contract call to check if it would succeed
          const { request } = await publicClient.simulateContract({
            address: CONTRACTS.ConditionalTokens,
            abi: CONDITIONAL_TOKENS_ABI,
            functionName: "prepareCondition",
            args: [oracle, questionId, outcomeSlotCount],
            account: address,
          });

          // If simulation succeeds, estimate gas
          const gas = await publicClient.estimateGas({
            to: CONTRACTS.ConditionalTokens,
            data: (request as any).data,
            account: address,
          });

          // Get current gas price
          const currentGasPrice = await publicClient.getGasPrice();

          if (mounted) {
            // Add 20% buffer to gas estimate for safety
            const gasWithBuffer = (gas * 120n) / 100n;
            setEstimatedGas(gasWithBuffer);
            // Use network gas price but ensure it's above minimum floor
            const adjustedGasPrice =
              currentGasPrice < MIN_GAS_PRICE ? MIN_GAS_PRICE : currentGasPrice;
            setGasPrice(adjustedGasPrice);
            setIsEstimating(false);
          }
        }
      } catch (err: any) {

        if (mounted) {
          // Parse error message
          let errorMessage = "Failed to estimate gas";

          // Try to decode contract error
          if (err.data) {
            try {
              const decodedError = decodeErrorResult({
                abi: DIAMOND_ABI,
                data: err.data,
              });
              const name = decodedError.errorName || "Unknown";
              if (name === "NotMarketMaker") {
                errorMessage =
                  "Your wallet is not authorized to create conditions. Contact the Doefin team to get your address whitelisted as a market maker.";
              } else if (
                name === "ConditionAlreadyPrepared" ||
                name === "OracleAdapter_QuestionAlreadyExists"
              ) {
                errorMessage =
                  "This condition already exists. Try different threshold or block height values.";
                setConditionExists(true);
              } else {
                errorMessage = `Contract error: ${name}`;
              }
            } catch {
              // Couldn't decode, try ConditionalTokens ABI
              try {
                const decodedError = decodeErrorResult({
                  abi: CONDITIONAL_TOKENS_ABI,
                  data: err.data,
                });
                errorMessage = `Contract error: ${decodedError.errorName || "Unknown"}`;
              } catch {
                // Couldn't decode at all
              }
            }
          }

          // Pattern-match on raw message only when ABI decode didn't give a specific message
          if (errorMessage === "Failed to estimate gas") {
            if (
              err.message?.includes("0xa9ad62f8") ||
              err.message?.includes("already prepared")
            ) {
              errorMessage =
                "This condition already exists. Try different threshold or block height values.";
              setConditionExists(true);
            } else if (err.message?.includes("0x67ca592f") || err.message?.includes("NotMarketMaker")) {
              errorMessage =
                "Your wallet is not authorized to create conditions. Contact the Doefin team to get your address whitelisted as a market maker.";
            } else if (err.message?.includes("execution reverted")) {
              errorMessage =
                "Transaction would fail: Contract execution reverted. The condition may already exist or parameters are invalid.";
            } else if (err.message?.includes("insufficient funds")) {
              errorMessage =
                "Insufficient funds for gas. Please add test ETH from a Base Sepolia faucet.";
            } else if (err.message?.includes("nonce")) {
              errorMessage = "Transaction nonce issue. Try refreshing the page.";
            } else if (err.shortMessage) {
              errorMessage = err.shortMessage;
            }
          }

          setError(errorMessage);
          setIsEstimating(false);

          // Set conservative fallback estimates
          setEstimatedGas(300000n); // ~300k gas fallback for Diamond contract

          // Get gas price even if estimation fails
          try {
            const currentGasPrice = await publicClient.getGasPrice();
            // Use network gas price but ensure it's above minimum floor
            const adjustedGasPrice =
              currentGasPrice < MIN_GAS_PRICE ? MIN_GAS_PRICE : currentGasPrice;
            setGasPrice(adjustedGasPrice);
          } catch {
            setGasPrice(parseGwei("1")); // 1 Gwei fallback
          }
        }
      }
    }

    estimateGas();

    return () => {
      mounted = false;
    };
  }, [
    props.enabled,
    publicClient,
    address,
    // Include all splitPosition-specific props
    isSplitPosition
      ? (props as UseGasEstimateSplitPositionProps).splitPosition
          ?.collateralToken
      : undefined,
    isSplitPosition
      ? (props as UseGasEstimateSplitPositionProps).splitPosition?.conditionId
      : undefined,
    isSplitPosition
      ? (props as UseGasEstimateSplitPositionProps).splitPosition?.amount
      : undefined,
    // Include all Diamond-specific props
    isDiamond ? (props as UseGasEstimateDiamondProps).diamond : undefined,
    isDiamond ? (props as UseGasEstimateDiamondProps).questionType : undefined,
    isDiamond ? (props as UseGasEstimateDiamondProps).threshold : undefined,
    isDiamond ? (props as UseGasEstimateDiamondProps).blockHeight : undefined,
    isDiamond
      ? (props as UseGasEstimateDiamondProps).outcomeSlotCount
      : undefined,
    isDiamond ? (props as UseGasEstimateDiamondProps).metadataURI : undefined,
    isDiamond ? (props as UseGasEstimateDiamondProps).salt : undefined,
    // Include all Legacy-specific props
    !isDiamond && !isSplitPosition
      ? (props as UseGasEstimateLegacyProps).oracle
      : undefined,
    !isDiamond && !isSplitPosition
      ? (props as UseGasEstimateLegacyProps).questionId
      : undefined,
    !isDiamond && !isSplitPosition
      ? (props as UseGasEstimateLegacyProps).outcomeSlotCount
      : undefined,
  ]);

  // Calculate costs
  const estimatedCostWei: bigint = estimatedGas * gasPrice;
  const estimatedCostEth = formatEther(estimatedCostWei);
  const estimatedCostUSD = (
    parseFloat(estimatedCostEth) * ETH_USD_RATE
  ).toFixed(2);

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
