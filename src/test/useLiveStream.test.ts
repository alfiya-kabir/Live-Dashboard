import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLiveStream } from '../hooks/useLiveStream';
import { StreamClient } from '../services/streamClient';

describe('useLiveStream hook', () => {
  let client: StreamClient;

  beforeEach(() => {
    vi.useFakeTimers();
    // Use rate 0 so events only come from explicit burst calls during tests
    client = new StreamClient(0);
  });

  afterEach(() => {
    client.disconnect();
    vi.restoreAllMocks();
  });

  it('initializes with connecting status', () => {
    const { result } = renderHook(() => useLiveStream(client));
    expect(result.current.status).toBe('connecting');
    expect(result.current.events).toEqual([]);
  });

  it('batches high-frequency incoming events without rendering per event', () => {
    const { result } = renderHook(() => useLiveStream(client));

    // Connect handshake
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current.status).toBe('live');

    // Emit 10 events directly to the client
    act(() => {
      client.burst(10);
    });

    // Immediately before the flush interval (150ms), React state has NOT updated yet
    expect(result.current.events.length).toBe(0);

    // Advance through the flush interval (150ms)
    act(() => {
      vi.advanceTimersByTime(160);
    });

    // Now events are committed to React state in a single batch
    expect(result.current.events.length).toBe(10);
    expect(result.current.stats.totalReceived).toBe(10);
  });

  it('rejects malformed items during batch flush and tracks dropped counter', () => {
    const { result } = renderHook(() => useLiveStream(client));

    act(() => {
      vi.advanceTimersByTime(250);
    });

    // Inject malformed data
    act(() => {
      client.injectMalformed();
    });

    // Advance batch timer
    act(() => {
      vi.advanceTimersByTime(160);
    });

    // Valid events should be 0 because all injected were malformed
    expect(result.current.events.length).toBe(0);
    expect(result.current.stats.totalDropped).toBeGreaterThan(0);
  });

  it('handles pause and resume correctly', () => {
    const { result } = renderHook(() => useLiveStream(client));

    act(() => {
      vi.advanceTimersByTime(250);
    });

    act(() => {
      result.current.pause();
    });

    expect(result.current.status).toBe('paused');

    // Emitting events while paused
    act(() => {
      client.burst(5);
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Paused state drops incoming events to preserve user view
    expect(result.current.events.length).toBe(0);

    act(() => {
      result.current.resume();
    });
    expect(result.current.status).toBe('live');
  });

  it('attempts exponential backoff reconnection on error', () => {
    const { result } = renderHook(() => useLiveStream(client));

    act(() => {
      vi.advanceTimersByTime(250);
    });

    act(() => {
      client.simulateError('Simulated drop');
    });

    // Status transitions to reconnecting
    expect(result.current.status).toBe('reconnecting');
    expect(result.current.stats.reconnectAttempts).toBe(1);

    // Advance timers through reconnect delay + handshake
    act(() => {
      vi.advanceTimersByTime(2500);
    });

    // Reconnected successfully
    expect(result.current.status).toBe('live');
  });
});
