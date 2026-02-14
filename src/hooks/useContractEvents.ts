import { useEffect, useState } from 'react';
import { useWatchContractEvent, usePublicClient } from 'wagmi';
import { CONTRACTS, CONDITIONAL_TOKENS_ABI } from '../config/contracts';
import { Log } from 'viem';

export interface ConditionEvent {
  type: 'ConditionPreparation' | 'PositionSplit';
  blockNumber: bigint;
  transactionHash: `0x${string}`;
  args: any;
  timestamp?: number;
}

export function useConditionEvents() {
  const [events, setEvents] = useState<ConditionEvent[]>([]);
  const publicClient = usePublicClient();

  // Watch for ConditionPreparation events
  useWatchContractEvent({
    address: CONTRACTS.ConditionalTokens,
    abi: CONDITIONAL_TOKENS_ABI,
    eventName: 'ConditionPreparation',
    onLogs(logs) {
      const newEvents: ConditionEvent[] = logs.map((log) => ({
        type: 'ConditionPreparation',
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        args: log.args,
      }));
      setEvents((prev) => [...newEvents, ...prev]);
    },
  });

  // Watch for PositionSplit events
  useWatchContractEvent({
    address: CONTRACTS.ConditionalTokens,
    abi: CONDITIONAL_TOKENS_ABI,
    eventName: 'PositionSplit',
    onLogs(logs) {
      const newEvents: ConditionEvent[] = logs.map((log) => ({
        type: 'PositionSplit',
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        args: log.args,
      }));
      setEvents((prev) => [...newEvents, ...prev]);
    },
  });

  // Fetch timestamps for events
  useEffect(() => {
    if (!publicClient) return;

    const fetchTimestamps = async () => {
      const eventsWithTimestamps = await Promise.all(
        events.map(async (event) => {
          if (event.timestamp) return event;
          try {
            const block = await publicClient.getBlock({
              blockNumber: event.blockNumber,
            });
            return { ...event, timestamp: Number(block.timestamp) };
          } catch (error) {
            console.error('Error fetching block timestamp:', error);
            return event;
          }
        })
      );
      setEvents(eventsWithTimestamps);
    };

    fetchTimestamps();
  }, [events.length, publicClient]);

  return { events };
}

// Hook to fetch historical events
export function useHistoricalEvents(fromBlock?: bigint) {
  const [events, setEvents] = useState<ConditionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const publicClient = usePublicClient();

  useEffect(() => {
    if (!publicClient) return;

    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        // Get current block number
        const currentBlock = await publicClient.getBlockNumber();
        
        // Start from 10,000 blocks ago (Base Sepolia RPC limit) or fromBlock if provided
        const startBlock = fromBlock !== undefined 
          ? fromBlock 
          : currentBlock > 10000n 
            ? currentBlock - 10000n 
            : 0n;

        console.log(`📊 Fetching events from block ${startBlock} to ${currentBlock}`);

        const logs = await publicClient.getLogs({
          address: CONTRACTS.ConditionalTokens,
          events: CONDITIONAL_TOKENS_ABI.filter((item) => item.type === 'event'),
          fromBlock: startBlock,
          toBlock: currentBlock,
        });

        console.log(`✅ Found ${logs.length} events`);

        // Fetch timestamps in batches to avoid overwhelming the RPC
        const batchSize = 10;
        const parsedEvents: ConditionEvent[] = [];

        for (let i = 0; i < logs.length; i += batchSize) {
          const batch = logs.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map(async (log) => {
              try {
                const block = await publicClient.getBlock({
                  blockNumber: log.blockNumber,
                });
                return {
                  type: log.eventName as 'ConditionPreparation' | 'PositionSplit',
                  blockNumber: log.blockNumber,
                  transactionHash: log.transactionHash,
                  args: log.args,
                  timestamp: Number(block.timestamp),
                };
              } catch (error) {
                console.error(`Error fetching block ${log.blockNumber}:`, error);
                return {
                  type: log.eventName as 'ConditionPreparation' | 'PositionSplit',
                  blockNumber: log.blockNumber,
                  transactionHash: log.transactionHash,
                  args: log.args,
                  timestamp: 0,
                };
              }
            })
          );
          parsedEvents.push(...batchResults);
        }

        setEvents(parsedEvents.sort((a, b) => Number(b.blockNumber - a.blockNumber)));
      } catch (error: any) {
        console.error('Error fetching historical events:', error);
        
        // Provide helpful error message
        if (error.message?.includes('10,000 range')) {
          console.error('❌ RPC block range limit exceeded. Fetching from recent blocks only.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [publicClient, fromBlock]);

  return { events, isLoading };
}