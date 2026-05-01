import type {
  Eip1193Provider,
  PredictedSafeProps,
  SafeAccountConfig,
  SafeDeploymentConfig,
} from "@safe-global/protocol-kit";
import Safe from "@safe-global/protocol-kit";
import type { MetaTransactionData } from "@safe-global/types-kit";
import { encodeFunctionData, type Hex, keccak256, type WalletClient } from "viem";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;

export const DOEFIN_SAFE_VERSION = "1.4.1" as const;
export const BASE_SEPOLIA_CHAIN_ID = 84532 as const;

const SAFE_SINGLETON = (
  (import.meta.env.VITE_SAFE_SINGLETON as string) ||
  "0x41675C099F32341bf84BFc5382aF534df5C7461a"
) as `0x${string}`;

const SAFE_FACTORY = (
  (import.meta.env.VITE_SAFE_FACTORY as string) ||
  "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67"
) as `0x${string}`;

// Pinned Safe 1.4.1 auxiliary contract addresses on Base Sepolia.
// Must match backend shared/scw/resolver.py to ensure CREATE2 address parity.
export const BASE_SEPOLIA_CONTRACT_NETWORKS = {
  [BASE_SEPOLIA_CHAIN_ID.toString()]: {
    safeSingletonAddress: SAFE_SINGLETON,
    safeProxyFactoryAddress: SAFE_FACTORY,
    fallbackHandlerAddress: "0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99",
    multiSendAddress: "0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526",
    multiSendCallOnlyAddress: "0x9641d764fc13c8B624c04430C7356C1C7C8102e2",
    createCallAddress: "0x9b35Af71d77eaf8d7e40252370304687390A1A52",
    signMessageLibAddress: "0xd53cd0aB83D845Ac265BE939c57F53AD838012c9",
    simulateTxAccessorAddress: "0x3d4BA2E0884aa488718476ca2FB8Efc291A46199",
  },
} as const;

// saltNonce = uint256(keccak256(eoa_as_20_bytes)) as decimal string.
// Must match backend shared/scw/resolver.py:115-125.
export const computeSaltNonce = (eoa: `0x${string}`): string =>
  BigInt(keccak256(eoa)).toString();

export const buildSafeAccountConfig = (eoa: `0x${string}`): SafeAccountConfig => ({
  owners: [eoa],
  threshold: 1,
  // fallbackHandler intentionally zero — keeps CREATE2 address deterministic.
  // The canonical CompatibilityFallbackHandler is installed post-deployment
  // via setFallbackHandler so ERC-1155 mints don't revert.
  fallbackHandler: ZERO_ADDRESS,
  to: ZERO_ADDRESS,
  data: "0x",
  paymentToken: ZERO_ADDRESS,
  payment: 0,
  paymentReceiver: ZERO_ADDRESS,
});

export const buildSafeDeploymentConfig = (eoa: `0x${string}`): SafeDeploymentConfig => ({
  saltNonce: computeSaltNonce(eoa),
  safeVersion: DOEFIN_SAFE_VERSION,
});

export const buildPredictedSafeProps = (eoa: `0x${string}`): PredictedSafeProps => ({
  safeAccountConfig: buildSafeAccountConfig(eoa),
  safeDeploymentConfig: buildSafeDeploymentConfig(eoa),
});

const FALLBACK_HANDLER_SLOT =
  "0x6c9a6c4a39284e37ed1cf53d337577d14212a4870fb976a4366c693b939918d5" as const;

export const COMPATIBILITY_FALLBACK_HANDLER =
  "0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99" as const;

const SAFE_SET_FALLBACK_HANDLER_ABI = [
  {
    type: "function",
    name: "setFallbackHandler",
    stateMutability: "nonpayable",
    inputs: [{ name: "handler", type: "address" }],
    outputs: [],
  },
] as const;

const readSafeFallbackHandler = async (
  eip1193: Eip1193Provider,
  safeAddress: `0x${string}`,
): Promise<`0x${string}`> => {
  const raw = (await eip1193.request({
    method: "eth_getStorageAt",
    params: [safeAddress, FALLBACK_HANDLER_SLOT, "latest"],
  })) as string;
  return `0x${raw.slice(-40)}`.toLowerCase() as `0x${string}`;
};

const buildInstallFallbackHandlerTx = (safeAddress: `0x${string}`): MetaTx => ({
  to: safeAddress,
  data: encodeFunctionData({
    abi: SAFE_SET_FALLBACK_HANDLER_ABI,
    functionName: "setFallbackHandler",
    args: [COMPATIBILITY_FALLBACK_HANDLER],
  }),
  value: 0n,
});

export type MetaTx = {
  to: `0x${string}`;
  data: Hex;
  value?: bigint;
};

export type SafeClient = {
  readonly eoa: `0x${string}`;
  predictAddress(): Promise<`0x${string}`>;
  isDeployed(): Promise<boolean>;
  exec(txs: MetaTx[]): Promise<Hex>;
};

