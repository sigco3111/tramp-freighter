/**
 * @fileoverview NPC Data Definitions
 *
 * Static definitions for all NPCs in the game. Each NPC has a unique personality,
 * speech style, and is located at a specific station in a specific star system.
 * This data drives the relationship and dialogue systems.
 *
 * Usage:
 * - Import individual NPCs: `import { WEI_CHEN } from './npc-data.js'`
 * - Import all NPCs: `import { ALL_NPCS } from './npc-data.js'`
 * - Validate NPC definitions: `validateNPCDefinition(npcObject)`
 *
 * @module NPCData
 */

import {
  NPC_VALIDATION,
  NPC_PERSONALITY_VALUES,
  NPC_INITIAL_REPUTATION,
  REPUTATION_BOUNDS,
  ENDGAME_CONFIG,
} from '../constants.js';

/**
 * Validates NPC definition structure to prevent runtime errors during game initialization.
 *
 * This validation ensures that all NPCs have the required fields for the benefits system,
 * preventing crashes when the game tries to access missing properties during relationship
 * calculations, dialogue generation, or benefit application.
 *
 * @param {Object} npc - NPC definition object containing personality, benefits, and metadata
 * @throws {Error} When required fields are missing - fails fast to expose data issues during development
 */
export function validateNPCDefinition(npc) {
  for (const field of NPC_VALIDATION.REQUIRED_FIELDS) {
    if (!(field in npc)) {
      throw new Error(
        `Invalid NPC definition: missing required field '${field}'`
      );
    }
  }

  // Validate personality object has required traits
  for (const trait of NPC_VALIDATION.REQUIRED_PERSONALITY_TRAITS) {
    if (!(trait in npc.personality)) {
      throw new Error(
        `Invalid NPC definition: missing personality trait '${trait}'`
      );
    }
  }

  // Validate speechStyle object has required properties
  for (const prop of NPC_VALIDATION.REQUIRED_SPEECH_PROPERTIES) {
    if (!(prop in npc.speechStyle)) {
      throw new Error(
        `Invalid NPC definition: missing speechStyle property '${prop}'`
      );
    }
  }

  // Validate tierBenefits object has required tiers
  for (const tier of NPC_VALIDATION.REQUIRED_TIER_BENEFITS) {
    if (!(tier in npc.tierBenefits)) {
      throw new Error(
        `Invalid NPC definition: missing tierBenefits tier '${tier}'`
      );
    }
  }

  // Validate tips is an array
  if (!Array.isArray(npc.tips)) {
    throw new Error(`Invalid NPC definition: tips must be an array`);
  }

  // Validate discountService is string or null
  if (npc.discountService !== null && typeof npc.discountService !== 'string') {
    throw new Error(
      `Invalid NPC definition: discountService must be string or null`
    );
  }
}

/**
 * Wei Chen - Dock Worker at Barnard's Star
 *
 * Represents the "cautious survivor" archetype - someone who has been burned by trust
 * but still maintains hope. Her low trust/high loyalty combination creates interesting
 * relationship dynamics where earning her trust is difficult but extremely rewarding.
 *
 * Personality Design Rationale:
 * - Low trust (0.3): Creates initial relationship challenge for players
 * - Low greed (0.2): Makes her motivated by respect rather than profit
 * - High loyalty (0.8): Rewards players who invest time in the relationship
 * - Moderate morality (0.6): Allows pragmatic decisions while maintaining ethics
 *
 * Game Role: Provides early-game relationship tutorial and demonstrates that
 * NPCs have depth beyond their current circumstances.
 */
