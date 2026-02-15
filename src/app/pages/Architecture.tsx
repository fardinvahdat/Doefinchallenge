import { ArrowRight, Database, Wallet as WalletIcon, FileCode, Activity, Zap, Radio } from "lucide-react";

export default function Architecture() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Doefin V2 – Web3 Architecture
          </h1>
          <p className="text-text-secondary text-lg max-w-3xl mx-auto">
            Production-grade Web3 integration using wagmi + viem patterns for
            Bitcoin mining difficulty prediction markets on Base Sepolia
          </p>
        </div>

        {/* Architecture Flow */}
        <div className="space-y-8">
          {/* Wallet Connection */}
          <ArchitectureStep
            icon={<WalletIcon className="h-6 w-6" />}
            title="1. Wallet Connection"
            color="primary"
          >
            <div className="space-y-3">
              <CodeBlock>
                <code>useAccount()</code> → Connected address + balance
              </CodeBlock>
              <CodeBlock>
                <code>useSwitchChain()</code> → Enforce Base Sepolia (84532)
              </CodeBlock>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span>Network: Base Sepolia</span>
              </div>
            </div>
          </ArchitectureStep>

          <FlowArrow />

          {/* Create Condition */}
          <ArchitectureStep
            icon={<FileCode className="h-6 w-6" />}
            title="2. Create Condition"
            color="accent"
          >
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-text-primary">
                  Contract Call:
                </p>
                <CodeBlock>
                  <code>
                    ConditionManagerFacet.createConditionWithMetadata()
                  </code>
                </CodeBlock>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <ParamBox label="threshold" value="uint256" />
                  <ParamBox label="blockHeight" value="uint256" />
                  <ParamBox label="metadataURI" value="string" />
                  <ParamBox label="salt" value="bytes32" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-text-primary">
                  Implementation:
                </p>
                <CodeBlock>
                  <code>useWriteContract()</code> → writeContract()
                </CodeBlock>
                <CodeBlock>
                  <code>useWaitForTransactionReceipt()</code> → Wait for
                  confirmation
                </CodeBlock>
              </div>
            </div>
          </ArchitectureStep>

          <FlowArrow />

          {/* Event Listeners */}
          <ArchitectureStep
            icon={<Radio className="h-6 w-6" />}
            title="3. Event Listeners"
            color="success"
          >
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-text-primary">
                  Condition Events:
                </p>
                <EventBox
                  event="ConditionCreated"
                  params="conditionId, creator"
                />
                <EventBox
                  event="QuestionCreated"
                  params="questionId, conditionId"
                />
                <EventBox
                  event="DifficultyThresholdQuestionCreated"
                  params="questionId, threshold, blockHeight"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-text-primary">
                  Implementation:
                </p>
                <CodeBlock>
                  <code>useWatchContractEvent()</code> → Real-time event
                  streaming
                </CodeBlock>
                <CodeBlock>
                  <code>useContractRead()</code> → Fetch historical events
                </CodeBlock>
              </div>
            </div>
          </ArchitectureStep>

          <FlowArrow />

          {/* Split Position */}
          <ArchitectureStep
            icon={<Zap className="h-6 w-6" />}
            title="4. Split Position (Market Creation)"
            color="primary"
          >
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-text-primary">
                  Approval Flow:
                </p>
                <CodeBlock>
                  <code>useReadContract()</code> → Check allowance (mBTC/mUSDC)
                </CodeBlock>
                <CodeBlock>
                  <code>useWriteContract()</code> → ERC20.approve() if needed
                </CodeBlock>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span>
                    mBTC: 0x...{" "}
                    <span className="font-mono">mock_address_here</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span>
                    mUSDC: 0x...{" "}
                    <span className="font-mono">mock_address_here</span>
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-text-primary">
                  Split Position:
                </p>
                <CodeBlock>
                  <code>ConditionalTokensFacet.splitPosition()</code>
                </CodeBlock>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <ParamBox label="collateralToken" value="address" />
                  <ParamBox label="conditionId" value="bytes32" />
                  <ParamBox label="amount" value="uint256" />
                </div>
              </div>
            </div>
          </ArchitectureStep>

          <FlowArrow />

          {/* Position Events */}
          <ArchitectureStep
            icon={<Activity className="h-6 w-6" />}
            title="5. Position Events"
            color="success"
          >
            <div className="space-y-3">
              <EventBox event="PositionSplit" params="owner, conditionId, amount" />
              <EventBox
                event="PositionPairsRegistered"
                params="conditionId, yesPositionId, noPositionId"
              />
              <EventBox
                event="TransferBatch"
                params="from, to, ids[], values[]"
              />
              <div className="p-3 bg-primary/5 border border-primary/30 rounded-lg">
                <p className="text-xs text-primary font-semibold mb-1">
                  Extract Position IDs
                </p>
                <p className="text-xs text-text-tertiary">
                  Parse PositionPairsRegistered event to get YES/NO token IDs
                </p>
              </div>
            </div>
          </ArchitectureStep>

          <FlowArrow />

          {/* Local Storage */}
          <ArchitectureStep
            icon={<Database className="h-6 w-6" />}
            title="6. Local Event Store → UI Updates"
            color="accent"
          >
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-text-primary">
                  Storage Layer:
                </p>
                <CodeBlock>
                  <code>IndexedDB / localStorage</code> → Persist event history
                </CodeBlock>
                <CodeBlock>
                  <code>React Query</code> → Cache & sync state
                </CodeBlock>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-text-primary">
                  Real-time UI:
                </p>
                <CodeBlock>
                  <code>useQuery()</code> → Markets table auto-updates
                </CodeBlock>
                <CodeBlock>
                  <code>refetchInterval</code> → Poll every 12 seconds
                </CodeBlock>
                <div className="flex items-center gap-2 text-xs text-success">
                  <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  <span>Listening to contract events...</span>
                </div>
              </div>
            </div>
          </ArchitectureStep>
        </div>

        {/* Technical Stack */}
        <div className="mt-12 p-6 bg-surface border border-border rounded-xl">
          <h3 className="text-lg font-semibold mb-4 text-text-primary">
            Technical Stack
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TechBox
              title="Wagmi Hooks"
              items={[
                "useAccount",
                "useSwitchChain",
                "useWriteContract",
                "useReadContract",
                "useWatchContractEvent",
              ]}
            />
            <TechBox
              title="Viem Functions"
              items={[
                "writeContract",
                "readContract",
                "watchContractEvent",
                "waitForTransactionReceipt",
                "parseEventLogs",
              ]}
            />
            <TechBox
              title="Contracts (Base Sepolia)"
              items={[
                "ConditionManagerFacet",
                "ConditionalTokensFacet",
                "mBTC (ERC20)",
                "mUSDC (ERC20)",
                "Event subscriptions",
              ]}
            />
          </div>
        </div>

        {/* Network Info */}
        <div className="mt-8 p-6 bg-elevated border border-border rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-1">
                Network Configuration
              </h4>
              <p className="text-sm text-text-secondary">
                All transactions execute on Base Sepolia testnet
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-lg bg-success/10 border border-success/30">
                <p className="text-xs text-text-secondary mb-0.5">Chain ID</p>
                <p className="text-sm font-mono font-semibold text-success">
                  84532
                </p>
              </div>
              <a
                href="https://sepolia.basescan.org"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                View on Basescan →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components

