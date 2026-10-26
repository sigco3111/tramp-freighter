import { describe, it, expect } from 'vitest';
import {
  WHISPER,
  CAPTAIN_VASQUEZ,
  DR_SARAH_KIM,
  RUSTY_RODRIGUEZ,
  ZARA_OSMAN,
  STATION_MASTER_KOWALSKI,
  LUCKY_LIU,
  validateNPCDefinition,
} from '../../src/game/data/npc-data.js';
import { NPC_INITIAL_REPUTATION } from '../../src/game/constants.js';

/**
 * Parameterized NPC data validation tests
 * Feature: npc-benefits
 *
 * **Validates: Requirements 4.1-4.15, 5.1-5.11, 6.1-6.10, 7.1-7.10, 8.1-8.10, 9.1-9.10, 10.1-10.10**
 *
 * Consolidates per-NPC data validation into a single parameterized suite.
 * Each NPC is tested for required fields, basic information, personality traits,
 * speech style, initial reputation, tips, discount service, tier benefits, and
 * validation function compliance.
 *
 * Replaces:
 *   - captain-vasquez-npc-data.test.js
 *   - dr-sarah-kim-npc-data.test.js
 *   - lucky-liu-npc-data.test.js
 *   - rusty-rodriguez-npc-data.test.js
 *   - station-master-kowalski-npc-data.test.js
 *   - whisper-npc-data.test.js
 *   - zara-osman-npc-data.test.js
 */

const NPC_TEST_CASES = [
  {
    npc: WHISPER,
    label: 'Whisper (Information Broker at Sirius A)',
    expectedBasic: {
      id: 'whisper_sirius',
      name: '위스퍼',
      role: '정보 중개인',
      system: 7,
      station: 'Sirius Exchange',
    },
    expectedPersonality: {
      trust: 0.5,
      greed: 0.7,
      loyalty: 0.5,
      morality: 0.4,
    },
    expectedSpeechStyle: {
      greeting: 'formal',
      vocabulary: 'educated',
      quirk: 'cryptic measured tones',
    },
    expectedInitialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
    expectedDiscountService: 'intel',
    expectedTipSamples: [],
  },
  {
    npc: CAPTAIN_VASQUEZ,
    label: 'Captain Vasquez (Retired Trader at Epsilon Eridani)',
    expectedBasic: {
      id: 'vasquez_epsilon',
      name: '바스케스 선장',
      role: '은퇴한 상인',
      system: 13,
      station: 'Eridani Hub',
    },
    expectedPersonality: {
      trust: 0.6,
      greed: 0.3,
      loyalty: 0.7,
      morality: 0.7,
    },
    expectedSpeechStyle: {
      greeting: 'warm',
      vocabulary: 'simple',
      quirk: 'trading stories',
    },
    expectedInitialRep: 5,
    expectedDiscountService: null,
    expectedTipSamples: [
      '바너드 항성은 늘 광석이 필요하지. 채굴 정거장이거든.',
      '시리우스 A는 사치품에 최고가를 쳐줘. 부자들이니까.',
      '프로키온 항로는 연료비를 감당할 수만 있다면 돈이 돼.',
    ],
  },
  {
    npc: DR_SARAH_KIM,
    label: 'Dr. Sarah Kim (Station Administrator at Tau Ceti)',
    expectedBasic: {
      id: 'kim_tau_ceti',
      name: '사라 김 박사',
      role: '정거장 관리자',
      system: 31,
      station: 'Tau Ceti Station',
    },
    expectedPersonality: {
      trust: 0.4,
      greed: 0.5,
      loyalty: 0.6,
      morality: 0.8,
    },
    expectedSpeechStyle: {
      greeting: 'formal',
      vocabulary: 'technical',
      quirk: 'regulation citations',
    },
    expectedInitialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
    expectedDiscountService: 'docking',
    expectedTipSamples: [
      '이곳은 세관이 엄격합니다. 화물 명세서를 정확히 작성하세요.',
      '로스 154의 의약품 가격은 안정적입니다. 계획 세우기에 좋습니다.',
      '장거리 항로에서는 연료 효율이 중요합니다. 엔진을 업그레이드하세요.',
    ],
  },
  {
    npc: RUSTY_RODRIGUEZ,
    label: '"러스티" 로드리게스 (Mechanic at Procyon)',
    expectedBasic: {
      id: 'rodriguez_procyon',
      name: '"러스티" 로드리게스',
      role: '정비공',
      system: 19,
      station: 'Procyon Depot',
    },
    expectedPersonality: {
      trust: 0.7,
      greed: 0.4,
      loyalty: 0.8,
      morality: 0.5,
    },
    expectedSpeechStyle: {
      greeting: 'gruff',
      vocabulary: 'technical',
      quirk: 'ship personification',
    },
    expectedInitialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
    expectedDiscountService: 'repair',
    expectedTipSamples: [
      '선체가 50% 아래로 떨어지게 두지 마. 그 뒤로는 고치는 데 돈이 많이 들어.',
      '엔진 노후화는 현실이야. 정비 예산을 잡아 둬.',
      '생명 유지 장치는 핵심이야. 그 수리는 절대 건너뛰지 마.',
    ],
  },
  {
    npc: ZARA_OSMAN,
    label: "Zara Osman (Trader at Luyten's Star)",
    expectedBasic: {
      id: 'osman_luyten',
      name: '자라 오스만',
      role: '상인',
      system: 34,
      station: "Luyten's Outpost",
    },
    expectedPersonality: {
      trust: 0.5,
      greed: 0.6,
      loyalty: 0.6,
      morality: 0.5,
    },
    expectedSpeechStyle: {
      greeting: 'casual',
      vocabulary: 'slang',
      quirk: 'trading jargon',
    },
    expectedInitialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
    expectedDiscountService: 'trade',
    expectedTipSamples: [
      '광산 정거장에서 싸게 사서 부유한 항성계에서 비싸게 팔아요.',
      '자본만 있다면 사치품이 마진이 제일 좋아요.',
      '경제 이벤트를 지켜봐요. 가격을 크게 흔들어요.',
    ],
  },
  {
    npc: STATION_MASTER_KOWALSKI,
    label: 'Station Master Kowalski (Station Master at Alpha Centauri)',
    expectedBasic: {
      id: 'kowalski_alpha_centauri',
      name: '코왈스키 정거장장',
      role: '정거장장',
      system: 1,
      station: 'Centauri Station',
    },
    expectedPersonality: {
      trust: 0.3,
      greed: 0.4,
      loyalty: 0.7,
      morality: 0.7,
    },
    expectedSpeechStyle: {
      greeting: 'gruff',
      vocabulary: 'simple',
      quirk: 'no-nonsense direct',
    },
    expectedInitialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
    expectedDiscountService: 'docking',
    expectedTipSamples: [],
  },
  {
    npc: LUCKY_LIU,
    label: '"럭키" 리우 (Gambler at Wolf 359)',
    expectedBasic: {
      id: 'liu_wolf359',
      name: '"럭키" 리우',
      role: '도박꾼',
      system: 5,
      station: 'Wolf 359 Station',
    },
    expectedPersonality: {
      trust: 0.6,
      greed: 0.8,
      loyalty: 0.4,
      morality: 0.3,
    },
    expectedSpeechStyle: {
      greeting: 'casual',
      vocabulary: 'slang',
      quirk: 'gambling metaphors',
    },
    expectedInitialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
    expectedDiscountService: null,
    expectedTipSamples: [
      '가끔은 위험을 감수해야지. 큰 위험, 큰 보상.',
      '고액 판돈이 걸린 화물 운송 얘기를 들었어. 관심 있어?',
      "항상 안전하게만 하지 마. 행운은 대담한 자의 편이야.",
    ],
  },
];