export const WEI_CHEN = {
  id: 'chen_barnards',
  name: '웨이 첸',
  role: '부두 일꾼',
  system: 4, // Barnard's Star
  station: 'Bore Station 7',
  personality: {
    trust: NPC_PERSONALITY_VALUES.TRUST_LOW, // Cautious after losing her ship
    greed: NPC_PERSONALITY_VALUES.GREED_LOW, // Not motivated by money
    loyalty: NPC_PERSONALITY_VALUES.LOYALTY_HIGH, // Deeply loyal once trust is earned
    morality: NPC_PERSONALITY_VALUES.MORALITY_MODERATE, // Generally ethical but pragmatic
  },
  speechStyle: {
    greeting: 'casual',
    vocabulary: 'simple',
    quirk: 'drops articles', // "Ship needs fuel" instead of "The ship needs fuel"
  },
  description:
    '굳은살 박인 손과 모든 걸 아는 눈을 가진 풍파 겪은 부두 일꾼. 전직 선장.',
  initialRep: NPC_INITIAL_REPUTATION.NEUTRAL, // Neutral starting relationship
  tips: [
    '무거운 화물은 운송 중에 쏠려요. 제대로 고정해요.',
    '부두 요금은 정거장마다 달라요. 솔과 알파 센타우리는 할증이 붙어요.',
    '화물칸을 과적하는 선장들이 있어요. 험한 우주에선 나쁜 생각이죠.',
  ],
  discountService: 'docking',
  tierBenefits: {
    warm: { discount: 0, benefit: '부두 일꾼 팁' },
    friendly: { discount: 0.05, benefit: '도킹 서비스 5% 할인' },
    trusted: {
      discount: 0.05,
      benefit: '부두 검사에 대한 사전 경고',
    },
    family: { discount: 0.1, benefit: '우선 도킹 및 화물 처리' },
  },
};

/**
 * Marcus Cole - Loan Shark at Sol
 *
 * Serves as the game's primary antagonistic relationship and debt pressure system.
 * His extreme personality values create a clear "villain" that players love to hate,
 * while his position at Sol makes him unavoidable, maintaining constant tension.
 *
 * Personality Design Rationale:
 * - Very low trust (0.1): Makes every interaction feel transactional and cold
 * - Very high greed (0.9): Ensures he always prioritizes profit over relationships
 * - Low loyalty (0.3): Creates unpredictable behavior that keeps players on edge
 * - Low morality (0.2): Allows morally questionable business practices
 *
 * Game Role: Provides financial pressure and serves as a relationship contrast
 * to more positive NPCs. His hostile starting reputation creates immediate stakes.
 */
export const MARCUS_COLE = {
  id: 'cole_sol',
  name: '마커스 콜',
  role: '고리대금업자',
  system: 0, // Sol
  station: 'Sol Central',
  personality: {
    trust: NPC_PERSONALITY_VALUES.TRUST_VERY_LOW, // Trusts no one
    greed: NPC_PERSONALITY_VALUES.GREED_VERY_HIGH, // Highly motivated by profit
    loyalty: NPC_PERSONALITY_VALUES.LOYALTY_LOW, // Loyalty is transactional
    morality: NPC_PERSONALITY_VALUES.MORALITY_LOW, // Flexible ethics when profit is involved
  },
  speechStyle: {
    greeting: 'formal',
    vocabulary: 'educated',
    quirk: 'short clipped sentences', // "Payment. Due. Now."
  },
  description:
    '흠잡을 데 없이 차려입은 금융업자. 차가운 눈과 계산적인 미소. 당신의 채권자.',
  initialRep: NPC_INITIAL_REPUTATION.HOSTILE, // Starts cold due to player debt
  tips: [
    '빚은 복리로 불어납니다. 가능하면 일찍 갚으세요.',
    '신용은 도구입니다. 절박하지 않게, 현명하게 쓰세요.',
    '더 큰 화물을 위해 빚을 지렛대로 쓰는 상인도 있습니다. 위험하지만 효과적이죠.',
  ],
  discountService: 'debt',
  tierBenefits: {
    warm: { discount: 0, benefit: '금융 팁' },
    friendly: { discount: 0.1, benefit: '부채 이자 10% 감면' },
    trusted: { discount: 0.1, benefit: '부채 재조정 옵션' },
    family: { discount: 0.15, benefit: '유리한 대출 조건' },
  },
};

