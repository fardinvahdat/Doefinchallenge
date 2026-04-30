import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StrikePreviewProps {
  thresholdT: number | null;
  blockHeight: number | null;
  currentDifficulty: number;
  currentBtcBlock: number;
}

function formatT(t: number): string {
  return t.toFixed(2) + "T";
}

function pct(a: number, b: number): string {
  if (b === 0) return "—";
  const diff = ((a - b) / b) * 100;
  const sign = diff >= 0 ? "+" : "";
  return `${sign}${diff.toFixed(2)}%`;
}

export function StrikePreview({
  thresholdT,
  blockHeight,
  currentDifficulty,
  currentBtcBlock,
}: StrikePreviewProps) {
  const currentT = currentDifficulty > 0 ? currentDifficulty / 1e12 : null;

  // Warnings
  const warnings: string[] = [];
  if (thresholdT !== null && currentT !== null) {
    if (thresholdT > currentT * 10) {
      warnings.push(
        `${formatT(thresholdT)} is over 10× the current difficulty (${formatT(currentT)}). Did you add extra zeros?`,
      );
    } else if (thresholdT < currentT * 0.1) {
      warnings.push(
        `${formatT(thresholdT)} is below 10% of the current difficulty (${formatT(currentT)}).`,
      );
    } else if (thresholdT <= currentT) {
      warnings.push(
        `Current difficulty (${formatT(currentT)}) already exceeds this threshold — the condition may resolve YES immediately.`,
      );
    }
  }
  if (
    blockHeight !== null &&
    currentBtcBlock > 0 &&
    blockHeight <= currentBtcBlock
  ) {
    warnings.push(
      `Block ${blockHeight.toLocaleString()} has already passed (current: ${currentBtcBlock.toLocaleString()}).`,
    );
  }

  // Gauge
  let gaugeContent: React.ReactNode = null;
  if (thresholdT !== null && currentT !== null) {
    const max = Math.max(thresholdT, currentT) * 1.3;
    const currentPct = Math.min((currentT / max) * 100, 100);
    const thresholdPct = Math.min((thresholdT / max) * 100, 100);
    const delta = thresholdT - currentT;
    const DeltaIcon =
      delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
    const deltaColor =
      delta > 0
        ? "text-green-400"
        : delta < 0
          ? "text-red-400"
          : "text-text-tertiary";

    gaugeContent = (
      <div className="space-y-3">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 bg-elevated rounded-lg border border-border">
            <p className="text-text-tertiary mb-0.5">Current</p>
            <p className="font-mono font-semibold text-text-primary">
              {formatT(currentT)}
            </p>
          </div>
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/30">
            <p className="text-text-tertiary mb-0.5">Threshold</p>
            <p className="font-mono font-semibold text-primary">
              {formatT(thresholdT)}
            </p>
          </div>
          <div className={`p-2 bg-elevated rounded-lg border border-border flex flex-col items-center justify-center ${deltaColor}`}>
            <DeltaIcon className="h-3 w-3 mb-0.5" />
            <p className="font-mono font-semibold">
              {pct(thresholdT, currentT)}
            </p>
          </div>
        </div>

        {/* Gauge bar */}
        <div className="relative h-6">
          {/* Track */}
          <div className="absolute inset-y-0 left-0 right-0 top-2 h-2 bg-elevated rounded-full border border-border" />
          {/* Current marker */}
          <div
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${currentPct}%` }}
          >
            <div className="w-2 h-2 rounded-full bg-text-tertiary border border-border mt-2" />
          </div>
          {/* Threshold marker */}
          <div
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${thresholdPct}%` }}
          >
            <div className="w-3 h-3 rounded-full bg-primary border-2 border-background mt-1.5" />
          </div>
        </div>

        {/* Gauge labels — offset vertically when markers are too close to avoid overlap (#28) */}
        <div className="relative h-8 text-[10px] text-text-tertiary">
          <span
            className="absolute -translate-x-1/2 whitespace-nowrap"
            style={{
              left: `${currentPct}%`,
              top: Math.abs(currentPct - thresholdPct) < 10 ? "14px" : "0px",
            }}
          >
            Current
          </span>
          <span
            className="absolute -translate-x-1/2 whitespace-nowrap text-primary"
            style={{ left: `${thresholdPct}%`, top: "0px" }}
          >
            Strike
          </span>
        </div>
      </div>
    );
  }

  const hasContent = thresholdT !== null || blockHeight !== null;

  return (
    <div className="bg-surface border border-border rounded-xl p-6 md:p-8 h-fit sticky top-24">
      <h3 className="text-lg font-semibold mb-4">Market Preview</h3>

      {!hasContent ? (
        <div className="text-center py-12">
          <p className="text-text-tertiary text-sm">
            Fill in the form to see a preview
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Question */}
          <div className="p-4 bg-elevated rounded-lg border border-border">
            <p className="text-xs text-text-secondary mb-1">Question</p>
            <p className="text-text-primary font-medium leading-snug">
              Will Bitcoin difficulty exceed{" "}
              <span className="text-primary font-semibold">
                {thresholdT !== null ? formatT(thresholdT) : "—"}
              </span>{" "}
              at block{" "}
              <span className="text-primary font-semibold">
                {blockHeight !== null
                  ? blockHeight.toLocaleString()
                  : "—"}
              </span>
              ?
            </p>
          </div>

          {/* Outcomes */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-xs text-text-secondary mb-1">YES — if difficulty</p>
              <p className="text-sm font-semibold text-green-400">
                ≥ {thresholdT !== null ? formatT(thresholdT) : "—"}
              </p>
            </div>
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-xs text-text-secondary mb-1">NO — if difficulty</p>
              <p className="text-sm font-semibold text-red-400">
                &lt; {thresholdT !== null ? formatT(thresholdT) : "—"}
              </p>
            </div>
          </div>

          {/* Gauge */}
          {gaugeContent && (
            <div className="p-4 bg-elevated rounded-lg border border-border">
              <p className="text-xs text-text-secondary mb-3">
                Difficulty gauge
              </p>
              {gaugeContent}
            </div>
          )}

          {/* Raw value — string-based conversion to avoid IEEE 754 precision loss */}
          {thresholdT !== null && (
            <div className="p-3 bg-elevated rounded-lg border border-border">
              <p className="text-xs text-text-secondary mb-1">
                Raw on-chain value
              </p>
              <p className="text-xs font-mono text-text-primary">
                {(() => {
                  const s = thresholdT.toFixed(12);
                  const [i, f = ""] = s.split(".");
                  const padded = f.padEnd(12, "0").slice(0, 12);
                  return (BigInt(i) * 1_000_000_000_000n + BigInt(padded)).toLocaleString();
                })()}
              </p>
            </div>
          )}

          {/* Warnings */}
          {warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
            >
              <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-300">{w}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
