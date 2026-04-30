import { useSwitchChain } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { AlertTriangle, X, Loader2, ArrowRightLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";

interface NetworkNotificationProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export default function NetworkNotification({
  isVisible,
  onDismiss,
}: NetworkNotificationProps) {
  const { chains, switchChain, isPending } = useSwitchChain();

  if (!isVisible) return null;

  const handleSwitchNetwork = () => {
    switchChain({ chainId: baseSepolia.id });
  };

  // Check if already on the correct chain
  const isCorrectChain = chains.some((chain) => chain.id === baseSepolia.id);

  if (!isCorrectChain) {
    // If baseSepolia is not in the configured chains, we can't switch to it
    return (
      <div className="mb-4 w-full">
        <Alert
          variant="destructive"
          className="border-amber-500/50 bg-amber-500/10"
        >
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-500">Wrong Network</AlertTitle>
          <AlertDescription className="text-text-secondary">
            This application requires Base Sepolia. Please switch to Base
            Sepolia in your wallet.
          </AlertDescription>
          <div className="flex items-center gap-2 mt-4">
            <Button
              onClick={onDismiss}
              variant="outline"
              size="sm"
              className="border-border hover:bg-elevated"
            >
              <X className="h-3 w-3 mr-1" />
              Dismiss
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mb-4 w-full">
      <Alert
        variant="default"
        className="border-amber-500/50 bg-amber-500/10 shadow-lg shadow-amber-500/10"
      >
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <AlertTitle className="text-amber-500 font-semibold">
          Wrong Network Detected
        </AlertTitle>
        <AlertDescription className="text-text-secondary mt-1">
          You are currently connected to the wrong network. Please switch to{" "}
          <span className="text-amber-500 font-medium">Base Sepolia</span> to
          use this application.
        </AlertDescription>
        <div className="flex items-center gap-2 mt-4">
          <Button
            onClick={handleSwitchNetwork}
            size="sm"
            disabled={isPending}
            className="bg-amber-500 hover:bg-amber-600 text-black font-medium"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Switching...
              </>
            ) : (
              <>
                <ArrowRightLeft className="h-3 w-3 mr-1" />
                Switch to Base Sepolia
              </>
            )}
          </Button>
          <Button
            onClick={onDismiss}
            variant="ghost"
            size="sm"
            className="text-text-tertiary hover:text-text-secondary"
          >
            <X className="h-3 w-3 mr-1" />
            Dismiss
          </Button>
        </div>
      </Alert>
    </div>
  );
}
