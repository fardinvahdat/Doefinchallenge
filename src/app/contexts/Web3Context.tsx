import { createContext, useContext, ReactNode } from "react";
import { useAccount, useBlockNumber } from "wagmi";

interface Web3ContextType {
  currentBlock: bigint | undefined;
  isLoading: boolean;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
  const { isConnected } = useAccount();
  const { data: currentBlock, isLoading } = useBlockNumber({
    watch: true,
  });

  return (
    <Web3Context.Provider
      value={{
        currentBlock,
        isLoading,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}
