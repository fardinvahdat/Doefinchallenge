import { AlertTriangle, CheckCircle2, XCircle, TrendingUp, TrendingDown, Minus, Eye, ArrowRight } from "lucide-react";

interface StrikePreviewProps {
  thresholdT: number | null;
  blockHeight: number | null;
  currentDifficulty: number;
  currentBtcBlock: number;
}

// ── Formatting helpers ──────────────────────────────────────────────────────

function fmtT(t: number): string {
  return t.toFixed(2) + "T";
}

/** Human-readable magnitude label for very large T values */
function magnitudeLabel(t: number): string {
  if (t >= 1_000_000) return `${(t / 1_000_000).toFixed(2)} ×10⁶ T`;
  if (t >= 1_000) return `${(t / 1_000).toFixed(2)} ×10³ T`;
  return fmtT(t);
}

/** Spell out the integer part in plain English for cognitive cross-check */
function spellMagnitude(t: number): string {
  if (t >= 1_000_000) return `${(t / 1_000_000).toFixed(1)} million T`;
  if (t >= 100_000) return `${Math.round(t / 1_000)} thousand T`;
  if (t >= 1_000) return `${(t / 1_000).toFixed(1)} thousand T`;
  if (t >= 100) return `${Math.round(t)} T`;
  return `${t.toFixed(2)} T`;
}

/** Safe bigint raw value — mirrors parseTToRaw in CreateCondition */
function rawValue(t: number): string {
  const s = t.toFixed(12);
  const [i, f = ""] = s.split(".");
  const padded = f.padEnd(12, "0").slice(0, 12);
  return (BigInt(i) * 1_000_000_000_000n + BigInt(padded)).toLocaleString();
}

function pctDiff(a: number, b: number): number | null {
  if (b === 0) return null;
  return ((a - b) / b) * 100;
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-text-tertiary mb-3">
      {children}
    </p>
  );
}

