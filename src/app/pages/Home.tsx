import { Button } from "../components/ui/button";
import { ArrowRight, TrendingUp, Shield, Zap, BarChart3 } from "lucide-react";
import { Link } from "react-router";
import { useConditions } from "../../hooks/useConditions";

export default function Home() {
  const { totalCount, isLoading } = useConditions("all");

  return (
    <div className="container mx-auto px-4 lg:px-8">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-12">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-elevated border border-border animate-in fade-in slide-in-from-bottom-3 duration-700">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse mr-2" />
            <span className="text-sm font-medium text-text-secondary">
              Live on Base Sepolia Testnet
            </span>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
              Bitcoin Difficulty
            </span>
            <br />
            Prediction Markets
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-text-secondary max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
            Hedge mining risk with institutional-grade binary markets on Bitcoin
            difficulty thresholds
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto py-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary">
                {isLoading ? "..." : totalCount}
              </div>
              <div className="text-xs md:text-sm text-text-tertiary">Conditions</div>
            </div>
            <div className="text-center border-x border-border">
              <div className="text-2xl md:text-3xl font-bold text-accent">2</div>
              <div className="text-xs md:text-sm text-text-tertiary">Collaterals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-success">100%</div>
              <div className="text-xs md:text-sm text-text-tertiary">On-Chain</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-7 duration-700 delay-400">
            <Link to="/create-condition">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:scale-105 active:scale-95"
              >
                Create Condition
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
                Browse Markets
              </Button>
            </Link>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 max-w-5xl mx-auto">
            <div className="p-6 rounded-xl bg-surface border border-border hover:border-primary/50 transition-all group animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Binary Outcomes</h3>
              <p className="text-text-secondary text-sm">
                Simple YES/NO positions on Bitcoin mining difficulty thresholds
              </p>
            </div>

            <div className="p-6 rounded-xl bg-surface border border-border hover:border-accent/50 transition-all group animate-in fade-in slide-in-from-bottom-9 duration-700 delay-600">
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Trustless Settlement</h3>
              <p className="text-text-secondary text-sm">
                Automated resolution based on actual Bitcoin block data
              </p>
            </div>

            <div className="p-6 rounded-xl bg-surface border border-border hover:border-success/50 transition-all group animate-in fade-in slide-in-from-bottom-10 duration-700 delay-700">
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6 text-success" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Instant Liquidity</h3>
              <p className="text-text-secondary text-sm">
                Split positions into tradeable YES/NO tokens instantly
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
