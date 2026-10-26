import { describe, it, expect } from 'vitest';
import {
  getKarmaLabel,
  getFactionLabel,
} from '../../src/features/achievements/StatsSection';

describe('getKarmaLabel', () => {
  it('returns Saint for karma >= 75', () => {
    expect(getKarmaLabel(75)).toBe('성인');
    expect(getKarmaLabel(100)).toBe('성인');
  });

  it('returns Virtuous for karma 50-74', () => {
    expect(getKarmaLabel(50)).toBe('선량');
    expect(getKarmaLabel(74)).toBe('선량');
  });

  it('returns Decent for karma 25-49', () => {
    expect(getKarmaLabel(25)).toBe('온건');
    expect(getKarmaLabel(49)).toBe('온건');
  });

  it('returns Neutral for karma -24 to 24', () => {
    expect(getKarmaLabel(0)).toBe('중립');
    expect(getKarmaLabel(24)).toBe('중립');
    expect(getKarmaLabel(-24)).toBe('중립');
  });

  it('returns Shady for karma -25 to -49', () => {
    expect(getKarmaLabel(-25)).toBe('수상쩍음');
    expect(getKarmaLabel(-49)).toBe('수상쩍음');
  });

  it('returns Ruthless for karma -50 to -74', () => {
    expect(getKarmaLabel(-50)).toBe('냉혹');
    expect(getKarmaLabel(-74)).toBe('냉혹');
  });

  it('returns Villain for karma <= -75', () => {
    expect(getKarmaLabel(-75)).toBe('악당');
    expect(getKarmaLabel(-100)).toBe('악당');
  });
});

describe('getFactionLabel', () => {
  it('returns Allied for rep >= 75', () => {
    expect(getFactionLabel(75)).toBe('동맹');
    expect(getFactionLabel(100)).toBe('동맹');
  });

  it('returns Respected for rep 50-74', () => {
    expect(getFactionLabel(50)).toBe('존경');
    expect(getFactionLabel(74)).toBe('존경');
  });

  it('returns Favorable for rep 25-49', () => {
    expect(getFactionLabel(25)).toBe('호의적');
    expect(getFactionLabel(49)).toBe('호의적');
  });

  it('returns Neutral for rep -24 to 24', () => {
    expect(getFactionLabel(0)).toBe('중립');
    expect(getFactionLabel(24)).toBe('중립');
    expect(getFactionLabel(-24)).toBe('중립');
  });

  it('returns Suspicious for rep -25 to -49', () => {
    expect(getFactionLabel(-25)).toBe('의심');
    expect(getFactionLabel(-49)).toBe('의심');
  });

  it('returns Hostile for rep -50 to -74', () => {
    expect(getFactionLabel(-50)).toBe('적대');
    expect(getFactionLabel(-74)).toBe('적대');
  });

  it('returns Enemy for rep <= -75', () => {
    expect(getFactionLabel(-75)).toBe('원수');
    expect(getFactionLabel(-100)).toBe('원수');
  });
});
