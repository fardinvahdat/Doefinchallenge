import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface CopyableHashProps {
  hash: string;
  label?: string;
  variant?: "default" | "success" | "danger" | "primary";
}

export function CopyableHash({
  hash,
  label,
  variant = "default",
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

  // Truncate if too long
  const displayValue =
    hash.length > 20
      ? `${hash.slice(0, 10)}...${hash.slice(-8)}`
      : hash;

  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-sm text-text-secondary min-w-[80px]">
          {label}:
        </span>
      )}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border flex-1 ${variantClasses[variant]}`}
      >
        <code className="text-sm font-mono flex-1 truncate">{displayValue}</code>
        <TooltipProvider>
          <Tooltip open={copied ? true : undefined}>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="h-6 w-6 p-0 hover:bg-background/50"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-success" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{copied ? "Copied!" : "Copy to clipboard"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}