/**
 * Father Okonkwo - Chaplain at Ross 154
 *
 * Represents unconditional positive regard and serves as the game's "moral anchor."
 * His extreme positive values provide a safe relationship for players to experience
 * the benefits system without risk, while his medical role makes him practically useful.
 *
 * Personality Design Rationale:
 * - High trust (0.7): Immediately welcoming to all players regardless of reputation
 * - No greed (0.0): Completely removes transactional elements from interactions
 * - Very high loyalty (0.9): Ensures he remains supportive even if player makes mistakes
 * - Very high morality (0.9): Provides moral guidance and represents ethical gameplay
 *
 * Game Role: Offers emotional respite from harsh trading world and demonstrates
 * that not all relationships require careful management. His friendly starting
 * reputation provides immediate positive feedback for new players.
 */
export const FATHER_OKONKWO = {
  id: 'okonkwo_ross154',
  name: '오콘쿠오 신부',
  role: '사제',
  system: 11, // Ross 154
  station: 'Ross 154 Medical',
  personality: {
    trust: NPC_PERSONALITY_VALUES.TRUST_HIGH, // Trusts people by default
    greed: NPC_PERSONALITY_VALUES.GREED_NONE, // Not motivated by material gain
    loyalty: NPC_PERSONALITY_VALUES.LOYALTY_VERY_HIGH, // Deeply committed to his calling and community
    morality: NPC_PERSONALITY_VALUES.MORALITY_VERY_HIGH, // Strong moral compass
  },
  speechStyle: {
    greeting: 'warm',
    vocabulary: 'educated',
    quirk: 'religious metaphors', // "May your journey be blessed with fair winds"
  },
  description:
    '다정한 눈빛과 따뜻한 미소를 가진 온화한 사제. 지친 여행자들에게 위안을 줍니다.',
  initialRep: NPC_INITIAL_REPUTATION.FRIENDLY, // Starts warm and welcoming
  tips: [
    '변경 정거장은 생각보다 의약품에 더 후하게 쳐줍니다. 연민과 상업이 늘 대립하는 건 아닙니다.',
    '많은 상인이 곡물을 돈 안 되는 물건으로 여깁니다. 하지만 외곽 항성계의 굶주린 광부들은 값이 얼마든 치릅니다.',
    '제한 품목을 실어야 한다면, 당국은 중심 항성계 바깥에서는 덜 감시한다는 걸 아세요.',
  ],
  discountService: 'medical',
  tierBenefits: {
    warm: { discount: 0, benefit: '영적 안내' },
    friendly: { discount: 0, benefit: '방문당 1회 무료 의약품' },
    trusted: { discount: 0, benefit: '성역(안전 항구) 혜택' },
    family: { discount: 0, benefit: '응급 의료' },
  },
};

/**
 * Whisper - Information Broker at Sirius A
 *
 * Embodies the "morally ambiguous useful contact" archetype. Her balanced trust/loyalty
 * with high greed and low morality creates a relationship where players must weigh
 * the value of her services against the ethical implications of supporting her business.
 *
 * Personality Design Rationale:
 * - Moderate trust (0.5): Neither immediately welcoming nor hostile - requires earning
 * - High greed (0.7): Makes her services expensive but ensures she's always available for profit
 * - Moderate loyalty (0.5): Creates uncertainty about her reliability in difficult situations
 * - Low morality (0.4): Allows her to trade in questionable information and gray-market intel
 *
 * Game Role: Provides essential intelligence services while forcing players to engage
 * with morally complex characters. Her intel discount service makes the relationship
 * economically valuable despite ethical concerns.
 */