export type CreateSafeClientParams = {
  eip1193: Eip1193Provider;
  eoa: `0x${string}`;
  chainId?: number;
  walletClient: WalletClient;
};

export const createSafeClient = async (
  params: CreateSafeClientParams,
): Promise<SafeClient> => {
  const { eip1193, eoa, chainId = BASE_SEPOLIA_CHAIN_ID, walletClient } = params;

  if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
    throw new Error(
      `Only Base Sepolia (${BASE_SEPOLIA_CHAIN_ID}) is supported, got ${chainId}`,
    );
  }

  const predictedSdk = await Safe.init({
    provider: eip1193,
    signer: eoa,
    isL1SafeSingleton: true,
    contractNetworks: BASE_SEPOLIA_CONTRACT_NETWORKS,
    predictedSafe: buildPredictedSafeProps(eoa),
  });

  let deployedSdk: Safe | null = null;
  const getDeployedSdk = async (): Promise<Safe> => {
    if (deployedSdk) return deployedSdk;
    const safeAddress = (await predictedSdk.getAddress()) as `0x${string}`;
    deployedSdk = await Safe.init({
      provider: eip1193,
      signer: eoa,
      isL1SafeSingleton: true,
      contractNetworks: BASE_SEPOLIA_CONTRACT_NETWORKS,
      safeAddress,
    });
    return deployedSdk;
  };

  const toMetaTxData = (t: MetaTx): MetaTransactionData => ({
    to: t.to,
    data: t.data,
    value: (t.value ?? 0n).toString(),
  });

  return {
    eoa,
    predictAddress: async () => (await predictedSdk.getAddress()) as `0x${string}`,
    isDeployed: () => predictedSdk.isSafeDeployed(),
    exec: async (txs) => {
      const deployed = await predictedSdk.isSafeDeployed();
      const safeAddress = (await predictedSdk.getAddress()) as `0x${string}`;

      // Auto-install CompatibilityFallbackHandler so ERC-1155 mints don't revert.
      let needsHandlerInstall = true;
      if (deployed) {
        const current = await readSafeFallbackHandler(eip1193, safeAddress);
        needsHandlerInstall =
          current.toLowerCase() !== COMPATIBILITY_FALLBACK_HANDLER.toLowerCase();
      }
      const txsWithHandler = needsHandlerInstall
        ? [buildInstallFallbackHandlerTx(safeAddress), ...txs]
        : txs;

      if (txsWithHandler.length === 0) {
        throw new Error("safe.exec: nothing to execute");
      }

      if (deployed) {
        const sdk = await getDeployedSdk();
        const safeTx = await sdk.createTransaction({
          transactions: txsWithHandler.map(toMetaTxData),
        });
        const signed = await sdk.signTransaction(safeTx);

        // Simulate each inner tx from the Safe's address to get accurate gas,
        // then add execTransaction overhead and a 30% buffer.
        const SAFE_EXEC_OVERHEAD = 80_000n;
        const FALLBACK_PER_TX = 300_000n;
        let innerGas = 0n;
        for (const tx of txsWithHandler) {
          try {
            const hexGas = await eip1193.request({
              method: "eth_estimateGas",
              params: [{
                from: safeAddress,
                to: tx.to,
                data: tx.data,
                value: `0x${(tx.value ?? 0n).toString(16)}`,
              }],
            }) as string;
            innerGas += BigInt(hexGas);
          } catch {
            innerGas += FALLBACK_PER_TX;
          }
        }
        const gasLimit = ((innerGas + SAFE_EXEC_OVERHEAD) * 13n) / 10n;

        const result = await sdk.executeTransaction(signed, { gasLimit });
        return result.hash as Hex;
      }

      // Undeployed: build the full deployment batch, then simulate it directly
      // (from the EOA) to get the real gas cost before sending.
      const safeTx = await predictedSdk.createTransaction({
        transactions: txsWithHandler.map(toMetaTxData),
      });
      const signed = await predictedSdk.signTransaction(safeTx);
      const wrapped =
        await predictedSdk.wrapSafeTransactionIntoDeploymentBatch(signed);

      let deployGas: bigint;
      try {
        const hexGas = await eip1193.request({
          method: "eth_estimateGas",
          params: [{
            from: eoa,
            to: wrapped.to,
            data: wrapped.data,
            value: `0x${BigInt(wrapped.value).toString(16)}`,
          }],
        }) as string;
        deployGas = (BigInt(hexGas) * 13n) / 10n; // 30% buffer on simulation result
      } catch {
        // Fallback: known-cost ceiling (proxy deploy ~250K + 300K per inner tx)
        deployGas =
          ((285_000n + BigInt(txsWithHandler.length) * 300_000n) * 13n) / 10n;
      }

      return walletClient.sendTransaction({
        account: eoa,
        chain: walletClient.chain ?? null,
        to: wrapped.to as `0x${string}`,
        value: BigInt(wrapped.value),
        data: wrapped.data as Hex,
        gas: deployGas,
      });
    },
  };
};
