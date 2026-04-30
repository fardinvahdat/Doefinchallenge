import { useEffect } from "react";
import { Button } from "../components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "../components/ui/tooltip";
import { ArrowRight, TrendingUp, Shield, Zap, BarChart3 } from "lucide-react";
import { Link } from "react-router";
import { useConditions } from "../../hooks/useConditions";

export default function Home() {
  useEffect(() => { document.title = "Doefin — Bitcoin Difficulty Prediction Markets"; }, []);
  const { totalCount, isLoading } = useConditions("all");

  return (
    <div className="container mx-auto px-4 lg:px-8">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] py-12">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-elevated border border-border animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse mr-2" />
            <span className="text-sm font-medium text-text-secondary">
              Live on Base Sepolia Testnet
            </span>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight animate-in fade-in slide-in-from-bottom-4 duration-500 delay-50">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
              Bitcoin Difficulty
            </span>
            <br />
            Prediction Markets
          </h1>

          {/* Subtitle — plain language */}
          <p className="text-xl md:text-2xl text-text-secondary max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-500 delay-100">
            Bet on whether Bitcoin mining gets harder or easier — and earn
            rewards if you're right. All automated, transparent, and on-chain.
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto py-6 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-150">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center cursor-help">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
                    {isLoading ? "..." : totalCount}
                  </div>
                  <div className="text-xs md:text-sm text-text-tertiary underline decoration-dashed">
                    Active Markets
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Prediction markets you can participate in right now</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center border-x border-border cursor-help">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-accent">2</div>
                  <div className="text-xs md:text-sm text-text-tertiary underline decoration-dashed">
                    Currencies
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Use mBTC or mUSDC to participate — both are free test tokens</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center cursor-help">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-success">100%</div>
                  <div className="text-xs md:text-sm text-text-tertiary underline decoration-dashed">
                    Trustless
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>No middleman — winners are paid automatically by smart contracts</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-7 duration-500 delay-200">
            <Link to="/create-condition">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:scale-105 active:scale-95"
              >
                Make a Prediction
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/markets">
              <Button
                size="lg"
                variant="outline"
                className="bg-elevated hover:bg-elevated/80 border-border px-8 py-6 text-lg transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]"
              >
                <BarChart3 className="mr-2 h-5 w-5" />
                Browse Predictions
              </Button>
            </Link>
          </div>

          {/* How It Works */}
          <div className="pt-16 max-w-3xl mx-auto w-full">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
              How It Works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left relative">
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left p-6 rounded-xl bg-surface border border-border relative">
                <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center mb-4 text-primary font-bold text-lg">
                  1
                </div>
                <h4 className="font-semibold mb-2">Connect your wallet</h4>
                <p className="text-sm text-text-secondary">
                  Click "Connect Wallet" in the top right. It's free — use a test wallet for this demo.
                </p>
              </div>

              <div className="flex flex-col items-center sm:items-start text-center sm:text-left p-6 rounded-xl bg-surface border border-border">
                <div className="h-10 w-10 rounded-full bg-accent/20 border border-accent/50 flex items-center justify-center mb-4 text-accent font-bold text-lg">
                  2
                </div>
                <h4 className="font-semibold mb-2">Pick a prediction</h4>
                <p className="text-sm text-text-secondary">
                  Browse open markets and choose YES (difficulty rises) or NO (difficulty stays low).
                </p>
              </div>

              <div className="flex flex-col items-center sm:items-start text-center sm:text-left p-6 rounded-xl bg-surface border border-border">
                <div className="h-10 w-10 rounded-full bg-success/20 border border-success/50 flex items-center justify-center mb-4 text-success font-bold text-lg">
                  3
                </div>
                <h4 className="font-semibold mb-2">Collect winnings</h4>
                <p className="text-sm text-text-secondary">
                  When the target Bitcoin block is mined, the smart contract reads the result and pays you automatically.
                </p>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-16 max-w-5xl mx-auto">
            <div className="p-6 rounded-xl bg-surface border border-border hover:border-primary/50 transition-all group animate-in fade-in slide-in-from-bottom-8 duration-500 delay-[250ms]">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Pick YES or NO</h3>
              <p className="text-text-secondary text-sm">
                Predict whether Bitcoin mining difficulty will be above or below
                a target level at a specific future date.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-surface border border-border hover:border-accent/50 transition-all group animate-in fade-in slide-in-from-bottom-9 duration-500 delay-[300ms]">
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Paid Automatically</h3>
              <p className="text-text-secondary text-sm">
                Smart contracts read the actual Bitcoin data and pay winners
                automatically — no human needed.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-surface border border-border hover:border-success/50 transition-all group animate-in fade-in slide-in-from-bottom-10 duration-500 delay-[350ms]">
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200">
                <Zap className="h-6 w-6 text-success" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Trade Your Position</h3>
              <p className="text-text-secondary text-sm">
                Your YES and NO tokens can be traded or sold to others who
                disagree with your prediction.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
