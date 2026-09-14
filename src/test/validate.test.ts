import { describe, it, expect } from 'vitest';
import { isValidMonitoringEvent, sanitizeAndValidateEvent } from '../utils/validate';

describe('validate.ts - isValidMonitoringEvent', () => {
  const validEvent = {
    id: 'evt-test-123',
    timestamp: Date.now(),
    service: 'API Gateway',
    status: 'healthy',
    metric: 42.5,
    message: 'System operating within normal parameters',
  };

  it('accepts a valid monitoring event', () => {
    expect(isValidMonitoringEvent(validEvent)).toBe(true);
  });

  it('rejects null, undefined, and non-object values', () => {
    expect(isValidMonitoringEvent(null)).toBe(false);
    expect(isValidMonitoringEvent(undefined)).toBe(false);
    expect(isValidMonitoringEvent('string')).toBe(false);
    expect(isValidMonitoringEvent(12345)).toBe(false);
    expect(isValidMonitoringEvent([])).toBe(false);
  });

  it('rejects events with missing or empty id', () => {
    expect(isValidMonitoringEvent({ ...validEvent, id: '' })).toBe(false);
    expect(isValidMonitoringEvent({ ...validEvent, id: '   ' })).toBe(false);
    expect(isValidMonitoringEvent({ ...validEvent, id: undefined })).toBe(false);
  });

  it('rejects events with invalid timestamp', () => {
    expect(isValidMonitoringEvent({ ...validEvent, timestamp: -1 })).toBe(false);
    expect(isValidMonitoringEvent({ ...validEvent, timestamp: NaN })).toBe(false);
    expect(isValidMonitoringEvent({ ...validEvent, timestamp: Infinity })).toBe(false);
    expect(isValidMonitoringEvent({ ...validEvent, timestamp: 1000 })).toBe(false); // Far past
  });

  it('rejects events with invalid status', () => {
    expect(isValidMonitoringEvent({ ...validEvent, status: 'unknown' })).toBe(false);
    expect(isValidMonitoringEvent({ ...validEvent, status: 'danger' })).toBe(false);
    expect(isValidMonitoringEvent({ ...validEvent, status: '<script>' })).toBe(false);
  });

  it('rejects events with out-of-bounds or non-finite metric values', () => {
    expect(isValidMonitoringEvent({ ...validEvent, metric: -5 })).toBe(false);
    expect(isValidMonitoringEvent({ ...validEvent, metric: NaN })).toBe(false);
    expect(isValidMonitoringEvent({ ...validEvent, metric: Infinity })).toBe(false);
    expect(isValidMonitoringEvent({ ...validEvent, metric: 500000 })).toBe(false);
  });

  it('rejects oversized string fields', () => {
    const hugeMessage = 'A'.repeat(600);
    expect(isValidMonitoringEvent({ ...validEvent, message: hugeMessage })).toBe(false);
  });
});

describe('validate.ts - sanitizeAndValidateEvent', () => {
  it('sanitizes and trims string fields and formats metric', () => {
    const raw = {
      id: '  evt-trim-test  ',
      timestamp: 1718000000000,
      service: '  Database  ',
      status: 'warning',
      metric: 125.4567,
      message: '  High CPU spike  ',
    };

    const sanitized = sanitizeAndValidateEvent(raw);
    expect(sanitized).not.toBeNull();
    expect(sanitized?.id).toBe('evt-trim-test');
    expect(sanitized?.service).toBe('Database');
    expect(sanitized?.message).toBe('High CPU spike');
    expect(sanitized?.metric).toBe(125.46);
  });

  it('returns null for malformed items', () => {
    expect(sanitizeAndValidateEvent({ broken: true })).toBeNull();
    expect(sanitizeAndValidateEvent(null)).toBeNull();
  });
});
