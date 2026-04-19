import { describe, it, expect } from 'vitest';
import { parseUPILink } from './upiParser';

describe('upiParser', () => {
  it('should parse a valid full UPI link', () => {
    const raw = 'upi://pay?pa=merchant@okaxis&pn=Merchant%20Name&am=250.00&cu=INR&tn=Dinner';
    const payload = parseUPILink(raw);
    
    expect(payload).not.toBeNull();
    expect(payload?.pa).toBe('merchant@okaxis');
    expect(payload?.pn).toBe('Merchant Name');
    expect(payload?.am).toBe(250);
    expect(payload?.cu).toBe('INR');
    expect(payload?.tn).toBe('Dinner');
  });

  it('should parse a raw query string as a UPI link', () => {
    const raw = 'pa=friend@upi&pn=Friend&am=100';
    const payload = parseUPILink(raw);
    
    expect(payload).not.toBeNull();
    expect(payload?.pa).toBe('friend@upi');
    expect(payload?.pn).toBe('Friend');
    expect(payload?.am).toBe(100);
  });

  it('should return null for malformed links missing pa', () => {
    const raw = 'upi://pay?pn=NoVPA&am=100';
    const payload = parseUPILink(raw);
    expect(payload).toBeNull();
  });

  it('should handle zero amount', () => {
    const raw = 'upi://pay?pa=test@upi&pn=Test';
    const payload = parseUPILink(raw);
    expect(payload?.am).toBe(0);
  });

  it('should handle non-numeric amount gracefully', () => {
    const raw = 'upi://pay?pa=test@upi&am=invalid';
    const payload = parseUPILink(raw);
    expect(payload?.am).toBe(0);
  });
});
