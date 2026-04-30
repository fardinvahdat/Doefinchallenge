import { useEffect } from "react";
import { Button } from "../components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "../components/ui/tooltip";
import {
  ArrowRight,
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  Plus,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router";
import { useConditions } from "../../hooks/useConditions";
import { useBitcoinDifficulty } from "../../hooks/useBitcoinDifficulty";
import { useBitcoinBlockHeight } from "../../hooks/useBitcoinBlockHeight";

export default function Home() {
  useEffect(() => { document.title = "Doefin — Bitcoin Difficulty Prediction Markets"; }, []);

  const { totalCount, isLoading } = useConditions("all");
  const { formatted: difficultyFormatted } = useBitcoinDifficulty();
  const { height: bitcoinBlockHeight, loading: blockLoading } = useBitcoinBlockHeight();

  return (
    <div className="container mx-auto px-4 lg:px-8">
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-7rem)] py-16">
        <div className="text-center max-w-4xl mx-auto w-full space-y-6">
          {/* Live badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-elevated border border-border animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse mr-2" />
            <span className="text-sm font-medium text-text-secondary">
              Live on Base Sepolia Testnet
            </span>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[50ms]">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
              Bitcoin Difficulty
            </span>
            <br />
            Prediction Markets
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-text-secondary max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-500 delay-[100ms]">
            Bet on whether Bitcoin mining gets harder or easier — and earn
            rewards if you're right. All automated, transparent, and on-chain.
          </p>

          {/* Stats bar */}
          <div
            className="grid grid-cols-3 gap-4 max-w-2xl mx-auto py-4 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-[150ms]"
            aria-label="Platform statistics"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center cursor-help">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary tabular-nums">
                    {isLoading ? "…" : totalCount}
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
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-accent">
                    2
                  </div>
                  <div className="text-xs md:text-sm text-text-tertiary underline decoration-dashed">
                    Currencies
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Use mBTC or mUSDC to participate — both are free test tokens
                </p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center cursor-help">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-success">
                    100%
                  </div>
                  <div className="text-xs md:text-sm text-text-tertiary underline decoration-dashed">
                    Trustless
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  No middleman — winners are paid automatically by smart
                  contracts
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Live Bitcoin data strip */}
          {(difficultyFormatted ||
            (bitcoinBlockHeight > 0 && !blockLoading)) && (
            <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-4 px-5 py-2.5 rounded-full bg-elevated/60 border border-border/60 text-xs animate-in fade-in duration-700 delay-[180ms]">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-text-tertiary uppercase tracking-wider font-semibold">
                  Live
                </span>
              </span>
              {difficultyFormatted && (
                <>
                  <span className="h-3 w-px bg-border hidden xs:block" />
                  <span className="text-text-tertiary hidden xs:inline">
                    Difficulty
                  </span>
                  <span className="font-mono font-semibold text-accent">
                    {difficultyFormatted}
                  </span>
                </>
              )}
              {bitcoinBlockHeight > 0 && (
                <>
                  <span className="h-3 w-px bg-border hidden sm:block" />
                  <span className="text-text-tertiary hidden sm:inline">
                    Block
                  </span>
                  <span className="font-mono font-semibold text-text-primary">
                    #{bitcoinBlockHeight.toLocaleString()}
                  </span>
                </>
              )}
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-7 duration-500 delay-[200ms]">
            <Link to="/create-condition">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto px-8 py-6 text-lg transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:scale-105 active:scale-95"
              >
                Make a Prediction
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/markets">
              <Button
                size="lg"
                variant="outline"
                className="bg-elevated hover:bg-elevated/80 border-border w-full sm:w-auto px-8 py-6 text-lg transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.18)] hover:scale-105 active:scale-95"
              >
                <BarChart3 className="mr-2 h-5 w-5" />
                Browse Predictions
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section
        aria-labelledby="how-it-works-heading"
        className="py-20 max-w-4xl mx-auto"
      >
        <h2
          id="how-it-works-heading"
          className="text-2xl md:text-3xl font-bold text-center mb-12"
        >
          How It Works
        </h2>

        <div className="flex flex-col sm:flex-row items-stretch gap-4">
          {/* Step 1 */}
          <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left p-6 rounded-xl bg-surface border border-border">
            <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center mb-4 text-primary font-bold text-lg flex-shrink-0">
              1
            </div>
            <h4 className="font-semibold mb-2">Connect your wallet</h4>
            <p className="text-sm text-text-secondary">
              Click "Connect Wallet" in the top right. It's free — use a test
              wallet for this demo.
            </p>
          </div>

          {/* Connector arrow (desktop only) */}
          <div className="hidden sm:flex items-center justify-center px-1 flex-shrink-0">
            <ChevronRight className="h-5 w-5 text-text-tertiary" />
          </div>

          {/* Step 2 */}
          <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left p-6 rounded-xl bg-surface border border-border">
            <div className="h-10 w-10 rounded-full bg-accent/20 border border-accent/50 flex items-center justify-center mb-4 text-accent font-bold text-lg flex-shrink-0">
              2
            </div>
            <h4 className="font-semibold mb-2">Pick a prediction</h4>
            <p className="text-sm text-text-secondary">
              Browse open markets and choose YES (difficulty rises) or NO
              (difficulty stays low).
            </p>
          </div>

          {/* Connector arrow (desktop only) */}
          <div className="hidden sm:flex items-center justify-center px-1 flex-shrink-0">
            <ChevronRight className="h-5 w-5 text-text-tertiary" />
          </div>

          {/* Step 3 */}
          <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left p-6 rounded-xl bg-surface border border-border">
            <div className="h-10 w-10 rounded-full bg-success/20 border border-success/50 flex items-center justify-center mb-4 text-success font-bold text-lg flex-shrink-0">
              3
            </div>
            <h4 className="font-semibold mb-2">Collect winnings</h4>
            <p className="text-sm text-text-secondary">
              When the target Bitcoin block is mined, the smart contract reads
              the result and pays you automatically.
            </p>
          </div>
        </div>
      </section>

      {/* ── Feature Cards ──────────────────────────────────────────────── */}
      <section
        aria-labelledby="features-heading"
        className="pb-16 max-w-5xl mx-auto"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-surface border border-border hover:border-primary/50 transition-all group animate-in fade-in slide-in-from-bottom-8 duration-500 delay-[250ms]">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Pick YES or NO</h3>
            <p className="text-text-secondary text-sm">
              Predict whether Bitcoin mining difficulty will be above or below a
              target level at a specific future date.
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

          <div className="p-6 rounded-xl bg-surface border border-border hover:border-success/50 transition-all group animate-in fade-in slide-in-from-bottom-10 duration-500 delay-[350ms] sm:col-span-2 md:col-span-1">
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
      </section>

      {/* ── Quick Access Widget Cards ──────────────────────────────────── */}
      <section
        aria-labelledby="quick-access-heading"
        className="py-16 max-w-5xl mx-auto border-t border-border"
      >
        <div className="text-center mb-10">
          <h2 id="quick-access-heading" className="text-2xl font-bold mb-2">
            Ready to start?
          </h2>
          <p className="text-text-secondary">
            Jump into any section of the app
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Create Prediction widget */}
          <Link to="/create-condition" className="group block">
            <div className="h-full p-6 rounded-2xl bg-surface border border-border hover:border-primary/40 transition-all duration-200 hover:shadow-[0_8px_32px_rgba(99,102,241,0.12)] group-hover:-translate-y-0.5">
              <div className="flex items-start justify-between mb-5">
                <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <ArrowRight className="h-4 w-4 text-text-tertiary group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 mt-1" />
              </div>
              <h3 className="font-semibold text-text-primary mb-1.5">
                Create Prediction
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Set a difficulty threshold and a target Bitcoin block height.
                Anyone can participate in your market.
              </p>
              <div className="mt-4 pt-4 border-t border-border">
                <span className="text-xs text-primary font-medium">
                  For creators
                </span>
              </div>
            </div>
          </Link>

          {/* Browse Markets widget */}
          <Link to="/markets" className="group block">
            <div className="h-full p-6 rounded-2xl bg-surface border border-border hover:border-accent/40 transition-all duration-200 hover:shadow-[0_8px_32px_rgba(245,158,11,0.10)] group-hover:-translate-y-0.5">
              <div className="flex items-start justify-between mb-5">
                <div className="h-12 w-12 rounded-xl bg-accent/15 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <BarChart3 className="h-5 w-5 text-accent" />
                </div>
                <ArrowRight className="h-4 w-4 text-text-tertiary group-hover:text-accent group-hover:translate-x-1 transition-all duration-200 mt-1" />
              </div>
              <h3 className="font-semibold text-text-primary mb-1.5">
                Browse Markets
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Explore all active difficulty predictions. Filter by status,
                search by question, and participate with one click.
              </p>
              <div className="mt-4 pt-4 border-t border-border">
                <span className="text-xs text-accent font-medium">
                  {isLoading
                    ? "Loading…"
                    : `${totalCount} market${totalCount !== 1 ? "s" : ""} available`}
                </span>
              </div>
            </div>
          </Link>

          {/* Get YES/NO Tokens widget */}
          <Link to="/create-market" className="group block">
            <div className="h-full p-6 rounded-2xl bg-surface border border-border hover:border-success/40 transition-all duration-200 hover:shadow-[0_8px_32px_rgba(52,211,153,0.10)] group-hover:-translate-y-0.5">
              <div className="flex items-start justify-between mb-5">
                <div className="h-12 w-12 rounded-xl bg-success/15 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Layers className="h-5 w-5 text-success" />
                </div>
                <ArrowRight className="h-4 w-4 text-text-tertiary group-hover:text-success group-hover:translate-x-1 transition-all duration-200 mt-1" />
              </div>
              <h3 className="font-semibold text-text-primary mb-1.5">
                Get YES/NO Tokens
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Put in test tokens and receive equal YES + NO positions. Trade
                or hold until the result is known.
              </p>
              <div className="mt-4 pt-4 border-t border-border">
                <span className="text-xs text-success font-medium">
                  For traders
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