export const WHISPER = {
  id: 'whisper_sirius',
  name: '위스퍼',
  role: '정보 중개인',
  system: 7, // Sirius A
  station: 'Sirius Exchange',
  personality: {
    trust: 0.5, // Moderately trusting
    greed: 0.7, // Motivated by profit
    loyalty: 0.5, // Moderate loyalty
    morality: 0.4, // Flexible ethics in information trade
  },
  speechStyle: {
    greeting: 'formal',
    vocabulary: 'educated',
    quirk: 'cryptic measured tones',
  },
  description:
    "수수께끼의 정보 중개인. 모두의 비밀을 안다. 당신의 비밀까지.",
  initialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
  tips: [
    '프로키온이 이번 주 광석을 웃돈에 사들이고 있습니다.',
    '타우 세티는 피하세요. 검문이 300% 늘었습니다.',
    '로스 154의 누군가가 전자제품을 찾고 있습니다. 큰손이에요.',
  ],
  discountService: 'intel',
  tierBenefits: {
    warm: { discount: 0.1, benefit: '정보 구매 10% 할인' },
    friendly: { discount: 0.1, benefit: '방문당 1회 무료 소문' },
    trusted: { discount: 0.15, benefit: '검문 사전 경고' },
    family: { discount: 0.2, benefit: '독점 내부 정보' },
  },
};

/**
 * Captain Vasquez - Retired Trader at Epsilon Eridani
 *
 * Functions as the game's mentor figure and positive relationship tutorial. Her
 * higher starting reputation and balanced positive traits make her an ideal
 * "first friend" who demonstrates the benefits of NPC relationships without
 * requiring significant investment from new players.
 *
 * Personality Design Rationale:
 * - Moderate-high trust (0.6): Welcoming but not naive - respects competent traders
 * - Low greed (0.3): More interested in sharing knowledge than making profit
 * - High loyalty (0.7): Becomes a reliable ally once relationship is established
 * - High morality (0.7): Provides ethical guidance and represents honorable trading
 *
 * Game Role: Serves as relationship onboarding and provides valuable trading tips
 * without service discounts. Her mentor status and starting reputation of 5 makes
 * her immediately accessible to new players learning the relationship system.
 */
export const CAPTAIN_VASQUEZ = {
  id: 'vasquez_epsilon',
  name: '바스케스 선장',
  role: '은퇴한 상인',
  system: 13, // Epsilon Eridani
  station: 'Eridani Hub',
  personality: {
    trust: 0.6, // Moderately trusting
    greed: 0.3, // Low greed - not motivated by money
    loyalty: 0.7, // High loyalty to community
    morality: 0.7, // High moral standards
  },
  speechStyle: {
    greeting: 'warm',
    vocabulary: 'simple',
    quirk: 'trading stories',
  },
  description:
    '은퇴한 화물선 선장. 멘토 같은 존재. 옛 항로를 안다.',
  initialRep: 5, // Starts with 5 rep as mentor figure
  tips: [
    "바너드 항성은 늘 광석이 필요하지. 채굴 정거장이거든.",
    '시리우스 A는 사치품에 최고가를 쳐줘. 부자들이니까.',
    '프로키온 항로는 연료비를 감당할 수만 있다면 돈이 돼.',
  ],
  discountService: null, // Mentor, not service provider
  tierBenefits: {
    warm: { discount: 0, benefit: '거래 팁과 항로 제안' },
    friendly: {
      discount: 0,
      benefit: '옛 성도가 수익성 좋은 항로를 알려 준다',
    },
    trusted: {
      discount: 0,
      benefit: '공동 투자 기회(50/50 분배)',
    },
    family: { discount: 0, benefit: '파보니스 항로 힌트(엔드게임 콘텐츠)' },
  },
};

/**
 * Dr. Sarah Kim - Station Administrator at Tau Ceti
 *
 * Represents the "professional bureaucrat" archetype - someone who values competence
 * and proper procedures. Her personality creates a relationship that rewards players
 * who demonstrate professionalism and follow proper trading protocols.
 *
 * Personality Design Rationale:
 * - Low-moderate trust (0.4): Requires players to prove their competence before warming up
 * - Moderate greed (0.5): Business-focused but not purely profit-driven
 * - Moderate-high loyalty (0.6): Becomes reliable ally for players who respect procedures
 * - High morality (0.8): Enforces ethical standards and rewards honest dealing
 *
 * Game Role: Teaches players that different NPCs value different behaviors.
 * Her docking service discounts reward players who invest in "boring but useful"
 * relationships, demonstrating that not all valuable NPCs are colorful characters.
 */
