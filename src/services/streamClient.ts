import { ConnectionStatus, EventStatus, MonitoringEvent } from '../types/event';
import { SERVICES, SAMPLE_MESSAGES } from '../utils/constants';

type EventListener = (event: unknown) => void;
type StatusListener = (status: ConnectionStatus) => void;
type ErrorListener = (error: Error) => void;

export class StreamClient {
  private status: ConnectionStatus = 'connecting';
  private rateEps: number = 25; // default 25 events/sec
  private timerId: number | null = null;
  private eventListeners = new Set<EventListener>();
  private statusListeners = new Set<StatusListener>();
  private errorListeners = new Set<ErrorListener>();
  private eventSequence = 0;
  private isConnected = false;

  constructor(initialRateEps: number = 25) {
    this.rateEps = initialRateEps;
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getRate(): number {
    return this.rateEps;
  }

  public setRate(newRateEps: number): void {
    this.rateEps = Math.max(0, Math.min(1000, newRateEps));
    if (this.isConnected && this.status === 'live') {
      this.restartEmissionTimer();
    }
  }

  public subscribe(listener: EventListener): () => void {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  public onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public onError(listener: ErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => {
      this.errorListeners.delete(listener);
    };
  }

  public connect(): void {
    if (this.isConnected) return;

    this.setStatus('connecting');

    // Simulate initial network handshake (150-300ms)
    window.setTimeout(() => {
      // If disconnected during handshake, abort
      if (this.status !== 'connecting') return;

      this.isConnected = true;
      this.setStatus('live');
      this.startEmissionTimer();
    }, 200);
  }

  public disconnect(): void {
    this.isConnected = false;
    this.stopEmissionTimer();
    this.setStatus('connecting');
  }

  public pause(): void {
    if (!this.isConnected || this.status === 'paused') return;
    this.stopEmissionTimer();
    this.setStatus('paused');
  }

  public resume(): void {
    if (!this.isConnected || this.status === 'live') return;
    this.setStatus('live');
    this.startEmissionTimer();
  }

  public simulateError(customMessage?: string): void {
    this.stopEmissionTimer();
    this.isConnected = false;
    this.setStatus('error');

    const err = new Error(
      customMessage || 'Stream connection interrupted: Gateway transport timeout'
    );
    this.errorListeners.forEach((listener) => {
      try {
        listener(err);
      } catch {
        // Prevent listener exceptions from breaking client
      }
    });
  }

  /**
   * Generates a sudden burst of N events.
   * Useful for testing UI performance, buffer limits, and frame rate stability.
   */
  public burst(count: number = 100): void {
    if (this.status !== 'live' && this.status !== 'connecting') return;

    for (let i = 0; i < count; i++) {
      const event = this.generateRealisticEvent();
      this.emitEvent(event);
    }
  }

  /**
   * Deliberately emits malformed data to verify that the security validation
   * layer safely rejects it and prevents application state corruption.
   */
  public injectMalformed(): void {
    const malformedVariants: unknown[] = [
      { id: '', timestamp: Date.now(), service: 'API', status: 'healthy', metric: 10 },
      { id: 'bad-1', timestamp: -100, service: 'DB', status: 'healthy', metric: 10 },
      { id: 'bad-2', timestamp: Date.now(), service: '', status: 'healthy', metric: 10 },
      { id: 'bad-3', timestamp: Date.now(), service: 'DB', status: 'exploit_status', metric: 10 },
      { id: 'bad-4', timestamp: Date.now(), service: 'DB', status: 'healthy', metric: NaN },
      { id: 'bad-5', timestamp: Date.now(), service: 'DB', status: 'healthy', metric: Infinity },
      'totally not an object',
      null,
      undefined,
    ];

    malformedVariants.forEach((badItem) => this.emitEvent(badItem));
  }

  private setStatus(newStatus: ConnectionStatus): void {
    if (this.status === newStatus) return;
    this.status = newStatus;
    this.statusListeners.forEach((listener) => {
      try {
        listener(newStatus);
      } catch {
        // Ignore subscriber errors
      }
    });
  }

  private startEmissionTimer(): void {
    this.stopEmissionTimer();

    if (this.rateEps <= 0) {
      return;
    }

    // Determine interval in ms. For rates > 50 eps, generate small batches per tick
    // to avoid timer precision throttling below 16ms
    const intervalMs = this.rateEps <= 50 ? Math.max(16, Math.floor(1000 / this.rateEps)) : 20;
    const eventsPerTick =
      this.rateEps <= 50 ? 1 : Math.ceil((this.rateEps * intervalMs) / 1000);

    this.timerId = window.setInterval(() => {
      for (let i = 0; i < eventsPerTick; i++) {
        const event = this.generateRealisticEvent();
        this.emitEvent(event);
      }
    }, intervalMs);
  }

  private restartEmissionTimer(): void {
    this.startEmissionTimer();
  }

  private stopEmissionTimer(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private emitEvent(event: unknown): void {
    this.eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch {
        // Prevent subscriber error from crashing the generator
      }
    });
  }

  private generateRealisticEvent(): MonitoringEvent {
    this.eventSequence++;
    const id = `evt-${Date.now().toString(36)}-${this.eventSequence.toString(36)}`;
    const timestamp = Date.now();

    // Pick service
    const serviceIndex = Math.floor(Math.random() * SERVICES.length);
    const service = SERVICES[serviceIndex];

    // Status distribution: ~78% healthy, ~15% warning, ~7% critical
    const rand = Math.random();
    let status: EventStatus = 'healthy';
    let metric = 0;

    if (rand < 0.78) {
      status = 'healthy';
      // Low response time / latency (10 - 150ms)
      metric = parseFloat((15 + Math.random() * 85).toFixed(1));
    } else if (rand < 0.93) {
      status = 'warning';
      // Elevated latency / queue size (160 - 550ms)
      metric = parseFloat((160 + Math.random() * 390).toFixed(1));
    } else {
      status = 'critical';
      // High latency / error spike (600 - 3000ms)
      metric = parseFloat((600 + Math.random() * 2400).toFixed(1));
    }

    const messages = SAMPLE_MESSAGES[status];
    let message = messages[Math.floor(Math.random() * messages.length)];

    // Once in 120 events, test XSS resilience by including benign script tags in the payload
    if (this.eventSequence % 120 === 0) {
      message = `<script>alert("xss-test-${this.eventSequence}")</script> - Diagnostic ping for ${service}`;
    }

    return {
      id,
      timestamp,
      service,
      status,
      metric,
      message,
    };
  }
}

// Global singleton instance for app-wide access or testing
export const streamClient = new StreamClient();