/** Exact replica of the ConditionCard from Markets.tsx */
function MarketCardPreview({
  thresholdT,
  blockHeight,
  estDate,
}: {
  thresholdT: number;
  blockHeight: number | null;
  estDate: Date | null;
}) {
  const question = `Will Bitcoin difficulty exceed ${fmtT(thresholdT)} at block ${blockHeight !== null ? blockHeight.toLocaleString() : "—"}?`;

  return (
    <div className="rounded-xl border border-border bg-elevated p-4 space-y-3 font-[inherit]">
      {/* Header row — mirrors CardHeader */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-text-primary leading-snug flex-1">
          {question}
        </p>
        <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
          Preview
        </span>
      </div>

      {/* Badges — mirrors the parsed badge row */}
      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex items-center px-2 py-0.5 rounded border border-border text-xs text-text-secondary font-mono bg-surface">
          {fmtT(thresholdT)} threshold
        </span>
        {blockHeight !== null && (
          <span className="inline-flex items-center px-2 py-0.5 rounded border border-border text-xs text-text-secondary font-mono bg-surface">
            Block {blockHeight.toLocaleString()}
          </span>
        )}
        {estDate && (
          <span className="inline-flex items-center px-2 py-0.5 rounded border border-success/30 bg-success/8 text-xs text-success">
            ≈ {estDate.toLocaleDateString(undefined, { month: "short", year: "numeric" })}
          </span>
        )}
      </div>

      {/* YES / NO outcome row — mirrors ConditionCard content */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-success/8 border border-success/25">
          <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
          <div>
            <p className="text-[10px] text-text-tertiary">YES pays if</p>
            <p className="text-xs font-semibold text-success">≥ {fmtT(thresholdT)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-danger/8 border border-danger/25">
          <XCircle className="h-3.5 w-3.5 text-danger shrink-0" />
          <div>
            <p className="text-[10px] text-text-tertiary">NO pays if</p>
            <p className="text-xs font-semibold text-danger">&lt; {fmtT(thresholdT)}</p>
          </div>
        </div>
      </div>

      {/* "Participate →" ghost button, matching Markets page */}
      <div className="pt-1 border-t border-border/60">
        <div className="flex items-center justify-center gap-1 py-1.5 text-xs text-text-tertiary">
          <span>Participate button will appear here once created</span>
          <ArrowRight className="h-3 w-3" />
        </div>
      </div>
    </div>
  );
}

/** Proportional bar row — length encodes value, making scale errors visually obvious */
function ScaleBar({
  label,
  value,
  maxValue,
  variant = "default",
}: {
  label: string;
  value: number;
  maxValue: number;
  variant?: "default" | "primary" | "danger";
}) {
  const pct = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;
  const barColor =
    variant === "primary"
      ? "bg-primary"
      : variant === "danger"
        ? "bg-danger/70"
        : "bg-text-tertiary/35";
  const textColor =
    variant === "primary"
      ? "text-primary"
      : variant === "danger"
        ? "text-danger"
        : "text-text-secondary";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className={`text-xs font-mono font-semibold tabular-nums ${textColor}`}>
          {fmtT(value)}
        </span>
      </div>
      <div className="h-2.5 bg-elevated rounded-full overflow-hidden border border-border/40">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${Math.max(pct, 0.6)}%` }}
        />
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function StrikePreview({
  thresholdT,
  blockHeight,
  currentDifficulty,
  currentBtcBlock,
}: StrikePreviewProps) {
  const currentT = currentDifficulty > 0 ? currentDifficulty / 1e12 : null;

  // Magnitude analysis
  const ratio = thresholdT !== null && currentT !== null ? thresholdT / currentT : null;
  const isExtraZeros = ratio !== null && ratio > 10;
  const isTooLow = thresholdT !== null && currentT !== null && thresholdT < currentT * 0.05;
  const isAlreadyAbove = thresholdT !== null && currentT !== null && thresholdT <= currentT;
  const blockAlreadyPast = blockHeight !== null && currentBtcBlock > 0 && blockHeight <= currentBtcBlock;

  // "Did you mean?" — suggest dividing by 1 000 / 1 000 000 when appropriate
  const suggestedFix: number | null = (() => {
    if (!isExtraZeros || thresholdT === null || currentT === null) return null;
    for (const divisor of [1_000_000, 1_000, 100]) {
      const candidate = thresholdT / divisor;
      if (candidate > currentT * 0.3 && candidate < currentT * 30) {
        return candidate;
      }
    }
    return null;
  })();

  // Block estimate
  const estDate =
    blockHeight !== null && currentBtcBlock > 0 && blockHeight > currentBtcBlock
      ? new Date(Date.now() + (blockHeight - currentBtcBlock) * 10 * 60 * 1_000)
      : null;

  const diff = thresholdT !== null && currentT !== null ? pctDiff(thresholdT, currentT) : null;
  const DeltaIcon = diff !== null ? (diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus) : null;
  const deltaColor = diff !== null ? (diff > 0 ? "text-success" : diff < 0 ? "text-danger" : "text-text-tertiary") : "";

  const hasContent = thresholdT !== null || blockHeight !== null;

  return (
    <div className="space-y-4 lg:sticky lg:top-24">

      {/* Panel header */}
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 text-text-tertiary" />
        <h3 className="text-sm font-semibold text-text-secondary tracking-wide">Live Preview</h3>
      </div>

      {!hasContent ? (
        <div className="bg-surface border border-dashed border-border rounded-xl p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-elevated flex items-center justify-center mx-auto mb-4">
            <Eye className="h-5 w-5 text-text-tertiary" />
          </div>
          <p className="text-sm text-text-secondary font-medium mb-1">Fill in the form to preview</p>
          <p className="text-xs text-text-tertiary">
            Live scale comparison will warn you if numbers look unusual
          </p>
        </div>
      ) : (
        <div className="space-y-4">

          {/* ── Panel 1: Markets page card preview ── */}
          {thresholdT !== null && (
            <div className="bg-surface border border-border rounded-xl p-4">
              <SectionLabel>How it will look on /markets</SectionLabel>
              <MarketCardPreview
                thresholdT={thresholdT}
                blockHeight={blockHeight}
                estDate={estDate}
              />
            </div>
          )}

          {/* ── Panel 2: Scale sanity checker ── */}
          {thresholdT !== null && currentT !== null && (
            <div
              className={`rounded-xl border p-4 space-y-4 transition-colors ${
                isExtraZeros
                  ? "bg-danger/5 border-danger/40"
                  : "bg-surface border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <SectionLabel>
                  {isExtraZeros ? "⚠ Scale alarm — check your number" : "Difficulty scale check"}
                </SectionLabel>
                {diff !== null && DeltaIcon && !isExtraZeros && (
                  <span className={`text-xs font-mono font-semibold tabular-nums ${deltaColor} flex items-center gap-1`}>
                    <DeltaIcon className="h-3 w-3" />
                    {diff >= 0 ? "+" : ""}{diff.toFixed(1)}%
                  </span>
                )}
              </div>

              {/* Bars — proportional scale makes extra zeros visually obvious */}
              {(() => {
                // When ratio is extreme, use logarithmic-ish scale so both bars are visible
                const maxVal = isExtraZeros
                  ? thresholdT // strike fills full width, current is a sliver
                  : Math.max(thresholdT, currentT) * 1.25;

                return (
                  <div className="space-y-3">
                    <ScaleBar
                      label="Current difficulty"
                      value={currentT}
                      maxValue={maxVal}
                      variant="default"
                    />
                    <ScaleBar
                      label={isExtraZeros ? "Your strike ← suspiciously high" : "Your strike"}
                      value={thresholdT}
                      maxValue={maxVal}
                      variant={isExtraZeros ? "danger" : "primary"}
                    />
                  </div>
                );
              })()}

              {/* Plain-language magnitude — the "cognitive check" */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
                <div className="text-center p-2 rounded-lg bg-elevated">
                  <p className="text-[10px] text-text-tertiary mb-1">Current is</p>
                  <p className="text-xs font-mono font-semibold text-text-secondary tabular-nums">
                    {spellMagnitude(currentT)}
                  </p>
                </div>
                <div className={`text-center p-2 rounded-lg ${isExtraZeros ? "bg-danger/10" : "bg-primary/8"}`}>
                  <p className="text-[10px] text-text-tertiary mb-1">Your strike is</p>
                  <p className={`text-xs font-mono font-semibold tabular-nums ${isExtraZeros ? "text-danger" : "text-primary"}`}>
                    {spellMagnitude(thresholdT)}
                  </p>
                </div>
              </div>

              {/* Extra zeros alarm with fix suggestion */}
              {isExtraZeros && ratio !== null && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-danger/10 border border-danger/30">
                    <AlertTriangle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-danger">
                        {ratio >= 1_000_000
                          ? `${(ratio / 1_000_000).toFixed(1)} million× higher than current`
                          : ratio >= 1_000
                            ? `${(ratio / 1_000).toFixed(1)}K× higher than current`
                            : `${ratio.toFixed(0)}× higher than current`}
                      </p>
                      <p className="text-xs text-text-secondary">
                        Did you accidentally add extra zeros?
                      </p>
                    </div>
                  </div>

                  {suggestedFix !== null && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/25">
                      <div className="flex-1">
                        <p className="text-[10px] text-text-tertiary uppercase tracking-wide mb-0.5">Did you mean?</p>
                        <p className="text-sm font-mono font-bold text-primary tabular-nums">
                          {fmtT(suggestedFix)}
                        </p>
                        <p className="text-[10px] text-text-tertiary mt-0.5">
                          ({spellMagnitude(suggestedFix)} — that's {(suggestedFix / currentT * 100).toFixed(0)}% of current)
                        </p>
                      </div>
                      <div className="text-xs text-text-tertiary text-right">
                        <p>Go back to</p>
                        <p>Step 1 to fix</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Too-low warning */}
              {isTooLow && !isExtraZeros && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/8 border border-yellow-500/25">
                  <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-300">
                    {fmtT(thresholdT)} is far below current difficulty — this condition would resolve YES immediately.
                  </p>
                </div>
              )}

              {/* Already-above warning */}
              {isAlreadyAbove && !isExtraZeros && !isTooLow && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/8 border border-yellow-500/25">
                  <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-300">
                    Current difficulty already exceeds this strike — the YES outcome is likely immediately.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Block already past warning ── */}
          {blockAlreadyPast && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/8 border border-yellow-500/25">
              <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-300">
                Block {blockHeight!.toLocaleString()} has already been mined (current:{" "}
                {currentBtcBlock.toLocaleString()}).
              </p>
            </div>
          )}

          {/* ── Raw on-chain value (progressive disclosure) ── */}
          {thresholdT !== null && (
            <details className="group">
              <summary className="flex items-center gap-1.5 text-xs text-text-tertiary cursor-pointer hover:text-text-secondary list-none select-none">
                <span className="group-open:rotate-90 transition-transform inline-block leading-none">›</span>
                Raw on-chain value
              </summary>
              <div className="mt-2 p-3 bg-elevated border border-border rounded-lg space-y-1">
                <p className="text-[10px] text-text-tertiary">
                  This is the exact number stored in the smart contract (threshold × 10¹²)
                </p>
                <p className="text-xs font-mono text-text-primary break-all tabular-nums">
                  {rawValue(thresholdT)}
                </p>
              </div>
            </details>
          )}

        </div>
      )}
    </div>
  );
}
