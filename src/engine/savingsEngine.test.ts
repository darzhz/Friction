import { describe, it, expect } from 'vitest';
import { computeMonthlyContribution, savingsProgress } from './savingsEngine';

describe('savingsEngine', () => {
  it('should compute monthly contribution correctly without target date', () => {
    // 12000 remaining, no date -> default 12 months -> 1000/mo
    const contribution = computeMonthlyContribution(12000, 0);
    expect(contribution).toBe(1000);
  });

  it('should compute monthly contribution correctly with target date', () => {
    // 6000 remaining, 6 months away -> 1000/mo
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    
    const contribution = computeMonthlyContribution(6000, 0, sixMonthsFromNow.getTime());
    expect(contribution).toBe(1000);
  });

  it('should return 0 if goal already reached', () => {
    const contribution = computeMonthlyContribution(5000, 5500);
    expect(contribution).toBe(0);
  });

  it('should return progress percent', () => {
    const progress = savingsProgress(10000, 2500);
    expect(progress.percent).toBe(25);
    expect(progress.status).toBe('on_track');
  });
});
