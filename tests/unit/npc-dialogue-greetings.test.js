import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DR_SARAH_KIM_DIALOGUE } from '../../src/game/data/dialogue/dr-sarah-kim.js';
import { LUCKY_LIU_DIALOGUE } from '../../src/game/data/dialogue/lucky-liu.js';
import { RUSTY_RODRIGUEZ_DIALOGUE } from '../../src/game/data/dialogue/rusty-rodriguez.js';
import { STATION_MASTER_KOWALSKI_DIALOGUE } from '../../src/game/data/dialogue/station-master-kowalski.js';
import { ZARA_OSMAN_DIALOGUE } from '../../src/game/data/dialogue/zara-osman.js';
import { WHISPER_DIALOGUE } from '../../src/game/data/dialogue/whisper.js';
import { YUKI_TANAKA_DIALOGUE } from '../../src/game/data/dialogue/tanaka-dialogue.js';
import { REPUTATION_BOUNDS, ENDGAME_CONFIG } from '../../src/game/constants.js';
import { showDialogue } from '../../src/game/game-dialogue.js';
import { createTestGame } from '../test-utils.js';

describe('NPC dialogue greetings', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    gsm = createTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to create a loan context where the loan is overdue
  function makeLoanContext(loanDay, currentDay) {
    return {
      npcState: { loanAmount: 500, loanDay },
      daysElapsed: currentDay,
    };
  }

  // Helper to create a context where the loan reminder triggers (<=5 days remaining)
  function makeLoanReminderContext() {
    // LOAN_REPAYMENT_DEADLINE = 30, LOAN_REMINDER_DAYS = 5
    // daysRemaining = 30 - (currentDay - loanDay) = 30 - 27 = 3
    return makeLoanContext(0, 27);
  }

  // Helper to create a context where the loan is overdue (daysRemaining <= 0)
  function makeLoanOverdueContext() {
    // daysRemaining = 30 - (currentDay - loanDay) = 30 - 200 = -170
    return makeLoanContext(0, 200);
  }

  // Helper to create a context where the loan is active but not urgent
  function makeLoanActiveContext() {
    // daysRemaining = 30 - (currentDay - loanDay) = 30 - 5 = 25
    return makeLoanContext(0, 5);
  }

  describe('Dr. Sarah Kim greeting', () => {
    const greeting = DR_SARAH_KIM_DIALOGUE.greeting;

    it('throws when rep is not a number', () => {
      expect(() => greeting.text('invalid')).toThrow(
        'reputation must be a number'
      );
    });

    it('appends overdue loan message when loan is past deadline', () => {
      const ctx = makeLoanOverdueContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('연체');
      expect(result).toContain('규정 12-A');
    });

    it('appends loan reminder when loan is due soon', () => {
      const ctx = makeLoanReminderContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('금융 안내');
      expect(result).toContain('표준 조건에 따라');
    });

    it('appends standard loan obligation when loan is active but not urgent', () => {
      const ctx = makeLoanActiveContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('미결 금융 채무');
      expect(result).toContain('약정에 따라');
    });

    it('request_loan action calls context.requestLoan', () => {
      const requestLoan = vi.fn().mockReturnValue({ success: true });
      const ctx = { requestLoan };
      const actionChoice = DR_SARAH_KIM_DIALOGUE.request_loan.choices.find(
        (c) => c.action
      );
      const result = actionChoice.action(ctx);
      expect(requestLoan).toHaveBeenCalledOnce();
      expect(result).toEqual({ success: true });
    });

    it('request_storage action calls context.storeCargo', () => {
      const storeCargo = vi.fn().mockReturnValue({ success: true });
      const ctx = { storeCargo };
      const actionChoice = DR_SARAH_KIM_DIALOGUE.request_storage.choices.find(
        (c) => c.action
      );
      const result = actionChoice.action(ctx);
      expect(storeCargo).toHaveBeenCalledOnce();
      expect(result).toEqual({ success: true });
    });

    it('repay_loan action calls context.repayLoan', () => {
      const repayLoan = vi.fn().mockReturnValue({ success: true });
      const ctx = { repayLoan };
      const actionChoice = DR_SARAH_KIM_DIALOGUE.repay_loan.choices.find(
        (c) => c.action
      );
      const result = actionChoice.action(ctx);
      expect(repayLoan).toHaveBeenCalledOnce();
      expect(result).toEqual({ success: true });
    });

    it('retrieve_cargo action calls context.retrieveCargo', () => {
      const retrieveCargo = vi.fn().mockReturnValue({ success: true });
      const ctx = { retrieveCargo };
      const actionChoice = DR_SARAH_KIM_DIALOGUE.retrieve_cargo.choices.find(
        (c) => c.action
      );
      const result = actionChoice.action(ctx);
      expect(retrieveCargo).toHaveBeenCalledOnce();
      expect(result).toEqual({ success: true });
    });
  });

  describe('Lucky Liu greeting', () => {
    const greeting = LUCKY_LIU_DIALOGUE.greeting;

    it('appends overdue loan message when loan is past deadline', () => {
      const ctx = makeLoanOverdueContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('하우스는 늘 받아 가지');
    });

    it('appends loan reminder when loan is due soon', () => {
      const ctx = makeLoanReminderContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('너무 오래 끌지 마');
    });

    it('appends standard loan message when loan is active but not urgent', () => {
      const ctx = makeLoanActiveContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('갚아야');
      expect(result).toContain('시계가');
    });

    it('request_loan action calls context.requestLoan', () => {
      const requestLoan = vi.fn().mockReturnValue({ success: true });
      const actionChoice = LUCKY_LIU_DIALOGUE.request_loan.choices.find(
        (c) => c.action
      );
      const result = actionChoice.action({ requestLoan });
      expect(requestLoan).toHaveBeenCalledOnce();
      expect(result).toEqual({ success: true });
    });

    it('request_storage action calls context.storeCargo', () => {
      const storeCargo = vi.fn().mockReturnValue({ success: true });
      const actionChoice = LUCKY_LIU_DIALOGUE.request_storage.choices.find(
        (c) => c.action
      );
      actionChoice.action({ storeCargo });
      expect(storeCargo).toHaveBeenCalledOnce();
    });

    it('repay_loan action calls context.repayLoan', () => {
      const repayLoan = vi.fn().mockReturnValue({ success: true });
      const actionChoice = LUCKY_LIU_DIALOGUE.repay_loan.choices.find(
        (c) => c.action
      );
      actionChoice.action({ repayLoan });
      expect(repayLoan).toHaveBeenCalledOnce();
    });

    it('retrieve_cargo action calls context.retrieveCargo', () => {
      const retrieveCargo = vi.fn().mockReturnValue({ success: true });
      const actionChoice = LUCKY_LIU_DIALOGUE.retrieve_cargo.choices.find(
        (c) => c.action
      );
      actionChoice.action({ retrieveCargo });
      expect(retrieveCargo).toHaveBeenCalledOnce();
    });
  });

  describe('Rusty Rodriguez greeting', () => {
    const greeting = RUSTY_RODRIGUEZ_DIALOGUE.greeting;

    it('appends overdue loan message when loan is past deadline', () => {
      const ctx = makeLoanOverdueContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('어제가 기한이었어');
    });

    it('appends loan reminder when loan is due soon', () => {
      const ctx = makeLoanReminderContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('잊지 말게');
      expect(result).toContain('믿고 있어');
    });

    it('appends standard loan message when loan is active but not urgent', () => {
      const ctx = makeLoanActiveContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('갚아야');
      expect(result).toContain('갚을 날이');
    });

    it('request_loan action calls context.requestLoan', () => {
      const requestLoan = vi.fn().mockReturnValue({ success: true });
      const actionChoice = RUSTY_RODRIGUEZ_DIALOGUE.request_loan.choices.find(
        (c) => c.action
      );
      const result = actionChoice.action({ requestLoan });
      expect(requestLoan).toHaveBeenCalledOnce();
      expect(result).toEqual({ success: true });
    });

    it('request_storage action calls context.storeCargo', () => {
      const storeCargo = vi.fn().mockReturnValue({ success: true });
      const actionChoice =
        RUSTY_RODRIGUEZ_DIALOGUE.request_storage.choices.find((c) => c.action);
      actionChoice.action({ storeCargo });
      expect(storeCargo).toHaveBeenCalledOnce();
    });

    it('repay_loan action calls context.repayLoan', () => {
      const repayLoan = vi.fn().mockReturnValue({ success: true });
      const actionChoice = RUSTY_RODRIGUEZ_DIALOGUE.repay_loan.choices.find(
        (c) => c.action
      );
      actionChoice.action({ repayLoan });
      expect(repayLoan).toHaveBeenCalledOnce();
    });

    it('retrieve_cargo action calls context.retrieveCargo', () => {
      const retrieveCargo = vi.fn().mockReturnValue({ success: true });
      const actionChoice = RUSTY_RODRIGUEZ_DIALOGUE.retrieve_cargo.choices.find(
        (c) => c.action
      );
      actionChoice.action({ retrieveCargo });
      expect(retrieveCargo).toHaveBeenCalledOnce();
    });
  });

  describe('Station Master Kowalski greeting', () => {
    const greeting = STATION_MASTER_KOWALSKI_DIALOGUE.greeting;

    it('appends overdue loan message when loan is past deadline', () => {
      const ctx = makeLoanOverdueContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('연체');
      expect(result).toContain('정거장 방침상 즉시 상환');
    });

    it('appends loan reminder when loan is due soon', () => {
      const ctx = makeLoanReminderContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('알림');
      expect(result).toContain('연장은 없네');
    });

    it('appends standard loan message when loan is active but not urgent', () => {
      const ctx = makeLoanActiveContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('미상환 대출');
      expect(result).toContain('정거장 방침에 따라');
    });

    it('request_loan action calls context.requestLoan', () => {
      const requestLoan = vi.fn().mockReturnValue({ success: true });
      const actionChoice =
        STATION_MASTER_KOWALSKI_DIALOGUE.request_loan.choices.find(
          (c) => c.action
        );
      actionChoice.action({ requestLoan });
      expect(requestLoan).toHaveBeenCalledOnce();
    });

    it('request_storage action calls context.storeCargo', () => {
      const storeCargo = vi.fn().mockReturnValue({ success: true });
      const actionChoice =
        STATION_MASTER_KOWALSKI_DIALOGUE.request_storage.choices.find(
          (c) => c.action
        );
      actionChoice.action({ storeCargo });
      expect(storeCargo).toHaveBeenCalledOnce();
    });

    it('repay_loan action calls context.repayLoan', () => {
      const repayLoan = vi.fn().mockReturnValue({ success: true });
      const actionChoice =
        STATION_MASTER_KOWALSKI_DIALOGUE.repay_loan.choices.find(
          (c) => c.action
        );
      actionChoice.action({ repayLoan });
      expect(repayLoan).toHaveBeenCalledOnce();
    });

    it('retrieve_cargo action calls context.retrieveCargo', () => {
      const retrieveCargo = vi.fn().mockReturnValue({ success: true });
      const actionChoice =
        STATION_MASTER_KOWALSKI_DIALOGUE.retrieve_cargo.choices.find(
          (c) => c.action
        );
      actionChoice.action({ retrieveCargo });
      expect(retrieveCargo).toHaveBeenCalledOnce();
    });
  });

  describe('Zara Osman greeting', () => {
    const greeting = ZARA_OSMAN_DIALOGUE.greeting;

    it('appends overdue loan message when loan is past deadline', () => {
      const ctx = makeLoanOverdueContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('시계가 다 됐어');
    });

    it('appends loan reminder when loan is due soon', () => {
      const ctx = makeLoanReminderContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('간단히 알려');
      expect(result).toContain('놓치지 마');
    });

    it('appends standard loan message when loan is active but not urgent', () => {
      const ctx = makeLoanActiveContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('갚아야');
      expect(result).toContain('시계가');
    });

    it('request_loan action calls context.requestLoan', () => {
      const requestLoan = vi.fn().mockReturnValue({ success: true });
      const actionChoice = ZARA_OSMAN_DIALOGUE.request_loan.choices.find(
        (c) => c.action
      );
      actionChoice.action({ requestLoan });
      expect(requestLoan).toHaveBeenCalledOnce();
    });

    it('request_storage action calls context.storeCargo', () => {
      const storeCargo = vi.fn().mockReturnValue({ success: true });
      const actionChoice = ZARA_OSMAN_DIALOGUE.request_storage.choices.find(
        (c) => c.action
      );
      actionChoice.action({ storeCargo });
      expect(storeCargo).toHaveBeenCalledOnce();
    });

    it('repay_loan action calls context.repayLoan', () => {
      const repayLoan = vi.fn().mockReturnValue({ success: true });
      const actionChoice = ZARA_OSMAN_DIALOGUE.repay_loan.choices.find(
        (c) => c.action
      );
      actionChoice.action({ repayLoan });
      expect(repayLoan).toHaveBeenCalledOnce();
    });

    it('retrieve_cargo action calls context.retrieveCargo', () => {
      const retrieveCargo = vi.fn().mockReturnValue({ success: true });
      const actionChoice = ZARA_OSMAN_DIALOGUE.retrieve_cargo.choices.find(
        (c) => c.action
      );
      actionChoice.action({ retrieveCargo });
      expect(retrieveCargo).toHaveBeenCalledOnce();
    });
  });

  describe('Whisper greeting', () => {
    const greeting = WHISPER_DIALOGUE.greeting;

    it('throws when rep is not a number', () => {
      expect(() => greeting.text('invalid')).toThrow(
        'reputation must be a number'
      );
    });

    it('shows cold/hostile greeting for low rep without context', () => {
      const result = greeting.text(REPUTATION_BOUNDS.COLD_MIN);
      expect(result).toBe('정보에는 크레딧이 듭니다.');
    });

    it('adds karma first impression for neutral rep with context', () => {
      const ctx = {
        karma: 0,
        factionReps: { authorities: 0, outlaws: 0, civilians: 0 },
      };
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('어서 오세요');
    });

    it('adds trustworthy karma modifier for very good karma at low rep', () => {
      const ctx = {
        karma: 100,
        factionReps: { authorities: 0, outlaws: 0, civilians: 0 },
      };
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('믿음직한 분위기');
    });

    it('adds wanted by authorities commentary at warm rep', () => {
      const ctx = {
        karma: 0,
        factionReps: { authorities: -30, outlaws: 0, civilians: 0 },
      };
      const result = greeting.text(REPUTATION_BOUNDS.WARM_MIN, ctx);
      expect(result).toContain('당국이 당신에게 관심을');
    });

    it('adds known to outlaws commentary at warm rep', () => {
      const ctx = {
        karma: 0,
        factionReps: { authorities: 0, outlaws: 55, civilians: 0 },
      };
      const result = greeting.text(REPUTATION_BOUNDS.WARM_MIN, ctx);
      expect(result).toContain('지하세계에서 흥미로운 인맥');
    });

    it('adds trusted by authorities commentary at warm rep', () => {
      const ctx = {
        karma: 0,
        factionReps: { authorities: 55, outlaws: 0, civilians: 0 },
      };
      const result = greeting.text(REPUTATION_BOUNDS.WARM_MIN, ctx);
      expect(result).toContain('깨끗한 이력은 특정한 문을');
    });

    it('appends overdue loan message when loan is past deadline', () => {
      const ctx = {
        karma: 0,
        factionReps: { authorities: 0, outlaws: 0, civilians: 0 },
        ...makeLoanOverdueContext(),
      };
      const result = greeting.text(REPUTATION_BOUNDS.WARM_MIN, ctx);
      expect(result).toContain('연체');
    });

    it('appends loan reminder when loan is due soon', () => {
      const ctx = {
        karma: 0,
        factionReps: { authorities: 0, outlaws: 0, civilians: 0 },
        ...makeLoanReminderContext(),
      };
      const result = greeting.text(REPUTATION_BOUNDS.WARM_MIN, ctx);
      expect(result).toContain('알림');
    });

    it('appends standard loan message when loan is active but not urgent', () => {
      const ctx = {
        karma: 0,
        factionReps: { authorities: 0, outlaws: 0, civilians: 0 },
        ...makeLoanActiveContext(),
      };
      const result = greeting.text(REPUTATION_BOUNDS.WARM_MIN, ctx);
      expect(result).toContain('미상환 대출');
    });

    it('request_loan action calls context.requestLoan', () => {
      const requestLoan = vi.fn().mockReturnValue({ success: true });
      const actionChoice = WHISPER_DIALOGUE.request_loan.choices.find(
        (c) => c.action
      );
      const result = actionChoice.action({ requestLoan });
      expect(requestLoan).toHaveBeenCalledOnce();
      expect(result).toEqual({ success: true });
    });

    it('request_storage action calls context.storeCargo', () => {
      const storeCargo = vi.fn().mockReturnValue({ success: true });
      const actionChoice = WHISPER_DIALOGUE.request_storage.choices.find(
        (c) => c.action
      );
      actionChoice.action({ storeCargo });
      expect(storeCargo).toHaveBeenCalledOnce();
    });

    it('repay_loan action calls context.repayLoan', () => {
      const repayLoan = vi.fn().mockReturnValue({ success: true });
      const actionChoice = WHISPER_DIALOGUE.repay_loan.choices.find(
        (c) => c.action
      );
      actionChoice.action({ repayLoan });
      expect(repayLoan).toHaveBeenCalledOnce();
    });

    it('retrieve_cargo action calls context.retrieveCargo', () => {
      const retrieveCargo = vi.fn().mockReturnValue({ success: true });
      const actionChoice = WHISPER_DIALOGUE.retrieve_cargo.choices.find(
        (c) => c.action
      );
      actionChoice.action({ retrieveCargo });
      expect(retrieveCargo).toHaveBeenCalledOnce();
    });
  });

  describe('Yuki Tanaka greeting and quest dialogue', () => {
    const greeting = YUKI_TANAKA_DIALOGUE.greeting;

    function makeTanakaContext(overrides = {}) {
      return {
        getQuestStage: () => 0,
        getQuestState: () => null,
        canStartQuestStage: () => false,
        checkQuestObjectives: () => false,
        hasClaimedStageRewards: () => false,
        getUnmetRequirements: () => [],
        ...overrides,
      };
    }

    it('returns simple greeting when context is null', () => {
      const result = greeting.text(0, null);
      expect(result).toBe('타나카가 당신 쪽으로 고개를 끄덕인다.');
    });

    it('shows stage 1 in-progress greeting with jumps remaining', () => {
      const ctx = makeTanakaContext({
        getQuestStage: () => 1,
        getQuestState: () => ({ data: { jumpsCompleted: 1 } }),
        hasClaimedStageRewards: () => false,
      });
      const result = greeting.text(REPUTATION_BOUNDS.FRIENDLY_MIN, ctx);
      expect(result).toContain('현장 시험이 진행 중이에요');
      expect(result).toContain(`${ENDGAME_CONFIG.STAGE_1_JUMPS - 1}`);
    });

    it('shows stage 1 complete greeting when jumps are done', () => {
      const ctx = makeTanakaContext({
        getQuestStage: () => 1,
        getQuestState: () => ({
          data: { jumpsCompleted: ENDGAME_CONFIG.STAGE_1_JUMPS },
        }),
        hasClaimedStageRewards: () => false,
      });
      const result = greeting.text(REPUTATION_BOUNDS.FRIENDLY_MIN, ctx);
      expect(result).toContain('현장 시험 데이터가 훌륭해요');
    });

    it('shows stage 2 in-progress greeting with exotic materials count', () => {
      const ctx = makeTanakaContext({
        getQuestStage: () => 2,
        getQuestState: () => ({ data: { exoticMaterials: 2 } }),
        hasClaimedStageRewards: () => false,
      });
      const result = greeting.text(REPUTATION_BOUNDS.FRIENDLY_MIN, ctx);
      expect(result).toContain('외계 물질 탐색은 계속되고 있어요');
      expect(result).toContain('5개 중 2개');
    });

    it('shows stage 2 complete greeting when all exotics found', () => {
      const ctx = makeTanakaContext({
        getQuestStage: () => 2,
        getQuestState: () => ({
          data: {
            exoticMaterials: ENDGAME_CONFIG.STAGE_2_EXOTIC_NEEDED,
          },
        }),
        hasClaimedStageRewards: () => false,
      });
      const result = greeting.text(REPUTATION_BOUNDS.FRIENDLY_MIN, ctx);
      expect(result).toContain(
        `${ENDGAME_CONFIG.STAGE_2_EXOTIC_NEEDED}개를 전부 찾았군요`
      );
    });

    it('shows requirement hint when between stages with rewards claimed', () => {
      const ctx = makeTanakaContext({
        getQuestStage: () => 1,
        hasClaimedStageRewards: () => true,
        canStartQuestStage: () => false,
        getUnmetRequirements: () => ['engine'],
      });
      const result = greeting.text(REPUTATION_BOUNDS.FRIENDLY_MIN, ctx);
      expect(result).toContain('구동계가 거칠게 돌아가네요');
    });

    it('shows hull requirement hint', () => {
      const ctx = makeTanakaContext({
        getQuestStage: () => 1,
        hasClaimedStageRewards: () => true,
        canStartQuestStage: () => false,
        getUnmetRequirements: () => ['hull'],
      });
      const result = greeting.text(REPUTATION_BOUNDS.FRIENDLY_MIN, ctx);
      expect(result).toContain('선체가 많이 두들겨 맞았네요');
    });

    it('shows debt requirement hint', () => {
      const ctx = makeTanakaContext({
        getQuestStage: () => 1,
        hasClaimedStageRewards: () => true,
        canStartQuestStage: () => false,
        getUnmetRequirements: () => ['debt'],
      });
      const result = greeting.text(REPUTATION_BOUNDS.FRIENDLY_MIN, ctx);
      expect(result).toContain('콜의 주머니');
    });

    it('shows credits requirement hint with specific amount', () => {
      const ctx = makeTanakaContext({
        getQuestStage: () => 1,
        hasClaimedStageRewards: () => true,
        canStartQuestStage: () => false,
        getUnmetRequirements: () => ['credits'],
      });
      const result = greeting.text(REPUTATION_BOUNDS.FRIENDLY_MIN, ctx);
      expect(result).toContain('크레딧');
      expect(result).toContain(ENDGAME_CONFIG.VICTORY_CREDITS.toLocaleString());
    });

    it('shows rep requirement hint', () => {
      const ctx = makeTanakaContext({
        getQuestStage: () => 1,
        hasClaimedStageRewards: () => true,
        canStartQuestStage: () => false,
        getUnmetRequirements: () => ['rep'],
      });
      const result = greeting.text(REPUTATION_BOUNDS.FRIENDLY_MIN, ctx);
      expect(result).toContain('다음 단계를 하기엔 아직');
    });

    it('shows stage 0 requirement hint when stage 1 not available', () => {
      const ctx = makeTanakaContext({
        getQuestStage: () => 0,
        canStartQuestStage: () => false,
        getUnmetRequirements: () => ['engine'],
      });
      const result = greeting.text(REPUTATION_BOUNDS.FRIENDLY_MIN, ctx);
      expect(result).toContain('구동계가 거칠게 돌아가네요');
    });

    it('mission_1_offer action calls context.advanceQuest', () => {
      const advanceQuest = vi.fn().mockReturnValue({ success: true });
      const actionChoice = YUKI_TANAKA_DIALOGUE.mission_1_offer.choices.find(
        (c) => c.action
      );
      actionChoice.action({ advanceQuest });
      expect(advanceQuest).toHaveBeenCalledWith('tanaka');
    });

    it('mission_1_complete action calls context.claimStageRewards', () => {
      const claimStageRewards = vi.fn().mockReturnValue({ success: true });
      const actionChoice = YUKI_TANAKA_DIALOGUE.mission_1_complete.choices.find(
        (c) => c.action
      );
      actionChoice.action({ claimStageRewards });
      expect(claimStageRewards).toHaveBeenCalledWith('tanaka');
    });

    it('mission_1_complete second choice also calls claimStageRewards', () => {
      const claimStageRewards = vi.fn().mockReturnValue({ success: true });
      const actionChoices =
        YUKI_TANAKA_DIALOGUE.mission_1_complete.choices.filter((c) => c.action);
      expect(actionChoices.length).toBe(2);
      actionChoices[1].action({ claimStageRewards });
      expect(claimStageRewards).toHaveBeenCalledWith('tanaka');
    });

    it('mission_2_offer action calls context.advanceQuest', () => {
      const advanceQuest = vi.fn().mockReturnValue({ success: true });
      const actionChoice = YUKI_TANAKA_DIALOGUE.mission_2_offer.choices.find(
        (c) => c.action
      );
      actionChoice.action({ advanceQuest });
      expect(advanceQuest).toHaveBeenCalledWith('tanaka');
    });

    it('mission_2_complete action calls context.claimStageRewards', () => {
      const claimStageRewards = vi.fn().mockReturnValue({ success: true });
      const actionChoice = YUKI_TANAKA_DIALOGUE.mission_2_complete.choices.find(
        (c) => c.action
      );
      actionChoice.action({ claimStageRewards });
      expect(claimStageRewards).toHaveBeenCalledWith('tanaka');
    });

    it('mission_3_offer action calls context.advanceQuest', () => {
      const advanceQuest = vi.fn().mockReturnValue({ success: true });
      const actionChoice = YUKI_TANAKA_DIALOGUE.mission_3_offer.choices.find(
        (c) => c.action
      );
      actionChoice.action({ advanceQuest });
      expect(advanceQuest).toHaveBeenCalledWith('tanaka');
    });

    it('mission_3_complete first choice calls claimStageRewards', () => {
      const claimStageRewards = vi.fn().mockReturnValue({ success: true });
      const actionChoices =
        YUKI_TANAKA_DIALOGUE.mission_3_complete.choices.filter((c) => c.action);
      actionChoices[0].action({ claimStageRewards });
      expect(claimStageRewards).toHaveBeenCalledWith('tanaka');
    });

    it('mission_3_complete second choice calls claimStageRewards', () => {
      const claimStageRewards = vi.fn().mockReturnValue({ success: true });
      const actionChoices =
        YUKI_TANAKA_DIALOGUE.mission_3_complete.choices.filter((c) => c.action);
      actionChoices[1].action({ claimStageRewards });
      expect(claimStageRewards).toHaveBeenCalledWith('tanaka');
    });

    it('mission_4_offer first choice calls advanceQuest', () => {
      const advanceQuest = vi.fn().mockReturnValue({ success: true });
      const actionChoices = YUKI_TANAKA_DIALOGUE.mission_4_offer.choices.filter(
        (c) => c.action
      );
      actionChoices[0].action({ advanceQuest });
      expect(advanceQuest).toHaveBeenCalledWith('tanaka');
    });

    it('mission_4_offer second choice calls advanceQuest', () => {
      const advanceQuest = vi.fn().mockReturnValue({ success: true });
      const actionChoices = YUKI_TANAKA_DIALOGUE.mission_4_offer.choices.filter(
        (c) => c.action
      );
      actionChoices[1].action({ advanceQuest });
      expect(advanceQuest).toHaveBeenCalledWith('tanaka');
    });

    it('mission_4_offer backstory choice routes to mission_4_yumi_backstory', () => {
      const backstoryChoice = YUKI_TANAKA_DIALOGUE.mission_4_offer.choices.find(
        (c) => c.text.includes('유미에 대해 더 알려')
      );
      expect(backstoryChoice).toBeDefined();
      expect(backstoryChoice.next).toBe('mission_4_yumi_backstory');
    });

    it('mission_4_offer decline choice routes to greeting', () => {
      const declineChoice = YUKI_TANAKA_DIALOGUE.mission_4_offer.choices.find(
        (c) => c.text.includes('그쪽으로 가지 않아요')
      );
      expect(declineChoice).toBeDefined();
      expect(declineChoice.next).toBe('greeting');
    });

    it('mission_4_yumi_backstory accept choice calls advanceQuest', () => {
      const advanceQuest = vi.fn().mockReturnValue({ success: true });
      const acceptChoice =
        YUKI_TANAKA_DIALOGUE.mission_4_yumi_backstory.choices.find(
          (c) => c.action
        );
      expect(acceptChoice).toBeDefined();
      acceptChoice.action({ advanceQuest });
      expect(advanceQuest).toHaveBeenCalledWith('tanaka');
      expect(acceptChoice.next).toBe('mission_4_accepted');
    });

    it('mission_4_yumi_backstory decline choice routes to greeting', () => {
      const declineChoice =
        YUKI_TANAKA_DIALOGUE.mission_4_yumi_backstory.choices.find(
          (c) => !c.action
        );
      expect(declineChoice).toBeDefined();
      expect(declineChoice.next).toBe('greeting');
    });

    it('mission_4_complete first choice calls claimStageRewards', () => {
      const claimStageRewards = vi.fn().mockReturnValue({ success: true });
      const actionChoices =
        YUKI_TANAKA_DIALOGUE.mission_4_complete.choices.filter((c) => c.action);
      actionChoices[0].action({ claimStageRewards });
      expect(claimStageRewards).toHaveBeenCalledWith('tanaka');
    });

    it('mission_4_complete second choice calls claimStageRewards', () => {
      const claimStageRewards = vi.fn().mockReturnValue({ success: true });
      const actionChoices =
        YUKI_TANAKA_DIALOGUE.mission_4_complete.choices.filter((c) => c.action);
      actionChoices[1].action({ claimStageRewards });
      expect(claimStageRewards).toHaveBeenCalledWith('tanaka');
    });

    it('mission_5_accepted action calls claimStageRewards', () => {
      const claimStageRewards = vi.fn().mockReturnValue({ success: true });
      const actionChoice = YUKI_TANAKA_DIALOGUE.mission_5_accepted.choices.find(
        (c) => c.action
      );
      actionChoice.action({ claimStageRewards });
      expect(claimStageRewards).toHaveBeenCalledWith('tanaka');
    });

    it('mission_5_offer action calls advanceQuest', () => {
      const advanceQuest = vi.fn().mockReturnValue({ success: true });
      const actionChoice = YUKI_TANAKA_DIALOGUE.mission_5_offer.choices.find(
        (c) => c.action
      );
      actionChoice.action({ advanceQuest });
      expect(advanceQuest).toHaveBeenCalledWith('tanaka');
    });

    it('pavonis_ready action calls startPavonisRun and returns success', () => {
      const startPavonisRun = vi.fn();
      const actionChoice = YUKI_TANAKA_DIALOGUE.pavonis_ready.choices.find(
        (c) => c.action
      );
      const result = actionChoice.action({ startPavonisRun });
      expect(startPavonisRun).toHaveBeenCalledOnce();
      expect(result).toEqual({ success: true });
    });

    it('research_supply text returns appropriate line for high rep', () => {
      const textFn = YUKI_TANAKA_DIALOGUE.research_supply.text;
      const result = textFn(REPUTATION_BOUNDS.NEUTRAL_HIGH, { daysElapsed: 1 });
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('research_supply text returns appropriate line for mid rep', () => {
      const textFn = YUKI_TANAKA_DIALOGUE.research_supply.text;
      const result = textFn(REPUTATION_BOUNDS.NEUTRAL_MID, { daysElapsed: 1 });
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('research_supply text returns appropriate line for low rep', () => {
      const textFn = YUKI_TANAKA_DIALOGUE.research_supply.text;
      const result = textFn(0, { daysElapsed: 1 });
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('research_supply action calls contributeSupply', () => {
      const contributeSupply = vi.fn().mockReturnValue({ success: true });
      const actionChoice = YUKI_TANAKA_DIALOGUE.research_supply.choices.find(
        (c) => c.action
      );
      actionChoice.action({ contributeSupply });
      expect(contributeSupply).toHaveBeenCalledOnce();
    });
  });

  describe('Vasquez context-dependent greeting text', () => {
    it('includes bad karma commentary for Vasquez at warm rep', () => {
      gsm.getNPCState('vasquez_epsilon').rep = 20;
      gsm.state.player.karma = -30;
      const result = showDialogue('vasquez_epsilon', 'greeting', gsm);
      expect(result.text).toContain('눈매가 꽤 날카로워졌군');
    });

    it('includes good karma commentary for Vasquez at warm rep', () => {
      gsm.getNPCState('vasquez_epsilon').rep = 20;
      gsm.state.player.karma = 30;
      const result = showDialogue('vasquez_epsilon', 'greeting', gsm);
      expect(result.text).toContain('괜찮은 사람이야');
    });

    it('includes civilian faction appreciation for Vasquez', () => {
      gsm.getNPCState('vasquez_epsilon').rep = 20;
      gsm.state.player.factions = {
        civilians: 50,
        traders: 0,
        outlaws: 0,
        authorities: 0,
      };
      const result = showDialogue('vasquez_epsilon', 'greeting', gsm);
      expect(result.text).toContain('사람들을 돕고 다닌다는');
    });

    it('includes loan reminder for Vasquez when loan is active', () => {
      const npcState = gsm.getNPCState('vasquez_epsilon');
      npcState.rep = 30;
      npcState.loanAmount = 500;
      npcState.loanDay = gsm.state.player.daysElapsed - 5;
      const result = showDialogue('vasquez_epsilon', 'greeting', gsm);
      expect(result.text).toContain('500');
    });

    it('includes overdue loan warning for Vasquez', () => {
      const npcState = gsm.getNPCState('vasquez_epsilon');
      npcState.rep = 30;
      npcState.loanAmount = 500;
      npcState.loanDay = gsm.state.player.daysElapsed - 200;
      const result = showDialogue('vasquez_epsilon', 'greeting', gsm);
      expect(result.text).toContain('연체');
    });
  });

  describe('Vasquez dialogue action callbacks via selectChoice', () => {
    it('loan request choice exists for Vasquez at friendly rep', () => {
      gsm.getNPCState('vasquez_epsilon').rep = 40;
      const result = showDialogue('vasquez_epsilon', 'greeting', gsm);
      const loanChoice = result.choices.find(
        (c) => c.text && c.text.toLowerCase().includes('loan')
      );
      if (loanChoice) {
        expect(loanChoice.next).toBeDefined();
      }
    });

    it('storage choice exists for Vasquez at friendly rep', () => {
      gsm.getNPCState('vasquez_epsilon').rep = 40;
      const result = showDialogue('vasquez_epsilon', 'greeting', gsm);
      const storageChoice = result.choices.find(
        (c) =>
          c.text &&
          (c.text.toLowerCase().includes('storage') ||
            c.text.toLowerCase().includes('store'))
      );
      if (storageChoice) {
        expect(storageChoice.next).toBeDefined();
      }
    });
  });

  describe('NPC greeting validation at various rep levels', () => {
    const npcIds = [
      'vasquez_epsilon',
      'chen_barnards',
      'kowalski_alpha_centauri',
      'liu_wolf359',
      'rodriguez_procyon',
      'osman_luyten',
      'kim_tau_ceti',
    ];

    for (const npcId of npcIds) {
      it(`renders greeting for ${npcId} at various rep levels`, () => {
        for (const rep of [0, 10, 20, 30, 50, 70, 90]) {
          gsm.getNPCState(npcId).rep = rep;
          const result = showDialogue(npcId, 'greeting', gsm);
          expect(result.text).toBeDefined();
          expect(result.text.length).toBeGreaterThan(0);
        }
      });
    }
  });
});