export const DR_SARAH_KIM = {
  id: 'kim_tau_ceti',
  name: '사라 김 박사',
  role: '정거장 관리자',
  system: 31, // Tau Ceti
  station: 'Tau Ceti Station',
  personality: {
    trust: 0.4, // Cautious trust - needs to see professionalism
    greed: 0.5, // Moderate greed - business-focused
    loyalty: 0.6, // Loyal to station and regulations
    morality: 0.8, // High moral standards - by-the-book
  },
  speechStyle: {
    greeting: 'formal',
    vocabulary: 'technical',
    quirk: 'regulation citations',
  },
  description:
    '효율적인 정거장 관리자. 규정을 중시한다. 전문성을 존중한다.',
  initialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
  tips: [
    '이곳은 세관이 엄격합니다. 화물 명세서를 정확히 작성하세요.',
    '로스 154의 의약품 가격은 안정적입니다. 계획 세우기에 좋습니다.',
    '장거리 항로에서는 연료 효율이 중요합니다. 엔진을 업그레이드하세요.',
  ],
  discountService: 'docking',
  tierBenefits: {
    warm: { discount: 0, benefit: '운영 팁' },
    friendly: { discount: 0, benefit: '도킹 요금 면제' },
    trusted: { discount: 0, benefit: '세관 사전 통보' },
    family: { discount: 0, benefit: '우선 도킹 허가' },
  },
};

/**
 * "Rusty" Rodriguez - Mechanic at Procyon
 *
 * Embodies the "gruff but golden-hearted craftsman" archetype. His high trust and
 * loyalty combined with moderate greed creates a relationship where players are
 * rewarded for treating him with respect rather than trying to exploit him financially.
 *
 * Personality Design Rationale:
 * - High trust (0.7): Willing to give players the benefit of the doubt initially
 * - Low-moderate greed (0.4): More interested in good work than maximum profit
 * - Very high loyalty (0.8): Becomes fiercely protective of players who treat him well
 * - Moderate morality (0.5): Pragmatic about ship repairs - will bend rules for good customers
 *
 * Game Role: Provides essential repair services while demonstrating that respectful
 * treatment of working-class NPCs yields better results than purely transactional
 * relationships. His repair discounts make the relationship economically significant.
 */
export const RUSTY_RODRIGUEZ = {
  id: 'rodriguez_procyon',
  name: '"러스티" 로드리게스',
  role: '정비공',
  system: 19, // Procyon
  station: 'Procyon Depot',
  personality: {
    trust: 0.7, // High trust - trusting nature
    greed: 0.4, // Low-moderate greed - not primarily motivated by money
    loyalty: 0.8, // High loyalty - deeply committed to his craft
    morality: 0.5, // Moderate morality - pragmatic approach
  },
  speechStyle: {
    greeting: 'gruff',
    vocabulary: 'technical',
    quirk: 'ship personification',
  },
  description: '무뚝뚝하지만 솜씨 좋은 정비공. 사람보다 배를 더 사랑한다.',
  initialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
  tips: [
    "선체가 50% 아래로 떨어지게 두지 마. 그 뒤로는 고치는 데 돈이 많이 들어.",
    '엔진 노후화는 현실이야. 정비 예산을 잡아 둬.',
    '생명 유지 장치는 핵심이야. 그 수리는 절대 건너뛰지 마.',
  ],
  discountService: 'repair',
  tierBenefits: {
    warm: { discount: 0.05, benefit: '수리 5% 할인' },
    friendly: { discount: 0.15, benefit: '수리 15% 할인' },
    trusted: {
      discount: 0.15,
      benefit: '정비 팁과 무료 진단',
    },
    family: { discount: 0.2, benefit: '우선 수리 서비스' },
  },
};

