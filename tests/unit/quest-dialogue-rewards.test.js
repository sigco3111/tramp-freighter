import { describe, it, expect } from 'vitest';
import { YUKI_TANAKA_DIALOGUE } from '../../src/game/data/dialogue/tanaka-dialogue.js';

describe('Quest dialogue reward timing', () => {
  describe('completion dialogues claim rewards', () => {
    it('mission_1_complete choices have claimStageRewards action', () => {
      const node = YUKI_TANAKA_DIALOGUE.mission_1_complete;
      for (const choice of node.choices) {
        expect(choice.action).toBeTypeOf('function');
      }
    });

    it('mission_2_complete choices have claimStageRewards action', () => {
      const node = YUKI_TANAKA_DIALOGUE.mission_2_complete;
      for (const choice of node.choices) {
        expect(choice.action).toBeTypeOf('function');
      }
    });

    it('mission_3_complete choices have claimStageRewards action', () => {
      const node = YUKI_TANAKA_DIALOGUE.mission_3_complete;
      for (const choice of node.choices) {
        expect(choice.action).toBeTypeOf('function');
      }
    });

    it('mission_5_accepted choices have claimStageRewards action', () => {
      const node = YUKI_TANAKA_DIALOGUE.mission_5_accepted;
      for (const choice of node.choices) {
        expect(choice.action).toBeTypeOf('function');
      }
    });

    it('mission_4_complete node exists with claimStageRewards action', () => {
      const node = YUKI_TANAKA_DIALOGUE.mission_4_complete;
      expect(node).toBeDefined();
      for (const choice of node.choices) {
        expect(choice.action).toBeTypeOf('function');
      }
    });
  });

  describe('Design Note 1: mission_3_complete routes to greeting', () => {
    it('all mission_3_complete choices route to greeting, not mission_4_offer', () => {
      const node = YUKI_TANAKA_DIALOGUE.mission_3_complete;
      for (const choice of node.choices) {
        expect(choice.next).toBe('greeting');
      }
    });
  });

  describe('Tanaka backstory consistency with spec', () => {
    it('dialogue references sister leaving ten years ago, not fifteen', () => {
      const whyPavonis = YUKI_TANAKA_DIALOGUE.why_pavonis;
      expect(whyPavonis.text).toContain('십 년 전에');
      expect(whyPavonis.text).not.toContain('십오 년 전에');
    });

    it('sister dialogue references ten years, not fifteen', () => {
      const sister = YUKI_TANAKA_DIALOGUE.sister;
      expect(sister.text).toContain('십 년');
      expect(sister.text).not.toContain('십오 년');
    });
  });

  describe('Design Note 2: completion choices hide after rewards claimed', () => {
    const completionChoiceTexts = [
      '"데이터가 잘 나와서 다행이에요. 배가 거기서 잘 움직였어요."',
      '"찾느라 고생했지만 그럴 가치가 있었어요."',
      '"당신 솜씨가 인상적이에요, 타나카. 배가 다르게 느껴져요."',
    ];

    it('completion greeting choices have condition checking hasClaimedStageRewards', () => {
      const greetingChoices = YUKI_TANAKA_DIALOGUE.greeting.choices;
      for (const text of completionChoiceTexts) {
        const choice = greetingChoices.find((c) => c.text === text);
        expect(choice, `choice "${text}" should exist`).toBeDefined();
        expect(
          choice.condition,
          `choice "${text}" should have a condition`
        ).toBeTypeOf('function');

        // Condition should return false when hasClaimedStageRewards returns true
        const mockGSM = {
          getQuestStage: () => {
            if (text.includes('데이터가 잘 나와서')) return 1;
            if (text.includes('찾느라 고생')) return 2;
            if (text.includes('인상적')) return 3;
            return 0;
          },
          checkQuestObjectives: () => true,
          hasClaimedStageRewards: () => true,
        };
        expect(
          choice.condition(50, mockGSM),
          `choice "${text}" should be hidden after rewards claimed`
        ).toBe(false);
      }
    });

    it('mission_4_complete greeting choice exists', () => {
      const greetingChoices = YUKI_TANAKA_DIALOGUE.greeting.choices;
      const choice = greetingChoices.find((c) =>
        c.text.includes('바스케스는 이해했어요')
      );
      expect(choice).toBeDefined();
      expect(choice.next).toBe('mission_4_complete');
    });
  });
});
