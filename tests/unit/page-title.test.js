import { describe, it, expect } from 'vitest';
import { getPageTitle } from '../../src/game/utils/page-title.js';

describe('getPageTitle', () => {
  it('returns base title for TITLE view mode', () => {
    expect(getPageTitle('TITLE')).toBe('트램프 프레이터 블루스');
  });

  it('returns descriptive title for ORBIT view mode', () => {
    expect(getPageTitle('ORBIT')).toBe('성도 - 트램프 프레이터 블루스');
  });

  it('returns descriptive title for STATION view mode', () => {
    expect(getPageTitle('STATION')).toBe('정거장 - 트램프 프레이터 블루스');
  });

  it('returns descriptive title for ENCOUNTER view mode', () => {
    expect(getPageTitle('ENCOUNTER')).toBe('조우 - 트램프 프레이터 블루스');
  });

  it('returns base title for unknown view mode', () => {
    expect(getPageTitle('UNKNOWN')).toBe('트램프 프레이터 블루스');
  });
});
