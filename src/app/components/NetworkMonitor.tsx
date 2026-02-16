import { useAccount, useChainId } from "wagmi";
import { useEffect, useState, useRef } from "react";
import { baseSepolia } from "wagmi/chains";
import NetworkNotification from "./NetworkNotification";

const TARGET_CHAIN_ID = baseSepolia.id; // 84532 (Base Sepolia)

export default function NetworkMonitor() {
  const isFirstRender = useRef(true);
  const wasConnectedRef = useRef(false);
  const hasShownNotificationOnMount = useRef(false);

  // Use both useAccount and useChainId for better chain change detection
  const { chainId, isConnected } = useAccount();
  const chainIdFromHook = useChainId();
  const [showNotification, setShowNotification] = useState(false);

  // Debug logging to diagnose chain change issues
  console.log(
    "[NetworkMonitor] ==================== RENDER ====================",
  );
  console.log(
    "[NetworkMonitor] chainId from useAccount:",
    chainId,
    "type:",
    typeof chainId,
  );
  console.log(
    "[NetworkMonitor] chainId from useChainId:",
    chainIdFromHook,
    "type:",
    typeof chainIdFromHook,
  );
  console.log("[NetworkMonitor] isConnected:", isConnected);
  console.log(
    "[NetworkMonitor] TARGET_CHAIN_ID:",
    TARGET_CHAIN_ID,
    "type:",
    typeof TARGET_CHAIN_ID,
  );
  console.log(
    "[NetworkMonitor] wasConnectedRef.current (before effect):",
    wasConnectedRef.current,
  );
  console.log(
    "[NetworkMonitor] hasShownNotificationOnMount.current:",
    hasShownNotificationOnMount.current,
  );

  // Use chainIdFromHook as primary since it's more reliable for detecting changes
  const currentChainId = chainIdFromHook || chainId;

  // Convert both to numbers for proper comparison (wagmi v3 returns bigint)
  const currentChainIdNum = Number(currentChainId);
  const targetChainIdNum = Number(TARGET_CHAIN_ID);
  console.log(
    "[NetworkMonitor] currentChainId (as number):",
    currentChainIdNum,
  );
  console.log(
    "[NetworkMonitor] Comparison result (currentChainIdNum !== targetChainIdNum):",
    currentChainIdNum !== targetChainIdNum,
  );

  // Check if wallet just connected (was not connected before, now is connected)
  // NOTE: This ref is now initialized at component level, not inside render

  useEffect(() => {
    console.log(
      "[NetworkMonitor] ==================== USE EFFECT RUNNING ====================",
    );
    console.log("[NetworkMonitor] useEffect dependencies:", {
      currentChainIdNum,
      isConnected,
      wasConnectedRef_current: wasConnectedRef.current,
      hasShownNotificationOnMount_current:
        hasShownNotificationOnMount.current,
    });

    // Skip first render to reduce noise
    if (isFirstRender.current) {
      isFirstRender.current = false;
      console.log(
        "[NetworkMonitor] First render - setting hasShownNotificationOnMount and skipping effect",
      );
      // On first render, check if we should show notification immediately after autoConnect
      // The key insight: autoConnect restores state BEFORE first render, so we might already have isConnected=true
      if (isConnected && currentChainIdNum && currentChainIdNum !== targetChainIdNum) {
        console.log(
          "[NetworkMonitor] AUTO CONNECT DETECTED ON FIRST RENDER - Wrong network already connected!",
        );
        hasShownNotificationOnMount.current = true;
        setShowNotification(true);
        return;
      }
      return;
    }

    console.log("[NetworkMonitor] ===== USE EFFECT TRIGGERED (non-first render) =====");
    console.log("[NetworkMonitor] useEffect triggered:", {
      isConnected,
      currentChainIdNum,
      targetChainIdNum,
    });

    // Handle case where:
    // 1. Wallet just connected (was not connected before)
    // 2. ChainId became available after initial mount
    // 3. Network changed
    const walletJustConnected = !wasConnectedRef.current && isConnected;
    const chainIdNowAvailable =
      currentChainId && currentChainIdNum !== 0 && currentChainIdNum !== targetChainIdNum;

    console.log("[NetworkMonitor] walletJustConnected:", walletJustConnected);
    console.log(
      "[NetworkMonitor] chainIdNowAvailable:",
      chainIdNowAvailable,
      "currentChainId:",
      currentChainId,
      "currentChainIdNum:",
      currentChainIdNum,
      "targetChainIdNum:",
      targetChainIdNum,
    );

    if (walletJustConnected || chainIdNowAvailable) {
      // Update the ref for next render
      wasConnectedRef.current = isConnected;

      // Show notification when:
      // 1. Wallet is connected
      // 2. Chain ID exists and is valid
      // 3. Chain ID is different from target (Base Sepolia)
      if (
        isConnected &&
        currentChainId &&
        currentChainIdNum !== targetChainIdNum
      ) {
        console.log(
          "[NetworkMonitor] Setting showNotification to TRUE - Wrong network detected!",
        );
        setShowNotification(true);
      } else if (
        isConnected &&
        currentChainId &&
        currentChainIdNum === targetChainIdNum
      ) {
        // User switched to correct network - hide notification
        console.log(
          "[NetworkMonitor] Setting showNotification to FALSE - Correct network",
        );
        setShowNotification(false);
      }
    } else if (isConnected && currentChainId) {
      // Handle network change while wallet stays connected
      if (currentChainIdNum !== targetChainIdNum) {
        console.log(
          "[NetworkMonitor] Setting showNotification to TRUE - Wrong network detected!",
        );
        setShowNotification(true);
      } else {
        console.log(
          "[NetworkMonitor] Setting showNotification to FALSE - Correct network",
        );
        setShowNotification(false);
      }
    } else if (!isConnected) {
      // Wallet disconnected - hide notification
      console.log(
        "[NetworkMonitor] Setting showNotification to FALSE - Wallet disconnected",
      );
      setShowNotification(false);
    }

    // Update the ref for tracking connection state
    wasConnectedRef.current = isConnected;
    console.log(
      "[NetworkMonitor] Updated wasConnectedRef.current to:",
      isConnected,
    );
  }, [currentChainIdNum, isConnected]); // Removed wasConnectedRef from deps - it's a ref, not state

  // Don't render anything if wallet is not connected
  if (!isConnected) {
    return null;
  }

  return (
    <NetworkNotification
      isVisible={showNotification}
      onDismiss={() => setShowNotification(false)}
    />
  );
}