describe('NPC Data Validation (Parameterized)', () => {
  describe.each(NPC_TEST_CASES)(
    '$label',
    ({
      npc,
      expectedBasic,
      expectedPersonality,
      expectedSpeechStyle,
      expectedInitialRep,
      expectedDiscountService,
      expectedTipSamples,
    }) => {
      it('should have all required fields for NPC benefits system', () => {
        expect(npc.id).toBeDefined();
        expect(npc.name).toBeDefined();
        expect(npc.role).toBeDefined();
        expect(npc.system).toBeDefined();
        expect(npc.station).toBeDefined();
        expect(npc.personality).toBeDefined();
        expect(npc.speechStyle).toBeDefined();
        expect(npc.description).toBeDefined();
        expect(npc.initialRep).toBeDefined();
        expect(npc.tips).toBeDefined();
        expect(npc.discountService).toBeDefined();
        expect(npc.tierBenefits).toBeDefined();
      });

      it('should have correct basic information', () => {
        expect(npc.id).toBe(expectedBasic.id);
        expect(npc.name).toBe(expectedBasic.name);
        expect(npc.role).toBe(expectedBasic.role);
        expect(npc.system).toBe(expectedBasic.system);
        expect(npc.station).toBe(expectedBasic.station);
      });

      it('should have correct personality values matching specification', () => {
        expect(npc.personality.trust).toBe(expectedPersonality.trust);
        expect(npc.personality.greed).toBe(expectedPersonality.greed);
        expect(npc.personality.loyalty).toBe(expectedPersonality.loyalty);
        expect(npc.personality.morality).toBe(expectedPersonality.morality);
      });

      it('should have correct speech style', () => {
        expect(npc.speechStyle.greeting).toBe(expectedSpeechStyle.greeting);
        expect(npc.speechStyle.vocabulary).toBe(expectedSpeechStyle.vocabulary);
        expect(npc.speechStyle.quirk).toBe(expectedSpeechStyle.quirk);
      });

      it('should have correct initial reputation', () => {
        expect(npc.initialRep).toBe(expectedInitialRep);
      });

      it('should have non-empty tips array with valid strings', () => {
        expect(Array.isArray(npc.tips)).toBe(true);
        expect(npc.tips.length).toBeGreaterThan(0);

        npc.tips.forEach((tip) => {
          expect(typeof tip).toBe('string');
          expect(tip.length).toBeGreaterThan(0);
        });
      });

      if (expectedTipSamples.length > 0) {
        it('should contain expected tip samples', () => {
          expectedTipSamples.forEach((tip) => {
            expect(npc.tips).toContain(tip);
          });
        });
      }

      it('should have correct discount service', () => {
        expect(npc.discountService).toBe(expectedDiscountService);
      });

      it('should have correct tier benefits configuration', () => {
        expect(npc.tierBenefits).toBeDefined();
        expect(npc.tierBenefits.warm).toBeDefined();
        expect(npc.tierBenefits.friendly).toBeDefined();
        expect(npc.tierBenefits.trusted).toBeDefined();
        expect(npc.tierBenefits.family).toBeDefined();

        expect(npc.tierBenefits.warm.discount).toBeDefined();
        expect(npc.tierBenefits.warm.benefit).toBeDefined();
      });

      it('should pass NPC validation', () => {
        expect(() => validateNPCDefinition(npc)).not.toThrow();
      });
    }
  );
});
