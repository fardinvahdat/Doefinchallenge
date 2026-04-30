import { useAccount } from "wagmi";
import { useEffect, useState, useRef } from "react";
import { baseSepolia } from "wagmi/chains";
import NetworkNotification from "./NetworkNotification";

const TARGET_CHAIN_ID = baseSepolia.id;

export default function NetworkMonitor() {
  const isFirstRender = useRef(true);
  const wasConnectedRef = useRef(false);
  const hasShownNotificationOnMount = useRef(false);

  // #30: useAccount().chainId and useChainId() return the same value in wagmi v3 — removed redundant hook
  const { chainId, isConnected } = useAccount();
  const [showNotification, setShowNotification] = useState(false);

  const currentChainIdNum = Number(chainId);
  const targetChainIdNum = Number(TARGET_CHAIN_ID);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (isConnected && currentChainIdNum && currentChainIdNum !== targetChainIdNum) {
        hasShownNotificationOnMount.current = true;
        setShowNotification(true);
      }
      wasConnectedRef.current = isConnected; // #29: single write in first-render path
      return;
    }

    const walletJustConnected = !wasConnectedRef.current && isConnected;
    const chainIdNowAvailable =
      chainId && currentChainIdNum !== 0 && currentChainIdNum !== targetChainIdNum;

    if (walletJustConnected || chainIdNowAvailable) {
      if (isConnected && chainId && currentChainIdNum !== targetChainIdNum) {
        setShowNotification(true);
      } else if (isConnected && chainId && currentChainIdNum === targetChainIdNum) {
        setShowNotification(false);
      }
    } else if (isConnected && chainId) {
      setShowNotification(currentChainIdNum !== targetChainIdNum);
    } else if (!isConnected) {
      setShowNotification(false);
    }

    // #29: single unconditional write — removed the duplicate write inside the if-block
    wasConnectedRef.current = isConnected;
  }, [currentChainIdNum, isConnected]);

  if (!isConnected) return null;

  return (
    <NetworkNotification
      isVisible={showNotification}
      onDismiss={() => setShowNotification(false)}
    />
  );
}
