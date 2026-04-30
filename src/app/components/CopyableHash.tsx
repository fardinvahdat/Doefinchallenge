import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { cn } from "./ui/utils";

interface CopyableHashProps {
  hash: string;
  label?: string;
  variant?: "default" | "success" | "danger" | "primary";
  className?: string;
}

export function CopyableHash({
  hash,
  label,
  variant = "default",
  className,
}: CopyableHashProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const variantClasses = {
    default: "bg-elevated border-border text-text-primary",
    success: "bg-success/10 border-success/30 text-success",
    danger: "bg-danger/10 border-danger/30 text-danger",
    primary: "bg-primary/10 border-primary/30 text-primary",
  };

  const displayValue =
    hash.length > 20
      ? `${hash.slice(0, 10)}...${hash.slice(-8)}`
      : hash;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {label && (
        <span className="text-sm text-text-secondary min-w-[80px]">
          {label}:
        </span>
      )}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border flex-1 min-w-0 ${variantClasses[variant]}`}
      >
        <code className="text-sm font-mono flex-1 truncate">{displayValue}</code>
        <TooltipProvider>
          {/* SC-03: Tooltip shows the full hash, not just "Copy to clipboard" */}
          <Tooltip open={copied ? true : undefined}>
            <TooltipTrigger asChild>
              {/* SC-01: Increased to 40×40px touch target. SC-02: aria-label added */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="h-10 w-10 p-0 flex-shrink-0 hover:bg-background/50"
                aria-label={copied ? "Copied to clipboard" : "Copy hash to clipboard"}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-success" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-mono break-all max-w-xs">
                {copied ? "Copied!" : hash}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
