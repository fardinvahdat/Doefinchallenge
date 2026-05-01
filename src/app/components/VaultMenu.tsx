import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, ArrowDownToLine, ArrowUpFromLine, Vault, Info } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useAccount, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits, parseUnits, type Hex } from "viem";
import { useScw } from "../../hooks/useScw";
import { useScwBalances } from "../../hooks/useScwBalances";
import { useDeposit } from "../../hooks/useDeposit";
import { useWithdraw } from "../../hooks/useWithdraw";
import { useTokens, type ApiToken } from "../../hooks/useTokens";
import { ERC20_ABI } from "../../config/contracts";
import { friendlyError } from "../../utils/friendlyError";
import { CopyableHash } from "./CopyableHash";

type Tab = "deposit" | "withdraw";
const TX_TIMEOUT_MS = 60_000;

// ── Skeleton pulse ────────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-elevated ${className}`} />;
}

// ── Vault button + dialog shell ───────────────────────────────────────────────
export function VaultMenu() {
  const [open, setOpen] = useState(false);
  const { address, isConnected } = useAccount();
  const { data: scwInfo } = useScw();

  if (!isConnected) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-1.5 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary !h-[stretch]"
        onClick={() => setOpen(true)}
      >
        <Vault className="h-3.5 w-3.5" />
        Vault
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-elevated border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-text-primary">
              Safe Wallet Vault
            </DialogTitle>
          </DialogHeader>
          <VaultContent
            eoa={address}
            scwAddress={scwInfo?.scw}
            onClose={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Modal body ────────────────────────────────────────────────────────────────
function VaultContent({
  eoa,
  scwAddress,
  onClose,
}: {
  eoa: `0x${string}` | undefined;
  scwAddress: `0x${string}` | undefined;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("deposit");
  const [txInFlight, setTxInFlight] = useState(false);
  const [eoaRefreshing, setEoaRefreshing] = useState(false);
  const [scwRefreshing, setScwRefreshing] = useState(false);
  const successCalledRef = useRef(false);
  const eoaSnapshotRef = useRef<bigint | undefined>(undefined);
  const { tokens, isLoading: tokensLoading } = useTokens();
  const [selectedToken, setSelectedToken] = useState<ApiToken | null>(null);
  const scwBalances = useScwBalances();

  // EOA balance lifted here so BalancesRow and DepositPanel share the same data + refetch
  const { data: eoaRaw, refetch: refetchEoa } = useReadContract({
    address: selectedToken?.address,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: eoa ? [eoa] : undefined,
    query: { enabled: !!eoa && !!selectedToken, staleTime: 0 },
  });
  const eoaBalance = eoaRaw as bigint | undefined;

  // Snapshot pre-tx balance so we can detect when it actually changes
  useEffect(() => {
    if (txInFlight) eoaSnapshotRef.current = eoaBalance;
  }, [txInFlight]);

  // Poll refetchEoa every 2s while skeleton is active; clear when balance changes
  useEffect(() => {
    if (!eoaRefreshing) return;
    const poll = setInterval(() => { refetchEoa(); }, 2000);
    const fallback = setTimeout(() => setEoaRefreshing(false), 15_000);
    return () => { clearInterval(poll); clearTimeout(fallback); };
  }, [eoaRefreshing, refetchEoa]);

  // Detect the moment eoaBalance actually differs from the snapshot
  useEffect(() => {
    if (!eoaRefreshing) return;
    if (eoaBalance !== undefined && eoaBalance !== eoaSnapshotRef.current) {
      setEoaRefreshing(false);
    }
  }, [eoaBalance, eoaRefreshing]);

  const handleInFlightChange = useCallback((inFlight: boolean) => {
    setTxInFlight(inFlight);
    if (inFlight) {
      successCalledRef.current = false;
      setEoaRefreshing(true);
      setScwRefreshing(true);
    } else if (!successCalledRef.current) {
      // rejected or timed out — clear both immediately
      setEoaRefreshing(false);
      setScwRefreshing(false);
    }
  }, []);

  const handleSuccess = useCallback(() => {
    successCalledRef.current = true;
    refetchEoa(); // kick off immediately; polling+snapshot effects handle the rest
    scwBalances.forceRefresh().finally(() => setScwRefreshing(false));
  }, [scwBalances, refetchEoa]);

  useEffect(() => {
    if (tokens.length > 0 && !selectedToken) setSelectedToken(tokens[0]);
  }, [tokens, selectedToken]);

  if (tokensLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Vault address */}
      {scwAddress && (
        <div className="p-3 bg-surface rounded-lg border border-border space-y-1">
          <p className="text-xs text-text-tertiary uppercase tracking-wide font-medium">Your Safe vault address</p>
          <CopyableHash hash={scwAddress} className="text-xs" />
        </div>
      )}

      {/* Token selector */}
      {tokens.length > 1 && (
        <Select
          value={selectedToken?.address}
          disabled={txInFlight}
          onValueChange={(v) => {
            const t = tokens.find((x) => x.address === v) ?? null;
            setSelectedToken(t);
          }}
        >
          <SelectTrigger className="bg-surface border-border text-text-primary">
            <SelectValue placeholder="Select token" />
          </SelectTrigger>
          <SelectContent>
            {tokens.map((t) => (
              <SelectItem key={t.address} value={t.address}>
                {t.symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Balance cards */}
      {selectedToken && (
        <BalancesRow
          token={selectedToken}
          eoaBalance={eoaBalance}
          scwBalances={scwBalances}
          eoaRefreshing={eoaRefreshing}
          scwRefreshing={scwRefreshing}
        />
      )}

      {/* Tabs — locked while tx is in flight */}
      <div className="flex rounded-lg bg-surface p-1 gap-1">
        {(["deposit", "withdraw"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => !txInFlight && setTab(t)}
            disabled={txInFlight}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t === "deposit"
              ? <><ArrowDownToLine className="h-3.5 w-3.5" /> Deposit</>
              : <><ArrowUpFromLine className="h-3.5 w-3.5" /> Withdraw</>
            }
          </button>
        ))}
      </div>

      {selectedToken ? (
        tab === "deposit" ? (
          <DepositPanel
            token={selectedToken}
            eoa={eoa}
            scwAddress={scwAddress}
            eoaBalance={eoaBalance}
            onSuccess={handleSuccess}
            onInFlightChange={handleInFlightChange}
            onClose={onClose}
          />
        ) : (
          <WithdrawPanel
            token={selectedToken}
            scwBalances={scwBalances}
            onSuccess={handleSuccess}
            onInFlightChange={handleInFlightChange}
            onClose={onClose}
          />
        )
      ) : (
        <p className="text-center text-sm text-text-tertiary py-4">No tokens available</p>
      )}
    </div>
  );
}

// ── Balance cards ─────────────────────────────────────────────────────────────
function BalancesRow({
  token,
  eoaBalance,
  scwBalances,
  eoaRefreshing,
  scwRefreshing,
}: {
  token: ApiToken;
  eoaBalance: bigint | undefined;
  scwBalances: ReturnType<typeof useScwBalances>;
  eoaRefreshing: boolean;
  scwRefreshing: boolean;
}) {
  const eoaDisplay = eoaBalance !== undefined
    ? parseFloat(formatUnits(eoaBalance, token.decimals)).toFixed(4)
    : null;

  const scwAvailable = scwBalances.data?.getAvailable(token.address);
  const scwDisplay = scwAvailable !== undefined
    ? parseFloat(formatUnits(scwAvailable, token.decimals)).toFixed(4)
    : null;

  return (
    <div className="grid grid-cols-2 gap-2 text-sm">
      <div className="p-3 bg-surface rounded-lg border border-border">
        <p className="text-xs text-text-tertiary mb-1.5">Wallet</p>
        {eoaRefreshing ? (
          <Skeleton className="h-5 w-20" />
        ) : (
          <p className="font-semibold text-text-primary leading-none">
            {eoaDisplay ?? "—"} <span className="text-text-tertiary font-normal text-xs">{token.symbol}</span>
          </p>
        )}
      </div>
      <div className="p-3 bg-surface rounded-lg border border-primary/30">
        <p className="text-xs text-text-tertiary mb-1.5">Vault</p>
        {scwRefreshing || scwBalances.isFetching ? (
          <Skeleton className="h-5 w-20" />
        ) : (
          <p className="font-semibold text-primary leading-none">
            {scwDisplay ?? "—"} <span className="text-text-tertiary font-normal text-xs">{token.symbol}</span>
          </p>
        )}
      </div>
    </div>
  );
}

// ── Deposit panel ─────────────────────────────────────────────────────────────
function DepositPanel({
  token,
  eoa,
  scwAddress,
  eoaBalance,
  onSuccess,
  onInFlightChange,
  onClose,
}: {
  token: ApiToken;
  eoa: `0x${string}` | undefined;
  scwAddress: `0x${string}` | undefined;
  eoaBalance: bigint | undefined;
  onSuccess: () => void;
  onInFlightChange: (v: boolean) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState<Hex | undefined>(undefined);
  const deposit = useDeposit();
  const pendingToastId = useRef<string | number | null>(null);
  const submittedLabel = useRef("");

  const { isLoading: isConfirming, isSuccess, isError: receiptError } =
    useWaitForTransactionReceipt({ hash: txHash });

  const inFlight = deposit.isPending || !!txHash;

  // Sync in-flight state to parent
  useEffect(() => { onInFlightChange(inFlight); }, [inFlight]);
  useEffect(() => () => { onInFlightChange(false); }, []);

  // 60-second timeout — if tx isn't confirmed, unblock the UI
  useEffect(() => {
    if (!txHash) return;
    const id = setTimeout(() => {
      if (pendingToastId.current) { toast.dismiss(pendingToastId.current); pendingToastId.current = null; }
      toast.error("Transaction is taking longer than expected — check your wallet");
      setTxHash(undefined);
      deposit.reset();
    }, TX_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [txHash]);

  // Receipt confirmed
  useEffect(() => {
    if (!isSuccess && !receiptError) return;
    if (pendingToastId.current) { toast.dismiss(pendingToastId.current); pendingToastId.current = null; }
    if (isSuccess) {
      toast.success(`Deposited ${submittedLabel.current} to vault`);
      onSuccess();
      deposit.reset();
    } else {
      toast.error("Deposit transaction reverted — please try again");
      deposit.reset();
    }
    setAmount("");
    setTxHash(undefined);
  }, [isSuccess, receiptError]);

  const parsedAmount = (() => {
    try { return amount ? parseUnits(amount, token.decimals) : 0n; }
    catch { return 0n; }
  })();

  const insufficient = eoaBalance !== undefined && parsedAmount > 0n && parsedAmount > eoaBalance;
  const canSubmit = parsedAmount > 0n && !insufficient && !!scwAddress && !inFlight;

  const handleSubmit = async () => {
    try {
      submittedLabel.current = `${amount} ${token.symbol}`;
      const hash = await deposit.mutateAsync({ tokenAddress: token.address, amount: parsedAmount });
      setTxHash(hash);
      pendingToastId.current = toast.loading(`Depositing ${submittedLabel.current}…`);
    } catch (err) {
      toast.error(friendlyError(err));
    }
  };

  return (
    <div className="space-y-3">
      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-start gap-2 text-xs text-text-secondary">
        <Info className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
        Transfer {token.symbol} from your wallet to your Safe vault. Vault balance is used for splitting positions.
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-text-tertiary">
          <span>Amount</span>
          {eoaBalance !== undefined && eoaBalance > 0n && (
            <button
              className="text-primary hover:underline"
              onClick={() => setAmount(formatUnits(eoaBalance, token.decimals))}
            >
              Max: {parseFloat(formatUnits(eoaBalance, token.decimals)).toFixed(4)}
            </button>
          )}
        </div>
        <div className="relative">
          <Input
            type="number"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={inFlight}
            className={`bg-surface border-border text-text-primary pr-16 ${insufficient ? "border-danger" : ""}`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-tertiary pointer-events-none">
            {token.symbol}
          </span>
        </div>
        {insufficient && <p className="text-xs text-danger">Insufficient wallet balance</p>}
      </div>

      {eoaBalance === 0n && !inFlight && (
        <p className="text-xs text-text-tertiary text-center">
          Your wallet has no {token.symbol}. Get test tokens from a faucet first.
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 border-border" onClick={onClose} disabled={inFlight}>
          Cancel
        </Button>
        <Button
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {deposit.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Waiting for wallet…</>
          ) : isConfirming ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Confirming…</>
          ) : "Deposit"}
        </Button>
      </div>
    </div>
  );
}

// ── Withdraw panel ────────────────────────────────────────────────────────────
function WithdrawPanel({
  token,
  scwBalances,
  onSuccess,
  onInFlightChange,
  onClose,
}: {
  token: ApiToken;
  scwBalances: ReturnType<typeof useScwBalances>;
  onSuccess: () => void;
  onInFlightChange: (v: boolean) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState<Hex | undefined>(undefined);
  const withdraw = useWithdraw();
  const pendingToastId = useRef<string | number | null>(null);
  const submittedLabel = useRef("");

  const scwAvailable = scwBalances.data?.getAvailable(token.address);

  const { isLoading: isConfirming, isSuccess, isError: receiptError } =
    useWaitForTransactionReceipt({ hash: txHash });

  const inFlight = withdraw.isPending || !!txHash;

  useEffect(() => { onInFlightChange(inFlight); }, [inFlight]);
  useEffect(() => () => { onInFlightChange(false); }, []);

  useEffect(() => {
    if (!txHash) return;
    const id = setTimeout(() => {
      if (pendingToastId.current) { toast.dismiss(pendingToastId.current); pendingToastId.current = null; }
      toast.error("Transaction is taking longer than expected — check your wallet");
      setTxHash(undefined);
      withdraw.reset();
    }, TX_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [txHash]);

  useEffect(() => {
    if (!isSuccess && !receiptError) return;
    if (pendingToastId.current) { toast.dismiss(pendingToastId.current); pendingToastId.current = null; }
    if (isSuccess) {
      toast.success(`Withdrew ${submittedLabel.current} to wallet`);
      onSuccess();
      withdraw.reset();
    } else {
      toast.error("Withdrawal transaction reverted — please try again");
      withdraw.reset();
    }
    setAmount("");
    setTxHash(undefined);
  }, [isSuccess, receiptError]);

  const parsedAmount = (() => {
    try { return amount ? parseUnits(amount, token.decimals) : 0n; }
    catch { return 0n; }
  })();

  const insufficient = scwAvailable !== undefined && parsedAmount > 0n && parsedAmount > scwAvailable;
  const canSubmit = parsedAmount > 0n && !insufficient && !inFlight && (scwAvailable ?? 0n) > 0n;

  const handleSubmit = async () => {
    try {
      submittedLabel.current = `${amount} ${token.symbol}`;
      const hash = await withdraw.mutateAsync({ tokenAddress: token.address, amount: parsedAmount });
      setTxHash(hash);
      pendingToastId.current = toast.loading(`Withdrawing ${submittedLabel.current}…`);
    } catch (err) {
      toast.error(friendlyError(err));
    }
  };

  return (
    <div className="space-y-3">
      <div className="p-3 bg-accent/5 border border-accent/20 rounded-lg flex items-start gap-2 text-xs text-text-secondary">
        <Info className="h-3.5 w-3.5 text-accent flex-shrink-0 mt-0.5" />
        Withdraw {token.symbol} from your Safe vault back to your wallet. Requires a Safe-signed transaction.
      </div>

      {scwAvailable !== undefined && scwAvailable === 0n && !inFlight && (
        <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-xs text-danger">
          Your vault has no {token.symbol}. Deposit first.
        </div>
      )}

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-text-tertiary">
          <span>Amount</span>
          {scwAvailable !== undefined && scwAvailable > 0n && (
            <button
              className="text-primary hover:underline"
              onClick={() => setAmount(formatUnits(scwAvailable, token.decimals))}
            >
              Max: {parseFloat(formatUnits(scwAvailable, token.decimals)).toFixed(4)}
            </button>
          )}
        </div>
        <div className="relative">
          <Input
            type="number"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={inFlight || (scwAvailable !== undefined && scwAvailable === 0n)}
            className={`bg-surface border-border text-text-primary pr-16 ${insufficient ? "border-danger" : ""}`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-tertiary pointer-events-none">
            {token.symbol}
          </span>
        </div>
        {insufficient && <p className="text-xs text-danger">Insufficient vault balance</p>}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 border-border" onClick={onClose} disabled={inFlight}>
          Cancel
        </Button>
        <Button
          className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {withdraw.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Waiting for wallet…</>
          ) : isConfirming ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Confirming…</>
          ) : "Withdraw"}
        </Button>
      </div>
    </div>
  );
}
