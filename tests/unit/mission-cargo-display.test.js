import { describe, it, expect } from 'vitest';
import { formatCargoDisplayName } from '../../src/game/utils/string-utils.js';

describe('Mission Cargo Display Names', () => {
  describe('formatCargoDisplayName', () => {
    it('converts underscored mission cargo IDs to title case', () => {
      expect(formatCargoDisplayName('registered_freight')).toBe(
        '등록 화물'
      );
    });

    it('converts multi-word illegal cargo IDs to title case', () => {
      expect(formatCargoDisplayName('black_market_goods')).toBe(
        '암시장 물품'
      );
    });

    it('handles single-word goods by capitalizing first letter', () => {
      expect(formatCargoDisplayName('grain')).toBe('곡물');
    });

    it('handles empty or null input gracefully', () => {
      expect(formatCargoDisplayName('')).toBe('');
      expect(formatCargoDisplayName(null)).toBe('');
      expect(formatCargoDisplayName(undefined)).toBe('');
    });

    it('formats underscored commodity names used in inspections', () => {
      expect(formatCargoDisplayName('unmarked_crates')).toBe('무표기 상자');
      expect(formatCargoDisplayName('alien_artifacts')).toBe('Alien Artifacts');
    });

    it('formats a list of restricted item IDs for display', () => {
      const restrictedItems = ['unmarked_crates', 'alien_artifacts'];
      const formatted = restrictedItems.map(formatCargoDisplayName).join(', ');
      expect(formatted).toBe('무표기 상자, Alien Artifacts');
    });
  });
});