function ArchitectureStep({
  icon,
  title,
  color,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  color: "primary" | "accent" | "success";
  children: React.ReactNode;
}) {
  const colorClasses = {
    primary: "bg-primary/10 border-primary/30 text-primary",
    accent: "bg-accent/10 border-accent/30 text-accent",
    success: "bg-success/10 border-success/30 text-success",
  };

  return (
    <div className="relative">
      <div className="absolute -left-3 top-0 w-1 h-full bg-gradient-to-b from-primary via-accent to-success opacity-30 rounded-full" />
      <div className="pl-8">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
          <h2 className="text-xl font-bold text-text-primary">{title}</h2>
        </div>
        <div className="bg-surface border border-border rounded-xl p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex items-center justify-center py-2">
      <div className="flex flex-col items-center gap-1">
        <ArrowRight className="h-6 w-6 text-primary rotate-90 animate-pulse" />
        <div className="h-4 w-px bg-gradient-to-b from-primary to-transparent" />
      </div>
    </div>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-2 bg-background border border-border/50 rounded-lg font-mono text-xs text-text-primary">
      {children}
    </div>
  );
}

function ParamBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2 py-1.5 bg-elevated border border-border rounded">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="text-xs font-mono text-accent">{value}</p>
    </div>
  );
}

function EventBox({ event, params }: { event: string; params: string }) {
  return (
    <div className="px-3 py-2 bg-success/5 border border-success/20 rounded-lg">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
        <code className="text-xs font-mono font-semibold text-success">
          {event}
        </code>
      </div>
      <p className="text-xs text-text-tertiary font-mono ml-3.5">{params}</p>
    </div>
  );
}

function TechBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="p-4 bg-elevated border border-border rounded-lg">
      <h4 className="text-sm font-semibold text-text-primary mb-3">{title}</h4>
      <ul className="space-y-1.5">
        {items.map((item, idx) => (
          <li
            key={idx}
            className="text-xs text-text-secondary flex items-center gap-2"
          >
            <div className="h-1 w-1 rounded-full bg-primary" />
            <code className="font-mono">{item}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}