/**
 * Zara Osman - Trader at Luyten's Star
 *
 * Represents the "competitive peer" archetype - another trader who can be either
 * rival or ally depending on player approach. Her balanced moderate values create
 * a relationship that requires consistent positive interaction to maintain.
 *
 * Personality Design Rationale:
 * - Moderate trust (0.5): Neither immediately friendly nor hostile - neutral starting point
 * - Moderate-high greed (0.6): Profit-motivated but willing to share opportunities with allies
 * - Moderate loyalty (0.6): Reliable business partner but not unconditionally supportive
 * - Moderate morality (0.5): Competitive but fair - won't cheat but will take advantage
 *
 * Game Role: Provides trading expertise and market connections while teaching players
 * about peer relationships in the trading community. Her trade service benefits
 * make her valuable for players focused on commercial success.
 */
export const ZARA_OSMAN = {
  id: 'osman_luyten',
  name: '자라 오스만',
  role: '상인',
  system: 34, // Luyten's Star
  station: "Luyten's Outpost",
  personality: {
    trust: 0.5, // Moderate trust - cautious but fair
    greed: 0.6, // Moderate-high greed - profit-motivated
    loyalty: 0.6, // Moderate loyalty - business relationships
    morality: 0.5, // Moderate morality - competitive but fair
  },
  speechStyle: {
    greeting: 'casual',
    vocabulary: 'slang',
    quirk: 'trading jargon',
  },
  description:
    '섹터 곳곳에 인맥이 있는 날카로운 상인. 경쟁적이지만 공정하다.',
  initialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
  tips: [
    '광산 정거장에서 싸게 사서 부유한 항성계에서 비싸게 팔아요.',
    '자본만 있다면 사치품이 마진이 제일 좋아요.',
    '경제 이벤트를 지켜봐요. 가격을 크게 흔들어요.',
  ],
  discountService: 'trade',
  tierBenefits: {
    warm: { discount: 0, benefit: '시장 가격 팁' },
    friendly: { discount: 0, benefit: '가격 변동 사전 통지' },
    trusted: { discount: 0, benefit: '프리미엄 거래 팁(105% 매수율)' },
    family: { discount: 0, benefit: '독점 거래 파트너십' },
  },
};

/**
 * Station Master Kowalski - Station Master at Alpha Centauri
 *
 * Represents the "earned respect" archetype - someone who starts skeptical but
 * becomes a powerful ally for players who prove their competence. His position
 * at the major hub system makes his approval particularly valuable.
 *
 * Personality Design Rationale:
 * - Low trust (0.3): Skeptical of new traders until they prove themselves reliable
 * - Low-moderate greed (0.4): More concerned with operational efficiency than profit
 * - High loyalty (0.7): Becomes strong supporter for traders who meet his standards
 * - High morality (0.7): Maintains high standards and respects ethical behavior
 *
 * Game Role: Guards access to Alpha Centauri's hub benefits and teaches players
 * that some relationships require proving competence over time. His docking
 * services become valuable for players who establish themselves as reliable traders.
 */
export const STATION_MASTER_KOWALSKI = {
  id: 'kowalski_alpha_centauri',
  name: '코왈스키 정거장장',
  role: '정거장장',
  system: 1, // Alpha Centauri
  station: 'Centauri Station',
  personality: {
    trust: 0.3, // Low trust - needs to see competence first
    greed: 0.4, // Low-moderate greed - not primarily motivated by money
    loyalty: 0.7, // High loyalty - committed to station and standards
    morality: 0.7, // High morality - respects competence and fairness
  },
  speechStyle: {
    greeting: 'gruff',
    vocabulary: 'simple',
    quirk: 'no-nonsense direct',
  },
  description: '산전수전 다 겪은 정거장장. 안 본 게 없다. 유능함을 존중한다.',
  initialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
  tips: [
    '알파 센타우리는 허브야. 대부분의 물건을 사고팔기 좋지.',
    '교통량이 많아. 가격도 경쟁력 있고.',
    '배 상태를 잘 유지해. 여기엔 기준이 있어.',
  ],
  discountService: 'docking',
  tierBenefits: {
    warm: { discount: 0, benefit: '정거장 운영 팁' },
    friendly: { discount: 0, benefit: '정거장 보관소 이용' },
    trusted: { discount: 0, benefit: '원가로 비상 연료 제공' },
    family: { discount: 0, benefit: '우선 도킹 및 서비스' },
  },
};

