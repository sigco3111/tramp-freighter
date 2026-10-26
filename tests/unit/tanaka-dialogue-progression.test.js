import { describe, it, expect } from 'vitest';
import { YUKI_TANAKA_DIALOGUE } from '../../src/game/data/dialogue/tanaka-dialogue.js';

function makeContext(overrides = {}) {
  return {
    getQuestStage: () => overrides.questStage ?? 0,
    getQuestState: () => overrides.questState ?? null,
    canStartQuestStage: () => false,
    checkQuestObjectives: () => false,
    hasClaimedStageRewards: () => false,
    canContributeSupply: () => false,
    getUnmetRequirements: () => [],
    ...overrides,
  };
}

describe('Tanaka greeting progression within NEUTRAL tier (pre-quest)', () => {
  const greeting = YUKI_TANAKA_DIALOGUE.greeting;

  it('shows cold greeting at rep 0-3', () => {
    const text = greeting.text(0, makeContext());
    expect(text).toContain('엔지니어예요');
    expect(text).toContain('할 일이 있어요');
  });

  it('shows acknowledging greeting at rep 4-6', () => {
    const text = greeting.text(4, makeContext());
    expect(text).toContain('충분했어요');
  });

  it('shows near-threshold greeting at rep 7-9', () => {
    const text = greeting.text(7, makeContext());
    expect(text).toContain('믿음직함');
  });

  it('still shows warm greeting at rep >= WARM_MIN', () => {
    const text = greeting.text(10, makeContext());
    expect(text).toContain('흥미로워요');
  });
});

describe('Tanaka supply response tiered by rep', () => {
  const supplyNode = YUKI_TANAKA_DIALOGUE.research_supply;

  it('returns transactional response at low rep (< 4)', () => {
    const text = supplyNode.text(2, makeContext());
    expect(text).toMatch(/부품을 빨리 소모/);
  });

  it('returns appreciative response at mid rep (4-6)', () => {
    const text = supplyNode.text(5, makeContext());
    expect(text).toMatch(/조달 서류 작업/);
  });

  it('returns personal response at high rep (>= 7)', () => {
    const text = supplyNode.text(8, makeContext());
    expect(text).toMatch(/격납 하우징/);
  });
});

describe('Tanaka stage 4 greeting (message delivery)', () => {
  const greeting = YUKI_TANAKA_DIALOGUE.greeting;

  it('reminds player about delivery destination when message not delivered', () => {
    const context = makeContext({
      questStage: 4,
      questState: { data: { messageDelivered: false } },
    });

    const text = greeting.text(50, context);
    expect(text).toContain('바스케스');
    expect(text).toContain('엡실론 에리다니');
    expect(text).not.toContain('개인적인 부탁 말인데요');
  });

  it('acknowledges delivery when message has been delivered', () => {
    const context = makeContext({
      questStage: 4,
      questState: { data: { messageDelivered: true } },
    });

    const text = greeting.text(50, context);
    expect(text).toContain('메시지를 전해 줬군요');
  });
});
