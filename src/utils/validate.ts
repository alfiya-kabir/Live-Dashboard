import { MonitoringEvent, EventStatus } from '../types/event';

const MAX_ID_LENGTH = 64;
const MAX_SERVICE_LENGTH = 64;
const MAX_MESSAGE_LENGTH = 512;
const MIN_METRIC = 0;
const MAX_METRIC = 100000;

const VALID_STATUSES = new Set<EventStatus>(['healthy', 'warning', 'critical']);

/**
 * Strict type guard that asserts whether an unknown object adheres to the MonitoringEvent schema.
 * All incoming untrusted events must pass this check before ingestion into application state.
 */
export function isValidMonitoringEvent(data: unknown): data is MonitoringEvent {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return false;
  }

  const record = data as Record<string, unknown>;

  // Validate 'id'
  if (
    typeof record.id !== 'string' ||
    record.id.trim().length === 0 ||
    record.id.length > MAX_ID_LENGTH
  ) {
    return false;
  }

  // Validate 'timestamp'
  if (
    typeof record.timestamp !== 'number' ||
    !Number.isFinite(record.timestamp) ||
    record.timestamp <= 0
  ) {
    return false;
  }

  // Ensure timestamp is within a sane timeframe (between year 2020 and 1 day in the future)
  const oneDayAhead = Date.now() + 24 * 60 * 60 * 1000;
  const minTimestamp = new Date('2020-01-01').getTime();
  if (record.timestamp < minTimestamp || record.timestamp > oneDayAhead) {
    return false;
  }

  // Validate 'service'
  if (
    typeof record.service !== 'string' ||
    record.service.trim().length === 0 ||
    record.service.length > MAX_SERVICE_LENGTH
  ) {
    return false;
  }

  // Validate 'status'
  if (
    typeof record.status !== 'string' ||
    !VALID_STATUSES.has(record.status as EventStatus)
  ) {
    return false;
  }

  // Validate 'metric'
  if (
    typeof record.metric !== 'number' ||
    !Number.isFinite(record.metric) ||
    record.metric < MIN_METRIC ||
    record.metric > MAX_METRIC
  ) {
    return false;
  }

  // Validate 'message'
  if (
    typeof record.message !== 'string' ||
    record.message.length > MAX_MESSAGE_LENGTH
  ) {
    return false;
  }

  return true;
}

/**
 * Validates and safely parses an unknown item. Returns the validated event or null if invalid.
 */
export function sanitizeAndValidateEvent(data: unknown): MonitoringEvent | null {
  if (!isValidMonitoringEvent(data)) {
    return null;
  }

  // Return a clean object with trimmed strings to ensure immutability and no hidden prototype pollution
  return {
    id: data.id.trim(),
    timestamp: Math.floor(data.timestamp),
    service: data.service.trim(),
    status: data.status,
    metric: Number(data.metric.toFixed(2)),
    message: data.message.trim(),
  };
}