/**
 * "Lucky" Liu - Gambler at Wolf 359
 *
 * Embodies the "high-risk high-reward" archetype - someone who respects bold players
 * but can't be relied upon for consistent support. His extreme greed and low morality
 * create opportunities for players willing to engage in questionable activities.
 *
 * Personality Design Rationale:
 * - Moderate-high trust (0.6): Willing to take chances on people, like he does with bets
 * - Very high greed (0.8): Motivated by potential for big payoffs rather than steady income
 * - Low loyalty (0.4): Follows opportunities rather than relationships - unreliable ally
 * - Low morality (0.3): Willing to engage in ethically questionable schemes for profit
 *
 * Game Role: Provides high-risk opportunities and tests player willingness to engage
 * with morally ambiguous characters. His lack of service discounts but unique
 * benefits create a different type of valuable relationship focused on opportunities
 * rather than cost savings.
 */
export const LUCKY_LIU = {
  id: 'liu_wolf359',
  name: '"럭키" 리우',
  role: '도박꾼',
  system: 5, // Wolf 359
  station: 'Wolf 359 Station',
  personality: {
    trust: 0.6, // Moderately trusting - willing to take chances on people
    greed: 0.8, // High greed - motivated by big payoffs
    loyalty: 0.4, // Low loyalty - follows the money and odds
    morality: 0.3, // Low morality - flexible ethics in pursuit of profit
  },
  speechStyle: {
    greeting: 'casual',
    vocabulary: 'slang',
    quirk: 'gambling metaphors',
  },
  description:
    '전문 도박꾼이자 위험 감수자. 낮은 확률을 사랑한다. 대담한 행동을 존중한다.',
  initialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
  tips: [
    '가끔은 위험을 감수해야지. 큰 위험, 큰 보상.',
    '고액 판돈이 걸린 화물 운송 얘기를 들었어. 관심 있어?',
    "항상 안전하게만 하지 마. 행운은 대담한 자의 편이야.",
  ],
  discountService: null, // Gambler, not service provider
  tierBenefits: {
    warm: { discount: 0, benefit: '위험 감수 팁' },
    friendly: { discount: 0, benefit: '₡500 판돈 메커니즘' },
    trusted: { discount: 0, benefit: '내부 정보' },
    family: { discount: 0, benefit: '고위험 독점 기회' },
  },
};

/**
 * Yuki Tanaka - Engineer at Barnard's Star
 *
 * The endgame quest NPC. Hidden until the player has visited 5+ systems and
 * docks at Barnard's Star, triggering the tanaka_intro narrative event.
 * Her quest line leads to the Pavonis Run and game victory.
 *
 * Personality Design Rationale:
 * - Low trust (0.2): Brilliant but guarded, requires proving yourself
 * - No greed (0.1): Driven by her research, not profit
 * - Very high loyalty (0.9): Once earned, her loyalty is absolute
 * - High morality (0.8): Ethical researcher pursuing knowledge
 */
