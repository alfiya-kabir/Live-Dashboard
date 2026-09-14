import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StreamClient } from '../services/streamClient';
import { isValidMonitoringEvent } from '../utils/validate';

describe('StreamClient', () => {
  let client: StreamClient;

  beforeEach(() => {
    vi.useFakeTimers();
    client = new StreamClient(20);
  });

  afterEach(() => {
    client.disconnect();
    vi.restoreAllMocks();
  });

  it('initializes with connecting status and default rate', () => {
    expect(client.getStatus()).toBe('connecting');
    expect(client.getRate()).toBe(20);
  });

  it('transitions to live after connection handshake delay', () => {
    client.connect();
    expect(client.getStatus()).toBe('connecting');

    // Advance through handshake delay (200ms)
    vi.advanceTimersByTime(250);
    expect(client.getStatus()).toBe('live');
  });

  it('does not complete a handshake after disconnecting', () => {
    client.connect();
    client.disconnect(true);

    vi.advanceTimersByTime(250);

    expect(client.getStatus()).toBe('connecting');
  });

  it('pauses and resumes emission properly', () => {
    client.connect();
    vi.advanceTimersByTime(250);
    expect(client.getStatus()).toBe('live');

    client.pause();
    expect(client.getStatus()).toBe('paused');

    client.resume();
    expect(client.getStatus()).toBe('live');
  });

  it('emits valid monitoring events to subscribers', () => {
    const received: unknown[] = [];
    const unsubscribe = client.subscribe((evt) => {
      received.push(evt);
    });

    client.connect();
    vi.advanceTimersByTime(250); // Live

    // Advance 500ms at 20 eps => ~10 events
    vi.advanceTimersByTime(500);

    expect(received.length).toBeGreaterThan(0);
    expect(isValidMonitoringEvent(received[0])).toBe(true);

    unsubscribe();
  });

  it('triggers burst emission properly', () => {
    const received: unknown[] = [];
    client.subscribe((evt) => {
      received.push(evt);
    });

    client.connect();
    vi.advanceTimersByTime(250);

    // Reset array to only count burst events
    received.length = 0;

    client.burst(50);
    expect(received.length).toBe(50);
  });

  it('notifies error subscribers upon simulated error', () => {
    const errorListener = vi.fn();
    client.onError(errorListener);

    client.connect();
    vi.advanceTimersByTime(250);

    client.simulateError('Simulated Gateway Crash');
    expect(client.getStatus()).toBe('error');
    expect(errorListener).toHaveBeenCalledTimes(1);
    expect(errorListener.mock.calls[0][0].message).toContain('Simulated Gateway Crash');
  });
});
