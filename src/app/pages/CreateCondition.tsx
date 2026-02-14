import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Loader2, ExternalLink, AlertTriangle, Fuel } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { useNavigate } from "react-router";
import { TransactionOverlay } from "../components/TransactionOverlay";
import { CopyableHash } from "../components/CopyableHash";
import { GasEstimationModal } from "../components/GasEstimationModal";
import { useAccount } from "wagmi";
import { useConditionalTokens } from "../../hooks/useConditionalTokens";
import { useWeb3 } from "../contexts/Web3Context";
import { useGasEstimate } from "../../hooks/useGasEstimate";
import { keccak256, toHex, encodePacked } from "viem";
import { CONTRACTS } from "../../config/contracts";

export default function CreateCondition() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { currentBlock } = useWeb3();
  const { prepareCondition, generateConditionId, hash, isPending, isConfirming, isSuccess, error } =
    useConditionalTokens();

  const [threshold, setThreshold] = useState("");
  const [blockHeight, setBlockHeight] = useState("");
  const [metadataURI, setMetadataURI] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showGasModal, setShowGasModal] = useState(false);
  const [conditionId, setConditionId] = useState<`0x${string}` | "">("");
  const [questionId, setQuestionId] = useState<`0x${string}` | "">("");

  const currentBlockNumber = currentBlock ? Number(currentBlock) : 0;
  const outcomeSlotCount = 2n; // Binary condition (YES/NO)

  // Check if contracts are configured
  const contractsConfigured = CONTRACTS.ConditionalTokens !== '0x0000000000000000000000000000000000000000';

  // Current Bitcoin block height (approximate - update periodically)
  const CURRENT_BITCOIN_BLOCK = 870000; // Update this value or fetch from API

  // Gas estimation - enable when all fields are filled
  const canEstimateGas = Boolean(
    contractsConfigured &&
    isConnected &&
    address &&
    threshold &&
    blockHeight &&
    parseInt(blockHeight) > CURRENT_BITCOIN_BLOCK &&
    questionId
  );

  const gasEstimate = useGasEstimate({
    enabled: canEstimateGas,
    oracle: address,
    questionId: questionId || undefined,
    outcomeSlotCount,
  });

  // Generate questionId from metadata
  useEffect(() => {
    if (threshold && blockHeight) {
      const metadata = {
        question: `Will Bitcoin mining difficulty exceed ${parseInt(threshold).toLocaleString()} at block ${blockHeight}?`,
        threshold: threshold,
        blockHeight: blockHeight,
        type: "DifficultyThreshold",
      };
      const metadataString = JSON.stringify(metadata);
      const qId = keccak256(toHex(metadataString));
      
      // DEBUG: Log to see what's being hashed
      console.log('🔍 DEBUG: Generating questionId');
      console.log('  Threshold:', threshold);
      console.log('  Block Height:', blockHeight);
      console.log('  Metadata:', metadata);
      console.log('  Metadata String:', metadataString);
      console.log('  QuestionId:', qId);
      
      setQuestionId(qId);
    } else {
      setQuestionId("");
    }
  }, [threshold, blockHeight]);

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && hash && address && questionId) {
      const cId = generateConditionId(address, questionId, outcomeSlotCount);
      setConditionId(cId);
      setShowSuccessModal(true);
      toast.success("Condition created successfully!");
    }
  }, [isSuccess, hash, address, questionId, generateConditionId]);

  // Handle transaction error
  useEffect(() => {
    if (error) {
      toast.error("Transaction failed: " + (error as Error).message);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!contractsConfigured) {
      toast.error("Contracts not configured. Please deploy contracts and update /src/config/contracts.ts");
      return;
    }

    if (!threshold) {
      toast.error("Threshold is required");
      return;
    }
    if (!blockHeight) {
      toast.error("Target block height is required");
      return;
    }
    
    // Validate Bitcoin block height (not Base Sepolia block height!)
    const bitcoinBlock = parseInt(blockHeight);
    if (bitcoinBlock <= CURRENT_BITCOIN_BLOCK) {
      toast.error(`Bitcoin block height must be greater than current block ~${CURRENT_BITCOIN_BLOCK.toLocaleString()}`);
      return;
    }
    
    if (!questionId) {
      toast.error("Question ID generation failed");
      return;
    }

    // Show gas estimation modal instead of submitting directly
    setShowGasModal(true);
  };

  const handleConfirmTransaction = async () => {
    if (!address || !questionId) return;

    try {
      setShowGasModal(false);
      // Use connected wallet address as oracle
      await prepareCondition(address, questionId, outcomeSlotCount);
    } catch (err) {
      console.error("Error preparing condition:", err);
    }
  };

  const txStatus = isPending
    ? "awaiting"
    : isConfirming
    ? "confirming"
    : isSuccess
    ? "confirmed"
    : error
    ? "failed"
    : "idle";

  const metadata = threshold && blockHeight
    ? {
        question: `Will Bitcoin mining difficulty exceed ${parseInt(threshold).toLocaleString()} at block ${blockHeight}?`,
        threshold: threshold,
        blockHeight: blockHeight,
        type: "DifficultyThreshold",
      }
    : null;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Create Binary Condition
          </h1>
          <p className="text-text-secondary text-lg">
            Define a difficulty threshold condition for Bitcoin mining prediction markets
          </p>
        </div>

        {!isConnected ? (
          <div className="bg-surface border border-border rounded-xl p-12 text-center">
            <p className="text-text-secondary text-lg mb-4">
              Please connect your wallet to create a condition
            </p>
            <p className="text-text-tertiary text-sm">
              Use the Connect Wallet button in the top right corner
            </p>
          </div>
        ) : (
          <>
            {/* Warning Banner - Contracts Not Configured */}
            {!contractsConfigured && (
              <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-xl flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-danger font-semibold mb-1">Contracts Not Configured</p>
                  <p className="text-sm text-text-secondary mb-2">
                    Contract addresses are set to zero address. You need to deploy contracts first and update <code className="text-xs bg-elevated px-1.5 py-0.5 rounded">/src/config/contracts.ts</code>
                  </p>
                  <p className="text-xs text-text-tertiary">
                    See <code className="bg-elevated px-1.5 py-0.5 rounded">/WEB3_SETUP.md</code> for deployment instructions
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Form */}
              <div className="bg-surface border border-border rounded-xl p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Threshold */}
                  <div className="space-y-2">
                    <Label htmlFor="threshold" className="text-text-primary">
                      Difficulty Threshold *
                    </Label>
                    <div className="relative">
                      <Input
                        id="threshold"
                        type="number"
                        placeholder="50000000000"
                        value={threshold}
                        onChange={(e) => setThreshold(e.target.value)}
                        className="bg-elevated border-border text-text-primary pr-20 focus:ring-primary focus:border-primary"
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">
                        H/s
                      </span>
                    </div>
                    <p className="text-xs text-text-tertiary">
                      The difficulty value that determines the binary outcome
                    </p>
                  </div>

                  {/* Target Block Height */}
                  <div className="space-y-2">
                    <Label htmlFor="blockHeight" className="text-text-primary">
                      Target Bitcoin Block Height *
                    </Label>
                    <Input
                      id="blockHeight"
                      type="number"
                      placeholder="875000"
                      value={blockHeight}
                      onChange={(e) => setBlockHeight(e.target.value)}
                      className="bg-elevated border-border text-text-primary focus:ring-primary focus:border-primary"
                      required
                    />
                    <div className="space-y-1">
                      <p className="text-xs text-text-tertiary">
                        Current Bitcoin block: ~{CURRENT_BITCOIN_BLOCK.toLocaleString()}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        Note: This is Bitcoin blockchain, not Base Sepolia (Current Base Sepolia: ~{currentBlockNumber.toLocaleString()})
                      </p>
                    </div>
                    {blockHeight && parseInt(blockHeight) <= CURRENT_BITCOIN_BLOCK && (
                      <p className="text-xs text-danger">
                        Bitcoin block height must be greater than current block ~{CURRENT_BITCOIN_BLOCK.toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Metadata URI */}
                  <div className="space-y-2">
                    <Label htmlFor="metadataURI" className="text-text-primary">
                      Metadata URI (Optional)
                    </Label>
                    <Input
                      id="metadataURI"
                      type="text"
                      placeholder="ipfs://Qm..."
                      value={metadataURI}
                      onChange={(e) => setMetadataURI(e.target.value)}
                      className="bg-elevated border-border text-text-primary focus:ring-primary focus:border-primary"
                    />
                    <p className="text-xs text-text-tertiary">
                      IPFS URI for additional condition metadata
                    </p>
                  </div>

                  {/* Generated Question ID */}
                  {questionId && (
                    <div className="p-3 bg-primary/5 border border-primary/30 rounded-lg">
                      <p className="text-xs text-text-secondary mb-1">Generated Question ID</p>
                      <code className="text-xs font-mono text-text-primary break-all block">
                        {questionId}
                      </code>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                    disabled={isPending || isConfirming}
                  >
                    {isPending || isConfirming ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Condition...
                      </>
                    ) : (
                      "Create Condition"
                    )}
                  </Button>
                </form>
              </div>

              {/* Live Preview */}
              <div className="bg-surface border border-border rounded-xl p-6 md:p-8 h-fit sticky top-24">
                <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
                {metadata ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-elevated rounded-lg border border-border">
                      <p className="text-sm text-text-secondary mb-1">Question</p>
                      <p className="text-text-primary font-medium">
                        {metadata.question}
                      </p>
                    </div>
                    <div className="p-4 bg-elevated rounded-lg border border-border">
                      <p className="text-sm text-text-secondary mb-2">Encoded Metadata</p>
                      <pre className="text-xs text-text-tertiary font-mono overflow-x-auto">
                        {JSON.stringify(metadata, null, 2)}
                      </pre>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
                        <p className="text-xs text-text-secondary mb-1">YES Outcome</p>
                        <p className="text-sm font-medium text-success">
                          ≥ {parseInt(threshold).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg">
                        <p className="text-xs text-text-secondary mb-1">NO Outcome</p>
                        <p className="text-sm font-medium text-danger">
                          &lt; {parseInt(threshold).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-text-tertiary">
                      Fill in the form to see a preview
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Transaction Overlay */}
      <TransactionOverlay
        isOpen={txStatus !== "idle"}
        status={txStatus}
        txHash={hash}
        onClose={() => {}}
        onRetry={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
      />

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="bg-elevated border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-text-primary">
              Condition Created Successfully! 🎉
            </DialogTitle>
            <DialogDescription className="text-text-secondary">
              Your condition has been created on-chain
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Condition ID */}
            <div className="space-y-2">
              <Label className="text-text-secondary text-sm">Condition ID</Label>
              <CopyableHash hash={conditionId} />
            </div>

            {/* Question ID */}
            <div className="space-y-2">
              <Label className="text-text-secondary text-sm">Question ID</Label>
              <CopyableHash hash={questionId} />
            </div>

            {/* Transaction Hash */}
            {hash && (
              <div className="space-y-2">
                <Label className="text-text-secondary text-sm">Transaction Hash</Label>
                <div className="flex items-center gap-2">
                  <CopyableHash hash={hash} />
                  <a
                    href={`https://sepolia.basescan.org/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )}

            {/* Question Preview */}
            <div className="p-4 bg-background border border-border rounded-lg">
              <p className="text-sm text-text-primary">
                {metadata?.question}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowSuccessModal(false)}
              className="flex-1 bg-background border-border"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                navigate("/create-market");
              }}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Create Market
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gas Estimation Modal */}
      <GasEstimationModal
        open={showGasModal}
        onOpenChange={setShowGasModal}
        gasEstimate={gasEstimate}
        onSubmit={handleConfirmTransaction}
      />
    </div>
  );
}