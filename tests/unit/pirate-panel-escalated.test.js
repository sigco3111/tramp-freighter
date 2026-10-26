import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

describe('PirateEncounterPanel Escalated Mode (#68/73)', () => {
  const source = readFileSync(
    'src/features/danger/PirateEncounterPanel.jsx',
    'utf-8'
  );

  it('should accept escalated prop', () => {
    expect(source).toContain('escalated');
  });

  it('should disable negotiate option when escalated', () => {
    expect(source).toContain("그들은 이미 대화를 끝냈습니다");
  });
});
