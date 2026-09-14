import { useState, useEffect, useRef, useCallback } from 'react';
import { ConnectionStatus, MonitoringEvent } from '../types/event';
import { StreamClient, streamClient as defaultClient } from '../services/streamClient';
import { sanitizeAndValidateEvent } from '../utils/validate';
import {
  BATCH_INTERVAL_MS,
  MAX_EVENTS,
  MAX_BUFFER_CAPACITY,
  RECONNECT_INITIAL_DELAY_MS,
  RECONNECT_MAX_DELAY_MS,
  RECONNECT_FACTOR,
} from '../utils/constants';

export interface LiveStreamStats {
  totalReceived: number;
  totalDropped: number;
  eventsPerSec: number;
  reconnectAttempts: number;
}

export interface UseLiveStreamReturn {
  events: MonitoringEvent[];
  status: ConnectionStatus;
  stats: LiveStreamStats;
  currentRate: number;
  pause: () => void;
  resume: () => void;
  reconnect: () => void;
  disconnect: () => void;
  connect: () => void;
  setRate: (rate: number) => void;
  burst: (count?: number) => void;
  injectMalformed: () => void;
  simulateError: (msg?: string) => void;
  clearEvents: () => void;
}

export function useLiveStream(client: StreamClient = defaultClient): UseLiveStreamReturn {
  const [events, setEvents] = useState<MonitoringEvent[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [currentRate, setCurrentRateState] = useState<number>(client.getRate());
  const [stats, setStats] = useState<LiveStreamStats>({
    totalReceived: 0,
    totalDropped: 0,
    eventsPerSec: 0,
    reconnectAttempts: 0,
  });

  // Non-state buffer ref to accumulate high-frequency raw events without triggering renders
  const rawBufferRef = useRef<unknown[]>([]);
  const retryCountRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const flushIntervalRef = useRef<number | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const userPausedRef = useRef<boolean>(false);

  // Stats tracking refs to avoid stale closure state in high-frequency flush loop
  const totalReceivedRef = useRef<number>(0);
  const totalDroppedRef = useRef<number>(0);
  const eventsInCurrentWindowRef = useRef<number>(0);
  const lastRateTimestampRef = useRef<number>(Date.now());
  const calculatedEpsRef = useRef<number>(0);

  // Clear reconnect timer
  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Initiate connection attempt with exponential backoff
  const attemptReconnect = useCallback(() => {
    clearReconnectTimer();

    if (!isMountedRef.current || userPausedRef.current) return;

    retryCountRef.current++;
    setStatus('reconnecting');
    setStats((prev) => ({
      ...prev,
      reconnectAttempts: retryCountRef.current,
    }));

    // Calculate exponential backoff delay with 20% random jitter to prevent thundering herd
    const baseDelay = Math.min(
      RECONNECT_INITIAL_DELAY_MS * Math.pow(RECONNECT_FACTOR, retryCountRef.current - 1),
      RECONNECT_MAX_DELAY_MS
    );
    const jitter = baseDelay * (0.8 + Math.random() * 0.4);
    const delay = Math.round(jitter);

    reconnectTimeoutRef.current = window.setTimeout(() => {
      if (!isMountedRef.current || userPausedRef.current) return;
      client.connect();
    }, delay);
  }, [client, clearReconnectTimer]);

  // Flush buffer to React state on periodic tick
  const flushBuffer = useCallback(() => {
    if (!isMountedRef.current) return;

    const rawBatch = rawBufferRef.current;
    if (rawBatch.length === 0) {
      // Calculate zero eps if idle
      const now = Date.now();
      const elapsed = (now - lastRateTimestampRef.current) / 1000;
      if (elapsed >= 1.0) {
        calculatedEpsRef.current = 0;
        lastRateTimestampRef.current = now;
        eventsInCurrentWindowRef.current = 0;
        setStats((prev) =>
          prev.eventsPerSec !== 0 ? { ...prev, eventsPerSec: 0 } : prev
        );
      }
      return;
    }

    // Drain buffer
    rawBufferRef.current = [];

    // Validate and sanitize each event; reject malformed items
    const validBatch: MonitoringEvent[] = [];
    let droppedInBatch = 0;

    for (let i = 0; i < rawBatch.length; i++) {
      const sanitized = sanitizeAndValidateEvent(rawBatch[i]);
      if (sanitized) {
        validBatch.push(sanitized);
      } else {
        droppedInBatch++;
      }
    }

    totalReceivedRef.current += validBatch.length;
    totalDroppedRef.current += droppedInBatch;
    eventsInCurrentWindowRef.current += validBatch.length;

    // Calculate rolling events/sec rate
    const now = Date.now();
    const elapsedSec = (now - lastRateTimestampRef.current) / 1000;
    if (elapsedSec >= 0.8) {
      calculatedEpsRef.current = Math.round(eventsInCurrentWindowRef.current / elapsedSec);
      eventsInCurrentWindowRef.current = 0;
      lastRateTimestampRef.current = now;
    }

    if (validBatch.length > 0) {
      // Prepend newest events first and keep bounded to MAX_EVENTS
      setEvents((prevEvents) => {
        const combined = [...validBatch.reverse(), ...prevEvents];
        if (combined.length > MAX_EVENTS) {
          return combined.slice(0, MAX_EVENTS);
        }
        return combined;
      });
    }

    // Commit stats update synchronously with batch
    setStats({
      totalReceived: totalReceivedRef.current,
      totalDropped: totalDroppedRef.current,
      eventsPerSec: calculatedEpsRef.current,
      reconnectAttempts: retryCountRef.current,
    });
  }, []);

  // Connection & Event Subscription Lifecycle
  useEffect(() => {
    isMountedRef.current = true;

    // Flush timer
    flushIntervalRef.current = window.setInterval(flushBuffer, BATCH_INTERVAL_MS);

    // Subscribe to incoming stream events
    const unsubscribeEvents = client.subscribe((event: unknown) => {
      if (!isMountedRef.current) return;

      // Drop events if user intentionally paused ingestion
      if (userPausedRef.current) return;

      // Protect against memory exhaustion under extreme bursts: drop oldest if buffer is over capacity
      if (rawBufferRef.current.length >= MAX_BUFFER_CAPACITY) {
        totalDroppedRef.current += 1;
        rawBufferRef.current.shift();
      }

      rawBufferRef.current.push(event);
    });

    // Subscribe to client status changes
    const unsubscribeStatus = client.onStatusChange((newStatus: ConnectionStatus) => {
      if (!isMountedRef.current) return;

      setStatus(newStatus);

      if (newStatus === 'live') {
        // Reset reconnect attempts on successful connection
        retryCountRef.current = 0;
        clearReconnectTimer();
      } else if (newStatus === 'error') {
        attemptReconnect();
      }
    });

    // Subscribe to client errors
    const unsubscribeError = client.onError(() => {
      // Reconnect is already triggered when status transitions to 'error'
    });

    // Initial connection
    client.connect();

    // Comprehensive unmount cleanup
    return () => {
      isMountedRef.current = false;
      if (flushIntervalRef.current !== null) {
        window.clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = null;
      }
      clearReconnectTimer();
      unsubscribeEvents();
      unsubscribeStatus();
      unsubscribeError();
      client.disconnect();
    };
  }, [client, flushBuffer, clearReconnectTimer, attemptReconnect]);

  const pause = useCallback(() => {
    userPausedRef.current = true;
    clearReconnectTimer();
    client.pause();
    setStatus('paused');
  }, [client, clearReconnectTimer]);

  const resume = useCallback(() => {
    userPausedRef.current = false;
    client.resume();
  }, [client]);

  const reconnect = useCallback(() => {
    userPausedRef.current = false;
    retryCountRef.current = 0;
    clearReconnectTimer();
    client.disconnect();
    client.connect();
  }, [client, clearReconnectTimer]);

  const disconnect = useCallback(() => {
    userPausedRef.current = true;
    clearReconnectTimer();
    client.disconnect();
    setStatus('error');
  }, [client, clearReconnectTimer]);

  const connect = useCallback(() => {
    userPausedRef.current = false;
    clearReconnectTimer();
    client.connect();
  }, [client, clearReconnectTimer]);

  const setRate = useCallback(
    (rate: number) => {
      client.setRate(rate);
      setCurrentRateState(client.getRate());
    },
    [client]
  );

  const burst = useCallback(
    (count?: number) => {
      client.burst(count);
    },
    [client]
  );

  const injectMalformed = useCallback(() => {
    client.injectMalformed();
  }, [client]);

  const simulateError = useCallback(
    (msg?: string) => {
      client.simulateError(msg);
    },
    [client]
  );

  const clearEvents = useCallback(() => {
    setEvents([]);
    rawBufferRef.current = [];
  }, []);

  return {
    events,
    status,
    stats,
    currentRate,
    pause,
    resume,
    reconnect,
    disconnect,
    connect,
    setRate,
    burst,
    injectMalformed,
    simulateError,
    clearEvents,
  };
}