export const YUKI_TANAKA = {
  id: 'tanaka_barnards',
  name: '유키 타나카',
  role: '엔지니어',
  system: 4, // Barnard's Star
  station: 'Bore Station 7',
  personality: {
    trust: 0.2,
    greed: 0.1,
    loyalty: 0.9,
    morality: 0.8,
  },
  speechStyle: {
    greeting: 'formal',
    vocabulary: 'technical',
    quirk: 'Precise, measured speech. Never wastes words.',
  },
  description:
    '실험적 구동 기술을 연구하는 뛰어난 엔지니어. 델타 파보니스에 가려는 나름의 이유가 있다.',
  initialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
  tips: [
    '선체 무결성이 높을수록 구동계가 더 효율적으로 돌아가요. 손상된 배는 구조적 항력을 보상하느라 연료를 낭비해요.',
    '웜홀 네트워크에는 패턴이 있어요. 교통량이 적은 항로는 해적이 적지만 구조 옵션도 적어요.',
    '부품은 제조되는 중심 항성계에서 쌉니다. 멀리 갈수록 비싸져요.',
  ],
  discountService: null,
  tierBenefits: {
    warm: {
      discount: 0,
      benefit: '타나카 구동계에 대한 기술적 통찰을 공유한다.',
    },
    friendly: { discount: 0, benefit: '자신의 연구를 자유롭게 논한다.' },
    trusted: { discount: 0, benefit: '진짜 임무를 밝힌다.' },
    family: { discount: 0, benefit: '파보니스 항해의 파트너.' },
  },
  questId: 'tanaka',
  hidden: true,
  revealFlag: 'tanaka_met',
};

/**
 * Yumi Tanaka - Colony Director at Delta Pavonis (Post-Credits)
 *
 * Tanaka's sister. Hidden until post-credits scene reveals her.
 * Fourth-wall-breaking comedy dialogue about the game being over.
 */
export const YUMI_TANAKA_POSTCREDITS = {
  id: 'yumi_delta_pavonis',
  name: '유미 타나카',
  role: '식민지 총괄',
  system: ENDGAME_CONFIG.DELTA_PAVONIS_ID,
  station: 'Delta Pavonis Colony',
  personality: {
    trust: NPC_PERSONALITY_VALUES.TRUST_HIGH,
    greed: NPC_PERSONALITY_VALUES.GREED_NONE,
    loyalty: NPC_PERSONALITY_VALUES.LOYALTY_HIGH,
    morality: NPC_PERSONALITY_VALUES.MORALITY_MODERATE,
  },
  speechStyle: {
    greeting: 'casual',
    vocabulary: 'simple',
    quirk: 'Fourth-wall-breaking irreverence.',
  },
  description:
    "델타 파보니스의 식민지 총괄. 타나카의 언니. 알아선 안 될 것까지 아는 듯하다.",
  initialRep: REPUTATION_BOUNDS.WARM_MIN,
  tips: [
    '크레딧은 이미 올라갔어요. 여기엔 정말로 할 일이 남아 있지 않아요.',
  ],
  discountService: null,
  tierBenefits: {
    warm: { discount: 0, benefit: '크레딧 후 농담.' },
    friendly: { discount: 0, benefit: '더 많은 크레딧 후 농담.' },
    trusted: { discount: 0, benefit: '훨씬 더 많은 크레딧 후 농담.' },
    family: { discount: 0, benefit: '최대치의 크레딧 후 농담.' },
  },
  hidden: true,
  revealFlag: 'post_credits',
};

/**
 * All NPCs in the game
 * Add new NPCs to this array to make them available to the game systems
 */
export const ALL_NPCS = [
  WEI_CHEN,
  MARCUS_COLE,
  FATHER_OKONKWO,
  WHISPER,
  CAPTAIN_VASQUEZ,
  DR_SARAH_KIM,
  RUSTY_RODRIGUEZ,
  ZARA_OSMAN,
  STATION_MASTER_KOWALSKI,
  LUCKY_LIU,
  YUKI_TANAKA,
  YUMI_TANAKA_POSTCREDITS,
];

/**
 * Validates all NPC definitions to ensure data integrity during game initialization.
 *
 * This function should be called during game startup to catch data errors early
 * rather than discovering them during gameplay when an NPC interaction fails.
 * Failing fast during initialization prevents runtime crashes and makes debugging easier.
 *
 * @throws {Error} When any NPC definition fails validation - includes NPC name in error message
 */
export function validateAllNPCs() {
  ALL_NPCS.forEach((npc) => validateNPCDefinition(npc));
}
